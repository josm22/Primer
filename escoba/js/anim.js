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
  const sz = cssCardSize();
  const w = player === me ? sz.width : sz.width * 0.82;
  const h = player === me ? sz.height : sz.height * 0.82;
  if (!r) {
    return {
      left: window.innerWidth / 2 - w / 2,
      top: player === me ? window.innerHeight - 140 : 80,
      width: w,
      height: h,
    };
  }
  return {
    left: r.left + r.width / 2 - w / 2,
    top: r.top + r.height / 2 - h / 2,
    width: w,
    height: h,
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

function animAborted(isCancelled) {
  return typeof isCancelled === 'function' && !!isCancelled();
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

function softSparks(cx, cy) {
  const layer = ensureLayer();
  const colors = ['#7dffb0', '#f4ebe0', '#efc56a', '#c8f5d8'];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'spark';
    const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.2;
    const dist = 28 + Math.random() * 42;
    const size = 4 + Math.random() * 4;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    layer.appendChild(p);
  }
}

function landRipple(cx, cy) {
  const layer = ensureLayer();
  const ring = document.createElement('div');
  ring.className = 'felt-ripple';
  ring.style.left = `${cx}px`;
  ring.style.top = `${cy}px`;
  layer.appendChild(ring);
  setTimeout(() => ring.remove(), 360);
}

function captureKiss(cx, cy) {
  const layer = ensureLayer();
  const kiss = document.createElement('div');
  kiss.className = 'capture-kiss';
  kiss.style.left = `${cx}px`;
  kiss.style.top = `${cy}px`;
  layer.appendChild(kiss);
  softSparks(cx, cy);
  setTimeout(() => kiss.remove(), 450);
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
  isCancelled,
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
  const deck = selRect('.deck-stack') || felt;
  const cardSz = cssCardSize();
  const origin = {
    left: (deck?.left ?? window.innerWidth / 2) + (deck?.width ?? 0) / 2 - cardSz.width * 0.35,
    top: (deck?.top ?? window.innerHeight / 2) + (deck?.height ?? 0) / 2 - cardSz.height * 0.35,
    width: cardSz.width * 0.7,
    height: cardSz.height * 0.7,
  };

  await preload(cardBackUrl());
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }
  if (!handsOnly) await Promise.all(tableCards.map((c) => preload(cardImageUrl(c))));
  await Promise.all(myCards.map((c) => preload(cardImageUrl(c))));
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }

  onSfx?.('deal');
  toast(handsOnly ? 'Nueva mano' : 'Repartiendo…', { ms: 700 });

  const flyers = [];
  const table = handsOnly ? [] : tableCards;

  // Mesa (cara arriba)
  for (let i = 0; i < table.length; i++) {
    const land = feltLanding(felt, i, cardSz);
    const node = makeFlyer(null, origin, { face: false, z: 1 + i });
    flyers.push(
      (async () => {
        await sleep(70 * i);
        if (animAborted(isCancelled)) return;
        await animateTo(node, land, {
          ms: 420,
          rotate: (i - 1.5) * 3,
          easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
        });
        if (animAborted(isCancelled)) return;
        setFace(node, table[i]);
        await animateTo(node, land, { ms: 120, scale: 1.02 });
      })()
    );
  }

  // Rival (dorso)
  const oppW = cardSz.width * 0.82;
  const oppH = cardSz.height * 0.82;
  for (let i = 0; i < oppCount; i++) {
    const hand = handOrigin(1 - me, me);
    const spread = (i - (oppCount - 1) / 2) * (oppW * 0.38);
    const land = {
      left: hand.left + spread,
      top: hand.top,
      width: oppW,
      height: oppH,
    };
    const node = makeFlyer(null, origin, { face: false, z: 10 + i });
    flyers.push(
      (async () => {
        await sleep(90 + 55 * i);
        if (animAborted(isCancelled)) return;
        await animateTo(node, land, {
          ms: 480,
          rotate: (i - 1) * 4,
          easing: 'cubic-bezier(0.22, 0.8, 0.28, 1)',
        });
      })()
    );
  }

  // Tú (cara arriba)
  for (let i = 0; i < myCards.length; i++) {
    const hand = handOrigin(me, me);
    const mid = (myCards.length - 1) / 2;
    const spread = (i - mid) * (cardSz.width * 0.38);
    const land = {
      left: hand.left + spread,
      top: hand.top,
      width: cardSz.width,
      height: cardSz.height,
    };
    const node = makeFlyer(null, origin, { face: false, z: 20 + i });
    flyers.push(
      (async () => {
        await sleep(140 + 60 * i);
        if (animAborted(isCancelled)) return;
        await animateTo(node, {
          left: land.left,
          top: land.top - 18,
          width: land.width,
          height: land.height,
        }, { ms: 420, rotate: (i - mid) * 5 });
        if (animAborted(isCancelled)) return;
        setFace(node, myCards[i]);
        await animateTo(node, land, {
          ms: 160,
          rotate: (i - mid) * 4,
        });
      })()
    );
  }

  await Promise.all(flyers);
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }
  await sleep(280);
  clearLayer();
}

