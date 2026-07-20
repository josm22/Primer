/**
 * Multijugador por invitación vía MQTT (WebSocket).
 * Más fiable que WebRTC en redes móviles (sin NAT/TURN).
 * El anfitrión es autoridad del estado; el invitado envía jugadas.
 */

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
];

const TOPIC_PREFIX = 'escoba15/v2';

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
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

export class EscobaNet {
  constructor() {
    this.client = null;
    this.role = null; // 'host' | 'guest'
    this.code = null;
    this.clientId = null;
    this.topic = null;
    this.ready = false;
    this._joinTimer = null;
    this._destroyed = false;
    this.handlers = {
      onStatus: () => {},
      onReady: () => {},
      onMessage: () => {},
      onDisconnect: () => {},
      onError: () => {},
      onPeerJoin: () => {},
    };
  }

  on(event, fn) {
    this.handlers[event] = fn;
  }

  async host() {
    this.role = 'host';
    this.code = randomCode();
    await this._connect();
    this.handlers.onStatus('Esperando a tu amigo…');
    return { code: this.code };
  }

  async join(code) {
    this.role = 'guest';
    this.code = normalizeCode(code);
    if (this.code.length !== 6) throw new Error('Código inválido (6 caracteres)');
    await this._connect();
    this.handlers.onStatus('Buscando la partida…');
    this._announceJoin();
    this._joinTimer = setInterval(() => {
      if (this.ready || this._destroyed) {
        clearInterval(this._joinTimer);
        this._joinTimer = null;
        return;
      }
      this._announceJoin();
    }, 2000);
    return { code: this.code };
  }

  send(payload) {
    if (!this.client || !this.client.connected || !this.topic) return false;
    const msg = {
      ...payload,
      from: this.role,
      clientId: this.clientId,
      ts: Date.now(),
    };
    this.client.publish(this.topic, JSON.stringify(msg), { qos: 0 });
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
    try {
      this.client?.end(true);
    } catch (_) {}
    this.client = null;
  }

  _announceJoin() {
    this.send({ type: 'join' });
  }

  async _connect() {
    await this._ensureMqtt();
    this._destroyed = false;
    this.clientId = `esc_${this.role}_${randomId()}`;
    this.topic = `${TOPIC_PREFIX}/${this.code}`;

    let lastError = null;
    for (const url of BROKERS) {
      if (this._destroyed) throw new Error('Cancelado');
      this.handlers.onStatus('Conectando al servidor…');
      try {
        await this._connectBroker(url);
        return;
      } catch (err) {
        lastError = err;
        try {
          this.client?.end(true);
        } catch (_) {}
        this.client = null;
      }
    }
    throw lastError || new Error('No se pudo conectar. Revisa la red e inténtalo otra vez.');
  }

  _connectBroker(url) {
    return new Promise((resolve, reject) => {
      const client = mqtt.connect(url, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 3000,
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
        client.subscribe(this.topic, { qos: 0 }, (err) => {
          if (settled) return;
          if (err) {
            settled = true;
            clearTimeout(timer);
            reject(err);
            return;
          }
          settled = true;
          clearTimeout(timer);
          this.handlers.onStatus(
            this.role === 'host' ? 'Sala lista — comparte el código' : 'En sala — emparejando…'
          );
          resolve();
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
          // guest pide estado de nuevo
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

  _ensureMqtt() {
    if (typeof mqtt !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar la librería de red'));
      document.head.appendChild(s);
    });
  }
}
