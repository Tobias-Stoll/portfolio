/**
 * Project card rail: paddles, video on hover, and the project dialog.
 * A card button with data-project="<template id>" opens #pm with that template's content.
 * The card morphs into the dialog (stand-in box + travelling image, Web Animations), else the dialog fades in.
 */
(() => {
  const rails = [...document.querySelectorAll('.prail')];
  if (!rails.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // paddles per rail: one card per click, disabled at the ends, hidden when everything fits
  rails.forEach((rail) => {
    const group = rail.closest('.prail-group');
    const box = group && group.querySelector('.prail__paddles');
    const paddles = box ? [...box.querySelectorAll('.prail__paddle')] : [];
    const step = () => { const li = rail.querySelector('li'); return li ? li.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 20) : 400; };
    paddles.forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: step() * Number(b.dataset.dir), behavior: reduced ? 'auto' : 'smooth' })));
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      if (box) box.hidden = max <= 0;
      paddles.forEach((b) => { b.disabled = Number(b.dataset.dir) < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; });
    };
    rail.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  });
  // the Ride Recap story plays while you point at its card (user-started, so no extra pause control needed)
  document.querySelectorAll('.prail .pcard video').forEach((v) => {
    const card = v.closest('.pcard');
    const play = () => { if (!reduced) { v.preload = 'auto'; v.play().catch(() => {}); } };
    const stop = () => v.pause();
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') play(); });
    card.addEventListener('pointerleave', stop);
    card.addEventListener('focus', play);
    card.addEventListener('blur', stop);
  });

  // project dialog
  const dlg = document.getElementById('pm');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const body = dlg.querySelector('.pm__body');
  let opener = null;

  // own scrollbar inside the box: track + pill, like the case dots; the pill can be dragged
  const track = dlg.querySelector('.pm__bar'), thumb = dlg.querySelector('.pm__thumb');
  function bar() {
    const max = body.scrollHeight - body.clientHeight;
    dlg.classList.toggle('has-scroll', max > 1);
    if (max <= 1) return;
    const th = track.clientHeight, h = Math.max(30, th * body.clientHeight / body.scrollHeight);
    thumb.style.setProperty('--thumb-h', h + 'px');
    thumb.style.setProperty('--thumb-y', ((th - h) * body.scrollTop / max) + 'px');
  }
  body.addEventListener('scroll', bar, { passive: true });
  addEventListener('resize', () => { if (dlg.open) bar(); });
  new ResizeObserver(() => { if (dlg.open) bar(); }).observe(body);
  body.addEventListener('load', bar, true);   // images arriving change the height
  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault(); thumb.setPointerCapture(e.pointerId); track.classList.add('is-drag');
    const y0 = e.clientY, s0 = body.scrollTop;
    const move = (ev) => {
      const th = track.clientHeight - thumb.offsetHeight, max = body.scrollHeight - body.clientHeight;
      body.scrollTop = s0 + (ev.clientY - y0) * (th > 0 ? max / th : 0);
    };
    const up = () => { track.classList.remove('is-drag'); thumb.removeEventListener('pointermove', move); thumb.removeEventListener('pointerup', up); thumb.removeEventListener('pointercancel', up); };
    thumb.addEventListener('pointermove', move); thumb.addEventListener('pointerup', up); thumb.addEventListener('pointercancel', up);
  });

  /* Card to dialog morph (container transform, like the App Store cards):
     a stand-in box grows from the card to the dialog while the card image glides to the first visual,
     the card's text fades out early, the dialog's text fades in once the box has landed. Closing runs it backwards. */
  const DUR = 560, EASE = 'cubic-bezier(.32, .72, 0, 1)';
  let busy = false;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const box = (r) => ({ left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  const rel = (r, o) => ({ x: r.x - o.x, y: r.y - o.y, w: r.w, h: r.h });

  function stage(card) {   // the stand-in: card background, a copy of the card (text) and a copy of the image
    const cs = getComputedStyle(card);
    const m = document.createElement('div'); m.className = 'pm-morph'; m.setAttribute('aria-hidden', 'true');
    const face = card.cloneNode(true); face.className += ' pm-morph__face'; face.removeAttribute('data-project'); face.tabIndex = -1;
    face.querySelectorAll('.pcard__frame img').forEach((i) => { i.style.visibility = 'hidden'; });
    const img = document.createElement('img'); img.className = 'pm-morph__img';
    const src = card.querySelector('.pcard__frame img'); img.src = src.currentSrc || src.src; img.alt = '';
    m.append(face, img);
    return { m, face, img, bg: cs.backgroundColor, cardR: rect(card), srcR: rect(src) };
  }

  function run(st, fromBox, toBox, fromImg, toImg, fromBg, toBg, fromRad, toRad, faceIn) {
    const o = { duration: DUR, easing: EASE, fill: 'both' };
    const a1 = st.m.animate([{ ...box(fromBox), backgroundColor: fromBg, borderRadius: fromRad }, { ...box(toBox), backgroundColor: toBg, borderRadius: toRad }], o);
    st.img.animate([{ ...box(fromImg), borderRadius: faceIn ? '12px' : '7px 7px 0 0' }, { ...box(toImg), borderRadius: faceIn ? '7px 7px 0 0' : '12px' }], o);
    st.face.animate(faceIn ? [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: .3 }, { opacity: 0 }], { duration: DUR, easing: 'linear', fill: 'both' });
    return a1.finished;
  }

  function fill(card) {
    body.replaceChildren(document.getElementById(card.dataset.project).content.cloneNode(true));
    body.querySelector('.pm__title')?.setAttribute('id', 'pm-title');
  }
  function show() {
    document.documentElement.classList.add('pm-lock');
    dlg.showModal();
    dlg.append(...document.querySelectorAll('body > .cursor, body > .cursor__label'));   // the custom cursor would sit under the top layer
    document.querySelector('.cursor__label')?.classList.remove('is-on');
    body.scrollTop = 0; bar();
    body.focus({ preventScroll: true });   // arrow keys and space scroll the content; Tab reaches the close button
  }

  async function open(card) {
    if (busy || !document.getElementById(card.dataset.project)) return;
    opener = card; fill(card);
    const hero = body.querySelector('.pm__fig--hero img');
    if (reduced || !hero || !card.querySelector('.pcard__frame img') || !dlg.animate) { dlg.classList.add('is-fade'); show(); return; }
    busy = true;
    const st = stage(card);
    dlg.classList.remove('is-fade'); dlg.classList.add('is-morphing');
    show();
    dlg.append(st.m);
    const dR = rect(dlg), hR = rect(hero);
    card.style.visibility = 'hidden';
    requestAnimationFrame(() => dlg.classList.add('is-dim'));
    st.face.style.width = st.cardR.w + 'px'; st.face.style.height = st.cardR.h + 'px';
    await run(st, st.cardR, dR, rel(st.srcR, st.cardR), rel(hR, dR), st.bg, getComputedStyle(dlg).backgroundColor, '18px', getComputedStyle(dlg).borderRadius, false);
    dlg.classList.remove('is-morphing'); dlg.classList.add('is-enter');
    st.m.remove();
    setTimeout(() => dlg.classList.remove('is-enter'), 420);
    busy = false;
  }

  async function close() {
    if (!dlg.open || busy) return;
    const card = opener, hero = body.querySelector('.pm__fig--hero img');
    if (reduced || !card || !hero || !dlg.animate || dlg.classList.contains('is-fade')) { dlg.classList.remove('is-dim'); dlg.close(); return; }
    busy = true;
    card.style.visibility = '';
    const st = stage(card);
    card.style.visibility = 'hidden';
    const dR = rect(dlg), hR = rect(hero);
    st.face.style.width = st.cardR.w + 'px'; st.face.style.height = st.cardR.h + 'px';
    dlg.append(st.m);
    dlg.classList.add('is-leaving');   // the dialog's own content fades out fast
    await new Promise((r) => setTimeout(r, 120));
    dlg.classList.add('is-morphing'); dlg.classList.remove('is-dim', 'is-leaving');
    await run(st, dR, st.cardR, rel(hR, dR), rel(st.srcR, st.cardR), getComputedStyle(dlg).backgroundColor, st.bg, getComputedStyle(dlg).borderRadius, '18px', true);
    card.style.visibility = '';
    dlg.close();
    dlg.classList.remove('is-morphing');
    st.m.remove();
    busy = false;
  }

  document.querySelectorAll('.prail button.pcard[data-project]').forEach((c) => c.addEventListener('click', () => open(c)));
  dlg.querySelector('.pm__close').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });   // click on the backdrop
  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('pm-lock');
    document.body.append(...dlg.querySelectorAll('.cursor, .cursor__label'));
    if (opener) opener.focus({ preventScroll: true });
  });
})();
