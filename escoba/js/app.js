import {
  createMatch,
  applyMove,
  startNextRound,
  chooseAiMove,
  serializeState,
  WIN_SCORE,
} from './engine.js';
import { EscobaNet, normalizeCode } from './net.js';
import {
  buildCardFaceHtml,
  buildCardBackHtml,
  cardImageUrl,
  preloadDeckImages,
} from './cards-ui.js';
import { snapshotAnim, playTableAnim, playDealAnim, clearFlyLayer, playLeftoverSweep } from './anim.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NAME_KEY = 'escoba-player-name';

const state = {
  mode: null,
  role: null,
  me: 0,
  game: null,
  selectedHand: null,
  selectedTable: new Set(),
  names: ['Tú', 'Rival'],
  net: null,
  busy: false,
  skipNextPilePaint: false,
  animSeat: null,
  holdLeftoverIds: null,
  holdHandReveal: false,
  playGen: 0,
  lastSeenLog: 0,
  feed: [],
  pendingSnap: null,
  needDeal: false,
  dealHandsOnly: false,
  prevScores: [0, 0],
  dealing: false,
  lastPileCount: [0, 0],
  lastEscCount: [0, 0],
  netStatus: '',
  moveWatch: null,
  feltClearedUntil: 0,
  feltClearTimer: null,
  heroIdle: null,
  guestPoll: null,
  netChain: Promise.resolve(),
  nameHelloSent: false,
  waitRetry: false,
  stateEchoTimer: null,
  moveGate: false,
};

let audioCtx = null;

function buzz(pattern = 12) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) {}
}

function tone(freq = 440, dur = 0.08, type = 'sine', gain = 0.04) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch (_) {}
}

function playSfx(kind) {
  if (kind === 'select') {
    buzz(8);
    tone(520, 0.05, 'triangle', 0.03);
  } else if (kind === 'capture') {
    buzz([18, 40, 18]);
    tone(380, 0.09, 'sine', 0.05);
    setTimeout(() => tone(560, 0.1, 'sine', 0.04), 70);
  } else if (kind === 'escoba') {
    buzz([30, 40, 30, 40, 50]);
    tone(300, 0.12, 'sine', 0.06);
    setTimeout(() => tone(450, 0.12, 'sine', 0.05), 90);
    setTimeout(() => tone(680, 0.18, 'triangle', 0.05), 180);
  } else if (kind === 'discard') {
    buzz(10);
    tone(220, 0.07, 'sine', 0.03);
  } else if (kind === 'deal') {
    buzz(6);
    tone(260, 0.05, 'triangle', 0.025);
    setTimeout(() => tone(320, 0.05, 'triangle', 0.02), 80);
    setTimeout(() => tone(380, 0.06, 'triangle', 0.02), 160);
  } else if (kind === 'bad') {
    buzz([25, 40, 25]);
    tone(160, 0.1, 'sawtooth', 0.025);
  } else if (kind === 'round') {
    buzz([12, 30, 12]);
    tone(340, 0.1, 'sine', 0.04);
    setTimeout(() => tone(420, 0.12, 'triangle', 0.035), 90);
  } else if (kind === 'win') {
    buzz([30, 40, 30, 40, 60]);
    tone(392, 0.12, 'sine', 0.05);
    setTimeout(() => tone(523, 0.14, 'sine', 0.05), 100);
    setTimeout(() => tone(659, 0.22, 'triangle', 0.055), 220);
  } else if (kind === 'lose') {
    buzz([40, 60, 40]);
    tone(280, 0.14, 'sine', 0.04);
    setTimeout(() => tone(220, 0.18, 'triangle', 0.035), 120);
  } else if (kind === 'clutch') {
    buzz([16, 28, 16]);
    tone(600, 0.08, 'triangle', 0.04);
    setTimeout(() => tone(720, 0.1, 'sine', 0.035), 70);
  } else if (kind === 'peek') {
    buzz(6);
    tone(480, 0.04, 'triangle', 0.025);
  }
}

function myDisplayName() {
  const raw = ($('#playerName')?.value || '').trim();
  return raw.slice(0, 14) || 'Tú';
}

function loadSavedName() {
  try {
    const n = localStorage.getItem(NAME_KEY);
    if (n && $('#playerName')) $('#playerName').value = n;
  } catch (_) {}
}

function saveName() {
  try {
    localStorage.setItem(NAME_KEY, myDisplayName());
  } catch (_) {}
}

function applyFan(el, index, total) {
  const mid = (total - 1) / 2;
  const rot = (index - mid) * 3.6;
  const y = Math.abs(index - mid) * 2.2;
  el.style.setProperty('--fan-rot', `${rot}deg`);
  el.style.setProperty('--fan-y', `${y}px`);
}

function flashBad(msg) {
  setMsg(msg);
  const bar = $('#msgBar');
  bar?.classList.remove('flash-bad');
  void bar?.offsetWidth;
  bar?.classList.add('flash-bad');
  if (bar) {
    bar.setAttribute('aria-live', 'assertive');
    setTimeout(() => bar.setAttribute('aria-live', 'polite'), 500);
  }
  playSfx('bad');
  setTimeout(() => bar?.classList.remove('flash-bad'), 420);
}

function requestDeal({ handsOnly = false } = {}) {
  state.needDeal = true;
  state.dealHandsOnly = handsOnly;
}

async function runDealIfNeeded() {
  if (!state.needDeal || !state.game || state.game.phase !== 'play' || state.dealing) {
    return;
  }
  state.needDeal = false;
  const handsOnly = !!state.dealHandsOnly;
  state.dealHandsOnly = false;
  const gen = state.playGen;
  const cancelled = () => state.playGen !== gen;
  state.dealing = true;
  state.busy = true;
  state.holdHandReveal = false;
  const screen = $('#screenGame');
  screen?.classList.add('dealing');
  if (handsOnly) screen?.classList.add('dealing-hands');
  let finishedOk = false;
  try {
    render();
    await sleep(40);
    if (cancelled() || !state.game) return;
    const g = state.game;
    const me = state.me;
    const opp = 1 - me;
    try {
      await playDealAnim({
        tableCards: handsOnly ? [] : g.table.slice(),
        myCards: g.hands[me].slice(),
        oppCount: g.hands[opp].length,
        me,
        handsOnly,
        onSfx: playSfx,
        isCancelled: cancelled,
      });
    } catch (_) {}
    if (cancelled() || !state.game) return;
    state.prevScores = [...g.scores];
    state.dealing = false;
    state.busy = false;
    screen?.classList.remove('dealing', 'dealing-hands');
    finishedOk = true;
    render();
    // Deja asentar la mesa antes de que la CPU “piense”
    if (state.mode === 'cpu' && g.currentPlayer !== state.me) {
      await sleep(520);
    }
    if (cancelled()) return;
    maybeAiOrWait();
  } finally {
    screen?.classList.remove('dealing', 'dealing-hands');
    state.dealing = false;
    state.holdHandReveal = false;
    // Solo desbloquea si el reparto abortó; no toques el busy de la CPU
    if (!finishedOk && state.playGen === gen && state.game && !state.pendingSnap) {
      state.busy = false;
    }
  }
}

async function sweepRoundLeftovers(g) {
  const left = g.roundLeftovers;
  if (!left?.cards?.length) {
    state.holdLeftoverIds = null;
    return;
  }
  const gen = state.playGen;
  const cancelled = () => state.playGen !== gen;
  const felt = $('#felt');
  // Si onBeforeClear ya dejó los restos en la mesa, no hace falta reinyectar
  if (felt && !state.holdLeftoverIds?.size) {
    for (const c of left.cards) {
      const existing = document.querySelector(
        `.card[data-id="${CSS.escape(c.id)}"]`
      );
      if (!existing) {
        const el = cardEl(c, { face: true });
        const rot = ((Math.random() * 10) % 11) - 5;
        el.style.setProperty('--table-rot', `${rot}deg`);
        felt.appendChild(el);
      }
    }
    await sleep(40);
  }
  if (cancelled()) {
    state.holdLeftoverIds = null;
    return;
  }
  const who =
    left.player == null ? null : state.names[left.player] || 'Jugador';
  await playLeftoverSweep(left, {
    me: state.me,
    onSfx: playSfx,
    whoName: who,
    isCancelled: cancelled,
    onBeforeClear: async () => {
      state.holdLeftoverIds = null;
      renderPiles();
    },
  });
  state.holdLeftoverIds = null;
}

function stageRoundLeftoversForAnim() {
  const g = state.game;
  if (
    !g ||
    (g.phase !== 'roundEnd' && g.phase !== 'matchEnd') ||
    !g.roundLeftovers?.cards?.length
  ) {
    return false;
  }
  state.holdLeftoverIds = new Set(g.roundLeftovers.cards.map((c) => c.id));
  return true;
}

