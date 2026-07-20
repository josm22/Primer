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
  netChain: Promise.resolve(),
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
  state.dealing = true;
  state.busy = true;
  const screen = $('#screenGame');
  screen?.classList.add('dealing');
  if (handsOnly) screen?.classList.add('dealing-hands');
  render();
  await sleep(40);
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
    });
  } catch (_) {}
  screen?.classList.remove('dealing', 'dealing-hands');
  state.dealing = false;
  state.busy = false;
  state.prevScores = [...g.scores];
  render();
  // Deja asentar la mesa antes de que la CPU “piense”
  if (state.mode === 'cpu' && g.currentPlayer !== state.me) {
    await sleep(520);
  }
  maybeAiOrWait();
}

async function sweepRoundLeftovers(g) {
  const left = g.roundLeftovers;
  if (!left?.cards?.length) return;
  const felt = $('#felt');
  // Tras un “dejar” que cierra la ronda, la carta nueva no está en el DOM
  if (felt) {
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
  const who =
    left.player == null ? null : state.names[left.player] || 'Jugador';
  await playLeftoverSweep(left, {
    me: state.me,
    onSfx: playSfx,
    whoName: who,
  });
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
    .then(() => task())
    .catch((err) => console.error(err));
  return state.netChain;
}

function applyRemoteNames(names) {
  if (!Array.isArray(names) || names.length < 2) return;
  const cleaned = names.map((n) => String(n || '').trim().slice(0, 14) || 'Jugador');
  state.names = cleaned;
  // Conserva tu nombre local si lo tienes
  const mine = myDisplayName();
  if (mine && mine !== 'Tú') state.names[state.me] = mine;
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
  });

  $$('#felt > .card').forEach((el) => {
    const id = el.dataset.id;
    if (!id) return;
    el.classList.toggle('capture-target', state.selectedTable.has(id));
    el.onclick = selecting ? () => toggleTable(id) : null;
  });

  updatePlayButtons();
  if (!state.busy && g.phase === 'play') {
    setMsg(myTurn ? 'Tu turno' : `Turno de ${state.names[1 - state.me]}`);
  }
}

