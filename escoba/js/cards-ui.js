/** Naipes españoles originales (Basquetteur / Wikimedia Commons, CC BY-SA 3.0). */

export function cardImageUrl(card) {
  return `./cards/${card.suit}-${card.rank}.png`;
}

export function cardBackUrl() {
  return './cards/back.png';
}

export function buildCardFaceHtml(card) {
  const src = cardImageUrl(card);
  return `<img class="card-img" src="${src}" alt="${card.label}" draggable="false" loading="lazy">`;
}

export function buildCardBackHtml() {
  return `<img class="card-img" src="${cardBackUrl()}" alt="" draggable="false" loading="lazy">`;
}
