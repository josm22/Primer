/** Iconos y maquetación de naipes españoles (no póker). */

const SUIT_COLOR = {
  oros: '#c9921a',
  copas: '#c62828',
  espadas: '#1a2744',
  bastos: '#2f6b3a',
};

const RANK_SHORT = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'S',
  11: 'C',
  12: 'R',
};

const FIGURE_NAME = {
  10: 'SOTA',
  11: 'CABALLO',
  12: 'REY',
};

/** Posiciones de pintas (0–100) estilo baraja española. */
const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [
    [50, 22],
    [50, 78],
  ],
  3: [
    [50, 18],
    [50, 50],
    [50, 82],
  ],
  4: [
    [32, 24],
    [68, 24],
    [32, 76],
    [68, 76],
  ],
  5: [
    [32, 22],
    [68, 22],
    [50, 50],
    [32, 78],
    [68, 78],
  ],
  6: [
    [32, 18],
    [68, 18],
    [32, 50],
    [68, 50],
    [32, 82],
    [68, 82],
  ],
  7: [
    [32, 16],
    [68, 16],
    [50, 34],
    [32, 52],
    [68, 52],
    [32, 84],
    [68, 84],
  ],
};

function suitSvg(suit, { size = 24 } = {}) {
  const c = SUIT_COLOR[suit];
  const common = `width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"`;

  if (suit === 'oros') {
    return `<svg ${common}><circle cx="32" cy="32" r="26" fill="${c}"/><circle cx="32" cy="32" r="20" fill="none" stroke="#fff6d6" stroke-width="3"/><circle cx="32" cy="32" r="10" fill="#fff6d6"/><circle cx="32" cy="32" r="5" fill="${c}"/></svg>`;
  }
  if (suit === 'copas') {
    return `<svg ${common}>
      <path d="M18 12h28c0 14-6 22-14 26v8h8v4H22v-4h8v-8C22 34 18 26 18 12z" fill="${c}"/>
      <rect x="20" y="10" width="24" height="5" rx="1.5" fill="${c}"/>
      <ellipse cx="32" cy="14" rx="11" ry="3" fill="#ffd4d0" opacity=".45"/>
    </svg>`;
  }
  if (suit === 'espadas') {
    return `<svg ${common}>
      <path d="M32 6c8 14 16 22 16 34 0 8-6 12-16 12S16 48 16 40C16 28 24 20 32 6z" fill="${c}"/>
      <path d="M32 10c6 12 12 18 12 30 0 6-4 8-12 8s-12-2-12-8c0-12 6-18 12-30z" fill="#e8eef8" opacity=".25"/>
      <rect x="29" y="48" width="6" height="10" rx="1" fill="${c}"/>
      <rect x="24" y="52" width="16" height="4" rx="1" fill="${c}"/>
    </svg>`;
  }
  // bastos
  return `<svg ${common}>
    <rect x="28" y="8" width="8" height="44" rx="3" fill="${c}"/>
    <path d="M18 14c6 2 10 6 14 14-4 2-10 2-16-2 0-4 0-8 2-12z" fill="${c}"/>
    <path d="M46 14c-6 2-10 6-14 14 4 2 10 2 16-2 0-4 0-8-2-12z" fill="${c}"/>
    <path d="M20 46c6-2 10-2 12-8 2 6 6 6 12 8-4 4-8 6-12 6s-8-2-12-6z" fill="${c}"/>
    <circle cx="32" cy="30" r="4" fill="#e7f2e4"/>
  </svg>`;
}

function figureArt(suit, rank) {
  const c = SUIT_COLOR[suit];
  if (rank === 12) {
    // Rey — corona
    return `<svg class="figure-art" viewBox="0 0 80 80" aria-hidden="true">
      <path d="M12 54h56v8H12z" fill="${c}"/>
      <path d="M16 54l8-22 8 14 8-28 8 28 8-14 8 22z" fill="${c}"/>
      <circle cx="24" cy="30" r="3.5" fill="#f0d060"/>
      <circle cx="40" cy="16" r="3.5" fill="#f0d060"/>
      <circle cx="56" cy="30" r="3.5" fill="#f0d060"/>
      <rect x="18" y="54" width="44" height="5" fill="#f0d060" opacity=".7"/>
    </svg>`;
  }
  if (rank === 11) {
    // Caballo — silueta
    return `<svg class="figure-art" viewBox="0 0 80 80" aria-hidden="true">
      <path d="M18 58c8-2 14-10 16-20 2-2 6-2 8 0 4 8 12 14 22 14v6c-12 0-20-4-26-12-2 8-8 14-16 16l-4-4z" fill="${c}"/>
      <path d="M34 36c0-10 6-18 14-22 2 4 2 8 0 12-4 2-8 6-10 12h-4z" fill="${c}"/>
      <circle cx="50" cy="20" r="2.5" fill="#fff"/>
      <path d="M22 58v10M30 56v12M48 52v14M58 52v14" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }
  // Sota — figura estilizada
  return `<svg class="figure-art" viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="22" r="12" fill="${c}"/>
    <path d="M22 68c2-18 10-28 18-28s16 10 18 28H22z" fill="${c}"/>
    <rect x="28" y="10" width="24" height="6" rx="2" fill="#f0d060"/>
    <path d="M40 34v8" stroke="#f0d060" stroke-width="3"/>
  </svg>`;
}

export function buildCardFaceHtml(card) {
  const color = SUIT_COLOR[card.suit];
  const short = RANK_SHORT[card.rank];
  const cornerIcon = suitSvg(card.suit, { size: 14 });

  let body;
  if (card.rank <= 7) {
    const pips = PIP_LAYOUTS[card.rank]
      .map(([x, y]) => {
        const big = card.rank === 1;
        const size = big ? 34 : 18;
        return `<span class="pip" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;margin-left:-${size / 2}px;margin-top:-${size / 2}px">${suitSvg(card.suit, { size })}</span>`;
      })
      .join('');
    body = `<div class="pips">${pips}</div>`;
  } else {
    body = `<div class="figure">
      ${figureArt(card.suit, card.rank)}
      <div class="figure-suit">${suitSvg(card.suit, { size: 22 })}</div>
      <div class="figure-name" style="color:${color}">${FIGURE_NAME[card.rank]}</div>
    </div>`;
  }

  return `
    <div class="card-frame" style="--suit:${color}">
      <span class="corner tl"><span class="rnk">${short}</span>${cornerIcon}</span>
      ${body}
      <span class="corner br"><span class="rnk">${short}</span>${cornerIcon}</span>
    </div>
  `;
}

export function buildCardBackHtml() {
  return `<div class="card-back-art" aria-hidden="true">
    <div class="back-border"></div>
    <div class="back-motif">
      ${suitSvg('oros', { size: 18 })}
      ${suitSvg('copas', { size: 18 })}
      ${suitSvg('espadas', { size: 18 })}
      ${suitSvg('bastos', { size: 18 })}
    </div>
  </div>`;
}

export { SUIT_COLOR, suitSvg };