function markFeltCleared() {
  state.feltClearedUntil = Date.now() + 1200;
  clearTimeout(state.feltClearTimer);
  state.feltClearTimer = setTimeout(() => {
    state.feltClearedUntil = 0;
    if (!state.game || state.busy || state.dealing) return;
    if (state.game.table.length) return;
    const felt = $('#felt');
    felt?.classList.remove('felt-cleared');
    const empty = felt?.querySelector('.felt-empty');
    if (empty) {
      empty.classList.remove('cleared');
      empty.textContent = 'Mesa limpia';
    }
  }, 1250);
}

function enqueueNet(task) {
  state.netChain = state.netChain
    .then(() => {
      if (!state.net || state.mode !== 'online') return;
      return task();
    })
    .catch((err) => console.error(err));
  return state.netChain;
}

function applyRemoteNames(names) {
  if (!Array.isArray(names) || names.length < 2) return;
  const cleaned = names.map((n) => String(n || '').trim().slice(0, 14) || 'Jugador');
  state.names = cleaned;
  // Siempre conserva tu asiento local
  state.names[state.me] = myDisplayName();
}

function updatePlayButtons() {
  const g = state.game;
  if (!g) return;
  const myTurn = g.phase === 'play' && g.currentPlayer === state.me && !state.busy;
  const canPlay = myTurn && !!state.selectedHand;
  $('#btnCapture').disabled = !(canPlay && state.selectedTable.size > 0);
  $('#btnDiscard').disabled = !canPlay;
}

/** Actualiza selección sin reconstruir toda la mesa (más fluido en iPhone). */
function patchSelection() {
  const g = state.game;
  if (!g) return;
  const myTurn = g.phase === 'play' && g.currentPlayer === state.me && !state.busy;
  const selecting = myTurn && !!state.selectedHand;

  $$('#myHand .card').forEach((el) => {
    const id = el.dataset.id;
    const selected = state.selectedHand === id;
    el.classList.toggle('selected', selected);
    el.classList.toggle('dim', myTurn && !!state.selectedHand && !selected);
    if (el.getAttribute('aria-pressed') != null) {
      el.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
  });

  $$('#felt > .card').forEach((el) => {
    const id = el.dataset.id;
    if (!id) return;
    const on = state.selectedTable.has(id);
    el.classList.toggle('capture-target', on);
    if (el.getAttribute('aria-pressed') != null) {
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (selecting) el.onclick = () => toggleTable(id);
    else if (myTurn) el.onclick = () => setMsg('Elige primero una carta de tu mano');
    else el.onclick = null;
  });

  updatePlayButtons();
  if (!state.busy && g.phase === 'play') {
    setMsg(myTurn ? 'Tu turno' : `Turno de ${state.names[1 - state.me]}`);
  }
}

async function finishAfterMove() {
  const g = state.game;
  if (!g) {
    state.busy = false;
    state.holdHandReveal = false;
    return;
  }
  const gen = state.playGen;
  const cancelled = () => state.playGen !== gen;

  const last = normalizeLogMove(lastMoveFrom(g));
  if (last?.type === 'escoba') {
    markFeltCleared();
  }

  if (g.message === 'Nueva mano repartida' && g.phase === 'play') {
    setMsg('Nueva mano');
    state.holdHandReveal = true;
    render();
    await sleep(320);
    if (cancelled()) {
      state.holdHandReveal = false;
      return;
    }
    requestDeal({ handsOnly: true });
    await runDealIfNeeded();
    // Si el reparto no corrió (p.ej. ya dealing), no dejes la mano vacía/bloqueada
    if (state.playGen === gen && state.game) {
      state.holdHandReveal = false;
      if (state.busy && !state.dealing && !state.pendingSnap) {
        state.busy = false;
        render();
      }
    }
    return;
  }

  if (g.phase === 'roundEnd' || g.phase === 'matchEnd') {
    setMsg(g.phase === 'matchEnd' ? 'Fin de partida' : 'Fin de ronda');
    // Mantener cartas en el DOM para el barrido de restos
    await sweepRoundLeftovers(g);
    if (cancelled()) {
      state.busy = false;
      return;
    }
    render();
    await sleep(550);
    if (cancelled()) {
      state.busy = false;
      return;
    }
    if (state.game === g) showRoundPanel(g);
    state.busy = false;
    return;
  }

  if (state.skipNextPilePaint) {
    state.skipNextPilePaint = false;
    // Conserva el montón (y la animación de escoba cruzada) ya pintado bajo el flyer
    render({ skipPiles: true });
  } else {
    render();
  }
  state.busy = false;
  maybeAiOrWait();
}

function normalizeLogMove(mv) {
  if (!mv) return null;
  return {
    ...mv,
    cardId: mv.cardId || mv.card,
    captureIds: mv.captureIds || mv.capture || [],
  };
}

function clearGhosts() {
  document.querySelectorAll('.card.ghosting').forEach((el) => el.classList.remove('ghosting'));
}

function requestStateFromHost() {
  if (state.mode !== 'online' || state.role !== 'guest' || !state.net) return;
  state.net.send({ type: 'ping' });
}

function startGuestIdlePoll() {
  stopGuestIdlePoll();
  state.guestPoll = setInterval(() => {
    if (state.mode !== 'online' || state.role !== 'guest' || !state.net) return;
    if (!state.game || state.game.phase !== 'play') return;
    if (state.busy || state.dealing) return;
    if (state.game.currentPlayer === state.me) return;
    requestStateFromHost();
  }, 10000);
}

function stopGuestIdlePoll() {
  clearInterval(state.guestPoll);
  state.guestPoll = null;
}

function armMoveWatch() {
  clearTimeout(state.moveWatch);
  state.moveWatch = setTimeout(() => {
    if (!state.busy || state.role !== 'guest') return;
    // Primero sincroniza sin soltar; si el host ya aplicó, ingest desbloquea
    clearGhosts();
    clearSending();
    state.animSeat = null;
    flashBad('Sin respuesta — sincronizando');
    setNetChip('Sincronizando', 'warn');
    setMsg('Sincronizando…');
    requestStateFromHost();
    setTimeout(() => {
      if (state.role !== 'guest' || !state.busy) return;
      requestStateFromHost();
    }, 1800);
    // Si sigue colgado, libera la mesa para poder elegir otra vez
    clearTimeout(state.moveWatch);
    state.moveWatch = setTimeout(() => {
      if (!state.busy || state.role !== 'guest') return;
      const snap = state.pendingSnap;
      clearGhosts();
      clearSending();
      state.busy = false;
      state.moveGate = false;
      state.animSeat = null;
      state.holdHandReveal = false;
      if (snap?.move) {
        state.selectedHand = snap.move.cardId || null;
        state.selectedTable = new Set(snap.move.captureIds || []);
      }
      state.pendingSnap = null;
      state.waitRetry = false;
      flashBad('Sin respuesta — puedes reintentar');
      setNetChip('Sync…', 'warn');
      requestStateFromHost();
      render();
    }, 4000);
  }, 12000);
}

function clearMoveWatch() {
  clearTimeout(state.moveWatch);
  state.moveWatch = null;
}

function setNetChip(text, kind = '') {
  const el = $('#netChip');
  if (!el) return;
  const short =
    text === 'Sincronizando'
      ? 'Sync…'
      : text === 'Reconectando'
        ? 'Rede…'
        : text === 'Enlace…'
          ? 'Enlace…'
          : text;
  state.netStatus = text || '';
  if (!text) {
    el.hidden = true;
    el.textContent = '';
    el.className = 'net-chip';
    return;
  }
  el.hidden = false;
  el.textContent = short;
  el.className = `net-chip${kind ? ` ${kind}` : ''}`;
}

function showScreen(id) {
  $$('.screen').forEach((el) => el.classList.toggle('active', el.id === id));
}

function setMsg(text) {
  const el = $('#msgBar');
  if (el) el.textContent = text || '';
}

function tally(captured) {
  return {
    cards: captured.length,
    oros: captured.filter((c) => c.suit === 'oros').length,
    sietes: captured.filter((c) => c.rank === 7).length,
    sieteOros: captured.some((c) => c.suit === 'oros' && c.rank === 7),
    escobas: 0,
  };
}

function cardEl(card, {
  face = true,
  selectable = false,
  selected = false,
  capture = false,
  dim = false,
  tiny = false,
  last = false,
} = {}) {
  const asButton = !tiny && selectable;
  const el = document.createElement(asButton ? 'button' : 'div');
  if (asButton) el.type = 'button';
  el.className = `card ${face ? `face-up suit-${card?.suit || ''}` : 'face-down'}${tiny ? ' tiny' : ''}`;
  el.dataset.id = card?.id || '';
  if (selected) el.classList.add('selected');
  if (capture) el.classList.add('capture-target');
  if (dim) el.classList.add('dim');
  if (last) el.classList.add('hand-last');

  if (face && card) {
    el.innerHTML = buildCardFaceHtml(card);
    el.setAttribute('aria-label', card.label);
  } else {
    el.innerHTML = buildCardBackHtml();
    if (asButton) el.setAttribute('aria-label', 'Carta oculta');
    else el.setAttribute('aria-hidden', 'true');
  }

  if (asButton) {
    el.setAttribute('aria-pressed', selected || capture ? 'true' : 'false');
    const press = () => el.classList.add('pressed');
    const release = () => el.classList.remove('pressed');
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);
  }
  return el;
}

function renderStats() {
  const g = state.game;
  if (!g) return;
  const me = state.me;
  const opp = 1 - me;
  const tMe = tally(g.captured[me]);
  const tOpp = tally(g.captured[opp]);
  tMe.escobas = g.escobas[me];
  tOpp.escobas = g.escobas[opp];

  const fill = (root, t, who) => {
    if (!root) return;
    root.innerHTML = `
      <div class="stat-who">${who}</div>
      <div class="stat-chips">
        <span class="chip" title="Cartas"><em>${t.cards}</em> cartas</span>
        <span class="chip chip-oro" title="Oros"><em>${t.oros}</em> oros</span>
        <span class="chip chip-7" title="Sietes"><em>${t.sietes}</em> sietes</span>
        <span class="chip ${t.sieteOros ? 'chip-hot' : ''}" title="7 de oros">${t.sieteOros ? '★ 7♦' : '7♦'}</span>
        <span class="chip chip-esc" title="Escobas"><em>${t.escobas}</em> esc.</span>
      </div>
    `;
  };
  fill($('#statsOpp'), tOpp, state.names[opp]);
  fill($('#statsMe'), tMe, state.names[me]);
}

function renderScoreBars() {
  const g = state.game;
  if (!g) return;
  const set = (fillSel, trackSel, score) => {
    const el = $(fillSel);
    const track = $(trackSel);
    if (!el) return;
    const pct = Math.min(100, Math.round((score / WIN_SCORE) * 100));
    el.style.width = `${pct}%`;
    el.classList.toggle('near', score >= 15 && score < 18);
    el.classList.toggle('clutch', score >= 18);
    track?.setAttribute('aria-valuenow', String(score));
    track?.classList.toggle('near', score >= 15 && score < 18);
    track?.classList.toggle('clutch', score >= 18);
  };
  set('#barMe', '#scoreMe .score-track', g.scores[state.me]);
  set('#barOpp', '#scoreOpp .score-track', g.scores[1 - state.me]);
}

function renderFeed() {
  const el = $('#moveFeed');
  if (!el) return;
  if (!state.feed.length) {
    el.innerHTML = `<span class="feed-empty">Las capturas aparecerán aquí</span>`;
    return;
  }
  el.innerHTML = state.feed
    .slice(0, 5)
    .map(
      (f) =>
        `<div class="feed-item ${f.cls || ''}"><strong>${f.who}</strong> ${f.text}</div>`
    )
    .join('');
}

function pushFeed(mv) {
  if (!mv) return;
  const m = normalizeLogMove(mv);
  const who = state.names[m.player] || 'Jugador';
  let text = '';
  let cls = '';
  if (m.type === 'escoba') {
    text = 'hace ¡ESCOBA!';
    cls = 'feed-escoba';
  } else if (m.type === 'capture') {
    const n = 1 + (m.captureIds?.length || 0);
    text = `captura ${n} carta${n > 1 ? 's' : ''}`;
    cls = 'feed-cap';
  } else {
    text = 'deja una carta';
  }
  state.feed.unshift({ who, text, cls });
  state.feed = state.feed.slice(0, 8);
}

function renderPiles() {
  const g = state.game;
  const me = state.me;
  const opp = 1 - me;
  const hide = state.holdLeftoverIds;

  const paint = (el, cards, playerIdx) => {
    if (!el) return;
    const visible =
      hide?.size ? cards.filter((c) => !hide.has(c.id)) : cards;
    const prev = state.lastPileCount[playerIdx] || 0;
    const prevEsc = state.lastEscCount?.[playerIdx] || 0;
    const escCount = g.escobas[playerIdx] || 0;
    el.innerHTML = '';
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.setAttribute(
      'aria-label',
      `Capturas: ${cards.length} cartas, ${escCount} escobas. Toca para ver.`
    );
    el.onclick = () => openPeek(playerIdx);
    el.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPeek(playerIdx);
      }
    };

    if (!visible.length && !escCount) {
      el.innerHTML = `<div class="pile-empty">Sin capturas</div>`;
      state.lastPileCount[playerIdx] = 0;
      if (!state.lastEscCount) state.lastEscCount = [0, 0];
      state.lastEscCount[playerIdx] = 0;
      return;
    }

    const stage = document.createElement('div');
    stage.className = 'pile-stage';
    if (visible.length > prev || escCount > prevEsc) stage.classList.add('pile-pulse');

    // Montón normal (últimas capturas, cara arriba)
    if (visible.length) {
      const wrap = document.createElement('div');
      wrap.className = 'pile-stack';
      const show = visible.slice(-3);
      show.forEach((c, i) => {
        const card = cardEl(c, { face: true, tiny: true });
        card.style.setProperty('--i', String(i));
        wrap.appendChild(card);
      });
      stage.appendChild(wrap);
    }

    // Escobas: carta boca abajo y perpendicular (para contar)
    if (escCount > 0) {
      const escWrap = document.createElement('div');
      escWrap.className = 'pile-escobas';
      escWrap.setAttribute('aria-hidden', 'true');
      const showEsc = Math.min(escCount, 8);
      for (let i = 0; i < showEsc; i++) {
        const mark = cardEl(null, { face: false, tiny: true });
        mark.classList.add('escoba-mark');
        mark.style.setProperty('--e', String(i));
        if (i === showEsc - 1 && escCount > prevEsc) {
          mark.classList.add('escoba-mark-new');
        }
        escWrap.appendChild(mark);
      }
      stage.appendChild(escWrap);
    }

    el.appendChild(stage);
    const meta = document.createElement('div');
    meta.className = 'pile-meta';
    const bits = [];
    if (cards.length) bits.push(String(cards.length));
    if (escCount) bits.push(`${escCount} esc.`);
    bits.push('ver');
    meta.textContent = bits.join(' · ');
    el.appendChild(meta);

    state.lastPileCount[playerIdx] = visible.length;
    if (!state.lastEscCount) state.lastEscCount = [0, 0];
    state.lastEscCount[playerIdx] = escCount;
  };

  paint($('#pileOpp'), g.captured[opp], opp);
  paint($('#pileMe'), g.captured[me], me);
}