function feltLanding(felt, index = 0, size = null) {
  const w = size?.width || 72;
  const h = size?.height || 110;
  if (!felt) {
    return {
      left: window.innerWidth / 2 - w / 2,
      top: window.innerHeight / 2 - h / 2,
      width: w,
      height: h,
    };
  }
  // Spread a bit so it looks placed on the cloth
  const ox = ((index % 3) - 1) * (w * 0.38);
  const oy = (Math.floor(index / 3) - 0.5) * (h * 0.14);
  return {
    left: felt.left + felt.width / 2 - w / 2 + ox,
    top: felt.top + felt.height / 2 - h / 2 + oy,
    width: w,
    height: h,
  };
}

function cssCardSize() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const w = parseFloat(cs.getPropertyValue('--card-w')) || 72;
    const h = parseFloat(cs.getPropertyValue('--card-h')) || w * 1.55;
    if (w > 20 && h > 20) return { width: w, height: h };
  } catch (_) {}
  return { width: 72, height: 110 };
}

function cssPileSize() {
  try {
    const el =
      document.querySelector('#pileMe .pile-stack .card.tiny') ||
      document.querySelector('#pileOpp .pile-stack .card.tiny') ||
      document.querySelector('.pile-escobas .card.tiny');
    if (el && el.offsetWidth > 10) {
      return { width: el.offsetWidth, height: el.offsetHeight };
    }
  } catch (_) {}
  const short = typeof window !== 'undefined' && window.innerHeight <= 780;
  return short ? { width: 26, height: 38 } : { width: 28, height: 42 };
}

function pileLanding(pile, felt, meSide, { crossed = false } = {}) {
  const tiny = cssPileSize();
  const w = tiny.width;
  const h = tiny.height;
  const stage =
    selRect(meSide ? '#pileMe .pile-stage' : '#pileOpp .pile-stage') || pile;
  if (stage && stage.width > 10) {
    // Centro del montón (coincide con .pile-stage / escobas cruzadas)
    return {
      left: stage.left + Math.max(0, (stage.width - w) / 2) + (crossed ? -2 : 0),
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

/** Mide el destino real ya pintado en el montón (tras onBeforeClear). */
function measurePileDest(meSide, { crossed = false } = {}) {
  const root = meSide ? '#pileMe' : '#pileOpp';
  if (crossed) {
    const marks = document.querySelectorAll(`${root} .escoba-mark`);
    const el = marks[marks.length - 1];
    if (el) {
      // offset* = caja sin rotar; AABB de getBoundingClientRect está girada
      const w = el.offsetWidth || cssPileSize().width;
      const h = el.offsetHeight || cssPileSize().height;
      const r = el.getBoundingClientRect();
      if (r.width > 4) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return {
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          rotate: 90,
        };
      }
    }
  }
  const cards = document.querySelectorAll(
    `${root} .pile-stack .card.tiny:not(.escoba-mark)`
  );
  const el = cards[cards.length - 1];
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.width > 4) {
      return {
        left: r.left,
        top: r.top,
        width: el.offsetWidth || r.width,
        height: el.offsetHeight || r.height,
        rotate: 0,
      };
    }
  }
  return null;
}

