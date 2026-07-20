/**
 * Motor puro de Escoba del 15 (2 jugadores, baraja española).
 * Valores: 1–7, Sota=8, Caballo=9, Rey=10. Captura si suma exacta 15.
 */

export const SUITS = ['oros', 'copas', 'espadas', 'bastos'];
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // 10=sota, 11=caballo, 12=rey
export const TARGET = 15;
export const WIN_SCORE = 21;

export const SUIT_LABEL = {
  oros: 'Oros',
  copas: 'Copas',
  espadas: 'Espadas',
  bastos: 'Bastos',
};

export const RANK_LABEL = {
  1: 'As',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'Sota',
  11: 'Caballo',
  12: 'Rey',
};

export function cardValue(rank) {
  if (rank >= 1 && rank <= 7) return rank;
  if (rank === 10) return 8;
  if (rank === 11) return 9;
  if (rank === 12) return 10;
  throw new Error(`Rango inválido: ${rank}`);
}

export function cardId(suit, rank) {
  return `${suit}-${rank}`;
}

export function parseCardId(id) {
  const [suit, rankStr] = id.split('-');
  return { suit, rank: Number(rankStr), id };
}

export function makeCard(suit, rank) {
  return {
    suit,
    rank,
    id: cardId(suit, rank),
    value: cardValue(rank),
    label: `${RANK_LABEL[rank]} de ${SUIT_LABEL[suit]}`,
  };
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push(makeCard(suit, rank));
  }
  return deck;
}

export function shuffle(array, rng = Math.random) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Todas las combinaciones de índices que suman `need`. */
export function subsetsSummingTo(cards, need) {
  const results = [];
  const n = cards.length;
  const walk = (start, remaining, chosen) => {
    if (remaining === 0) {
      results.push(chosen.slice());
      return;
    }
    if (remaining < 0) return;
    for (let i = start; i < n; i++) {
      chosen.push(i);
      walk(i + 1, remaining - cards[i].value, chosen);
      chosen.pop();
    }
  };
  walk(0, need, []);
  return results;
}

export function findCaptures(handCard, table) {
  const need = TARGET - handCard.value;
  if (need <= 0) return [];
  return subsetsSummingTo(table, need).map((idxs) => idxs.map((i) => table[i]));
}

export function createMatch({ seedRng, firstPlayer = 0 } = {}) {
  const rng = seedRng || Math.random;
  const deck = shuffle(createDeck(), rng);
  const table = deck.splice(0, 4);
  const hands = [[], []];
  hands[0] = deck.splice(0, 3);
  hands[1] = deck.splice(0, 3);

  return {
    phase: 'play', // play | roundEnd | matchEnd
    deck,
    table,
    hands,
    captured: [[], []],
    escobas: [0, 0],
    scores: [0, 0],
    roundScores: null,
    currentPlayer: firstPlayer,
    lastCapturer: null,
    message: 'Nueva ronda',
    winner: null,
    moveLog: [],
  };
}

function removeCards(from, ids) {
  const set = new Set(ids);
  const kept = [];
  const removed = [];
  for (const c of from) {
    if (set.has(c.id)) {
      removed.push(c);
      set.delete(c.id);
    } else {
      kept.push(c);
    }
  }
  if (set.size > 0) throw new Error('Cartas no encontradas');
  return { kept, removed };
}

export function serializeState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function applyMove(state, { player, cardId: playId, captureIds = [] }) {
  if (state.phase !== 'play') throw new Error('La partida no está en juego');
  if (player !== state.currentPlayer) throw new Error('No es tu turno');

  const hand = state.hands[player];
  const card = hand.find((c) => c.id === playId);
  if (!card) throw new Error('No tienes esa carta');

  const next = serializeState(state);
  const captureSet = new Set(captureIds);

  if (captureIds.length === 0) {
    // Descarte solo si no hay captura posible con esa carta
    if (findCaptures(card, next.table).length > 0) {
      throw new Error('Hay que capturar con esa carta');
    }
    next.hands[player] = hand.filter((c) => c.id !== playId);
    next.table.push(card);
    next.message = `Jugador ${player + 1} deja ${card.label}`;
    next.moveLog.push({ player, type: 'discard', card: card.id, cardId: card.id, captureIds: [] });
  } else {
    const captures = findCaptures(card, next.table);
    const ok = captures.some(
      (group) =>
        group.length === captureIds.length &&
        group.every((c) => captureSet.has(c.id))
    );
    if (!ok) throw new Error('Captura inválida');

    const { kept, removed } = removeCards(next.table, captureIds);
    next.table = kept;
    next.hands[player] = hand.filter((c) => c.id !== playId);
    next.captured[player].push(card, ...removed);
    next.lastCapturer = player;

    const isEscoba = kept.length === 0;
    if (isEscoba) {
      next.escobas[player] += 1;
      next.message = `¡Escoba! ${card.label}`;
      next.moveLog.push({
        player,
        type: 'escoba',
        card: card.id,
        cardId: card.id,
        capture: captureIds,
        captureIds,
      });
    } else {
      next.message = `Captura con ${card.label}`;
      next.moveLog.push({
        player,
        type: 'capture',
        card: card.id,
        cardId: card.id,
        capture: captureIds,
        captureIds,
      });
    }
  }

  // Fin de manos → repartir o fin de ronda
  if (next.hands[0].length === 0 && next.hands[1].length === 0) {
    if (next.deck.length >= 6) {
      next.hands[0] = next.deck.splice(0, 3);
      next.hands[1] = next.deck.splice(0, 3);
      next.message = 'Nueva mano repartida';
    } else {
      return endRound(next);
    }
  }

  next.currentPlayer = 1 - player;
  return next;
}