function openPeek(playerIdx) {
  const g = state.game;
  if (!g) return;
  const cards = g.captured[playerIdx];
  const overlay = $('#peekOverlay');
  const body = $('#peekBody');
  const title = $('#peekTitle');
  title.textContent = `Capturas de ${state.names[playerIdx]}`;
  if (!cards.length) {
    body.innerHTML = `<p class="peek-empty">Todavía no hay cartas. Toca el montón cuando haya capturas.</p>`;
  } else {
    const t = tally(cards);
    const suitOrder = { oros: 0, copas: 1, espadas: 2, bastos: 3 };
    const sorted = cards.slice().sort((a, b) => {
      const s = (suitOrder[a.suit] ?? 9) - (suitOrder[b.suit] ?? 9);
      return s || a.rank - b.rank;
    });
    const oros = sorted.filter((c) => c.suit === 'oros');
    const sietes = sorted.filter((c) => c.rank === 7);
    body.innerHTML = `
      <div class="peek-summary">
        <span>${t.cards} cartas</span>
        <span class="chip-oro">${t.oros} oros</span>
        <span>${t.sietes} sietes</span>
        <span class="${t.sieteOros ? 'chip-hot-inline' : ''}">${t.sieteOros ? '★ 7 de oros' : 'Sin 7♦'}</span>
        <span>${g.escobas[playerIdx]} escobas</span>
      </div>
      ${
        g.escobas[playerIdx]
          ? `<p class="peek-escoba-hint">${g.escobas[playerIdx]} carta${g.escobas[playerIdx] > 1 ? 's' : ''} cruzada${g.escobas[playerIdx] > 1 ? 's' : ''} en el montón</p>`
          : ''
      }
      ${oros.length ? `<div class="peek-section"><h3>Oros</h3><div class="peek-grid" id="peekOros"></div></div>` : ''}
      ${sietes.length ? `<div class="peek-section"><h3>Sietes</h3><div class="peek-grid" id="peekSietes"></div></div>` : ''}
      <div class="peek-section"><h3>Todas</h3><div class="peek-grid" id="peekAll"></div></div>
    `;
    const fill = (sel, list) => {
      const box = body.querySelector(sel);
      if (!box) return;
      list.forEach((c) => {
        const d = document.createElement('div');
        d.className = 'peek-card';
        if (c.suit === 'oros' && c.rank === 7) d.classList.add('hot');
        d.innerHTML = `<img src="${cardImageUrl(c)}" alt="${c.label}">`;
        box.appendChild(d);
      });
    };
    fill('#peekOros', oros);
    fill('#peekSietes', sietes);
    fill('#peekAll', sorted);
  }
  openOverlay('#peekOverlay', '#btnClosePeek');
  playSfx('peek');
}