function ghostPile(meSide) {
  const root = meSide ? '#pileMe' : '#pileOpp';
  document
    .querySelectorAll(`${root} .pile-stack .card, ${root} .escoba-mark`)
    .forEach((el) => el.classList.add('ghosting'));
}

function unghostPile(meSide) {
  const root = meSide ? '#pileMe' : '#pileOpp';
  document
    .querySelectorAll(`${root} .ghosting`)
    .forEach((el) => el.classList.remove('ghosting'));
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
    // Índice donde caerá la carta al dejar (antes de aplicar la jugada)
    discardIndex: game.table.length,
    tableRot: ((game.table.length * 17) % 11) - 5,
  };
}

/**
 * Main choreography.
 * discard  → carta ENTRA a la mesa
 * capture  → carta entra al grupo y SALEN juntas al montón
 * escoba   → igual + barrido
 */
export async function playTableAnim(snap, type, { onSfx, onBeforeClear, isCancelled } = {}) {
  if (prefersReducedMotion()) {
    onSfx?.(type === 'escoba' ? 'escoba' : type === 'capture' ? 'capture' : 'discard');
    await sleep(220);
    if (animAborted(isCancelled)) return;
    await onBeforeClear?.();
    return;
  }

  clearLayer();
  const layer = ensureLayer();
  layer.classList.add('active', 'dim-table');

  const {
    move,
    playedCard,
    tableTaken,
    fromPlayed,
    fromTable,
    felt,
    pile,
    isRival,
    meSide,
    discardIndex = 0,
    tableRot = 0,
  } = snap;

  // Preload images so the flight isn't blank
  const urls = [];
  if (playedCard) urls.push(cardImageUrl(playedCard));
  for (const c of tableTaken) urls.push(cardImageUrl(c));
  urls.push(cardBackUrl());
  await Promise.all(urls.map(preload));
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }

  if (type === 'discard') {
    onSfx?.('discard');
    const flyer = makeFlyer(playedCard, fromPlayed, { face: !isRival, z: 5 });
    const cardId = playedCard?.id || move?.cardId;

    // Lift
    await animateTo(flyer, {
      left: fromPlayed.left,
      top: fromPlayed.top - 28,
      width: fromPlayed.width * 1.08,
      height: fromPlayed.height * 1.08,
    }, { ms: 180, scale: 1.06, rotate: isRival ? 8 : -8 });
    if (animAborted(isCancelled)) {
      clearLayer();
      return;
    }

    if (isRival && playedCard) {
      // Flip corto boca arriba antes del arco
      await animateTo(flyer, {
        left: fromPlayed.left,
        top: fromPlayed.top - 36,
        width: fromPlayed.width * 0.12,
        height: fromPlayed.height * 1.04,
      }, { ms: 110, rotate: 12, scale: 1.02 });
      if (animAborted(isCancelled)) {
        clearLayer();
        return;
      }
      setFace(flyer, playedCard);
      await animateTo(flyer, {
        left: fromPlayed.left,
        top: fromPlayed.top - 32,
        width: fromPlayed.width * 1.08,
        height: fromPlayed.height * 1.08,
      }, { ms: 130, rotate: -6, scale: 1.05 });
      if (animAborted(isCancelled)) {
        clearLayer();
        return;
      }
    }

    // Arc toward predicted mesa slot
    const approx = feltLanding(felt, discardIndex);
    await animateTo(
      flyer,
      { ...approx, top: approx.top - 36 },
      { ms: 420, rotate: tableRot * 0.4, easing: 'cubic-bezier(0.18, 0.7, 0.2, 1)' }
    );
    if (animAborted(isCancelled)) {
      clearLayer();
      return;
    }

    // Pinta la carta real (oculta) y aterriza exactamente encima
    await onBeforeClear?.();
    if (animAborted(isCancelled)) {
      clearLayer();
      return;
    }
    const destEl = cardId
      ? document.querySelector(`.card[data-id="${CSS.escape(String(cardId))}"]`)
      : null;
    if (destEl) destEl.classList.add('ghosting');

    let land = approx;
    let rot = tableRot;
    if (destEl) {
      const r = destEl.getBoundingClientRect();
      if (r.width > 4) {
        land = { left: r.left, top: r.top, width: r.width, height: r.height };
        const cssRot = getComputedStyle(destEl).getPropertyValue('--table-rot').trim();
        if (cssRot) rot = parseFloat(cssRot) || 0;
      }
    }

    await animateTo(flyer, land, {
      ms: 260,
      rotate: rot,
      easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
    });
    if (animAborted(isCancelled)) {
      clearLayer();
      destEl?.classList.remove('ghosting');
      return;
    }
    await animateTo(flyer, { ...land, top: land.top + 4 }, { ms: 120, scale: 0.98, rotate: rot });
    await animateTo(flyer, land, { ms: 100, scale: 1, rotate: rot });
    landRipple(land.left + land.width / 2, land.top + land.height / 2);

    toast('A la mesa', { ms: 650 });
    await sleep(160);
    clearLayer();
    destEl?.classList.remove('ghosting');
    return;
  }

  // ----- CAPTURE / ESCOBA: enter then leave -----
  onSfx?.(type === 'escoba' ? 'escoba' : 'capture');
  const cardSz = cssCardSize();

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
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }

  if (isRival && playedCard) setFace(playedFlyer, playedCard);

  // ENTER: fly onto the table cards
  await animateTo(
    playedFlyer,
    {
      left: cx - cardSz.width / 2,
      top: cy - cardSz.height / 2,
      width: cardSz.width,
      height: cardSz.height,
    },
    { ms: 580, rotate: -8, easing: 'cubic-bezier(0.2, 0.75, 0.2, 1)' }
  );
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }

  // Impact: table cards nudge toward the played card
  await Promise.all(
    tableFlyers.map((node, i) => {
      const spread = (i - (tableFlyers.length - 1) / 2) * 14;
      return animateTo(
        node,
        {
          left: cx - cardSz.width / 2 + spread,
          top: cy - cardSz.height / 2 + Math.abs(spread) * 0.2,
          width: cardSz.width,
          height: cardSz.height,
        },
        { ms: 280, rotate: spread * 0.4 }
      );
    })
  );
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }

  await sleep(180);

  const loot = lootText([playedCard, ...tableTaken]);
  if (type === 'escoba') {
    document.getElementById('felt')?.classList.add('sweep');
    burstSparks(cx, cy);
    toast('¡ESCOBA!', { escoba: true, ms: 1100 });
  } else {
    captureKiss(cx, cy);
    toast(loot || 'Captura', { ms: 850 });
  }

  // LEAVE: el mazo se acerca al montón, se pinta el destino y aterriza exacto
  const approx = pileLanding(pile, felt, meSide, { crossed: type === 'escoba' });
  const pack = [playedFlyer, ...tableFlyers];
  await Promise.all(
    pack.map((node, i) =>
      animateTo(
        node,
        {
          left: approx.left + i * 3,
          top: approx.top - 28 - i * 3,
          width: approx.width,
          height: approx.height,
        },
        {
          ms: 520,
          rotate: (i - 1) * 5,
          opacity: i === pack.length - 1 ? 1 : 0.55,
          easing: 'cubic-bezier(0.25, 0.8, 0.2, 1)',
        }
      )
    )
  );
  if (animAborted(isCancelled)) {
    document.getElementById('felt')?.classList.remove('sweep');
    clearLayer();
    return;
  }

  // Apoya solo la carta de encima; el resto se desvanece
  const topFlyer = pack[pack.length - 1];
  await Promise.all(
    pack.slice(0, -1).map((node) =>
      animateTo(
        node,
        {
          left: approx.left,
          top: approx.top - 10,
          width: approx.width * 0.9,
          height: approx.height * 0.9,
        },
        { ms: 160, opacity: 0, scale: 0.92 }
      )
    )
  );

  if (type === 'escoba') {
    setBack(topFlyer);
    await animateTo(
      topFlyer,
      {
        left: approx.left,
        top: approx.top - 12,
        width: approx.width,
        height: approx.height,
      },
      {
        ms: 300,
        rotate: 90,
        scale: 1.04,
        easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
      }
    );
  }

  document.getElementById('felt')?.classList.remove('sweep');
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }
  await onBeforeClear?.();
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }
  ghostPile(meSide);

  const exact = measurePileDest(meSide, { crossed: type === 'escoba' }) || {
    ...approx,
    top: approx.top,
    rotate: type === 'escoba' ? 90 : 0,
  };
  await animateTo(
    topFlyer,
    {
      left: exact.left,
      top: exact.top,
      width: exact.width,
      height: exact.height,
    },
    {
      ms: 240,
      rotate: exact.rotate ?? (type === 'escoba' ? 90 : 0),
      scale: 1,
      easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
    }
  );
  if (animAborted(isCancelled)) {
    clearLayer();
    unghostPile(meSide);
    return;
  }
  await sleep(180);
  clearLayer();
  unghostPile(meSide);
}

