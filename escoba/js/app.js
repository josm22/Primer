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
import { snapshotAnim, playTableAnim, playDealAnim } from './anim.js';

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
  revealSkip: null,
  feed: [],
  pendingSnap: null,
  needDeal: false,
  prevScores: [0, 0],
  dealing: false,
  lastPileCount: [0, 0],
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

function requestDeal() {
  state.needDeal = true;
}

async function runDealIfNeeded() {
  if (!state.needDeal || !state.game || state.game.phase !== 'play' || state.dealing) {
    return;
  }
  state.needDeal = false;
  state.dealing = true;
  state.busy = true;
  const screen = $('#screenGame');
  screen?.classList.add('dealing');
  render();
  await sleep(40);
  const g = state.game;
  const me = state.me;
  const opp = 1 - me;
  try {
    await playDealAnim({
      tableCards: g.table.slice(),
      myCards: g.hands[me].slice(),
      oppCount: g.hands[opp].length,
      me,
      onSfx: playSfx,
    });
  } catch (_) {}
  screen?.classList.remove('dealing');
  state.dealing = false;
  state.busy = false;
  state.prevScores = [...g.scores];
  render();
  maybeAiOrWait();
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

function cardEl(card, { face = true, selectable = false, selected = false, capture = false, dim = false, tiny = false } = {}) {
  const el = document.createElement(tiny ? 'div' : 'button');
  if (!tiny) el.type = 'button';
  el.className = `card ${face ? `face-up suit-${card?.suit || ''}` : 'face-down'}${tiny ? ' tiny' : ''}`;
  el.dataset.id = card?.id || '';
  if (selected) el.classList.add('selected');
  if (capture) el.classList.add('capture-target');
  if (dim) el.classList.add('dim');
  if (!selectable && !tiny) el.tabIndex = -1;

  if (face && card) {
    el.innerHTML = buildCardFaceHtml(card);
    el.setAttribute('aria-label', card.label);
  } else {
    el.innerHTML = buildCardBackHtml();
    el.setAttribute('aria-label', 'Carta oculta');
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
  const set = (id, score) => {
    const el = $(id);
    if (!el) return;
    const pct = Math.min(100, Math.round((score / WIN_SCORE) * 100));
    el.style.width = `${pct}%`;
    el.parentElement?.setAttribute('aria-valuenow', String(score));
  };
  set('#barMe', g.scores[state.me]);
  set('#barOpp', g.scores[1 - state.me]);
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
  const who = state.names[mv.player] || 'Jugador';
  let text = '';
  let cls = '';
  if (mv.type === 'escoba') {
    text = 'hace ¡ESCOBA!';
    cls = 'feed-escoba';
  } else if (mv.type === 'capture') {
    const n = 1 + (mv.captureIds?.length || 0);
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

  const paint = (el, cards, side, playerIdx) => {
    if (!el) return;
    const prev = state.lastPileCount[playerIdx] || 0;
    el.innerHTML = '';
    el.onclick = () => openPeek(playerIdx);
    if (!cards.length) {
      el.innerHTML = `<div class="pile-empty">Sin capturas</div>`;
      state.lastPileCount[playerIdx] = 0;
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'pile-stack';
    if (cards.length > prev) wrap.classList.add('pile-pulse');
    const show = cards.slice(-3);
    show.forEach((c, i) => {
      const card = cardEl(c, { face: true, tiny: true });
      card.style.setProperty('--i', String(i));
      wrap.appendChild(card);
    });
    el.appendChild(wrap);
    const meta = document.createElement('div');
    meta.className = 'pile-meta';
    meta.textContent = `${cards.length} · ver`;
    el.appendChild(meta);
    state.lastPileCount[playerIdx] = cards.length;
  };

  paint($('#pileOpp'), g.captured[opp], state.names[opp], opp);
  paint($('#pileMe'), g.captured[me], state.names[me], me);
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
    body.innerHTML = `<p class="peek-empty">Todavía no hay cartas.</p>`;
  } else {
    const t = tally(cards);
    const oros = cards.filter((c) => c.suit === 'oros');
    const sietes = cards.filter((c) => c.rank === 7);
    body.innerHTML = `
      <div class="peek-summary">
        <span>${t.cards} cartas</span>
        <span class="chip-oro">${t.oros} oros</span>
        <span>${t.sietes} sietes</span>
        <span class="${t.sieteOros ? 'chip-hot-inline' : ''}">${t.sieteOros ? '★ 7 de oros' : 'Sin 7♦'}</span>
        <span>${g.escobas[playerIdx]} escobas</span>
      </div>
      <div class="peek-section"><h3>Oros</h3><div class="peek-grid" id="peekOros"></div></div>
      <div class="peek-section"><h3>Sietes</h3><div class="peek-grid" id="peekSietes"></div></div>
      <div class="peek-section"><h3>Todas</h3><div class="peek-grid" id="peekAll"></div></div>
    `;
    const fill = (sel, list) => {
      const box = body.querySelector(sel);
      if (!list.length) {
        box.innerHTML = `<span class="peek-empty">—</span>`;
        return;
      }
      list.forEach((c) => {
        const d = document.createElement('div');
        d.className = 'peek-card';
        d.innerHTML = `<img src="${cardImageUrl(c)}" alt="${c.label}">`;
        box.appendChild(d);
      });
    };
    fill('#peekOros', oros);
    fill('#peekSietes', sietes);
    fill('#peekAll', cards);
  }
  overlay.classList.add('open');
  playSfx('select');
}

function render() {
  const g = state.game;
  if (!g) return;

  const opp = 1 - state.me;
  $('#scoreMe .who').textContent = state.names[state.me];
  $('#scoreOpp .who').textContent = state.names[opp];
  const ptsMe = $('#scoreMe .pts');
  const ptsOpp = $('#scoreOpp .pts');
  if (ptsMe) {
    if (Number(ptsMe.textContent) !== g.scores[state.me] && g.scores[state.me] > (state.prevScores[state.me] || 0)) {
      ptsMe.classList.remove('bump');
      void ptsMe.offsetWidth;
      ptsMe.classList.add('bump');
    }
    ptsMe.textContent = g.scores[state.me];
  }
  if (ptsOpp) {
    if (Number(ptsOpp.textContent) !== g.scores[opp] && g.scores[opp] > (state.prevScores[opp] || 0)) {
      ptsOpp.classList.remove('bump');
      void ptsOpp.offsetWidth;
      ptsOpp.classList.add('bump');
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
    const el = cardEl(null, { face: false });
    applyFan(el, i, oppLen);
    oppHand.appendChild(el);
  }

  const felt = $('#felt');
  felt.innerHTML = '';
  const deckBadge = document.createElement('div');
  deckBadge.className = 'deck-badge';
  deckBadge.textContent = `Mazo ${g.deck.length}`;
  felt.appendChild(deckBadge);

  if (!g.table.length) {
    const empty = document.createElement('div');
    empty.className = 'felt-empty';
    empty.textContent = 'Mesa limpia';
    felt.appendChild(empty);
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

  if (g.phase === 'roundEnd' || g.phase === 'matchEnd') {
    showRoundPanel(g);
  }
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
  render();
}

function toggleTable(id) {
  if (state.selectedTable.has(id)) state.selectedTable.delete(id);
  else state.selectedTable.add(id);
  playSfx('select');
  render();
}

async function showReveal(mv) {
  // Fallback path: build snapshot from current DOM + pre-move reconstruction
  const before = reconstructBefore(mv);
  const snap = snapshotAnim(
    { player: mv.player, cardId: mv.cardId, captureIds: mv.captureIds || [] },
    { me: state.me, game: before }
  );
  ghostIds([mv.cardId, ...(mv.captureIds || [])]);
  await playTableAnim(snap, mv.type, { onSfx: playSfx });
}

function lastMoveFrom(game) {
  const log = game?.moveLog || [];
  if (!log.length) return null;
  return log[log.length - 1];
}

/** Best-effort previous hands/table for remote replay. */
function reconstructBefore(mv) {
  const g = state.game;
  const hands = [
    g.hands[0].map((c) => ({ ...c })),
    g.hands[1].map((c) => ({ ...c })),
  ];
  const table = g.table.map((c) => ({ ...c }));
  const captured = [
    g.captured[0].map((c) => ({ ...c })),
    g.captured[1].map((c) => ({ ...c })),
  ];

  const ids = new Set([mv.cardId, ...(mv.captureIds || [])]);
  const pulled = [];
  for (const p of [0, 1]) {
    captured[p] = captured[p].filter((c) => {
      if (ids.has(c.id)) {
        pulled.push(c);
        return false;
      }
      return true;
    });
  }

  if (mv.type === 'discard') {
    const idx = table.findIndex((c) => c.id === mv.cardId);
    if (idx >= 0) {
      const [c] = table.splice(idx, 1);
      hands[mv.player].push(c);
    }
  } else {
    const played = pulled.find((c) => c.id === mv.cardId);
    if (played) hands[mv.player].push(played);
    for (const id of mv.captureIds || []) {
      const c = pulled.find((x) => x.id === id);
      if (c && c.id !== mv.cardId) table.push(c);
    }
  }

  return { ...g, hands, table, captured };
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
    state.net.send({ type: 'state', game: serializeState(state.game) });
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
    await playTableAnim(snap, mv.type, { onSfx: playSfx });
  }

  state.lastSeenLog = (state.game.moveLog || []).length;
  state.busy = false;
  render();
  maybeAiOrWait();
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
    state.pendingMoveType = null;
    ghostIds([move.cardId, ...(move.captureIds || [])]);
    state.net.send({ type: 'move', move });
    state.selectedHand = null;
    state.selectedTable.clear();
    setMsg('Enviando jugada…');
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
    setMsg('El rival piensa…');
    render();
    await sleep(1100);
    const move = chooseAiMove(state.game, 1 - state.me);
    if (!move) {
      state.busy = false;
      return;
    }
    // small pause so you see whose turn
    await sleep(400);
    state.busy = false;
    await applyAndReveal(move);
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
  } else {
    title.textContent = 'Recuento de la ronda';
  }

  const rs = g.roundScores;
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
    body.innerHTML = `<p>${g.message}</p>`;
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
        state.net.send({ type: 'state', game: serializeState(state.game) });
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
    state.net.send({ type: 'state', game: serializeState(state.game) });
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
  state.lastSeenLog = 0;
  state.feed = [];
  $('#screenGame')?.classList.remove('dealing');
  $('#roundOverlay').classList.remove('open');
  $('#inviteOverlay').classList.remove('open');
  $('#peekOverlay')?.classList.remove('open');
  showScreen('screenHome');
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
  requestDeal();
  render();
  runDealIfNeeded();
}

function beginHostMatch() {
  if (state.role !== 'host' || !state.net) return;
  if (state.game && state.net.ready) {
    state.net.send({ type: 'state', game: serializeState(state.game) });
    return;
  }
  saveName();
  state.names = [myDisplayName(), 'Amigo'];
  state.game = createMatch({ firstPlayer: 0 });
  state.lastSeenLog = 0;
  state.selectedHand = null;
  state.selectedTable.clear();
  state.feed = [];
  state.prevScores = [0, 0];
  state.net.markReady();
  state.net.send({ type: 'state', game: serializeState(state.game) });
  $('#inviteOverlay').classList.remove('open');
  showScreen('screenGame');
  requestDeal();
  render();
  runDealIfNeeded();
}

async function startHost() {
  try {
    saveName();
    state.net?.destroy();
    state.net = new EscobaNet();
    wireNet(state.net);
    $('#inviteStatus').textContent = 'Creando sala…';
    $('#inviteOverlay').classList.add('open');
    const { code } = await state.net.host();
    $('#inviteCode').textContent = code;
    $('#inviteStatus').textContent = 'Comparte el código con tu amigo';
    state.mode = 'online';
    state.role = 'host';
    state.me = 0;
    state.names = [myDisplayName(), 'Amigo'];
    state.game = null;
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
    wireNet(state.net);
    showScreen('screenJoinWait');
    $('#joinWaitStatus').textContent = 'Conectando…';
    await state.net.join(code);
    state.mode = 'online';
    state.role = 'guest';
    state.me = 1;
    state.names = ['Anfitrión', myDisplayName()];
    $('#joinWaitStatus').textContent = 'Conectado. Esperando al anfitrión…';
  } catch (err) {
    $('#joinWaitStatus').textContent = err.message || 'No se pudo unir';
  }
}

async function ingestRemoteState(game) {
  const prevLog = state.lastSeenLog || 0;
  const wasPlaying = !!state.game;
  const prevGame = state.game;
  const log = game.moveLog || [];
  const mv =
    wasPlaying && log.length > prevLog ? log[log.length - 1] : null;

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
  $('#roundOverlay').classList.remove('open');
  showScreen('screenGame');

  if (mv && snap) {
    pushFeed(mv);
    state.busy = true;
    await playTableAnim(snap, mv.type, { onSfx: playSfx });
  }

  state.lastSeenLog = log.length;
  state.busy = false;

  if (isFreshDeal && game.phase === 'play' && !mv) {
    requestDeal();
    render();
    await runDealIfNeeded();
    return;
  }

  render();
}

function wireNet(net) {
  net.on('onPeerJoin', () => {
    if (state.role === 'host') beginHostMatch();
  });

  net.on('onMessage', (data) => {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'requestState' && state.role === 'host' && state.game) {
      net.send({ type: 'state', game: serializeState(state.game) });
      return;
    }

    if (data.type === 'state' && state.role === 'guest') {
      ingestRemoteState(data.game);
      return;
    }

    if (data.type === 'move' && state.role === 'host') {
      (async () => {
        try {
          const move = { ...data.move, player: 1 };
          await applyAndReveal(move, { broadcast: true });
        } catch (err) {
          net.send({ type: 'reject', reason: err.message });
          state.busy = false;
        }
      })();
      return;
    }

    if (data.type === 'reject' && state.role === 'guest') {
      state.busy = false;
      document.querySelectorAll('.card.ghosting').forEach((el) => el.classList.remove('ghosting'));
      const reason = data.reason || 'Jugada rechazada';
      if (/capturar/i.test(reason)) flashBad('Con esa carta hay que capturar');
      else if (/inválida|sumar 15/i.test(reason)) flashBad('Esa captura no vale');
      else flashBad(reason);
      render();
    }
  });

  net.on('onDisconnect', () => setMsg('Conexión interrumpida. Reintentando…'));
  net.on('onError', (err) => {
    console.error(err);
    const msg = err?.message || 'Error de conexión';
    if ($('#inviteOverlay')?.classList.contains('open')) $('#inviteStatus').textContent = msg;
    else if ($('#screenJoinWait')?.classList.contains('active')) $('#joinWaitStatus').textContent = msg;
    else setMsg(msg);
  });
  net.on('onStatus', (s) => {
    if ($('#inviteOverlay')?.classList.contains('open')) $('#inviteStatus').textContent = s;
    if ($('#screenJoinWait')?.classList.contains('active')) $('#joinWaitStatus').textContent = s;
  });
}

async function shareInvite() {
  const code = $('#inviteCode').textContent;
  const base = location.href.split('?')[0].split('#')[0];
  const url = `${base}?code=${encodeURIComponent(code)}`;
  const text = `¡Juguemos a la Escoba! Código: ${code}\n${url}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Escoba', text, url });
    else {
      await navigator.clipboard.writeText(text);
      $('#inviteStatus').textContent = 'Código y enlace copiados';
    }
  } catch (_) {}
}

function applyInviteFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = normalizeCode(params.get('code') || '');
  if (code.length === 6) {
    showScreen('screenJoin');
    $('#joinCode').value = code;
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
  const unlock = () => {
    tone(1, 0.01, 'sine', 0.0001);
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
}

function registerSw() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js?v=11').then((reg) => {
    reg.update?.();
  }).catch(() => {});
}

loadSavedName();
bindUi();
registerSw();
showScreen('screenHome');
preloadDeckImages();
applyInviteFromUrl();