let focusReturnEl = null;

function setAppInert(on) {
  const app = $('#app');
  if (!app) return;
  if (on) app.setAttribute('inert', '');
  else app.removeAttribute('inert');
}

function anyOverlayOpen() {
  return !!document.querySelector('.overlay.open');
}

function openOverlay(overlaySel, focusSel) {
  focusReturnEl = document.activeElement;
  setAppInert(true);
  $(overlaySel)?.classList.add('open');
  if (focusSel) {
    requestAnimationFrame(() => $(focusSel)?.focus?.());
  }
}

function closeOverlay(overlaySel) {
  $(overlaySel)?.classList.remove('open');
  if (!anyOverlayOpen()) setAppInert(false);
  const back = focusReturnEl;
  focusReturnEl = null;
  if (back && typeof back.focus === 'function') {
    try {
      back.focus();
    } catch (_) {}
  }
}

function render(opts = {}) {
  const skipPiles = !!opts.skipPiles;
  const g = state.game;
  if (!g) return;

  const opp = 1 - state.me;
  $('#scoreMe .who').textContent = state.names[state.me];
  $('#scoreOpp .who').textContent = state.names[opp];
  const ptsMe = $('#scoreMe .pts');
  const ptsOpp = $('#scoreOpp .pts');
  const prevMe = state.prevScores[state.me] || 0;
  const prevOpp = state.prevScores[1 - state.me] || 0;
  if (ptsMe) {
    if (Number(ptsMe.textContent) !== g.scores[state.me] && g.scores[state.me] > prevMe) {
      ptsMe.classList.remove('bump');
      void ptsMe.offsetWidth;
      ptsMe.classList.add('bump');
      if (g.scores[state.me] >= 18 && prevMe < 18) playSfx('clutch');
      else if (g.scores[state.me] >= 15 && prevMe < 15) playSfx('clutch');
    }
    ptsMe.textContent = g.scores[state.me];
  }
  if (ptsOpp) {
    if (Number(ptsOpp.textContent) !== g.scores[opp] && g.scores[opp] > prevOpp) {
      ptsOpp.classList.remove('bump');
      void ptsOpp.offsetWidth;
      ptsOpp.classList.add('bump');
      if (g.scores[opp] >= 18 && prevOpp < 18) playSfx('clutch');
    }
    ptsOpp.textContent = g.scores[opp];
  }
  state.prevScores = [...g.scores];
  const seat = flyingOrCurrentPlayer();
  $('#scoreMe').classList.toggle('active', seat === state.me);
  $('#scoreOpp').classList.toggle('active', seat === opp);

  const myTurn = g.phase === 'play' && g.currentPlayer === state.me && !state.busy;
  if (!state.busy) {
    setMsg(
      g.phase === 'play'
        ? myTurn
          ? 'Tu turno'
          : `Turno de ${state.names[opp]}`
        : g.message
    );
  }

  renderStats();
  renderScoreBars();
  if (!skipPiles) renderPiles();
  renderFeed();

  const oppHand = $('#oppHand');
  oppHand.innerHTML = '';
  const oppLen = g.hands[opp].length;
  oppHand.setAttribute(
    'aria-label',
    `Mano del rival: ${oppLen} carta${oppLen === 1 ? '' : 's'}`
  );
  if (!state.holdHandReveal) {
    for (let i = 0; i < oppLen; i++) {
      const el = cardEl(null, { face: false, last: oppLen === 1 });
      applyFan(el, i, oppLen);
      oppHand.appendChild(el);
    }
  }

  const felt = $('#felt');
  felt.innerHTML = '';
  felt.classList.toggle('deck-low', g.deck.length > 0 && g.deck.length <= 6);
  felt.classList.toggle('deck-empty', g.deck.length === 0);

  const deckStack = document.createElement('div');
  deckStack.className = 'deck-stack';
  deckStack.setAttribute('aria-label', `Mazo: ${g.deck.length} cartas`);
  const layers = Math.min(4, Math.max(0, Math.ceil(g.deck.length / 8)));
  for (let i = 0; i < layers; i++) {
    const layer = document.createElement('div');
    layer.className = 'deck-layer';
    layer.style.setProperty('--i', String(i));
    deckStack.appendChild(layer);
  }
  if (!layers) deckStack.classList.add('empty');
  const deckCount = document.createElement('span');
  deckCount.className = 'deck-count';
  deckCount.textContent = String(g.deck.length);
  deckStack.appendChild(deckCount);
  felt.appendChild(deckStack);

  // Restos de fin de ronda se muestran en mesa hasta el barrido
  const stagedLeft =
    state.holdLeftoverIds?.size && g.roundLeftovers?.cards?.length
      ? g.roundLeftovers.cards
      : null;
  const tableCards = g.table.length ? g.table : stagedLeft || [];

  if (!tableCards.length) {
    const empty = document.createElement('div');
    empty.className = 'felt-empty';
    const cleared = Date.now() < (state.feltClearedUntil || 0);
    if (cleared) {
      felt.classList.add('felt-cleared');
      empty.classList.add('cleared');
      empty.textContent = '¡Mesa limpia!';
    } else {
      felt.classList.remove('felt-cleared');
      empty.textContent = 'Mesa limpia';
    }
    felt.appendChild(empty);
  } else {
    felt.classList.remove('felt-cleared');
  }

  tableCards.forEach((c, i) => {
    const selected = state.selectedTable.has(c.id);
    // Botón en tu turno (aunque aún no hayas elegido carta de mano)
    const canPickTable = myTurn && !stagedLeft;
    const selecting = canPickTable && !!state.selectedHand;
    const el = cardEl(c, {
      face: true,
      selectable: canPickTable,
      selected: false,
      capture: selected,
    });
    const rot = ((i * 17) % 11) - 5;
    el.style.setProperty('--table-rot', `${rot}deg`);
    if (selecting) el.onclick = () => toggleTable(c.id);
    else if (canPickTable) {
      el.onclick = () => setMsg('Elige primero una carta de tu mano');
    } else el.onclick = null;
    felt.appendChild(el);
  });

  const myHand = $('#myHand');
  myHand.innerHTML = '';
  if (!state.holdHandReveal) {
    const myCards = g.hands[state.me];
    myCards.forEach((c, i) => {
      const selected = state.selectedHand === c.id;
      const el = cardEl(c, {
        face: true,
        selectable: myTurn,
        selected,
        dim: myTurn && state.selectedHand && !selected,
        last: myCards.length === 1,
      });
      applyFan(el, i, myCards.length);
      if (myTurn) el.addEventListener('click', () => selectHand(c.id));
      myHand.appendChild(el);
    });
  }

  const canPlay = myTurn && !!state.selectedHand;
  const canTryCapture = canPlay && state.selectedTable.size > 0;

  // Sin adelantar si la jugada es válida: el motor decide al confirmar
  $('#btnCapture').disabled = !canTryCapture;
  $('#btnDiscard').disabled = !canPlay;
}

function selectHand(id) {
  if (state.busy || state.dealing) return;
  if (state.selectedHand === id) {
    state.selectedHand = null;
    state.selectedTable.clear();
  } else {
    state.selectedHand = id;
    state.selectedTable.clear();
    playSfx('select');
  }
  patchSelection();
}

function toggleTable(id) {
  if (state.busy || state.dealing) return;
  if (state.selectedTable.has(id)) state.selectedTable.delete(id);
  else state.selectedTable.add(id);
  playSfx('select');
  patchSelection();
}

function lastMoveFrom(game) {
  const log = game?.moveLog || [];
  if (!log.length) return null;
  return log[log.length - 1];
}

function ghostIds(ids) {
  for (const id of ids || []) {
    document
      .querySelector(`.card[data-id="${CSS.escape(String(id))}"]`)
      ?.classList.add('ghosting');
  }
}

function flyingOrCurrentPlayer() {
  const g = state.game;
  if (!g || g.phase !== 'play') return null;
  if (state.animSeat != null) return state.animSeat;
  if (state.pendingSnap?.move) {
    return Number(state.pendingSnap.move.player ?? state.me);
  }
  return g.currentPlayer;
}

function markSending(ids) {
  for (const id of ids || []) {
    document
      .querySelector(`.card[data-id="${CSS.escape(String(id))}"]`)
      ?.classList.add('sending');
  }
}

function clearSending() {
  document.querySelectorAll('.card.sending').forEach((el) => el.classList.remove('sending'));
}

