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

  /* Card to dialog morph (container transform, like the App Store cards).
     A stand-in box grows from the card to the dialog. Inside it: the card face (fades out), a copy of the dialog
     content anchored top left (text and visuals fade in while the box grows, no slide), and the card image,
     which glides to the first visual. Closing is the same timeline mirrored. */
  const T = { dur: 820, ease: 'cubic-bezier(.25, .9, .3, 1)' };
  let busy = false;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const box = (r) => ({ left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  const rel = (r, o) => ({ x: r.x - o.x, y: r.y - o.y, w: r.w, h: r.h });
  // opacity keyframes for "fade in between a and b" on the opening timeline; mirrored when closing
  const fade = (a, b, back) => back
    ? [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 1 - b }, { opacity: 0, offset: 1 - a }, { opacity: 0, offset: 1 }]
    : [{ opacity: 0, offset: 0 }, { opacity: 0, offset: a }, { opacity: 1, offset: b }, { opacity: 1, offset: 1 }];

  function morph(card, back) {
    const hero = body.querySelector('.pm__fig--hero img');
    const src = card.querySelector('.pcard__frame img');
    const wasHidden = card.style.visibility; card.style.visibility = '';
    const cardR = rect(card), srcR = rect(src);
    card.style.visibility = 'hidden';
    const dR = rect(dlg), hR = rect(hero);
    const dBg = getComputedStyle(dlg).backgroundColor, dRad = getComputedStyle(dlg).borderRadius;
    const cBg = getComputedStyle(card).backgroundColor;

    const m = document.createElement('div'); m.className = 'pm-morph'; m.setAttribute('aria-hidden', 'true');
    const face = card.cloneNode(true); face.className += ' pm-morph__face'; face.removeAttribute('data-project');
    face.style.width = cardR.w + 'px'; face.style.height = cardR.h + 'px';
    face.querySelectorAll('.pcard__frame img').forEach((i) => { i.style.visibility = 'hidden'; });
    const content = document.createElement('div'); content.className = 'pm-morph__content';
    content.style.width = dR.w + 'px'; content.style.top = -body.scrollTop + 'px';
    const copy = body.cloneNode(true); copy.removeAttribute('tabindex'); copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    copy.querySelector('.pm__fig--hero img').style.visibility = 'hidden';
    const xBtn = dlg.querySelector('.pm__close').cloneNode(true); xBtn.tabIndex = -1;
    content.append(copy, xBtn);
    const img = document.createElement('img'); img.className = 'pm-morph__img'; img.src = src.currentSrc || src.src; img.alt = '';
    m.append(face, content, img);
    dlg.append(m);
    dlg.classList.add('is-morphing');

    const o = { duration: T.dur, easing: T.ease, fill: 'both' }, lin = { duration: T.dur, easing: 'linear', fill: 'both' };
    const A = back ? dR : cardR, B = back ? cardR : dR;
    const iA = back ? rel(hR, dR) : rel(srcR, cardR), iB = back ? rel(srcR, cardR) : rel(hR, dR);
    const run = m.animate([{ ...box(A), borderRadius: back ? dRad : '18px' }, { ...box(B), borderRadius: back ? '18px' : dRad }], o);
    m.animate(back ? [{ backgroundColor: dBg }, { backgroundColor: dBg, offset: .8 }, { backgroundColor: cBg }] : [{ backgroundColor: cBg }, { backgroundColor: dBg, offset: .2 }, { backgroundColor: dBg }], lin);
    img.animate([{ ...box(iA), borderRadius: back ? '12px' : '7px 7px 0 0' }, { ...box(iB), borderRadius: back ? '7px 7px 0 0' : '12px' }], o);
    face.animate(back ? [{ opacity: 0 }, { opacity: 0, offset: .78 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: .22 }, { opacity: 0 }], lin);
    // dialog content: text first, then caption and close, then the other visuals one after another
    const parts = [
      [copy.querySelectorAll('.pm__eyebrow, .pm__title'), .12, .5],
      [copy.querySelectorAll('.pm__lead'), .18, .58],
      [copy.querySelectorAll('.pm__fig--hero figcaption'), .3, .7],
      [[xBtn], .3, .7],
      ...[...copy.querySelectorAll('.pm__fig:not(.pm__fig--hero)')].map((f, i) => [[f], .34 + i * .1, Math.min(1, .78 + i * .1)]),
    ];
    parts.forEach(([els, a, b]) => els.forEach((el) => el.animate(fade(a, b, back), lin)));
    return run.finished.then(() => { m.remove(); dlg.classList.remove('is-morphing'); card.style.visibility = back ? '' : 'hidden'; });
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
  const canMorph = (card) => !reduced && dlg.animate && card && card.querySelector('.pcard__frame img') && body.querySelector('.pm__fig--hero img');

  async function open(card) {
    if (busy || !document.getElementById(card.dataset.project)) return;
    opener = card; fill(card);
    dlg.classList.toggle('is-fade', !canMorph(card));
    show();
    if (dlg.classList.contains('is-fade')) return;
    busy = true;
    requestAnimationFrame(() => dlg.classList.add('is-dim'));
    await morph(card, false);
    busy = false;
  }

  async function close() {
    if (!dlg.open || busy) return;
    const card = opener;
    if (dlg.classList.contains('is-fade') || !canMorph(card)) { dlg.close(); return; }
    busy = true;
    dlg.classList.remove('is-dim');
    await morph(card, true);
    card.style.visibility = '';
    dlg.close();
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
