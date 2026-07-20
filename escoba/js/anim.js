/**
 * Animaciones de mesa: cartas que ENTREN (dejar) y SALGAN (capturar).
 * Usa Web Animations API para que se vea bien en iPhone.
 */

import { cardImageUrl, cardBackUrl } from './cards-ui.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {
    return false;
  }
}

function ensureLayer() {
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
  const el = ensureLayer();
  el.innerHTML = '';
  el.classList.remove('active', 'dim-table');
}

/** Limpia flyers al salir de la partida. */
export function clearFlyLayer() {
  clearLayer();
}

function cardElRect(id) {
  try {
    const el = document.querySelector(`.card[data-id="${CSS.escape(String(id))}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    return r;
  } catch (_) {
    return null;
  }
}

function selRect(sel) {
  const el = document.querySelector(sel);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function copyRect(r, w, h) {
  const width = w ?? r.width;
  const height = h ?? r.height;
  return {
    left: r.left + (r.width - width) / 2,
    top: r.top + (r.height - height) / 2,
    width,
    height,
  };
}

function handOrigin(player, me) {
  const sel = player === me ? '#myHand' : '#oppHand';
  const r = selRect(sel);
  if (!r) {
    return {
      left: window.innerWidth / 2 - 36,
      top: player === me ? window.innerHeight - 140 : 80,
      width: 72,
      height: 110,
    };
  }
  return {
    left: r.left + r.width / 2 - 36,
    top: r.top + r.height / 2 - 55,
    width: 72,
    height: 110,
  };
}

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function makeFlyer(card, rect, { face = true, z = 1 } = {}) {
  const layer = ensureLayer();
  layer.classList.add('active');
  const node = document.createElement('div');
  node.className = 'flyer';
  const width = rect?.width || 72;
  const height = rect?.height || 110;
  const left = rect?.left ?? window.innerWidth / 2 - width / 2;
  const top = rect?.top ?? window.innerHeight / 2 - height / 2;
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
  node.style.zIndex = String(20 + z);
  node.style.transform = 'translate(0,0) scale(1) rotate(0deg)';
  node.style.opacity = '1';
  const src = face && card ? cardImageUrl(card) : cardBackUrl();
  node.innerHTML = `<img src="${src}" alt="" draggable="false">`;
  layer.appendChild(node);
  return node;
}

function setFace(node, card) {
  if (!card) return;
  node.innerHTML = `<img src="${cardImageUrl(card)}" alt="" draggable="false">`;
}

function setBack(node) {
  node.innerHTML = `<img src="${cardBackUrl()}" alt="" draggable="false">`;
}

/**
 * Animate flyer from current left/top to target box.
 */
function animateTo(node, to, opts = {}) {
  const {
    ms = 550,
    scale = 1,
    rotate = 0,
    opacity = 1,
    easing = 'cubic-bezier(0.22, 0.8, 0.28, 1)',
  } = opts;

  const fromLeft = parseFloat(node.style.left) || 0;
  const fromTop = parseFloat(node.style.top) || 0;
  const fromW = parseFloat(node.style.width) || 72;
  const fromH = parseFloat(node.style.height) || 110;

  const toLeft = to.left;
  const toTop = to.top;
  const toW = to.width ?? fromW;
  const toH = to.height ?? fromH;

  // Prefer WAAPI; fallback CSS
  if (typeof node.animate === 'function') {
    const anim = node.animate(
      [
        {
          left: `${fromLeft}px`,
          top: `${fromTop}px`,
          width: `${fromW}px`,
          height: `${fromH}px`,
          transform: 'translate(0,0) scale(1) rotate(0deg)',
          opacity: 1,
        },
        {
          left: `${toLeft}px`,
          top: `${toTop}px`,
          width: `${toW}px`,
          height: `${toH}px`,
          transform: `translate(0,0) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
        },
      ],
      { duration: ms, easing, fill: 'forwards' }
    );
    return anim.finished.then(() => {
      node.style.left = `${toLeft}px`;
      node.style.top = `${toTop}px`;
      node.style.width = `${toW}px`;
      node.style.height = `${toH}px`;
      node.style.transform = `translate(0,0) scale(${scale}) rotate(${rotate}deg)`;
      node.style.opacity = String(opacity);
    }).catch(() => {});
  }

  return new Promise((resolve) => {
    node.style.transition = `left ${ms}ms ${easing}, top ${ms}ms ${easing}, width ${ms}ms ${easing}, height ${ms}ms ${easing}, transform ${ms}ms ${easing}, opacity ${ms}ms ease`;
    requestAnimationFrame(() => {
      node.style.left = `${toLeft}px`;
      node.style.top = `${toTop}px`;
      node.style.width = `${toW}px`;
      node.style.height = `${toH}px`;
      node.style.transform = `translate(0,0) scale(${scale}) rotate(${rotate}deg)`;
      node.style.opacity = String(opacity);
    });
    setTimeout(resolve, ms + 30);
  });
}