function sendState(game = state.game) {
  if (!state.net || !game) return false;
  const payload = {
    type: 'state',
    game: serializeState(game),
    names: state.names,
  };
  const ok = state.net.send(payload);
  if (!ok) {
    setTimeout(() => state.net?.send(payload), 500);
  }
  // Ecos retrasados por si un publish se pierde (QoS no es magia absoluta)
  clearTimeout(state.stateEchoTimer);
  const gen = state.playGen;
  const logLen = (game.moveLog || []).length;
  state.stateEchoTimer = setTimeout(() => {
    if (state.playGen !== gen || state.role !== 'host' || !state.net || !state.game) return;
    if ((state.game.moveLog || []).length !== logLen) return;
    state.net.send({
      type: 'state',
      game: serializeState(state.game),
      names: state.names,
    });
  }, 900);
  return ok;
}

async function applyAndReveal(move, { broadcast = false } = {}) {
  const gen = state.playGen;
  const cancelled = () => state.playGen !== gen;
  if (!state.game) {
    state.busy = false;
    state.moveGate = false;
    return;
  }
  state.busy = true;
  const beforeLen = (state.game.moveLog || []).length;

  // Snapshot positions while DOM still shows current hands/table
  const snap = snapshotAnim(move, { me: state.me, game: state.game });
  ghostIds([move.cardId, ...(move.captureIds || [])]);

  try {
    state.game = applyMove(state.game, move);
  } catch (err) {
    state.busy = false;
    state.moveGate = false;
    clearGhosts();
    throw err;
  }
  state.selectedHand = null;
  state.selectedTable.clear();

  if (broadcast && state.mode === 'online' && state.role === 'host') {
    sendState(state.game);
  }

  try {
    const mv = lastMoveFrom(state.game);
    if (mv && (state.game.moveLog || []).length > beforeLen) {
      pushFeed(mv);
      state.animSeat = mv.player;
      setMsg(
        mv.type === 'escoba'
          ? '¡Escoba!'
          : mv.type === 'capture'
            ? 'Capturando…'
            : 'Dejando carta…'
      );
      if (state.game.message === 'Nueva mano repartida') {
        state.holdHandReveal = true;
      }
      await playTableAnim(snap, mv.type, {
        onSfx: playSfx,
        isCancelled: cancelled,
        onBeforeClear: async () => {
          if (cancelled()) return;
          state.skipNextPilePaint = true;
          stageRoundLeftoversForAnim();
          render();
        },
      });
      if (cancelled()) {
        state.holdHandReveal = false;
        return;
      }
    }
    state.lastSeenLog = (state.game.moveLog || []).length;
    state.animSeat = null;
    clearGhosts();
    clearSending();
    await finishAfterMove();
  } catch (err) {
    if (!cancelled()) {
      state.busy = false;
      state.holdHandReveal = false;
      state.moveGate = false;
    }
    throw err;
  } finally {
    // No limpiar busy aquí: finishAfterMove / deal / maybeAiOrWait lo gestionan
    if (!cancelled()) {
      state.animSeat = null;
      clearGhosts();
      clearSending();
      state.moveGate = false;
    }
  }
}

async function commitLocalMove(move) {
  try {
    await applyAndReveal(move, {
      broadcast: state.mode === 'online' && state.role === 'host',
    });
    return true;
  } catch (err) {
    state.busy = false;
    state.moveGate = false;
    state.holdHandReveal = false;
    const reason = err?.message || 'Jugada inválida';
    // Mensajes cortos de regla, sin calcular por ti
    if (/capturar/i.test(reason)) flashBad('Con esa carta hay que capturar');
    else if (/inválida|sumar 15/i.test(reason)) flashBad('Esa captura no vale');
    else flashBad(reason);
    render();
    return false;
  }
}

function submitMove(move) {
  if (state.busy || state.moveGate || state.dealing) return;
  // Candado síncrono anti doble-toque (sin bloquear la mano antes de animar)
  state.moveGate = true;
  $('#btnCapture').disabled = true;
  $('#btnDiscard').disabled = true;

  if (state.mode === 'online' && state.role === 'guest') {
    state.busy = true;
    state.animSeat = state.me;
    state.waitRetry = false;
    // Snapshot ahora; no ocultar cartas hasta que arranque el vuelo
    state.pendingSnap = snapshotAnim(move, { me: state.me, game: state.game });
    markSending([move.cardId, ...(move.captureIds || [])]);
    const ok = state.net.send({ type: 'move', move });
    if (!ok) {
      state.busy = false;
      state.moveGate = false;
      state.animSeat = null;
      state.pendingSnap = null;
      clearSending();
      clearGhosts();
      flashBad('Sin conexión — reinténtalo');
      setNetChip('Sin red', 'bad');
      render();
      return;
    }
    state.selectedHand = null;
    state.selectedTable.clear();
    setMsg('Enviando jugada…');
    armMoveWatch();
    patchSelection();
    // Mantén el glow en tu asiento mientras envías
    const seat = flyingOrCurrentPlayer();
    $('#scoreMe')?.classList.toggle('active', seat === state.me);
    $('#scoreOpp')?.classList.toggle('active', seat === 1 - state.me);
    return;
  }
  commitLocalMove({ ...move, player: state.me });
}

function doCapture() {
  if (!state.selectedHand || state.busy) return;
  if (!state.selectedTable.size) {
    flashBad('Elige cartas de la mesa');
    return;
  }
  submitMove({
    player: state.me,
    cardId: state.selectedHand,
    captureIds: [...state.selectedTable],
  });
}

function doDiscard() {
  if (!state.selectedHand || state.busy) return;
  submitMove({
    player: state.me,
    cardId: state.selectedHand,
    captureIds: [],
  });
}

async function maybeAiOrWait() {
  const g = state.game;
  if (!g || g.phase !== 'play') return;
  if (state.mode === 'cpu' && g.currentPlayer !== state.me && !state.busy) {
    const gen = state.playGen;
    const stillCpu = () =>
      state.playGen === gen &&
      state.mode === 'cpu' &&
      state.game &&
      state.game.phase === 'play' &&
      state.game.currentPlayer !== state.me;
    state.busy = true;
    const oppName = state.names[1 - state.me] || 'Rival';
    setMsg(`${oppName} piensa…`);
    $('#scoreOpp')?.classList.add('thinking');
    render();
    const firstBeat = (g.moveLog || []).length === 0 ? 380 : 0;
    await sleep(firstBeat + 700 + Math.floor(Math.random() * 420));
    if (!stillCpu()) {
      $('#scoreOpp')?.classList.remove('thinking');
      if (state.playGen === gen) state.busy = false;
      return;
    }
    const move = chooseAiMove(state.game, 1 - state.me);
    if (!move) {
      $('#scoreOpp')?.classList.remove('thinking');
      state.busy = false;
      return;
    }
    const clearing =
      move.captureIds?.length &&
      move.captureIds.length === state.game.table.length;
    const pause = clearing ? 640 : move.captureIds?.length ? 420 : 240;
    await sleep(pause);
    if (!stillCpu()) {
      $('#scoreOpp')?.classList.remove('thinking');
      if (state.playGen === gen) state.busy = false;
      return;
    }
    // Mantener “thinking” hasta que arranque el vuelo
    state.busy = false;
    const flying = applyAndReveal(move);
    $('#scoreOpp')?.classList.remove('thinking');
    await flying;
  }
}

function cellMark(pts) {
  if (pts > 0) return `<span class="pts-win">+${pts}</span>`;
  return `<span class="pts-zero">—</span>`;
}

