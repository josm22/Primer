import {
  createMatch,
  applyMove,
  startNextRound,
  findCaptures,
  bestCapture,
  chooseAiMove,
  serializeState,
  WIN_SCORE,
} from './engine.js';
import { EscobaNet, normalizeCode } from './net.js';
import { buildCardFaceHtml, buildCardBackHtml, cardImageUrl } from './cards-ui.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  legalTableIds: new Set(),
  feed: [],
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
  }
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

function renderSumPreview() {
  const box = $('#sumPreview');
  if (!box || !state.game) return;
  const g = state.game;
  if (!state.selectedHand) {
    box.classList.remove('show', 'ok', 'bad');
    box.textContent = '';
    return;
  }
  const hand = g.hands[state.me].find((c) => c.id === state.selectedHand);
  if (!hand) return;
  const tableCards = g.table.filter((c) => state.selectedTable.has(c.id));
  const sum = hand.value + tableCards.reduce((s, c) => s + c.value, 0);
  const parts = [String(hand.value), ...tableCards.map((c) => String(c.value))];
  if (!tableCards.length) {
    const can = findCaptures(hand, g.table);
    box.classList.add('show');
    box.classList.toggle('ok', false);
    box.classList.toggle('bad', false);
    box.textContent = can.length
      ? `Carta ${hand.value} · toca la mesa para sumar 15`
      : `Dejar ${hand.value} en la mesa`;
    return;
  }
  box.classList.add('show');
  const ok = sum === 15;
  box.classList.toggle('ok', ok);
  box.classList.toggle('bad', !ok);
  box.textContent = ok
    ? `${parts.join(' + ')} = 15 · ¡captura!`
    : `${parts.join(' + ')} = ${sum} · ${sum < 15 ? `faltan ${15 - sum}` : `sobran ${sum - 15}`}`;
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

function legalIdsForHand(card, table) {
  const caps = findCaptures(card, table);
  const ids = new Set();
  for (const group of caps) group.forEach((c) => ids.add(c.id));
  return { caps, ids };
}

function autoPickCapture(card, table) {
  const { caps } = legalIdsForHand(card, table);
  if (!caps.length) return [];
  // Prefer escoba, then bestCapture order
  const best = bestCapture(card, table) || caps[0];
  return best.map((c) => c.id);
}


function renderPiles() {
  const g = state.game;
  const me = state.me;
  const opp = 1 - me;

  const paint = (el, cards, side, playerIdx) => {
    if (!el) return;
    el.innerHTML = '';
    el.onclick = () => openPeek(playerIdx);
    if (!cards.length) {
      el.innerHTML = `<div class="pile-empty">Sin capturas</div>`;
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'pile-stack';
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
  $('#scoreMe .pts').textContent = g.scores[state.me];
  $('#scoreOpp .pts').textContent = g.scores[opp];
  $('#scoreMe').classList.toggle('active', g.phase === 'play' && g.currentPlayer === state.me && !state.busy);
  $('#scoreOpp').classList.toggle('active', g.phase === 'play' && g.currentPlayer === opp);

  const myTurn = g.phase === 'play' && g.currentPlayer === state.me && !state.busy;
  if (!state.busy) {
    setMsg(
      g.phase === 'play'
        ? myTurn
          ? state.selectedHand
            ? 'Toca la mesa para sumar 15 (o Dejar)'
            : 'Tu turno — toca una carta de tu mano'
          : 'Turno del rival…'
        : g.message
    );
  }

  // Legal table highlights for selected hand card
  state.legalTableIds = new Set();
  if (myTurn && state.selectedHand) {
    const hand = g.hands[state.me].find((c) => c.id === state.selectedHand);
    if (hand) state.legalTableIds = legalIdsForHand(hand, g.table).ids;
  }

  renderStats();
  renderScoreBars();
  renderPiles();
  renderSumPreview();
  renderFeed();

  const oppHand = $('#oppHand');
  oppHand.innerHTML = '';
  for (let i = 0; i < g.hands[opp].length; i++) {
    oppHand.appendChild(cardEl(null, { face: false }));
  }

  const felt = $('#felt');
  felt.innerHTML = '';
  const deckBadge = document.createElement('div');
  deckBadge.className = 'deck-badge';
  deckBadge.textContent = `Mazo ${g.deck.length}`;
  felt.appendChild(deckBadge);

  for (const c of g.table) {
    const selected = state.selectedTable.has(c.id);
    const legal = state.legalTableIds.has(c.id);
    const hinting = myTurn && !!state.selectedHand;
    const el = cardEl(c, {
      face: true,
      selectable: hinting,
      capture: selected,
      dim: hinting && state.legalTableIds.size > 0 && !legal && !selected,
    });
    if (legal && hinting) el.classList.add('legal-hint');
    if (c.suit === 'oros') el.classList.add('is-oro');
    if (c.rank === 7) el.classList.add('is-siete');
    if (hinting) el.addEventListener('click', () => toggleTable(c.id));
    felt.appendChild(el);
  }

  const myHand = $('#myHand');
  myHand.innerHTML = '';
  for (const c of g.hands[state.me]) {
    const selected = state.selectedHand === c.id;
    const el = cardEl(c, {
      face: true,
      selectable: myTurn,
      selected,
      dim: myTurn && state.selectedHand && !selected,
    });
    if (c.suit === 'oros') el.classList.add('is-oro');
    if (c.rank === 7) el.classList.add('is-siete');
    // Can this card capture something?
    if (myTurn && findCaptures(c, g.table).length) el.classList.add('can-capture');
    if (myTurn) {
      el.addEventListener('click', () => selectHand(c.id));
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        quickPlay(c.id);
      });
    }
    myHand.appendChild(el);
  }

  const canPlay = myTurn && !!state.selectedHand;
  let canDiscard = canPlay;
  let handCard = null;
  if (canPlay) {
    handCard = g.hands[state.me].find((c) => c.id === state.selectedHand);
    if (handCard && findCaptures(handCard, g.table).length > 0) canDiscard = false;
  }
  const sumOk =
    canPlay &&
    handCard &&
    state.selectedTable.size > 0 &&
    handCard.value +
      g.table
        .filter((c) => state.selectedTable.has(c.id))
        .reduce((s, c) => s + c.value, 0) ===
      15;

  $('#btnCapture').disabled = !sumOk;
  $('#btnDiscard').disabled = !canDiscard;
  $('#btnAuto').disabled = !canPlay;
  $('#btnHint').disabled = !myTurn;

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
    const card = state.game.hands[state.me].find((c) => c.id === id);
    if (card) {
      const picks = autoPickCapture(card, state.game.table);
      picks.forEach((cid) => state.selectedTable.add(cid));
    }
    playSfx('select');
  }
  render();
}