function toast(text, { escoba = false, ms = 900 } = {}) {
  const t = document.createElement('div');
  t.className = `fly-toast${escoba ? ' escoba' : ''}`;
  t.textContent = text;
  ensureLayer().appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), ms);
  return t;
}

function burstSparks(cx, cy) {
  const layer = ensureLayer();
  const colors = ['#efc56a', '#7dffb0', '#f4ebe0', '#e0b34d', '#fff6d6'];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'spark';
    const ang = (Math.PI * 2 * i) / 22 + Math.random() * 0.3;
    const dist = 48 + Math.random() * 90;
    const size = 5 + Math.random() * 7;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.08}s`;
    layer.appendChild(p);
  }
}

/**
 * Reparto: cartas salen del mazo hacia mesa y manos.
 */
export async function playDealAnim({
  tableCards = [],
  myCards = [],
  oppCount = 0,
  me = 0,
  onSfx,
  handsOnly = false,
} = {}) {
  if (prefersReducedMotion()) {
    onSfx?.('deal');
    await sleep(180);
    return;
  }

  clearLayer();
  const layer = ensureLayer();
  layer.classList.add('active');

  const felt = selRect('#felt');
  const deck = selRect('.deck-stack') || selRect('.deck-badge') || felt;
  const origin = {
    left: (deck?.left ?? window.innerWidth / 2) + (deck?.width ?? 0) / 2 - 24,
    top: (deck?.top ?? window.innerHeight / 2) + (deck?.height ?? 0) / 2 - 36,
    width: 48,
    height: 74,
  };

  await preload(cardBackUrl());
  if (!handsOnly) await Promise.all(tableCards.map((c) => preload(cardImageUrl(c))));
  await Promise.all(myCards.map((c) => preload(cardImageUrl(c))));

  onSfx?.('deal');
  toast(handsOnly ? 'Nueva mano' : 'Repartiendo…', { ms: 700 });

  const flyers = [];
  const table = handsOnly ? [] : tableCards;

  // Mesa (cara arriba)
  for (let i = 0; i < table.length; i++) {
    const land = feltLanding(felt, i);
    const node = makeFlyer(null, origin, { face: false, z: 1 + i });
    flyers.push(
      (async () => {
        await sleep(70 * i);
        await animateTo(node, { ...land, width: 72, height: 110 }, {
          ms: 420,
          rotate: (i - 1.5) * 3,
          easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
        });
        setFace(node, table[i]);
        await animateTo(node, land, { ms: 120, scale: 1.02 });
      })()
    );
  }

  // Rival (dorso)
  for (let i = 0; i < oppCount; i++) {
    const hand = handOrigin(1 - me, me);
    const spread = (i - (oppCount - 1) / 2) * 22;
    const land = {
      left: hand.left + spread,
      top: hand.top,
      width: 56,
      height: 86,
    };
    const node = makeFlyer(null, origin, { face: false, z: 10 + i });
    flyers.push(
      (async () => {
        await sleep(90 + 55 * i);
        await animateTo(node, land, {
          ms: 480,
          rotate: 180 + (i - 1) * 4,
          easing: 'cubic-bezier(0.22, 0.8, 0.28, 1)',
        });
      })()
    );
  }

  // Tú (cara arriba)
  for (let i = 0; i < myCards.length; i++) {
    const hand = handOrigin(me, me);
    const mid = (myCards.length - 1) / 2;
    const spread = (i - mid) * 26;
    const land = {
      left: hand.left + spread,
      top: hand.top,
      width: 68,
      height: 104,
    };
    const node = makeFlyer(null, origin, { face: false, z: 20 + i });
    flyers.push(
      (async () => {
        await sleep(140 + 60 * i);
        await animateTo(node, {
          left: land.left,
          top: land.top - 18,
          width: land.width,
          height: land.height,
        }, { ms: 420, rotate: (i - mid) * 5 });
        setFace(node, myCards[i]);
        await animateTo(node, land, {
          ms: 160,
          rotate: (i - mid) * 4,
        });
      })()
    );
  }

  await Promise.all(flyers);
  await sleep(280);
  clearLayer();
}

function feltLanding(felt, index = 0) {
  const w = 72;
  const h = 110;
  if (!felt) {
    return {
      left: window.innerWidth / 2 - w / 2,
      top: window.innerHeight / 2 - h / 2,
      width: w,
      height: h,
    };
  }
  // Spread a bit so it looks placed on the cloth
  const ox = ((index % 3) - 1) * 28;
  const oy = (Math.floor(index / 3) - 0.5) * 16;
  return {
    left: felt.left + felt.width / 2 - w / 2 + ox,
    top: felt.top + felt.height / 2 - h / 2 + oy,
    width: w,
    height: h,
  };
}

function pileLanding(pile, felt, meSide, { crossed = false } = {}) {
  const w = crossed ? 48 : 52;
  const h = crossed ? 72 : 80;
  const stage =
    selRect(meSide ? '#pileMe .pile-stage' : '#pileOpp .pile-stage') || pile;
  if (stage && stage.width > 10) {
    // Centro del montón (coincide con .pile-stage / escobas cruzadas)
    return {
      left: stage.left + Math.max(0, (stage.width - w) / 2) + (crossed ? -6 : 0),
      top:
        stage.top +
        (crossed
          ? Math.max(0, (stage.height - h) / 2) + 4
          : Math.max(0, stage.height - h)),
      width: w,
      height: h,
    };
  }
  // Fallback: off toward player
  const f = felt || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  return {
    left: f.left + f.width / 2 - w / 2,
    top: meSide ? f.bottom - 20 : f.top - 40,
    width: w,
    height: h,
  };
}

function lootText(cards) {
  const list = cards.filter(Boolean);
  const oros = list.filter((c) => c.suit === 'oros').length;
  const sietes = list.filter((c) => c.rank === 7).length;
  const so = list.some((c) => c.suit === 'oros' && c.rank === 7);
  const bits = [];
  if (oros) bits.push(`+${oros} oro${oros > 1 ? 's' : ''}`);
  if (sietes) bits.push(`+${sietes} siete${sietes > 1 ? 's' : ''}`);
  if (so) bits.push('★ 7 de oros');
  return bits.join(' · ');
}

/** Snapshot BEFORE applying the move (DOM still has the cards). */
export function snapshotAnim(move, { me, game }) {
  const playedCard =
    game.hands[move.player]?.find((c) => c.id === move.cardId) || null;
  const tableTaken = (move.captureIds || [])
    .map((id) => game.table.find((c) => c.id === id))
    .filter(Boolean);

  let fromPlayed = cardElRect(move.cardId);
  if (!fromPlayed) fromPlayed = handOrigin(move.player, me);

  const fromTable = {};
  for (const c of tableTaken) {
    fromTable[c.id] = cardElRect(c.id) || feltLanding(selRect('#felt'));
  }

  return {
    move,
    playedCard,
    tableTaken,
    fromPlayed: copyRect(fromPlayed),
    fromTable,
    felt: selRect('#felt'),
    pile: selRect(move.player === me ? '#pileMe' : '#pileOpp'),
    isRival: move.player !== me,
    meSide: move.player === me,
  };
}

/**
 * Main choreography.
 * discard  → carta ENTRA a la mesa
 * capture  → carta entra al grupo y SALEN juntas al montón
 * escoba   → igual + barrido
 */
export async function playTableAnim(snap, type, { onSfx, onBeforeClear } = {}) {
  if (prefersReducedMotion()) {
    onSfx?.(type === 'escoba' ? 'escoba' : type === 'capture' ? 'capture' : 'discard');
    await sleep(220);
    await onBeforeClear?.();
    return;
  }

  clearLayer();
  const layer = ensureLayer();
  layer.classList.add('active', 'dim-table');

  const {
    playedCard,
    tableTaken,
    fromPlayed,
    fromTable,
    felt,
    pile,
    isRival,
    meSide,
  } = snap;

  // Preload images so the flight isn't blank
  const urls = [];
  if (playedCard) urls.push(cardImageUrl(playedCard));
  for (const c of tableTaken) urls.push(cardImageUrl(c));
  urls.push(cardBackUrl());
  await Promise.all(urls.map(preload));

  if (type === 'discard') {
    onSfx?.('discard');
    const flyer = makeFlyer(playedCard, fromPlayed, { face: !isRival, z: 5 });

    // Lift
    await animateTo(flyer, {
      left: fromPlayed.left,
      top: fromPlayed.top - 28,
      width: fromPlayed.width * 1.08,
      height: fromPlayed.height * 1.08,
    }, { ms: 180, scale: 1.06, rotate: isRival ? 8 : -8 });

    if (isRival && playedCard) setFace(flyer, playedCard);

    // Arc into the felt (ENTER)
    const land = feltLanding(felt, Math.floor(Math.random() * 3));
    await animateTo(flyer, land, { ms: 650, rotate: isRival ? 4 : -3, easing: 'cubic-bezier(0.18, 0.7, 0.2, 1)' });

    // Soft settle bounce
    await animateTo(flyer, { ...land, top: land.top + 6 }, { ms: 140, scale: 0.98 });
    await animateTo(flyer, land, { ms: 120, scale: 1 });

    toast('A la mesa', { ms: 650 });
    await sleep(220);
    await onBeforeClear?.();
    clearLayer();
    return;
  }

  // ----- CAPTURE / ESCOBA: enter then leave -----
  onSfx?.(type === 'escoba' ? 'escoba' : 'capture');

  // Table cards stay put as flyers (will LEAVE later)
  const tableFlyers = tableTaken.map((c, i) => {
    const r = fromTable[c.id] || feltLanding(felt, i);
    return makeFlyer(c, copyRect(r), { face: true, z: 2 + i });
  });

  // Played card starts in hand
  const playedFlyer = makeFlyer(playedCard, fromPlayed, {
    face: !isRival,
    z: 10,
  });

  // Target: center of the group being captured
  let cx = felt ? felt.left + felt.width / 2 : window.innerWidth / 2;
  let cy = felt ? felt.top + felt.height / 2 : window.innerHeight / 2;
  if (tableTaken.length) {
    let sx = 0;
    let sy = 0;
    let n = 0;
    tableTaken.forEach((c) => {
      const r = fromTable[c.id];
      if (!r) return;
      sx += r.left + r.width / 2;
      sy += r.top + r.height / 2;
      n++;
    });
    if (n) {
      cx = sx / n;
      cy = sy / n;
    }
  }

  // Lift from hand
  await animateTo(playedFlyer, {
    left: fromPlayed.left,
    top: fromPlayed.top - 24,
    width: fromPlayed.width * 1.1,
    height: fromPlayed.height * 1.1,
  }, { ms: 160, rotate: -10 });

  if (isRival && playedCard) setFace(playedFlyer, playedCard);

  // ENTER: fly onto the table cards
  await animateTo(
    playedFlyer,
    { left: cx - 40, top: cy - 60, width: 80, height: 122 },
    { ms: 580, rotate: -8, easing: 'cubic-bezier(0.2, 0.75, 0.2, 1)' }
  );

  // Impact: table cards nudge toward the played card
  await Promise.all(
    tableFlyers.map((node, i) => {
      const spread = (i - (tableFlyers.length - 1) / 2) * 14;
      return animateTo(
        node,
        {
          left: cx - 36 + spread,
          top: cy - 55 + Math.abs(spread) * 0.2,
          width: 72,
          height: 110,
        },
        { ms: 280, rotate: spread * 0.4 }
      );
    })
  );

  await sleep(180);

  const loot = lootText([playedCard, ...tableTaken]);
  if (type === 'escoba') {
    document.getElementById('felt')?.classList.add('sweep');
    burstSparks(cx, cy);
    toast('¡ESCOBA!', { escoba: true, ms: 1100 });
  } else {
    toast(loot || 'Captura', { ms: 850 });
  }

  // LEAVE: whole stack flies off the table into the capture pile
  const dest = pileLanding(pile, felt, meSide, { crossed: type === 'escoba' });
  const pack = [playedFlyer, ...tableFlyers];
  await Promise.all(
    pack.map((node, i) =>
      animateTo(
        node,
        {
          left: dest.left + i * 3,
          top: dest.top - i * 3,
          width: dest.width,
          height: dest.height,
        },
        {
          ms: 620,
          rotate: (i - 1) * 5,
          opacity: i === pack.length - 1 ? 1 : 0.7,
          easing: 'cubic-bezier(0.25, 0.8, 0.2, 1)',
        }
      )
    )
  );

  // Escoba: la última carta se gira boca abajo y se cruza (90°)
  if (type === 'escoba') {
    const marker = pack[pack.length - 1];
    setBack(marker);
    await animateTo(
      marker,
      {
        left: dest.left,
        top: dest.top,
        width: dest.width,
        height: dest.height,
      },
      {
        ms: 380,
        rotate: 90,
        scale: 1.04,
        easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
      }
    );
    await sleep(280);
  } else {
    await sleep(320);
  }

  document.getElementById('felt')?.classList.remove('sweep');
  await onBeforeClear?.();
  clearLayer();
}

/**
 * Fin de ronda: cartas que quedaban en la mesa van al montón del último
 * que capturó (o se retiran si nadie capturó).
 */
export async function playLeftoverSweep(leftovers, { me, onSfx, whoName } = {}) {
  if (!leftovers?.cards?.length) return;
  if (prefersReducedMotion()) {
    onSfx?.('discard');
    await sleep(160);
    return;
  }

  clearLayer();
  const layer = ensureLayer();
  layer.classList.add('active', 'dim-table');
  const felt = selRect('#felt');
  const toPlayer = leftovers.player;
  const meSide = toPlayer === me;
  const pile = toPlayer == null ? null : selRect(meSide ? '#pileMe' : '#pileOpp');

  await Promise.all(leftovers.cards.map((c) => preload(cardImageUrl(c))));

  const flyers = leftovers.cards.map((c, i) => {
    const r = cardElRect(c.id) || feltLanding(felt, i);
    return makeFlyer(c, copyRect(r), { face: true, z: 2 + i });
  });

  // Ghost underlying DOM cards
  for (const c of leftovers.cards) {
    document
      .querySelector(`.card[data-id="${CSS.escape(c.id)}"]`)
      ?.classList.add('ghosting');
  }

  onSfx?.('discard');
  if (toPlayer == null) {
    toast('Sin baza', { ms: 800 });
    await Promise.all(
      flyers.map((node, i) =>
        animateTo(
          node,
          {
            left: (felt?.left ?? 0) + (felt?.width ?? window.innerWidth) / 2 - 20,
            top: (felt?.top ?? 0) - 40,
            width: 40,
            height: 60,
          },
          { ms: 480, opacity: 0, rotate: (i - 1) * 8 }
        )
      )
    );
  } else {
    const n = leftovers.cards.length;
    toast(
      `${n} carta${n > 1 ? 's' : ''} → ${whoName || 'montón'}`,
      { ms: 900 }
    );
    const dest = pileLanding(pile, felt, meSide);
    await Promise.all(
      flyers.map((node, i) =>
        animateTo(
          node,
          {
            left: dest.left + i * 3,
            top: dest.top - i * 3,
            width: dest.width,
            height: dest.height,
          },
          { ms: 580, rotate: (i - 1) * 4, easing: 'cubic-bezier(0.25, 0.8, 0.2, 1)' }
        )
      )
    );
  }

  await sleep(280);
  clearLayer();
}