function showRoundPanel(g) {
  const panel = $('#roundOverlay');
  const title = $('#roundTitle');
  const body = $('#roundBody');
  const actions = $('#roundActions');

  if (g.phase === 'matchEnd') {
    title.textContent =
      g.winner == null
        ? 'Empate'
        : g.winner === state.me
          ? '¡Has ganado!'
          : 'Has perdido';
    if (g.winner === state.me) playSfx('win');
    else if (g.winner == null) playSfx('round');
    else playSfx('lose');
  } else {
    title.textContent = 'Recuento de la ronda';
    playSfx('round');
  }

  const rs = g.roundScores;
  const left = g.roundLeftovers;
  let leftoverNote = '';
  if (left?.cards?.length) {
    leftoverNote =
      left.player == null
        ? `<p class="leftover-note">Las ${left.cards.length} cartas de la mesa se retiraron (nadie había capturado).</p>`
        : `<p class="leftover-note">${left.cards.length} carta${left.cards.length > 1 ? 's' : ''} de la mesa → <strong>${state.names[left.player]}</strong></p>`;
  }

  if (rs) {
    const c = rs.counts;
    const me = state.me;
    const opp = 1 - me;
    const hasSO = [
      g.captured[0].some((x) => x.suit === 'oros' && x.rank === 7),
      g.captured[1].some((x) => x.suit === 'oros' && x.rank === 7),
    ];
    const byKey = Object.fromEntries(rs.detail.map((d) => [d.key, d]));
    const side = (d, p) => (p === 0 ? d.a : d.b);
    const meLabel = state.names[me] === 'Tú' ? 'Tú' : `Tú · ${state.names[me]}`;
    const row = (label, countA, countB, ptsA, ptsB, tip) => `
      <tr>
        <td><div class="score-label">${label}</div><div class="score-tip">${tip}</div></td>
        <td class="me-col"><div class="score-count">${countA}</div>${cellMark(ptsA)}</td>
        <td><div class="score-count">${countB}</div>${cellMark(ptsB)}</td>
      </tr>`;

    body.innerHTML = `
      ${leftoverNote}
      <p class="score-intro">Así se suman los puntos de esta ronda:</p>
      <table class="score-table">
        <thead><tr><th>Concepto</th><th class="me-col">${meLabel}</th><th>${state.names[opp]}</th></tr></thead>
        <tbody>
          ${row('Escobas', g.escobas[me], g.escobas[opp], side(byKey.escobas, me), side(byKey.escobas, opp), '1 punto por cada escoba')}
          ${row('Cartas', c.cards[me], c.cards[opp], side(byKey.cartas, me), side(byKey.cartas, opp), '1 punto quien tenga más')}
          ${row('Oros', c.oros[me], c.oros[opp], side(byKey.oros, me), side(byKey.oros, opp), '1 punto quien tenga más')}
          ${row('Sietes', c.sietes[me], c.sietes[opp], side(byKey.sietes, me), side(byKey.sietes, opp), '1 punto quien tenga más')}
          ${row('7 de oros', hasSO[me] ? 'Sí' : 'No', hasSO[opp] ? 'Sí' : 'No', side(byKey.sieteOros, me), side(byKey.sieteOros, opp), '1 punto quien lo capture')}
          <tr class="sum-row"><td>Suma de la ronda</td><td class="me-col"><strong>+${rs.pts[me]}</strong></td><td><strong>+${rs.pts[opp]}</strong></td></tr>
          <tr class="total"><td>Marcador (a ${WIN_SCORE})</td><td class="me-col"><strong>${g.scores[me]}</strong></td><td><strong>${g.scores[opp]}</strong></td></tr>
        </tbody>
      </table>
      ${
        g.phase === 'matchEnd'
          ? `<p class="final-line">${
              g.winner == null
                ? 'Misma puntuación final.'
                : g.winner === state.me
                  ? `¡Victoria! ${g.scores[me]}–${g.scores[opp]}.`
                  : `Victoria de <strong>${state.names[g.winner]}</strong>: ${g.scores[0]}–${g.scores[1]}.`
            }</p>`
          : ''
      }
    `;
  } else {
    body.innerHTML = `${leftoverNote}<p>${g.message}</p>`;
  }

  actions.innerHTML = '';
  if (g.phase === 'roundEnd') {
    const btn = document.createElement('button');
    btn.className = 'btn btn-gold';
    btn.textContent = 'Siguiente ronda';
    btn.onclick = () => nextRound();
    if (state.mode === 'online' && state.role === 'guest') {
      btn.disabled = true;
      btn.textContent = 'Esperando anfitrión…';
    }
    actions.appendChild(btn);
  } else if (g.phase === 'matchEnd') {
    const again = document.createElement('button');
    again.className = 'btn btn-gold';
    again.textContent = 'Nueva partida';
    if (state.mode === 'cpu') again.onclick = () => startCpu();
    else if (state.mode === 'online' && state.role === 'host') {
      again.onclick = () => {
        state.game = createMatch({ firstPlayer: 0 });
        state.game.scores = [0, 0];
        state.lastSeenLog = 0;
        state.feed = [];
        state.selectedHand = null;
        state.selectedTable.clear();
        state.prevScores = [0, 0];
        sendState(state.game);
        closeRoundOverlay();
        showScreen('screenGame');
        requestDeal();
        render();
        runDealIfNeeded();
      };
    } else {
      again.disabled = true;
      again.textContent = 'Espera al anfitrión o sal';
    }
    actions.appendChild(again);
  }

  const home = document.createElement('button');
  home.className = 'btn btn-ghost';
  home.textContent = 'Salir al inicio';
  home.onclick = () => leaveToHome();
  actions.appendChild(home);
  openOverlay('#roundOverlay', null);
  const inner = panel.querySelector('.panel');
  if (inner) {
    inner.classList.remove('reveal-score', 'match-win', 'match-lose', 'match-draw');
    void inner.offsetWidth;
    inner.classList.add('reveal-score');
    if (g.phase === 'matchEnd') {
      if (g.winner === state.me) inner.classList.add('match-win');
      else if (g.winner == null) inner.classList.add('match-draw');
      else inner.classList.add('match-lose');
    }
  }
  requestAnimationFrame(() => {
    actions.querySelector('button:not([disabled])')?.focus?.();
  });
}

function closeRoundOverlay() {
  closeOverlay('#roundOverlay');
}

function nextRound() {
  if (state.mode === 'online' && state.role === 'guest') return;
  state.game = startNextRound(state.game);
  state.lastSeenLog = 0;
  state.feed = [];
  closeRoundOverlay();
  requestDeal();
  render();
  if (state.mode === 'online' && state.role === 'host') {
    sendState(state.game);
  }
  runDealIfNeeded();
}

function leaveToHome() {
  state.playGen += 1;
  state.netChain = Promise.resolve();
  state.net?.destroy();
  state.net = null;
  state.game = null;
  state.mode = null;
  state.busy = false;
  state.dealing = false;
  state.animSeat = null;
  state.pendingSnap = null;
  state.holdLeftoverIds = null;
  state.holdHandReveal = false;
  state.needDeal = false;
  state.dealHandsOnly = false;
  state.lastSeenLog = 0;
  state.feed = [];
  state.feltClearedUntil = 0;
  state.waitRetry = false;
  state.moveGate = false;
  clearTimeout(state.feltClearTimer);
  clearTimeout(state.stateEchoTimer);
  state.stateEchoTimer = null;
  clearMoveWatch();
  stopGuestIdlePoll();
  clearGhosts();
  clearSending();
  clearFlyLayer();
  setNetChip('');
  $('#scoreOpp')?.classList.remove('thinking');
  $('#screenGame')?.classList.remove('dealing', 'dealing-hands');
  $('#roundOverlay').classList.remove('open');
  $('#inviteOverlay').classList.remove('open');
  $('#peekOverlay')?.classList.remove('open');
  $('#rulesOverlay')?.classList.remove('open');
  setAppInert(false);
  focusReturnEl = null;
  $('#inviteStatus')?.classList.remove('waiting-pulse');
  $('#joinWaitStatus')?.classList.remove('waiting-pulse');
  resetJoinUi();
  clearInviteQuery();
  showScreen('screenHome');
  startHeroIdle();
}

function startCpu() {
  saveName();
  state.mode = 'cpu';
  state.role = null;
  state.me = 0;
  state.names = [myDisplayName(), 'CPU'];
  state.game = createMatch({ firstPlayer: Math.random() < 0.5 ? 0 : 1 });
  state.lastSeenLog = 0;
  state.feed = [];
  state.selectedHand = null;
  state.selectedTable.clear();
  state.prevScores = [0, 0];
  showScreen('screenGame');
  closeRoundOverlay();
  stopHeroIdle();
  requestDeal();
  render();
  runDealIfNeeded();
}

function beginHostMatch() {
  if (state.role !== 'host' || !state.net) return;
  if (state.game && state.net.ready) {
    sendState(state.game);
    return;
  }
  saveName();
  state.names[0] = myDisplayName();
  if (!state.names[1] || state.names[1] === 'Amigo') {
    // se rellena con el nombre del join si llegó
    state.names[1] = state.names[1] || 'Amigo';
  }
  state.game = createMatch({ firstPlayer: 0 });
  state.lastSeenLog = 0;
  state.selectedHand = null;
  state.selectedTable.clear();
  state.feed = [];
  state.prevScores = [0, 0];
  state.net.markReady();
  state.net.send({ type: 'hello', names: state.names });
  sendState(state.game);
  closeOverlay('#inviteOverlay');
  showScreen('screenGame');
  setNetChip('En línea', 'ok');
  requestDeal();
  render();
  runDealIfNeeded();
}

async function startHost() {
  try {
    saveName();
    state.net?.destroy();
    state.net = new EscobaNet();
    state.net.playerName = myDisplayName();
    wireNet(state.net);
    $('#inviteStatus').textContent = 'Creando sala…';
    openOverlay('#inviteOverlay', '#btnCancelInvite');
    const { code } = await state.net.host();
    $('#inviteCode').textContent = code;
    $('#inviteStatus').textContent = 'Comparte el código con tu amigo';
    $('#inviteStatus')?.classList.add('waiting-pulse');
    requestAnimationFrame(() => $('#btnShare')?.focus?.());
    state.mode = 'online';
    state.role = 'host';
    state.me = 0;
    state.names = [myDisplayName(), 'Amigo'];
    state.game = null;
    stopHeroIdle();
  } catch (err) {
    $('#inviteStatus').textContent = err.message || 'Error al crear sala';
  }
}