function toggleTable(id) {
  // Only allow legal cards when a hand card is selected with captures
  if (state.selectedHand && state.legalTableIds.size > 0 && !state.legalTableIds.has(id)) {
    setMsg('Esa carta no entra en ninguna suma a 15');
    buzz(20);
    return;
  }
  if (state.selectedTable.has(id)) state.selectedTable.delete(id);
  else state.selectedTable.add(id);
  playSfx('select');
  render();
}

function quickPlay(cardId) {
  if (state.busy || !state.game) return;
  if (state.game.currentPlayer !== state.me) return;
  const card = state.game.hands[state.me].find((c) => c.id === cardId);
  if (!card) return;
  const best = bestCapture(card, state.game.table);
  if (best) {
    submitMove({
      player: state.me,
      cardId,
      captureIds: best.map((c) => c.id),
    });
  } else if (!findCaptures(card, state.game.table).length) {
    submitMove({ player: state.me, cardId, captureIds: [] });
  }
}

function doHint() {
  if (state.busy || !state.game) return;
  if (state.game.currentPlayer !== state.me) return;
  const move = chooseAiMove(state.game, state.me);
  if (!move) return;
  state.selectedHand = move.cardId;
  state.selectedTable = new Set(move.captureIds || []);
  playSfx('select');
  render();
  setMsg(
    move.captureIds?.length
      ? 'Pista: captura sugerida (revisa y pulsa Capturar)'
      : 'Pista: deja esta carta en la mesa'
  );
}

