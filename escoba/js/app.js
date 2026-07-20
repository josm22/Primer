import {
  createMatch,
  applyMove,
  startNextRound,
  findCaptures,
  bestCapture,
  serializeState,
  WIN_SCORE,
  RANK_LABEL,
} from './engine.js';
import { playAiTurn } from './ai.js';
import { EscobaNet, normalizeCode } from './net.js';

const SUIT_GLYPH = {
  oros: '◆',
  copas: '♥',
  espadas: '♠',
  bastos: '♣',
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  mode: null, // 'cpu' | 'online'
  role: null, // 'host' | 'guest' | null
  me: 0,
  game: null,
  selectedHand: null,
  selectedTable: new Set(),
  names: ['Tú', 'Rival'],
  net: null,
  busy: false,
};

function showScreen(id) {
  $$('.screen').forEach((el) => el.classList.toggle('active', el.id === id));
}

function setMsg(text) {
  const el = $('#msgBar');
  if (el) el.textContent = text || '';
}

function cardEl(card, { face = true, selectable = false, selected = false, capture = false, dim = false } = {}) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `card ${face ? `face-up ${card.suit}` : 'face-down'}`;
  el.dataset.id = card?.id || '';
  if (selected) el.classList.add('selected');
  if (capture) el.classList.add('capture-target');
  if (dim) el.classList.add('dim');
  if (!selectable) el.tabIndex = -1;

  if (face && card) {
    const rankShort = RANK_LABEL[card.rank] === 'As' ? 'A' : RANK_LABEL[card.rank].length > 2 ? RANK_LABEL[card.rank][0] : String(card.rank);
    const glyph = SUIT_GLYPH[card.suit];
    el.innerHTML = `
      <span class="corner"><span>${rankShort}</span><span>${glyph}</span></span>
      <span class="suit-big">${glyph}</span>
      <span class="corner bl"><span>${rankShort}</span><span>${glyph}</span></span>
    `;
    el.setAttribute('aria-label', card.label);
  } else {
    el.setAttribute('aria-label', 'Carta oculta');
  }
  return el;
}

function render() {
  const g = state.game;
  if (!g) return;

  const opp = 1 - state.me;
  $('#scoreMe .who').textContent = state.names[state.me];
  $('#scoreOpp .who').textContent = state.names[opp];
  $('#scoreMe .pts').textContent = g.scores[state.me];
  $('#scoreOpp .pts').textContent = g.scores[opp];
  $('#scoreMe').classList.toggle('active', g.phase === 'play' && g.currentPlayer === state.me);
  $('#scoreOpp').classList.toggle('active', g.phase === 'play' && g.currentPlayer === opp);

  const myTurn = g.phase === 'play' && g.currentPlayer === state.me && !state.busy;
  setMsg(
    g.phase === 'play'
      ? myTurn
        ? 'Tu turno — elige carta y captura (suma 15)'
        : state.mode === 'cpu'
          ? 'Pensando el rival…'
          : 'Turno del rival…'
      : g.message
  );

  const oppHand = $('#oppHand');
  oppHand.innerHTML = '';
  const oppCount = g.hands[opp].length;
  for (let i = 0; i < oppCount; i++) {
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
    const el = cardEl(c, {
      face: true,
      selectable: myTurn && !!state.selectedHand,
      capture: selected,
    });
    if (myTurn && state.selectedHand) {
      el.addEventListener('click', () => toggleTable(c.id));
    }
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
    if (myTurn) el.addEventListener('click', () => selectHand(c.id));
    myHand.appendChild(el);
  }

  const canPlay = myTurn && !!state.selectedHand;
  let canDiscard = canPlay;
  if (canPlay) {
    const card = g.hands[state.me].find((c) => c.id === state.selectedHand);
    if (card && findCaptures(card, g.table).length > 0) canDiscard = false;
  }
  $('#btnCapture').disabled = !canPlay || state.selectedTable.size === 0;
  $('#btnDiscard').disabled = !canDiscard;
  $('#btnAuto').disabled = !canPlay;

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
  }
  render();
}

function toggleTable(id) {
  if (state.selectedTable.has(id)) state.selectedTable.delete(id);
  else state.selectedTable.add(id);
  render();
}

