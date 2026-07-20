/**
 * Multijugador por invitación con PeerJS (WebRTC).
 * El anfitrión es autoridad del estado; el invitado envía jugadas.
 */

const PEER_PREFIX = 'escoba15-';

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
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
    this.peer = null;
    this.conn = null;
    this.role = null; // 'host' | 'guest'
    this.code = null;
    this.handlers = {
      onStatus: () => {},
      onReady: () => {},
      onMessage: () => {},
      onDisconnect: () => {},
      onError: () => {},
    };
  }

  on(event, fn) {
    this.handlers[event] = fn;
  }

  async host() {
    await this._ensurePeerJs();
    this.role = 'host';
    this.code = randomCode();
    const id = PEER_PREFIX + this.code;

    this.peer = new Peer(id, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    return new Promise((resolve, reject) => {
      const fail = (err) => {
        this.handlers.onError(err);
        reject(err);
      };

      this.peer.on('open', (peerId) => {
        this.handlers.onStatus('Esperando a tu amigo…');
        resolve({ code: this.code, peerId });
      });

      this.peer.on('connection', (conn) => {
        if (this.conn && this.conn.open) {
          conn.close();
          return;
        }
        this._bindConn(conn);
      });

      this.peer.on('error', (err) => {
        if (String(err?.type) === 'unavailable-id') {
          this.destroy();
          this.host().then(resolve).catch(reject);
          return;
        }
        fail(err);
      });
    });
  }

  async join(code) {
    await this._ensurePeerJs();
    this.role = 'guest';
    this.code = normalizeCode(code);
    if (this.code.length !== 6) throw new Error('Código inválido (6 caracteres)');

    this.peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    return new Promise((resolve, reject) => {
      this.peer.on('open', () => {
        this.handlers.onStatus('Conectando…');
        const conn = this.peer.connect(PEER_PREFIX + this.code, { reliable: true });
        this._bindConn(conn);
        conn.on('open', () => resolve({ code: this.code }));
        conn.on('error', reject);
      });
      this.peer.on('error', reject);
    });
  }

  send(payload) {
    if (!this.conn || !this.conn.open) return false;
    this.conn.send(payload);
    return true;
  }

  destroy() {
    try {
      this.conn?.close();
    } catch (_) {}
    try {
      this.peer?.destroy();
    } catch (_) {}
    this.conn = null;
    this.peer = null;
  }

  _bindConn(conn) {
    this.conn = conn;
    conn.on('open', () => {
      this.handlers.onStatus('Conectado');
      this.handlers.onReady({ role: this.role, code: this.code });
    });
    conn.on('data', (data) => this.handlers.onMessage(data));
    conn.on('close', () => {
      this.handlers.onStatus('Desconectado');
      this.handlers.onDisconnect();
    });
    conn.on('error', (err) => this.handlers.onError(err));
  }

  _ensurePeerJs() {
    if (typeof Peer !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar PeerJS'));
      document.head.appendChild(s);
    });
  }
}