async function finishAfterMove() {
  const g = state.game;
  if (!g) return;

  if (g.message === 'Nueva mano repartida' && g.phase === 'play') {
    setMsg('Nueva mano');
    render();
    await sleep(320);
    requestDeal({ handsOnly: true });
    render();
    await runDealIfNeeded();
    return;
  }

  if (g.phase === 'roundEnd' || g.phase === 'matchEnd') {
    setMsg(g.phase === 'matchEnd' ? 'Fin de partida' : 'Fin de ronda');
    // Mantener cartas en el DOM para el barrido de restos
    await sweepRoundLeftovers(g);
    render();
    await sleep(550);
    if (state.game === g) showRoundPanel(g);
    return;
  }

  const last = normalizeLogMove(lastMoveFrom(g));
  if (last?.type === 'escoba') {
    markFeltCleared();
  }

  render();
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

function armMoveWatch() {
  clearTimeout(state.moveWatch);
  state.moveWatch = setTimeout(() => {
    if (!state.busy || state.role !== 'guest') return;
    clearGhosts();
    state.busy = false;
    state.pendingSnap = null;
    flashBad('Sin respuesta — reintentando');
    setNetChip('Sincronizando', 'warn');
    requestStateFromHost();
    render();
  }, 8000);
}

function clearMoveWatch() {
  clearTimeout(state.moveWatch);
  state.moveWatch = null;
}

function setNetChip(text, kind = '') {
  const el = $('#netChip');
  if (!el) return;
  state.netStatus = text || '';
  if (!text) {
    el.hidden = true;
    el.textContent = '';
    el.className = 'net-chip';
    return;
  }
  el.hidden = false;
  el.textContent = text;
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

function cardEl(card, { face = true, selectable = false, selected = false, capture = false, dim = false, tiny = false, last = false } = {}) {
  const el = document.createElement(tiny ? 'div' : 'button');
  if (!tiny) el.type = 'button';
  el.className = `card ${face ? `face-up suit-${card?.suit || ''}` : 'face-down'}${tiny ? ' tiny' : ''}`;
  el.dataset.id = card?.id || '';
  if (selected) el.classList.add('selected');
  if (capture) el.classList.add('capture-target');
  if (dim) el.classList.add('dim');
  if (last) el.classList.add('hand-last');
  if (!selectable && !tiny) el.tabIndex = -1;

  if (face && card) {
    el.innerHTML = buildCardFaceHtml(card);
    el.setAttribute('aria-label', card.label);
  } else {
    el.innerHTML = buildCardBackHtml();
    el.setAttribute('aria-label', 'Carta oculta');
  }

  if (!tiny) {
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

  const paint = (el, cards, playerIdx) => {
    if (!el) return;
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

    if (!cards.length && !escCount) {
      el.innerHTML = `<div class="pile-empty">Sin capturas</div>`;
      state.lastPileCount[playerIdx] = 0;
      if (!state.lastEscCount) state.lastEscCount = [0, 0];
      state.lastEscCount[playerIdx] = 0;
      return;
    }

    const stage = document.createElement('div');
    stage.className = 'pile-stage';
    if (cards.length > prev || escCount > prevEsc) stage.classList.add('pile-pulse');

    // Montón normal (últimas capturas, cara arriba)
    if (cards.length) {
      const wrap = document.createElement('div');
      wrap.className = 'pile-stack';
      const show = cards.slice(-3);
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

    state.lastPileCount[playerIdx] = cards.length;
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
  overlay.classList.add('open');
  playSfx('peek');
}

function render() {
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
  $('#scoreMe').classList.toggle('active', g.phase === 'play' && g.currentPlayer === state.me && !state.busy);
  $('#scoreOpp').classList.toggle('active', g.phase === 'play' && g.currentPlayer === opp);

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
  renderPiles();
  renderFeed();

  const oppHand = $('#oppHand');
  oppHand.innerHTML = '';
  const oppLen = g.hands[opp].length;
  for (let i = 0; i < oppLen; i++) {
    const el = cardEl(null, { face: false, last: oppLen === 1 });
    applyFan(el, i, oppLen);
    oppHand.appendChild(el);
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

  if (!g.table.length) {
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

  g.table.forEach((c, i) => {
    const selected = state.selectedTable.has(c.id);
    const selecting = myTurn && !!state.selectedHand;
    const el = cardEl(c, {
      face: true,
      selectable: selecting,
      capture: selected,
    });
    const rot = ((i * 17) % 11) - 5;
    el.style.setProperty('--table-rot', `${rot}deg`);
    if (selecting) el.addEventListener('click', () => toggleTable(c.id));
    felt.appendChild(el);
  });

  const myHand = $('#myHand');
  myHand.innerHTML = '';
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

  const canPlay = myTurn && !!state.selectedHand;
  const canTryCapture = canPlay && state.selectedTable.size > 0;

  // Sin adelantar si la jugada es válida: el motor decide al confirmar
  $('#btnCapture').disabled = !canTryCapture;
  $('#btnDiscard').disabled = !canPlay;
}

function selectHand(id) {
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
  for (const id of ids) {
    document
      .querySelector(`.card[data-id="${CSS.escape(id)}"]`)
      ?.classList.add('ghosting');
  }
}

async function applyAndReveal(move, { broadcast = false } = {}) {
  state.busy = true;
  const beforeLen = (state.game.moveLog || []).length;

  // Snapshot positions while DOM still shows current hands/table
  const snap = snapshotAnim(move, { me: state.me, game: state.game });
  ghostIds([move.cardId, ...(move.captureIds || [])]);

  try {
    state.game = applyMove(state.game, move);
  } catch (err) {
    state.busy = false;
    document.querySelectorAll('.card.ghosting').forEach((el) => el.classList.remove('ghosting'));
    throw err;
  }
  state.selectedHand = null;
  state.selectedTable.clear();

  if (broadcast && state.mode === 'online' && state.role === 'host') {
    state.net.send({
      type: 'state',
      game: serializeState(state.game),
      names: state.names,
    });
  }

  const mv = lastMoveFrom(state.game);
  if (mv && (state.game.moveLog || []).length > beforeLen) {
    pushFeed(mv);
    setMsg(
      mv.type === 'escoba'
        ? '¡Escoba!'
        : mv.type === 'capture'
          ? 'Capturando…'
          : 'Dejando carta…'
    );
    await playTableAnim(snap, mv.type, {
      onSfx: playSfx,
      onBeforeClear: async () => {
        // Pinta el destino bajo el flyer para evitar un frame en blanco
        if (state.game?.phase === 'play') render();
      },
    });
  }

  state.lastSeenLog = (state.game.moveLog || []).length;
  state.busy = false;
  await finishAfterMove();
}

async function commitLocalMove(move) {
  try {
    await applyAndReveal(move, {
      broadcast: state.mode === 'online' && state.role === 'host',
    });
    return true;
  } catch (err) {
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
  if (state.busy) return;
  if (state.mode === 'online' && state.role === 'guest') {
    state.busy = true;
    // Keep DOM for flight anim when host echoes state
    state.pendingSnap = snapshotAnim(move, { me: state.me, game: state.game });
    ghostIds([move.cardId, ...(move.captureIds || [])]);
    state.net.send({ type: 'move', move });
    state.selectedHand = null;
    state.selectedTable.clear();
    setMsg('Enviando jugada…');
    armMoveWatch();
    // Soft UI update without wiping ghosted cards from layout
    $('#btnCapture').disabled = true;
    $('#btnDiscard').disabled = true;
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
    state.busy = true;
    const oppName = state.names[1 - state.me] || 'Rival';
    setMsg(`${oppName} piensa…`);
    $('#scoreOpp')?.classList.add('thinking');
    render();
    const firstBeat = (g.moveLog || []).length === 0 ? 380 : 0;
    await sleep(firstBeat + 700 + Math.floor(Math.random() * 420));
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
    const hasSO = [
      g.captured[0].some((x) => x.suit === 'oros' && x.rank === 7),
      g.captured[1].some((x) => x.suit === 'oros' && x.rank === 7),
    ];
    const byKey = Object.fromEntries(rs.detail.map((d) => [d.key, d]));
    const row = (label, countA, countB, ptsA, ptsB, tip) => `
      <tr>
        <td><div class="score-label">${label}</div><div class="score-tip">${tip}</div></td>
        <td><div class="score-count">${countA}</div>${cellMark(ptsA)}</td>
        <td><div class="score-count">${countB}</div>${cellMark(ptsB)}</td>
      </tr>`;

    body.innerHTML = `
      ${leftoverNote}
      <p class="score-intro">Así se suman los puntos de esta ronda:</p>
      <table class="score-table">
        <thead><tr><th>Concepto</th><th>${state.names[0]}</th><th>${state.names[1]}</th></tr></thead>
        <tbody>
          ${row('Escobas', g.escobas[0], g.escobas[1], byKey.escobas.a, byKey.escobas.b, '1 punto por cada escoba')}
          ${row('Cartas', c.cards[0], c.cards[1], byKey.cartas.a, byKey.cartas.b, '1 punto quien tenga más')}
          ${row('Oros', c.oros[0], c.oros[1], byKey.oros.a, byKey.oros.b, '1 punto quien tenga más')}
          ${row('Sietes', c.sietes[0], c.sietes[1], byKey.sietes.a, byKey.sietes.b, '1 punto quien tenga más')}
          ${row('7 de oros', hasSO[0] ? 'Sí' : 'No', hasSO[1] ? 'Sí' : 'No', byKey.sieteOros.a, byKey.sieteOros.b, '1 punto quien lo capture')}
          <tr class="sum-row"><td>Suma de la ronda</td><td><strong>+${rs.pts[0]}</strong></td><td><strong>+${rs.pts[1]}</strong></td></tr>
          <tr class="total"><td>Marcador (a ${WIN_SCORE})</td><td><strong>${g.scores[0]}</strong></td><td><strong>${g.scores[1]}</strong></td></tr>
        </tbody>
      </table>
      ${
        g.phase === 'matchEnd'
          ? `<p class="final-line">${
              g.winner == null
                ? 'Misma puntuación final.'
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
        state.net.send({
          type: 'state',
          game: serializeState(state.game),
          names: state.names,
        });
        $('#roundOverlay').classList.remove('open');
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
  panel.classList.add('open');
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
}

function nextRound() {
  if (state.mode === 'online' && state.role === 'guest') return;
  state.game = startNextRound(state.game);
  state.lastSeenLog = 0;
  state.feed = [];
  $('#roundOverlay').classList.remove('open');
  requestDeal();
  render();
  if (state.mode === 'online' && state.role === 'host') {
    state.net.send({
      type: 'state',
      game: serializeState(state.game),
      names: state.names,
    });
  }
  runDealIfNeeded();
}

function leaveToHome() {
  state.net?.destroy();
  state.net = null;
  state.game = null;
  state.mode = null;
  state.busy = false;
  state.dealing = false;
  state.needDeal = false;
  state.dealHandsOnly = false;
  state.lastSeenLog = 0;
  state.feed = [];
  state.feltClearedUntil = 0;
  clearTimeout(state.feltClearTimer);
  clearMoveWatch();
  clearFlyLayer();
  setNetChip('');
  $('#scoreOpp')?.classList.remove('thinking');
  $('#screenGame')?.classList.remove('dealing', 'dealing-hands');
  $('#roundOverlay').classList.remove('open');
  $('#inviteOverlay').classList.remove('open');
  $('#peekOverlay')?.classList.remove('open');
  $('#rulesOverlay')?.classList.remove('open');
  $('#inviteStatus')?.classList.remove('waiting-pulse');
  $('#joinWaitStatus')?.classList.remove('waiting-pulse');
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
  $('#roundOverlay').classList.remove('open');
  stopHeroIdle();
  requestDeal();
  render();
  runDealIfNeeded();
}

function beginHostMatch() {
  if (state.role !== 'host' || !state.net) return;
  if (state.game && state.net.ready) {
    state.net.send({
      type: 'state',
      game: serializeState(state.game),
      names: state.names,
    });
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
  state.net.send({
    type: 'state',
    game: serializeState(state.game),
    names: state.names,
  });
  $('#inviteOverlay').classList.remove('open');
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
    $('#inviteOverlay').classList.add('open');
    const { code } = await state.net.host();
    $('#inviteCode').textContent = code;
    $('#inviteStatus').textContent = 'Comparte el código con tu amigo';
    $('#inviteStatus')?.classList.add('waiting-pulse');
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
    $('#joinWaitStatus').textContent = 'Conectado. Esperando al anfitrión…';
    setNetChip('Enlace…', 'warn');
  } catch (err) {
    $('#joinWaitStatus').textContent = err.message || 'No se pudo unir';
    setNetChip('Sin red', 'bad');
  }
}

async function ingestRemoteState(game, meta = {}) {
  clearMoveWatch();
  if (meta.names) applyRemoteNames(meta.names);

  const prevLog = state.lastSeenLog || 0;
  const wasPlaying = !!state.game;
  const prevGame = state.game;
  const log = game.moveLog || [];

  // Ignora estados viejos / duplicados mientras animamos
  if (wasPlaying && log.length < prevLog) {
    const reset =
      game.phase === 'play' &&
      (prevGame.phase === 'roundEnd' || prevGame.phase === 'matchEnd');
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

  const rawMv =
    wasPlaying && log.length > prevLog ? log[log.length - 1] : null;
  const mv = normalizeLogMove(rawMv);

  // Nueva ronda o primera llegada del estado: animar reparto
  const isFreshDeal =
    !wasPlaying ||
    (prevGame &&
      game.phase === 'play' &&
      (prevGame.phase === 'roundEnd' || prevGame.phase === 'matchEnd'));

  let snap = state.pendingSnap || null;
  if (!snap && mv && prevGame) {
    snap = snapshotAnim(
      { player: mv.player, cardId: mv.cardId, captureIds: mv.captureIds || [] },
      { me: state.me, game: prevGame }
    );
    ghostIds([mv.cardId, ...(mv.captureIds || [])]);
  }
  state.pendingSnap = null;

  state.game = game;
  state.selectedHand = null;
  state.selectedTable.clear();
  state.net?.markReady();
  setNetChip('En línea', 'ok');
  $('#roundOverlay').classList.remove('open');
  showScreen('screenGame');

  if (mv && snap) {
    pushFeed(mv);
    state.busy = true;
    await playTableAnim(snap, mv.type, {
      onSfx: playSfx,
      onBeforeClear: async () => {
        if (state.game?.phase === 'play') render();
      },
    });
    if (mv.type === 'escoba') markFeltCleared();
  }

  state.lastSeenLog = log.length;
  state.busy = false;

  if (isFreshDeal && game.phase === 'play' && !mv) {
    requestDeal();
    render();
    await runDealIfNeeded();
    return;
  }

  // Mid-round redeal after a move
  if (mv && game.message === 'Nueva mano repartida' && game.phase === 'play') {
    setMsg('Nueva mano');
    render();
    await sleep(320);
    requestDeal({ handsOnly: true });
    render();
    await runDealIfNeeded();
    return;
  }

  if (game.phase === 'roundEnd' || game.phase === 'matchEnd') {
    setMsg(game.phase === 'matchEnd' ? 'Fin de partida' : 'Fin de ronda');
    await sweepRoundLeftovers(game);
    render();
    await sleep(550);
    if (state.game === game) showRoundPanel(game);
    return;
  }

  render();
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
    if (state.role === 'guest') requestStateFromHost();
  });

  net.on('onMessage', (data) => {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'requestState' && state.role === 'host' && state.game) {
      net.send({
        type: 'state',
        game: serializeState(state.game),
        names: state.names,
      });
      return;
    }

    if (data.type === 'hello' && data.names) {
      applyRemoteNames(data.names);
      if (state.game && !state.busy) render();
      return;
    }

    if (data.type === 'state' && state.role === 'guest') {
      enqueueNet(() => ingestRemoteState(data.game, { names: data.names }));
      return;
    }

    if (data.type === 'move' && state.role === 'host') {
      enqueueNet(async () => {
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
      state.busy = false;
      clearGhosts();
      const reason = data.reason || 'Jugada rechazada';
      if (/capturar/i.test(reason)) flashBad('Con esa carta hay que capturar');
      else if (/inválida|sumar 15|espera/i.test(reason)) flashBad(reason.includes('Espera') ? 'Espera un momento' : 'Esa captura no vale');
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
  }
}

function openRules() { $('#rulesOverlay').classList.add('open'); }
function closeRules() { $('#rulesOverlay').classList.remove('open'); }

function bindUi() {
  $('#btnCpu').addEventListener('click', startCpu);
  $('#btnHost').addEventListener('click', startHost);
  $('#btnShowJoin').addEventListener('click', () => {
    showScreen('screenJoin');
    $('#joinCode').value = '';
    $('#joinCode').focus();
  });
  $('#btnJoinBack').addEventListener('click', () => showScreen('screenHome'));
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
  $('#btnClosePeek')?.addEventListener('click', () => $('#peekOverlay')?.classList.remove('open'));
  $('#peekOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'peekOverlay') $('#peekOverlay').classList.remove('open');
  });
  $('#joinCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startJoin();
  });
  $('#playerName')?.addEventListener('change', saveName);
  $('#playerName')?.addEventListener('blur', saveName);
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#peekOverlay')?.classList.contains('open')) {
      $('#peekOverlay').classList.remove('open');
      return;
    }
    if ($('#rulesOverlay')?.classList.contains('open')) {
      closeRules();
      return;
    }
    if ($('#inviteOverlay')?.classList.contains('open') && !state.game) {
      leaveToHome();
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
  navigator.serviceWorker.register('./sw.js?v=16').then((reg) => {
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
  if (document.visibilityState === 'visible' && state.role === 'guest' && state.net?.ready) {
    requestStateFromHost();
  }
});
