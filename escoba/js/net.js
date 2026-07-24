/**
 * Multijugador por invitación vía MQTT (WebSocket).
 * Más fiable que WebRTC en redes móviles (sin NAT/TURN).
 * El anfitrión es autoridad del estado; el invitado envía jugadas.
 *
 * El código de sala incluye la etiqueta del broker (último carácter)
 * para que anfitrión e invitado usen siempre el mismo servidor.
 */

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
];

/** Etiquetas fuera del alfabeto de sala (evita colisión con códigos legacy). */
const BROKER_TAGS = ['0', '1', 'I'];

const TOPIC_PREFIX = 'escoba15/v3';

const MQTT_SOURCES = [
  './js/vendor/mqtt.min.js',
  'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js',
  'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js',
];

function randomRoom() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function normalizeCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

/** @returns {{ code: string, room: string, brokerIndex: number|null }} */
export function parseInviteCode(raw) {
  const code = normalizeCode(raw);
  if (code.length !== 6) {
    return { code, room: code, brokerIndex: null };
  }
  const tag = code.slice(5);
  const brokerIndex = BROKER_TAGS.indexOf(tag);
  if (brokerIndex >= 0) {
    return { code, room: code.slice(0, 5), brokerIndex };
  }
  // Código legacy de 6 chars sin etiqueta de broker
  return { code, room: code, brokerIndex: null };
}

function mqttApi() {
  return globalThis.mqtt;
}

function loadScript(src, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      s.remove();
      reject(new Error(`Tiempo agotado cargando ${src}`));
    }, timeoutMs);
    s.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    s.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      s.remove();
      reject(new Error(`No se pudo cargar ${src}`));
    };
    document.head.appendChild(s);
  });
}

export class EscobaNet {
  constructor() {
    this.client = null;
    this.role = null; // 'host' | 'guest'
    this.code = null;
    this.clientId = null;
    this.topic = null;
    this.brokerUrl = null;
    this.brokerIndex = null;
    this.ready = false;
    this.playerName = '';
    this._joinTimer = null;
    this._destroyed = false;
    this.handlers = {
      onStatus: () => {},
      onReady: () => {},
      onMessage: () => {},
      onDisconnect: () => {},
      onError: () => {},
      onPeerJoin: () => {},
      onReconnect: () => {},
    };
  }

  on(event, fn) {
    this.handlers[event] = fn;
  }

  async host() {
    this.role = 'host';
    const room = randomRoom();
    await this._ensureMqtt();
    this._destroyed = false;
    this.clientId = `esc_${this.role}_${randomId()}`;

    let lastError = null;
    for (let i = 0; i < BROKERS.length; i++) {
      if (this._destroyed) throw new Error('Cancelado');
      this.brokerIndex = i;
      this.brokerUrl = BROKERS[i];
      this.code = room + BROKER_TAGS[i];
      this.topic = `${TOPIC_PREFIX}/${this.code}`;
      this.handlers.onStatus('Conectando al servidor…');
      try {
        await this._connectBroker(this.brokerUrl);
        this.handlers.onStatus('Esperando a tu amigo…');
        return { code: this.code, brokerIndex: i };
      } catch (err) {
        lastError = err;
        this._forceEndClient();
      }
    }
    throw lastError || new Error('No se pudo conectar. Revisa la red e inténtalo otra vez.');
  }

  async join(code) {
    this.role = 'guest';
    const parsed = parseInviteCode(code);
    if (parsed.code.length !== 6) throw new Error('Código inválido (6 caracteres)');
    this.code = parsed.code;
    this.topic = `${TOPIC_PREFIX}/${this.code}`;

    await this._ensureMqtt();
    this._destroyed = false;
    this.clientId = `esc_${this.role}_${randomId()}`;

    // Con etiqueta: mismo broker que el anfitrión (obligatorio).
    // Legacy sin etiqueta: probar en orden.
    const order =
      parsed.brokerIndex != null ? [parsed.brokerIndex] : BROKERS.map((_, i) => i);

    let lastError = null;
    for (let n = 0; n < order.length; n++) {
      const i = order[n];
      if (this._destroyed) throw new Error('Cancelado');
      this.brokerIndex = i;
      this.brokerUrl = BROKERS[i];
      this.handlers.onStatus(
        n === 0 ? 'Conectando al servidor…' : 'Probando otro servidor…'
      );
      try {
        await this._connectBroker(this.brokerUrl);
        this.handlers.onStatus('Buscando la partida…');
        this._announceJoin();
        this._joinTimer = setInterval(() => {
          if (this.ready || this._destroyed) {
            clearInterval(this._joinTimer);
            this._joinTimer = null;
            return;
          }
          this._announceJoin();
        }, 1800);
        return { code: this.code, brokerIndex: i };
      } catch (err) {
        lastError = err;
        this._forceEndClient();
      }
    }
    throw lastError || new Error('No se pudo conectar. Revisa la red e inténtalo otra vez.');
  }