function describeLoot(cards) {
  const oros = cards.filter((c) => c.suit === 'oros').length;
  const sietes = cards.filter((c) => c.rank === 7).length;
  const so = cards.some((c) => c.suit === 'oros' && c.rank === 7);
  const bits = [];
  if (oros) bits.push(`+${oros} oro${oros > 1 ? 's' : ''}`);
  if (sietes) bits.push(`+${sietes} siete${sietes > 1 ? 's' : ''}`);
  if (so) bits.push('★ 7 de oros');
  if (!bits.length) bits.push(`${cards.length} carta${cards.length > 1 ? 's' : ''}`);
  return bits.join(' · ');
}

async function showReveal({ player, type, cardId, captureIds = [] }) {
  const overlay = $('#revealOverlay');
  const title = $('#revealTitle');
  const cardsEl = $('#revealCards');
  const loot = $('#revealLoot');
  const who = state.names[player] || `Jugador ${player + 1}`;
  const isMe = player === state.me;

  // Resolve cards from current OR previous — after applyMove they're in captured
  const all = [
    ...state.game.captured[0],
    ...state.game.captured[1],
    ...state.game.table,
    ...state.game.hands[0],
    ...state.game.hands[1],
  ];
  // Prefer looking in captured pile of player for the taken set
  const pile = state.game.captured[player];
  const findCard = (id) =>
    pile.find((c) => c.id === id) ||
    all.find((c) => c.id === id) ||
    null;

  const played = findCard(cardId);
  const taken = captureIds.map(findCard).filter(Boolean);
  const shown = played ? [played, ...taken.filter((c) => c.id !== played.id)] : taken;

  cardsEl.innerHTML = '';
  shown.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'reveal-card';
    d.style.animationDelay = `${0.08 + i * 0.1}s`;
    if (c.suit === 'oros') d.classList.add('is-oro');
    if (c.rank === 7) d.classList.add('is-siete');
    d.innerHTML = `<img src="${cardImageUrl(c)}" alt="${c.label}">`;
    cardsEl.appendChild(d);
  });

  overlay.classList.remove('escoba', 'mine', 'theirs');
  if (type === 'escoba') {
    title.textContent = isMe ? '¡ESCOBA!' : `¡Escoba de ${who}!`;
    overlay.classList.add('escoba');
    loot.textContent = describeLoot(shown) + ' · mesa limpia';
    playSfx('escoba');
  } else if (type === 'capture') {
    title.textContent = isMe ? 'Capturas' : `${who} captura`;
    overlay.classList.add(isMe ? 'mine' : 'theirs');
    loot.textContent = describeLoot(shown);
    playSfx('capture');
  } else {
    title.textContent = isMe ? 'Dejas en la mesa' : `${who} deja carta`;
    loot.textContent = played ? played.label : '';
    playSfx('discard');
  }

  const tip = $('#revealTip');
  if (tip) tip.textContent = 'Toca para continuar';

  overlay.classList.add('open');
  const wait = type === 'escoba' ? 3400 : type === 'capture' ? 2800 : 1500;

  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      overlay.removeEventListener('click', finish);
      state.revealSkip = null;
      resolve();
    };
    state.revealSkip = finish;
    const timer = setTimeout(finish, wait);
    overlay.addEventListener('click', finish);
  });

  overlay.classList.remove('open');
  await sleep(200);
}

function lastMoveFrom(game) {
  const log = game.moveLog || [];
  if (!log.length) return null;
  return log[log.length - 1];
}

async function applyAndReveal(move, { broadcast = false } = {}) {
  state.busy = true;
  const beforeLen = (state.game.moveLog || []).length;
  try {
    state.game = applyMove(state.game, move);
  } catch (err) {
    state.busy = false;
    setMsg(err.message || 'Jugada inválida');
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
    setMsg(mv.type === 'escoba' ? '¡Escoba!' : mv.type === 'capture' ? 'Capturando…' : '…');
    render();
    await showReveal(mv);
  } else {
    render();
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
  } catch (_) {
    return false;
  }
}

function submitMove(move) {
  if (state.busy) return;
  if (state.mode === 'online' && state.role === 'guest') {
    state.busy = true;
    state.net.send({ type: 'move', move });
    state.selectedHand = null;
    state.selectedTable.clear();
    setMsg('Enviando jugada…');
    render();
    return;
  }
  commitLocalMove({ ...move, player: state.me });
}