function commitLocalMove(move) {
  try {
    const prevTableLen = state.game.table.length;
    state.game = applyMove(state.game, move);
    state.selectedHand = null;
    state.selectedTable.clear();

    if (
      move.captureIds?.length &&
      move.captureIds.length === prevTableLen
    ) {
      $('#felt')?.classList.remove('sweep');
      void $('#felt')?.offsetWidth;
      $('#felt')?.classList.add('sweep');
    }

    render();
    maybeAiOrWait();
    return true;
  } catch (err) {
    setMsg(err.message || 'Jugada inválida');
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
  // host or cpu: apply locally; host broadcasts
  if (commitLocalMove({ ...move, player: state.me })) {
    if (state.mode === 'online' && state.role === 'host') {
      state.net.send({ type: 'state', game: serializeState(state.game) });
    }
  }
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

function maybeAiOrWait() {
  const g = state.game;
  if (!g || g.phase !== 'play') return;
  if (state.mode === 'cpu' && g.currentPlayer !== state.me) {
    state.busy = true;
    setTimeout(() => {
      state.game = playAiTurn(state.game, 1 - state.me);
      state.busy = false;
      render();
    }, 700);
  }
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
    title.textContent = 'Fin de ronda';
  }

  const rs = g.roundScores;
  if (rs) {
    const rows = rs.detail
      .map(
        (d) =>
          `<tr><td>${d.label}</td><td>${d.a}</td><td>${d.b}</td></tr>`
      )
      .join('');
    body.innerHTML = `
      <table class="score-table">
        <thead><tr><th></th><th>${state.names[0]}</th><th>${state.names[1]}</th></tr></thead>
        <tbody>
          ${rows}
          <tr class="total"><td>Ronda</td><td>${rs.pts[0]}</td><td>${rs.pts[1]}</td></tr>
          <tr class="total"><td>Total (a ${WIN_SCORE})</td><td>${g.scores[0]}</td><td>${g.scores[1]}</td></tr>
        </tbody>
      </table>`;
  } else {
    body.innerHTML = `<p>${g.message}</p>`;
  }

  actions.innerHTML = '';
  if (g.phase === 'roundEnd') {
    const btn = document.createElement('button');
    btn.className = 'btn btn-gold';
    btn.textContent = 'Siguiente ronda';
    btn.onclick = () => nextRound();
    // Solo host/cpu inicia; guest espera
    if (state.mode === 'online' && state.role === 'guest') {
      btn.disabled = true;
      btn.textContent = 'Esperando anfitrión…';
    }
    actions.appendChild(btn);
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
  $('#roundOverlay').classList.remove('open');
  $('#inviteOverlay').classList.remove('open');
  showScreen('screenHome');
}

function startCpu() {
  state.mode = 'cpu';
  state.role = null;
  state.me = 0;
  state.names = ['Tú', 'CPU'];
  state.game = createMatch({ firstPlayer: Math.random() < 0.5 ? 0 : 1 });
  state.selectedHand = null;
  state.selectedTable.clear();
  showScreen('screenGame');
  $('#roundOverlay').classList.remove('open');
  render();
  maybeAiOrWait();
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
    $('#joinWaitStatus').textContent = 'Conectado. Esperando partida…';
  } catch (err) {
    $('#joinWaitStatus').textContent = err.message || 'No se pudo unir';
  }
}

function wireNet(net) {
  net.on('onReady', ({ role }) => {
    if (role === 'host') {
      state.game = createMatch({ firstPlayer: 0 });
      state.selectedHand = null;
      state.selectedTable.clear();
      net.send({ type: 'state', game: serializeState(state.game) });
      $('#inviteOverlay').classList.remove('open');
      showScreen('screenGame');
      render();
    }
  });

  net.on('onMessage', (data) => {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'state' && state.role === 'guest') {
      state.game = data.game;
      state.busy = false;
      state.selectedHand = null;
      state.selectedTable.clear();
      $('#roundOverlay').classList.remove('open');
      showScreen('screenGame');
      render();
      return;
    }

    if (data.type === 'move' && state.role === 'host') {
      try {
        const move = { ...data.move, player: 1 }; // guest is player 1
        state.game = applyMove(state.game, move);
        net.send({ type: 'state', game: serializeState(state.game) });
        state.selectedHand = null;
        state.selectedTable.clear();
        render();
      } catch (err) {
        net.send({ type: 'reject', reason: err.message });
      }
      return;
    }

    if (data.type === 'reject' && state.role === 'guest') {
      state.busy = false;
      setMsg(data.reason || 'Jugada rechazada');
      render();
    }
  });

  net.on('onDisconnect', () => {
    setMsg('Tu amigo se ha desconectado');
  });

  net.on('onError', (err) => {
    console.error(err);
    setMsg(err?.message || 'Error de conexión');
  });

  net.on('onStatus', (s) => {
    const el = $('#inviteStatus') || $('#joinWaitStatus');
    if (el) el.textContent = s;
  });
}

async function shareInvite() {
  const code = $('#inviteCode').textContent;
  const text = `¡Juguemos a la Escoba! Código: ${code}`;
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Escoba', text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      $('#inviteStatus').textContent = 'Código copiado al portapapeles';
    }
  } catch (_) {
    /* usuario canceló */
  }
}

function openRules() {
  $('#rulesOverlay').classList.add('open');
}

function closeRules() {
  $('#rulesOverlay').classList.remove('open');
}

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
  $('#btnLeave').addEventListener('click', leaveToHome);
  $('#btnRules').addEventListener('click', openRules);
  $('#btnRulesHome').addEventListener('click', openRules);
  $('#btnCloseRules').addEventListener('click', closeRules);

  $('#joinCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startJoin();
  });
}

function registerSw() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

bindUi();
registerSw();
showScreen('screenHome');
