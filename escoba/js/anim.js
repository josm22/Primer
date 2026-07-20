/** Animaciones de cartas volando por la mesa (dejar / capturar). */

import { cardImageUrl, cardBackUrl } from './cards-ui.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function layer() {
  let el = document.getElementById('flyLayer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'flyLayer';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function clearLayer() {
  const el = layer();
  el.innerHTML = '';
  el.className = '';
}

function midRect(r) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

function cardRect(id) {
  const el = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function areaRect(sel) {
  const el = document.querySelector(sel);
  return el ? el.getBoundingClientRect() : null;
}

function makeFlyer(card, rect, { face = true } = {}) {
  const node = document.createElement('div');
  node.className = 'flyer';
  const w = rect?.width || 64;
  const h = rect?.height || 96;
  const left = rect ? rect.left : window.innerWidth / 2 - w / 2;
  const top = rect ? rect.top : window.innerHeight / 2 - h / 2;
  node.style.width = `${w}px`;
  node.style.height = `${h}px`;
  node.style.transform = `translate(${left}px, ${top}px)`;
  const src = face && card ? cardImageUrl(card) : cardBackUrl();
  node.innerHTML = `<img src="${src}" alt="">`;
  layer().appendChild(node);
  // force layout
  void node.offsetWidth;
  return node;
}

function flyTo(node, targetRect, { ms = 500, scale = 1, rotate = 0, opacity = 1 } = {}) {
  return new Promise((resolve) => {
    const tw = targetRect.width || 64;
    const th = targetRect.height || 96;
    const left = targetRect.left ?? targetRect.x - tw / 2;
    const top = targetRect.top ?? targetRect.y - th / 2;
    node.style.transition = `transform ${ms}ms cubic-bezier(.22,.8,.3,1), opacity ${ms}ms ease`;
    node.style.transform = `translate(${left}px, ${top}px) scale(${scale}) rotate(${rotate}deg)`;
    node.style.opacity = String(opacity);
    const done = () => {
      node.removeEventListener('transitionend', done);
      resolve();
    };
    node.addEventListener('transitionend', done);
    setTimeout(done, ms + 40);
  });
}

function toast(text, { escoba = false } = {}) {
  const t = document.createElement('div');
  t.className = `fly-toast${escoba ? ' escoba' : ''}`;
  t.textContent = text;
  layer().appendChild(t);
  void t.offsetWidth;
  t.classList.add('show');
  return t;
}

/**
 * Snapshot DOM positions BEFORE applyMove.
 */
export function snapshotAnim(move, { me, game }) {
  const playedCard =
    game.hands[move.player].find((c) => c.id === move.cardId) || null;
  const tableTaken = (move.captureIds || [])
    .map((id) => game.table.find((c) => c.id === id))
    .filter(Boolean);

  let fromPlayed = cardRect(move.cardId);
  if (!fromPlayed) {
    const handSel = move.player === me ? '#myHand' : '#oppHand';
    const hr = areaRect(handSel);
    if (hr) {
      fromPlayed = new DOMRect(
        hr.left + hr.width / 2 - 32,
        hr.top + hr.height / 2 - 48,
        64,
        96
      );
    }
  }

  const fromTable = {};
  for (const c of tableTaken) {
    fromTable[c.id] = cardRect(c.id);
  }

  const felt = areaRect('#felt');
  const pileSel = move.player === me ? '#pileMe' : '#pileOpp';
  const pile = areaRect(pileSel);

  return {
    move,
    playedCard,
    tableTaken,
    fromPlayed,
    fromTable,
    felt,
    pile,
    faceDownStart: move.player !== me,
  };
}

function feltDropSpot(felt, index = 0) {
  if (!felt) {
    return new DOMRect(window.innerWidth / 2 - 32, window.innerHeight / 2 - 48, 64, 96);
  }
  const w = 64;
  const h = 96;
  const cx = felt.left + felt.width / 2 - w / 2 + (index % 3) * 12 - 12;
  const cy = felt.top + felt.height / 2 - h / 2 + Math.floor(index / 3) * 8;
  return new DOMRect(cx, cy, w, h);
}

function pileSpot(pile, felt) {
  if (pile && pile.width > 8) {
    return new DOMRect(
      pile.left + Math.max(0, (pile.width - 48) / 2),
      pile.top + Math.max(0, pile.height - 80),
      48,
      72
    );
  }
  return feltDropSpot(felt);
}

function describeLoot(cards) {
  const oros = cards.filter((c) => c.suit === 'oros').length;
  const sietes = cards.filter((c) => c.rank === 7).length;
  const so = cards.some((c) => c.suit === 'oros' && c.rank === 7);
  const bits = [];
  if (oros) bits.push(`+${oros} oro${oros > 1 ? 's' : ''}`);
  if (sietes) bits.push(`+${sietes} siete${sietes > 1 ? 's' : ''}`);
  if (so) bits.push('★ 7 de oros');
  return bits.join(' · ');
}

/**
 * Play table animation for a move that was JUST applied.
 * type: discard | capture | escoba
 */
export async function playTableAnim(snap, type, { onSfx } = {}) {
  clearLayer();
  layer().classList.add('active');

  const { playedCard, tableTaken, fromPlayed, fromTable, felt, pile, faceDownStart } =
    snap;

  if (type === 'discard') {
    onSfx?.('discard');
    const flyer = makeFlyer(playedCard, fromPlayed, { face: !faceDownStart });
    // If started face-down (rival), flip to face near end
    const dest = feltDropSpot(felt, Math.floor(Math.random() * 3));
    if (faceDownStart && playedCard) {
      await flyTo(flyer, {
        left: (fromPlayed?.left || dest.left) + (dest.left - (fromPlayed?.left || dest.left)) * 0.45,
        top: (fromPlayed?.top || dest.top) + (dest.top - (fromPlayed?.top || dest.top)) * 0.45,
        width: dest.width,
        height: dest.height,
      }, { ms: 220, rotate: -8 });
      flyer.innerHTML = `<img src="${cardImageUrl(playedCard)}" alt="">`;
    }
    await flyTo(flyer, dest, { ms: 480, rotate: faceDownStart ? 6 : -4 });
    const tip = toast('Carta a la mesa');
    await sleep(450);
    tip.classList.remove('show');
    await sleep(120);
    clearLayer();
    return;
  }

  // Capture / escoba
  onSfx?.(type === 'escoba' ? 'escoba' : 'capture');

  // Ghost the table cards in place first
  const tableFlyers = tableTaken.map((c) => {
    const r = fromTable[c.id];
    const f = makeFlyer(c, r, { face: true });
    f.classList.add('flyer-pulse');
    return { card: c, node: f };
  });

  const playedFlyer = makeFlyer(playedCard, fromPlayed, { face: !faceDownStart });

  // Meet at centroid of table cards (or felt center)
  let cx = felt ? felt.left + felt.width / 2 : window.innerWidth / 2;
  let cy = felt ? felt.top + felt.height / 2 : window.innerHeight / 2;
  if (tableTaken.length) {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const c of tableTaken) {
      const r = fromTable[c.id];
      if (r) {
        sx += r.left + r.width / 2;
        sy += r.top + r.height / 2;
        n++;
      }
    }
    if (n) {
      cx = sx / n;
      cy = sy / n;
    }
  }

  if (faceDownStart && playedCard) {
    await flyTo(playedFlyer, {
      left: cx - 32,
      top: cy - 80,
      width: 64,
      height: 96,
    }, { ms: 200, scale: 1.05 });
    playedFlyer.innerHTML = `<img src="${cardImageUrl(playedCard)}" alt="">`;
  }

  // Played card slams into the group
  await flyTo(
    playedFlyer,
    { left: cx - 36, top: cy - 54, width: 72, height: 108 },
    { ms: 420, scale: 1.08, rotate: -6 }
  );

  // Pull table cards into the played card
  await Promise.all(
    tableFlyers.map(({ node }, i) =>
      flyTo(
        node,
        {
          left: cx - 32 + (i - (tableFlyers.length - 1) / 2) * 10,
          top: cy - 48 + i * 4,
          width: 64,
          height: 96,
        },
        { ms: 320 + i * 40, scale: 0.92, rotate: (i - 1) * 4 }
      )
    )
  );

  await sleep(180);

  const lootBits = describeLoot([playedCard, ...tableTaken].filter(Boolean));
  if (type === 'escoba') {
    const feltEl = document.getElementById('felt');
    feltEl?.classList.add('sweep');
    toast('¡ESCOBA!', { escoba: true });
    if (lootBits) toast(lootBits);
  } else if (lootBits) {
    toast(lootBits);
  } else {
    toast('Captura');
  }

  // Bundle flies to pile
  const dest = pileSpot(pile, felt);
  const allNodes = [playedFlyer, ...tableFlyers.map((t) => t.node)];
  await Promise.all(
    allNodes.map((node, i) =>
      flyTo(
        node,
        {
          left: dest.left + i * 2,
          top: dest.top - i * 2,
          width: dest.width,
          height: dest.height,
        },
        { ms: 520, scale: 0.75, rotate: i * 3, opacity: i === allNodes.length - 1 ? 1 : 0.85 }
      )
    )
  );

  await sleep(type === 'escoba' ? 700 : 380);
  document.getElementById('felt')?.classList.remove('sweep');
  clearLayer();
}