function doCapture() {
  if (!state.selectedHand) return;
  submitMove({
    player: state.me,
    cardId: state.selectedHand,
    captureIds: [...state.selectedTable],
  });
}

function doDiscard() {
  if (!state.selectedHand) return;
  submitMove({
    player: state.me,
    cardId: state.selectedHand,
    captureIds: [],
  });
}

function doAuto() {
  if (!state.selectedHand) return;
  const card = state.game.hands[state.me].find((c) => c.id === state.selectedHand);
  const best = bestCapture(card, state.game.table);
  if (!best) {
    doDiscard();
    return;
  }
  submitMove({
    player: state.me,
    cardId: state.selectedHand,
    captureIds: best.map((c) => c.id),
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
        state.selectedHand = null;
        state.selectedTable.clear();
        state.net.send({ type: 'state', game: serializeState(state.game) });
        $('#roundOverlay').classList.remove('open');
        showScreen('screenGame');
        render();
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
  render();
  if (state.mode === 'online' && state.role === 'host') {
    state.net.send({ type: 'state', game: serializeState(state.game) });
  }
  maybeAiOrWait();
}

function leaveToHome() {
  state.net?.destroy();
  state.net = null;
  state.game = null;
  state.mode = null;
  state.busy = false;
  state.lastSeenLog = 0;
  state.feed = [];
  $('#roundOverlay').classList.remove('open');
  $('#inviteOverlay').classList.remove('open');
  $('#revealOverlay')?.classList.remove('open');
  $('#peekOverlay')?.classList.remove('open');
  showScreen('screenHome');
}

function startCpu() {
  state.mode = 'cpu';
  state.role = null;
  state.me = 0;
  state.names = ['Tú', 'CPU'];
  state.game = createMatch({ firstPlayer: Math.random() < 0.5 ? 0 : 1 });
  state.lastSeenLog = 0;
  state.feed = [];
  state.selectedHand = null;
  state.selectedTable.clear();
  showScreen('screenGame');
  $('#roundOverlay').classList.remove('open');
  render();
  maybeAiOrWait();
}

function beginHostMatch() {
  if (state.role !== 'host' || !state.net) return;
  if (state.game && state.net.ready) {
    state.net.send({ type: 'state', game: serializeState(state.game) });
    return;
  }
  state.game = createMatch({ firstPlayer: 0 });
  state.lastSeenLog = 0;
  state.selectedHand = null;
  state.selectedTable.clear();
  state.net.markReady();
  state.net.send({ type: 'state', game: serializeState(state.game) });
  $('#inviteOverlay').classList.remove('open');
  showScreen('screenGame');
  render();
}

async function startHost() {
  try {
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
    state.names = ['Tú', 'Amigo'];
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
    state.net?.destroy();
    state.net = new EscobaNet();
    wireNet(state.net);
    showScreen('screenJoinWait');
    $('#joinWaitStatus').textContent = 'Conectando…';
    await state.net.join(code);
    state.mode = 'online';
    state.role = 'guest';
    state.me = 1;
    state.names = ['Anfitrión', 'Tú'];
    $('#joinWaitStatus').textContent = 'Conectado. Esperando al anfitrión…';
  } catch (err) {
    $('#joinWaitStatus').textContent = err.message || 'No se pudo unir';
  }
}

async function ingestRemoteState(game) {
  const prevLog = state.lastSeenLog || 0;
  const wasPlaying = !!state.game;
  state.game = game;
  state.selectedHand = null;
  state.selectedTable.clear();
  state.net?.markReady();
  $('#roundOverlay').classList.remove('open');
  showScreen('screenGame');

  const log = game.moveLog || [];
  if (wasPlaying && log.length > prevLog) {
    const mv = log[log.length - 1];
    pushFeed(mv);
    state.busy = true;
    render();
    await showReveal(mv);
  }
  state.lastSeenLog = log.length;
  state.busy = false;
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
      setMsg(data.reason || 'Jugada rechazada');
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
  $('#btnAuto').addEventListener('click', doAuto);
  $('#btnHint')?.addEventListener('click', doHint);
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
  const unlock = () => {
    tone(1, 0.01, 'sine', 0.0001);
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
}

function registerSw() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

bindUi();
registerSw();
showScreen('screenHome');
applyInviteFromUrl();
