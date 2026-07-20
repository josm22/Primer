/** Naipes españoles originales (Basquetteur / Wikimedia Commons, CC BY-SA 3.0). */

import { SUITS, RANKS } from './engine.js';

export function cardImageUrl(card) {
  return `./cards/${card.suit}-${card.rank}.png`;
}

export function cardBackUrl() {
  return './cards/back.png';
}

export function buildCardFaceHtml(card) {
  const src = cardImageUrl(card);
  return `<img class="card-img" src="${src}" alt="${card.label}" draggable="false">`;
}

export function buildCardBackHtml() {
  return `<img class="card-img" src="${cardBackUrl()}" alt="" draggable="false">`;
}

/** Precarga toda la baraja para que los vuelos no salgan en blanco. */
export function preloadDeckImages() {
  const urls = [cardBackUrl()];
  for (const suit of SUITS) {
    for (const rank of RANKS) urls.push(`./cards/${suit}-${rank}.png`);
  }
  return Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = () => resolve(src);
          img.src = src;
        })
    )
  );
}