/**
 * Fin de ronda: cartas que quedaban en la mesa van al montón del último
 * que capturó (o se retiran si nadie capturó).
 */
export async function playLeftoverSweep(leftovers, { me, onSfx, whoName, onBeforeClear, isCancelled } = {}) {
  if (!leftovers?.cards?.length) return;
  if (prefersReducedMotion()) {
    onSfx?.('discard');
    await sleep(160);
    if (animAborted(isCancelled)) return;
    await onBeforeClear?.();
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
  if (animAborted(isCancelled)) {
    clearLayer();
    return;
  }

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
    if (animAborted(isCancelled)) {
      clearLayer();
      return;
    }
    await onBeforeClear?.();
  } else {
    const n = leftovers.cards.length;
    toast(
      `${n} carta${n > 1 ? 's' : ''} → ${whoName || 'montón'}`,
      { ms: 900 }
    );
    const approx = pileLanding(pile, felt, meSide);
    await Promise.all(
      flyers.map((node, i) =>
        animateTo(
          node,
          {
            left: approx.left + i * 3,
            top: approx.top - 24 - i * 3,
            width: approx.width,
            height: approx.height,
          },
          { ms: 500, rotate: (i - 1) * 4, easing: 'cubic-bezier(0.25, 0.8, 0.2, 1)' }
        )
      )
    );
    if (animAborted(isCancelled)) {
      clearLayer();
      return;
    }
    // Solo la de encima aterriza; el resto se funde
    await Promise.all(
      flyers.slice(0, -1).map((node) =>
        animateTo(node, { ...approx, top: approx.top - 8 }, { ms: 140, opacity: 0 })
      )
    );
    await onBeforeClear?.();
    if (animAborted(isCancelled)) {
      clearLayer();
      return;
    }
    ghostPile(meSide);
    const exact = measurePileDest(meSide) || approx;
    const top = flyers[flyers.length - 1];
    await animateTo(
      top,
      { left: exact.left, top: exact.top, width: exact.width, height: exact.height },
      { ms: 220, rotate: exact.rotate || 0, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' }
    );
    if (animAborted(isCancelled)) {
      clearLayer();
      unghostPile(meSide);
      return;
    }
    await sleep(200);
    clearLayer();
    unghostPile(meSide);
    return;
  }

  await sleep(200);
  clearLayer();
}