  send(payload) {
    if (!this.client || !this.client.connected || !this.topic) return false;
    const msg = {
      ...payload,
      from: this.role,
      clientId: this.clientId,
      ts: Date.now(),
    };
    const critical = /^(move|state|reject|ping|requestState|join|hello)$/.test(payload?.type || '');
    this.client.publish(this.topic, JSON.stringify(msg), { qos: critical ? 1 : 0 });
    return true;
  }

  markReady() {
    this.ready = true;
    if (this._joinTimer) {
      clearInterval(this._joinTimer);
      this._joinTimer = null;
    }
  }

  destroy() {
    this._destroyed = true;
    if (this._joinTimer) {
      clearInterval(this._joinTimer);
      this._joinTimer = null;
    }
    this._forceEndClient();
  }

  _forceEndClient() {
    try {
      this.client?.end(true);
    } catch (_) {}
    this.client = null;
  }

  _announceJoin() {
    this.send({ type: 'join', name: this.playerName || '' });
  }

  _connectBroker(url) {
    const mqtt = mqttApi();
    if (!mqtt?.connect) {
      return Promise.reject(new Error('Librería de red no disponible'));
    }

    return new Promise((resolve, reject) => {
      const client = mqtt.connect(url, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 2500,
        protocolVersion: 4,
      });
      this.client = client;

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          client.end(true);
        } catch (_) {}
        reject(new Error('Tiempo de espera agotado'));
      }, 12000);

      client.on('connect', () => {
        client.subscribe(this.topic, { qos: 1 }, (err) => {
          if (err) {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              reject(err);
            }
            return;
          }
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            this.handlers.onStatus(
              this.role === 'host' ? 'Sala lista — comparte el código' : 'En sala — emparejando…'
            );
            resolve();
            return;
          }
          // Reconnect after the first successful session
          if (this.role === 'guest' && !this.ready) {
            this._announceJoin();
          }
          if (this.ready) {
            this.handlers.onStatus(
              this.role === 'host' ? 'Reconectado' : 'Reconectado — sincronizando…'
            );
            this.handlers.onReconnect?.();
          }
        });
      });

      client.on('message', (_topic, buf) => {
        let data;
        try {
          data = JSON.parse(String(buf));
        } catch (_) {
          return;
        }
        if (!data || data.clientId === this.clientId) return;

        if (data.type === 'join' && this.role === 'host') {
          this.handlers.onPeerJoin(data);
          return;
        }

        if (data.type === 'ping' && this.role === 'host' && this.ready) {
          this.handlers.onMessage({ type: 'requestState' });
          return;
        }

        this.handlers.onMessage(data);
      });

      client.on('reconnect', () => {
        this.handlers.onStatus('Reconectando…');
      });

      client.on('close', () => {
        if (!this._destroyed && this.ready) {
          this.handlers.onStatus('Conexión perdida…');
          this.handlers.onDisconnect();
        }
      });

      client.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        } else {
          this.handlers.onError(err);
        }
      });
    });
  }

  async _ensureMqtt() {
    if (mqttApi()?.connect) return;
    let lastError = null;
    for (const src of MQTT_SOURCES) {
      try {
        this.handlers.onStatus('Preparando conexión…');
        await loadScript(src);
        if (mqttApi()?.connect) return;
        lastError = new Error('MQTT cargó sin API');
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('No se pudo cargar la librería de red');
  }
}