async function startJoin() {
  const code = normalizeCode($('#joinCode').value);
  if (code.length !== 6) {
    setMsg('Introduce un código de 6 caracteres');
    return;
  }
  try {
    saveName();
    state.net?.destroy();
    state.net = new EscobaNet();
    state.net.playerName = myDisplayName();
    wireNet(state.net);
    showScreen('screenJoinWait');
    $('#joinWaitStatus').textContent = 'Conectando…';
    $('#joinWaitStatus')?.classList.add('waiting-pulse');
    stopHeroIdle();
    await state.net.join(code);
    state.mode = 'online';
    state.role = 'guest';
    state.me = 1;
    state.names = ['Anfitrión', myDisplayName()];
    state.nameHelloSent = false;
    startGuestIdlePoll();
    $('#joinWaitStatus').textContent = 'Conectado. Esperando al anfitrión…';
    setNetChip('Enlace…', 'warn');
  } catch (err) {
    $('#joinWaitStatus').textContent = err.message || 'No se pudo unir';
    setNetChip('Sin red', 'bad');
  }
}

async function ingestRemoteState(game, meta = {}) {
  const gen = state.playGen;
  const stillHere = () =>
    state.playGen === gen && state.mode === 'online' && !!state.net;

  clearMoveWatch();
  if (!stillHere()) return;
  if (meta.names) applyRemoteNames(meta.names);

  state.waitRetry = false;

  const prevLog = state.lastSeenLog || 0;
  const wasPlaying = !!state.game;
  const prevGame = state.game;
  const log = game.moveLog || [];

  // Ignora estados viejos / duplicados mientras animamos
  if (wasPlaying && log.length < prevLog) {
    // Nueva ronda/partida aunque el guest no viera el panel de fin
    const reset =
      game.phase === 'play' &&
      (prevGame.phase === 'roundEnd' ||
        prevGame.phase === 'matchEnd' ||
        log.length === 0);
    if (!reset) return;
  }
  if (
    wasPlaying &&
    log.length === prevLog &&
    game.phase === prevGame?.phase &&
    !meta.force
  ) {
    // Solo refresco de nombres / sync sin jugada nueva
    state.game = game;
    if (!state.busy) render();
    return;
  }

  const gap = wasPlaying ? Math.max(0, log.length - prevLog) : 0;
  let mv = null;
  if (gap === 1) {
    mv = normalizeLogMove(log[log.length - 1]);
  } else if (gap > 1) {
    // Varias jugadas perdidas: no animes con snapshot incorrecto
    for (let i = prevLog; i < log.length; i++) {
      pushFeed(normalizeLogMove(log[i]));
    }
    setMsg('Sincronizado');
  }

  // Reparto animado solo si la mesa es realmente nueva
  const isFreshDeal =
    game.phase === 'play' &&
    ((prevGame &&
      (prevGame.phase === 'roundEnd' || prevGame.phase === 'matchEnd')) ||
      (!wasPlaying && log.length === 0) ||
      (wasPlaying && log.length === 0 && gap === 0 && prevLog > 0));

  let snap = state.pendingSnap || null;
  if (snap && mv) {
    const sm = snap.move || {};
    const same =
      String(sm.cardId || '') === String(mv.cardId || '') &&
      Number(sm.player ?? state.me) === Number(mv.player);
    if (!same) snap = null;
  }
  if (!snap && mv && prevGame) {
    snap = snapshotAnim(
      { player: mv.player, cardId: mv.cardId, captureIds: mv.captureIds || [] },
      { me: state.me, game: prevGame }
    );
  }
  // Oculta cartas justo al arrancar el vuelo (guest ya no las ghostea al enviar)
  if (mv && snap) {
    clearSending();
    ghostIds([mv.cardId, ...(mv.captureIds || [])]);
  } else {
    clearSending();
  }
  state.pendingSnap = null;

  state.game = game;
  state.selectedHand = null;
  state.selectedTable.clear();
  state.net?.markReady();
  setNetChip('En línea', 'ok');
  closeRoundOverlay();
  showScreen('screenGame');

  // Guest confirma nombre tras estar listo (rejoin / primera sync)
  if (state.role === 'guest' && state.net && !state.nameHelloSent) {
    state.nameHelloSent = true;
    state.net.send({ type: 'hello', playerName: myDisplayName() });
  }

  state.busy = true;
  try {
    if (mv && snap) {
      pushFeed(mv);
      state.animSeat = mv.player;
      if (game.message === 'Nueva mano repartida') {
        state.holdHandReveal = true;
      }
      await playTableAnim(snap, mv.type, {
        onSfx: playSfx,
        isCancelled: () => !stillHere(),
        onBeforeClear: async () => {
          if (!stillHere()) return;
          state.skipNextPilePaint = true;
          stageRoundLeftoversForAnim();
          render();
        },
      });
      if (!stillHere()) return;
      if (mv.type === 'escoba') markFeltCleared();
    }
    state.lastSeenLog = log.length;
    state.animSeat = null;
    clearGhosts();
    clearSending();

    if (!stillHere()) return;

    if (state.role === 'guest') startGuestIdlePoll();

    if (isFreshDeal && game.phase === 'play' && !mv) {
      state.feed = [];
      requestDeal();
      render();
      await runDealIfNeeded();
      return;
    }

    // Guest se une a mitad de partida: pinta el estado sin falso reparto
    if (!wasPlaying && game.phase === 'play' && log.length > 0 && !mv) {
      render();
      return;
    }

    // Mid-round redeal after a move (o catch-up con varias jugadas)
    if (
      game.phase === 'play' &&
      game.message === 'Nueva mano repartida' &&
      (mv || gap > 1)
    ) {
      setMsg('Nueva mano');
      state.holdHandReveal = true;
      render();
      await sleep(320);
      if (!stillHere()) return;
      requestDeal({ handsOnly: true });
      await runDealIfNeeded();
      return;
    }

    if (game.phase === 'roundEnd' || game.phase === 'matchEnd') {
      setMsg(game.phase === 'matchEnd' ? 'Fin de partida' : 'Fin de ronda');
      await sweepRoundLeftovers(game);
      if (!stillHere()) return;
      render();
      await sleep(550);
      if (stillHere() && state.game === game) showRoundPanel(game);
      return;
    }

    if (state.skipNextPilePaint) {
      state.skipNextPilePaint = false;
      render({ skipPiles: true });
    } else {
      render();
    }
  } finally {
    if (state.playGen === gen) {
      state.busy = false;
      state.moveGate = false;
      state.holdHandReveal = false;
      state.animSeat = null;
      clearGhosts();
      clearSending();
    }
  }
}

