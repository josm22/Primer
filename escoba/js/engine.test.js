/**
 * Tests del motor (Node, sin DOM).
 * Ejecutar: node escoba/js/engine.test.js
 */
import {
  makeCard,
  createDeck,
  cardValue,
  findCaptures,
  applyMove,
  createMatch,
  scoreRound,
  subsetsSummingTo,
  shuffle,
} from './engine.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.error('  ✗', msg);
  }
}

console.log('Valores de cartas');
assert(cardValue(1) === 1, 'as = 1');
assert(cardValue(7) === 7, '7 = 7');
assert(cardValue(10) === 8, 'sota = 8');
assert(cardValue(11) === 9, 'caballo = 9');
assert(cardValue(12) === 10, 'rey = 10');

console.log('Baraja');
const deck = createDeck();
assert(deck.length === 40, '40 cartas');
assert(new Set(deck.map((c) => c.id)).size === 40, 'ids únicos');

console.log('Capturas');
const table = [
  makeCard('oros', 5),
  makeCard('copas', 2),
  makeCard('espadas', 3),
  makeCard('bastos', 7),
];
const rey = makeCard('oros', 12); // 10
const caps = findCaptures(rey, table);
assert(
  caps.some((g) => g.length === 1 && g[0].rank === 5),
  'rey captura el 5'
);
assert(
  caps.some((g) => g.map((c) => c.rank).sort().join() === '2,3'),
  'rey captura 2+3'
);

const sota = makeCard('copas', 10); // 8
const caps2 = findCaptures(sota, [makeCard('oros', 7)]);
assert(caps2.length === 1 && caps2[0][0].rank === 7, 'sota + 7 = 15');

console.log('Subconjuntos');
const sums = subsetsSummingTo(
  [makeCard('oros', 1), makeCard('copas', 2), makeCard('espadas', 3)],
  3
);
assert(sums.length >= 2, 'varias formas de sumar 3');

console.log('Jugada y escoba');
const fixedRng = (() => {
  // Deterministic-ish: reverse order then take
  let i = 0;
  return () => {
    i += 1;
    return (i % 100) / 100;
  };
})();

// Manual mini-state for escoba
let state = {
  phase: 'play',
  deck: [],
  table: [makeCard('oros', 5)],
  hands: [[makeCard('copas', 12)], [makeCard('bastos', 1)]],
  captured: [[], []],
  escobas: [0, 0],
  scores: [0, 0],
  roundScores: null,
  currentPlayer: 0,
  lastCapturer: null,
  message: '',
  winner: null,
  moveLog: [],
};

state = applyMove(state, {
  player: 0,
  cardId: 'copas-12',
  captureIds: ['oros-5'],
});
assert(state.escobas[0] === 1, 'escoba al vaciar mesa');
assert(state.table.length === 0, 'mesa vacía');
assert(state.captured[0].length === 2, '2 cartas capturadas');
assert(state.currentPlayer === 1, 'pasa turno');

console.log('Puntuación');
const scored = scoreRound({
  escobas: [2, 0],
  captured: [
    [
      makeCard('oros', 7),
      makeCard('oros', 1),
      makeCard('oros', 2),
      makeCard('copas', 7),
      makeCard('espadas', 3),
    ],
    [makeCard('bastos', 4), makeCard('copas', 5)],
  ],
});
assert(scored.detail.find((d) => d.key === 'escobas').a === 2, '2 escobas');
assert(scored.detail.find((d) => d.key === 'sieteOros').a === 1, '7 de oros');
assert(scored.detail.find((d) => d.key === 'cartas').a === 1, 'más cartas');
assert(scored.detail.find((d) => d.key === 'oros').a === 1, 'más oros');
assert(scored.detail.find((d) => d.key === 'sietes').a === 1, 'más sietes');

console.log('Partida completa se crea');
const match = createMatch({ seedRng: () => 0.42, firstPlayer: 0 });
assert(match.hands[0].length === 3, '3 cartas p0');
assert(match.hands[1].length === 3, '3 cartas p1');
assert(match.table.length === 4, '4 en mesa');
assert(match.deck.length === 30, '30 en mazo');

console.log('Shuffle no pierde cartas');
const sh = shuffle(createDeck(), () => 0.3);
assert(sh.length === 40, 'shuffle 40');

console.log(`\n${passed} ok, ${failed} fallos`);
if (failed) process.exit(1);