export function scoreRound(state) {
  const detail = [
    { key: 'escobas', label: 'Escobas', a: 0, b: 0 },
    { key: 'cartas', label: 'Cartas', a: 0, b: 0 },
    { key: 'oros', label: 'Oros', a: 0, b: 0 },
    { key: 'sietes', label: 'Sietes', a: 0, b: 0 },
    { key: 'sieteOros', label: '7 de oros', a: 0, b: 0 },
  ];

  detail[0].a = state.escobas[0];
  detail[0].b = state.escobas[1];

  const countCards = (p) => state.captured[p].length;
  const countOros = (p) => state.captured[p].filter((c) => c.suit === 'oros').length;
  const countSietes = (p) => state.captured[p].filter((c) => c.rank === 7).length;
  const hasSieteOros = (p) =>
    state.captured[p].some((c) => c.suit === 'oros' && c.rank === 7);

  const c0 = countCards(0);
  const c1 = countCards(1);
  if (c0 > c1) detail[1].a = 1;
  else if (c1 > c0) detail[1].b = 1;

  const o0 = countOros(0);
  const o1 = countOros(1);
  if (o0 > o1) detail[2].a = 1;
  else if (o1 > o0) detail[2].b = 1;

  const s0 = countSietes(0);
  const s1 = countSietes(1);
  if (s0 > s1) detail[3].a = 1;
  else if (s1 > s0) detail[3].b = 1;

  if (hasSieteOros(0)) detail[4].a = 1;
  if (hasSieteOros(1)) detail[4].b = 1;

  const pts = [
    detail.reduce((s, d) => s + d.a, 0),
    detail.reduce((s, d) => s + d.b, 0),
  ];

  return {
    detail,
    pts,
    counts: { cards: [c0, c1], oros: [o0, o1], sietes: [s0, s1] },
  };
}

function endRound(state) {
  const next = serializeState(state);
  // Cartas restantes van al último que capturó (sin escoba extra)
  if (next.table.length && next.lastCapturer != null) {
    next.captured[next.lastCapturer].push(...next.table);
    next.table = [];
  }

  const scored = scoreRound(next);
  next.roundScores = scored;
  next.scores[0] += scored.pts[0];
  next.scores[1] += scored.pts[1];
  next.phase = 'roundEnd';
  next.message = `Fin de ronda: ${scored.pts[0]}–${scored.pts[1]}`;

  if (next.scores[0] >= WIN_SCORE || next.scores[1] >= WIN_SCORE) {
    next.phase = 'matchEnd';
    if (next.scores[0] === next.scores[1]) next.winner = null;
    else next.winner = next.scores[0] > next.scores[1] ? 0 : 1;
    next.message =
      next.winner == null
        ? 'Empate'
        : `Gana el jugador ${next.winner + 1}`;
  }
  return next;
}

export function startNextRound(state, { seedRng, firstPlayer } = {}) {
  if (state.phase !== 'roundEnd') throw new Error('No hay ronda que continuar');
  const fresh = createMatch({
    seedRng,
    firstPlayer: firstPlayer ?? (1 - (state.lastCapturer ?? 0)),
  });
  fresh.scores = state.scores.slice();
  return fresh;
}

/** Mejor captura automática (prioriza escoba, luego más cartas). */
export function bestCapture(handCard, table) {
  const options = findCaptures(handCard, table);
  if (!options.length) return null;
  options.sort((a, b) => {
    const escA = a.length === table.length ? 1 : 0;
    const escB = b.length === table.length ? 1 : 0;
    if (escA !== escB) return escB - escA;
    return b.length - a.length;
  });
  return options[0];
}

export function legalMoves(state, player) {
  if (state.phase !== 'play' || state.currentPlayer !== player) return [];
  const moves = [];
  for (const card of state.hands[player]) {
    const caps = findCaptures(card, state.table);
    if (!caps.length) {
      moves.push({ cardId: card.id, captureIds: [] });
    } else {
      for (const group of caps) {
        moves.push({ cardId: card.id, captureIds: group.map((c) => c.id) });
      }
    }
  }
  return moves;
}

export function chooseAiMove(state, player) {
  const moves = legalMoves(state, player);
  if (!moves.length) return null;

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    let score = 0;
    const card = state.hands[player].find((c) => c.id === m.cardId);
    if (m.captureIds.length === 0) {
      score = -card.value; // preferir dejar cartas bajas
    } else {
      score = 10 + m.captureIds.length * 3;
      if (m.captureIds.length === state.table.length) score += 50;
      const taken = state.table.filter((c) => m.captureIds.includes(c.id));
      if (taken.some((c) => c.suit === 'oros' && c.rank === 7) || (card.suit === 'oros' && card.rank === 7))
        score += 20;
      score += taken.filter((c) => c.suit === 'oros').length * 4;
      score += taken.filter((c) => c.rank === 7).length * 5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { player, ...best };
}