function wireNet(net) {
  net.on('onPeerJoin', (data) => {
    if (state.role !== 'host') return;
    const guestName = String(data?.name || '').trim().slice(0, 14);
    if (guestName) state.names[1] = guestName;
    beginHostMatch();
  });

  net.on('onReconnect', () => {
    setNetChip('Sincronizando', 'warn');
    if (state.role === 'guest') {
      requestStateFromHost();
    } else if (state.role === 'host' && state.game) {
      sendState(state.game);
      setNetChip('En línea', 'ok');
    }
  });

  net.on('onMessage', (data) => {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'requestState' && state.role === 'host' && state.game) {
      sendState(state.game);
      return;
    }

    if (data.type === 'hello') {
      if (data.names) {
        applyRemoteNames(data.names);
      } else if (data.playerName && state.role === 'host') {
        const guestName = String(data.playerName || '').trim().slice(0, 14);
        if (guestName) {
          state.names[1] = guestName;
          // Echo nombres canónicos para que el guest vea al anfitrión
          net.send({ type: 'hello', names: state.names });
        }
      }
      if (state.game && !state.busy) render();
      return;
    }

    if (data.type === 'state' && state.role === 'guest') {
      enqueueNet(() => ingestRemoteState(data.game, { names: data.names }));
      return;
    }

    if (data.type === 'move' && state.role === 'host') {
      enqueueNet(async () => {
        // Espera a que termine animación/reparto en vez de rechazar
        let guard = 0;
        while ((state.busy || state.dealing) && guard < 70) {
          await sleep(200);
          guard++;
        }
        if (state.busy || state.dealing) {
          net.send({ type: 'reject', reason: 'Espera un momento' });
          return;
        }
        try {
          const move = { ...data.move, player: 1 };
          await applyAndReveal(move, { broadcast: true });
        } catch (err) {
          net.send({ type: 'reject', reason: err.message });
          state.busy = false;
        }
      });
      return;
    }

    if (data.type === 'reject' && state.role === 'guest') {
      clearMoveWatch();
      const snap = state.pendingSnap;
      const reason = data.reason || 'Jugada rechazada';
      const waitBusy = /espera/i.test(reason);

      // Host ocupado: reenvía una vez sin soltar la selección
      if (waitBusy && snap?.move && !state.waitRetry) {
        state.waitRetry = true;
        setNetChip('Sincronizando', 'warn');
        setMsg('Esperando al anfitrión…');
        flashBad('Espera un momento');
        setTimeout(() => {
          if (state.role !== 'guest' || !state.net || !state.pendingSnap?.move) return;
          if (!state.busy) return;
          const ok = state.net.send({ type: 'move', move: state.pendingSnap.move });
          if (ok) {
            setMsg('Reenviando jugada…');
            armMoveWatch();
          } else {
            state.busy = false;
            state.moveGate = false;
            state.animSeat = null;
            state.pendingSnap = null;
            state.waitRetry = false;
            clearSending();
            clearGhosts();
            flashBad('Sin conexión — reinténtalo');
            setNetChip('Sin red', 'bad');
            render();
          }
        }, 550);
        return;
      }

      state.busy = false;
      state.moveGate = false;
      state.animSeat = null;
      state.pendingSnap = null;
      state.waitRetry = false;
      state.holdHandReveal = false;
      clearGhosts();
      clearSending();
      // Restaura la selección para reintentar con un toque
      if (snap?.move) {
        state.selectedHand = snap.move.cardId || null;
        state.selectedTable = new Set(snap.move.captureIds || []);
      }
      if (/capturar/i.test(reason)) flashBad('Con esa carta hay que capturar');
      else if (/inválida|sumar 15/i.test(reason)) flashBad('Esa captura no vale');
      else if (waitBusy) flashBad('Espera un momento');
      else flashBad(reason);
      render();
    }
  });

  net.on('onDisconnect', () => {
    setMsg('Conexión interrumpida…');
    setNetChip('Reconectando', 'warn');
  });
  net.on('onError', (err) => {
    console.error(err);
    const msg = err?.message || 'Error de conexión';
    setNetChip('Sin red', 'bad');
    if ($('#inviteOverlay')?.classList.contains('open')) $('#inviteStatus').textContent = msg;
    else if ($('#screenJoinWait')?.classList.contains('active')) $('#joinWaitStatus').textContent = msg;
    else setMsg(msg);
  });
  net.on('onStatus', (s) => {
    if ($('#inviteOverlay')?.classList.contains('open')) {
      $('#inviteStatus').textContent = s;
      $('#inviteStatus')?.classList.add('waiting-pulse');
    }
    if ($('#screenJoinWait')?.classList.contains('active')) {
      $('#joinWaitStatus').textContent = s;
      $('#joinWaitStatus')?.classList.add('waiting-pulse');
    }
    if (/listo|conectado|amigo|peer|en línea|reconectado/i.test(s || '')) setNetChip('En línea', 'ok');
    else if (/conect|espera|emparej|sincron|reconect/i.test(s || '')) setNetChip('Enlace…', 'warn');
  });
}

async function shareInvite() {
  const code = $('#inviteCode').textContent;
  const base = location.href.split('?')[0].split('#')[0];
  const url = `${base}?code=${encodeURIComponent(code)}`;
  const text = `¡Juguemos a la Escoba! Código: ${code}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Escoba', text, url });
      $('#inviteStatus').textContent = 'Invitación enviada';
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      $('#inviteStatus').textContent = 'Código y enlace copiados';
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      $('#inviteStatus').textContent = 'Comparte el código cuando quieras';
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      $('#inviteStatus').textContent = 'Código y enlace copiados';
    } catch (_) {
      $('#inviteStatus').textContent = `Código: ${code}`;
    }
  }
}

async function copyInviteCode() {
  const code = $('#inviteCode').textContent?.trim();
  if (!code || code.includes('·')) return;
  const base = location.href.split('?')[0].split('#')[0];
  const url = `${base}?code=${encodeURIComponent(code)}`;
  try {
    await navigator.clipboard.writeText(`${code}\n${url}`);
    $('#inviteStatus').textContent = 'Código copiado';
    playSfx('peek');
  } catch (_) {
    $('#inviteStatus').textContent = `Código: ${code}`;
  }
}

function clearInviteQuery() {
  try {
    const url = new URL(location.href);
    if (!url.searchParams.has('code')) return;
    url.searchParams.delete('code');
    const qs = url.searchParams.toString();
    history.replaceState(null, '', url.pathname + (qs ? `?${qs}` : '') + url.hash);
  } catch (_) {}
}

function resetJoinUi() {
  const btn = $('#btnJoin');
  if (btn) btn.textContent = 'Unirme';
  const input = $('#joinCode');
  if (input && !input.value) {
    /* keep typed code if any */
  }
}

function applyInviteFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = normalizeCode(params.get('code') || '');
  if (code.length === 6) {
    showScreen('screenJoin');
    $('#joinCode').value = code;
    const btn = $('#btnJoin');
    if (btn) {
      btn.textContent = `Unirme con ${code}`;
      setTimeout(() => btn.focus(), 80);
    }
    clearInviteQuery();
  }
}

function openRules() {
  openOverlay('#rulesOverlay', '#btnCloseRules');
}
function closeRules() {
  closeOverlay('#rulesOverlay');
}

function bindUi() {
  $('#btnCpu').addEventListener('click', startCpu);
  $('#btnHost').addEventListener('click', startHost);
  $('#btnShowJoin').addEventListener('click', () => {
    showScreen('screenJoin');
    $('#joinCode').value = '';
    resetJoinUi();
    $('#joinCode').focus();
  });
  $('#btnJoinBack').addEventListener('click', () => {
    resetJoinUi();
    clearInviteQuery();
    showScreen('screenHome');
  });
  $('#btnJoin').addEventListener('click', startJoin);
  $('#btnJoinWaitHome').addEventListener('click', leaveToHome);
  $('#btnShare').addEventListener('click', shareInvite);
  $('#btnCopyCode')?.addEventListener('click', copyInviteCode);
  $('#inviteCode')?.addEventListener('click', copyInviteCode);
  $('#inviteCode')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyInviteCode();
    }
  });
  $('#btnCancelInvite').addEventListener('click', leaveToHome);
  $('#btnCapture').addEventListener('click', doCapture);
  $('#btnDiscard').addEventListener('click', doDiscard);
  $('#btnLeave').addEventListener('click', leaveToHome);
  $('#btnRules').addEventListener('click', openRules);
  $('#btnRulesHome').addEventListener('click', openRules);
  $('#btnCloseRules').addEventListener('click', closeRules);
  $('#btnClosePeek')?.addEventListener('click', () => closeOverlay('#peekOverlay'));
  $('#peekOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'peekOverlay') closeOverlay('#peekOverlay');
  });
  $('#rulesOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'rulesOverlay') closeRules();
  });
  $('#inviteOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'inviteOverlay' && !state.game) leaveToHome();
  });
  $('#roundOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'roundOverlay') {
      $('#roundActions .btn-ghost')?.focus?.();
    }
  });
  $('#joinCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startJoin();
  });
  $('#playerName')?.addEventListener('change', saveName);
  $('#playerName')?.addEventListener('blur', saveName);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const open = document.querySelector('.overlay.open');
      if (!open) return;
      const panel = open.querySelector('.panel') || open;
      const focusables = [
        ...panel.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length < 2) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (e.key !== 'Escape') return;
    if ($('#peekOverlay')?.classList.contains('open')) {
      closeOverlay('#peekOverlay');
      return;
    }
    if ($('#rulesOverlay')?.classList.contains('open')) {
      closeRules();
      return;
    }
    if ($('#inviteOverlay')?.classList.contains('open') && !state.game) {
      leaveToHome();
      return;
    }
    if ($('#roundOverlay')?.classList.contains('open')) {
      const primary = $('#roundActions button:not([disabled])');
      const leave = $('#roundActions .btn-ghost');
      (leave || primary)?.focus?.();
    }
  });
  const unlock = () => {
    tone(1, 0.01, 'sine', 0.0001);
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
}

function startHeroIdle() {
  stopHeroIdle();
  const art = $('#heroArt');
  if (!art) return;
  state.heroIdle = setInterval(() => {
    if (!$('#screenHome')?.classList.contains('active')) return;
    if (document.hidden) return;
    art.classList.remove('restack');
    void art.offsetWidth;
    art.classList.add('restack');
  }, 8000);
}

function stopHeroIdle() {
  clearInterval(state.heroIdle);
  state.heroIdle = null;
  $('#heroArt')?.classList.remove('restack');
}

function registerSw() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js?v=26').then((reg) => {
    reg.update?.();
  }).catch(() => {});
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
}

loadSavedName();
bindUi();
registerSw();
showScreen('screenHome');
preloadDeckImages();
applyInviteFromUrl();
startHeroIdle();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !state.net?.ready) return;
  if (state.role === 'guest') requestStateFromHost();
  else if (state.role === 'host' && state.game) sendState(state.game);
});
