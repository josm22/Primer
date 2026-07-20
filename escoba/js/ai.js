import { chooseAiMove, applyMove } from './engine.js';

export function playAiTurn(state, player) {
  const move = chooseAiMove(state, player);
  if (!move) return state;
  return applyMove(state, move);
}
