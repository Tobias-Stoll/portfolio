/**
 * Project card rail: paddles, video on hover, and the project dialog.
 * A card button with data-project="<template id>" opens #pm with that template's content.
 * The card morphs into the dialog (stand-in box + travelling image, Web Animations), else the dialog fades in.
 */
(() => {
  const rails = [...document.querySelectorAll('.prail')];
  if (!rails.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // input modality: the browser treats the programmatic focus moves of the dialog (content on open, card on close)
  // as keyboard focus and draws the ring even after a mouse click. Rings on cards and dialog only after keyboard use.
  const root = document.documentElement;
  addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) root.classList.add('using-kbd'); }, true);
  addEventListener('pointerdown', () => root.classList.remove('using-kbd'), true);

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
  /* Keyboard: each rail is one tab stop (roving tabindex). Inside it: arrow left/right move between cards,
     Home/End jump to the first/last card; the rail scrolls the focused card into view. Tab leaves the rail. */
  rails.forEach((rail) => {
    const cards = [...rail.querySelectorAll(':scope > li > :is(a, button).pcard')];
    if (!cards.length) return;
    const setCur = (c) => cards.forEach((x) => { x.tabIndex = x === c ? 0 : -1; });
    setCur(cards[0]);
    cards.forEach((c) => c.addEventListener('focus', () => {
      setCur(c);
      c.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
    }));
    rail.addEventListener('keydown', (e) => {
      const i = cards.indexOf(document.activeElement);
      if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: cards.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      cards[Math.max(0, Math.min(cards.length - 1, to))].focus({ preventScroll: true });
    });
    rail.setAttribute('aria-describedby', 'prail-hint');
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

  /* Card to dialog morph: a stand-in box grows from the card to the dialog, and the dialog's text and images
     simply grow with it (scaled from card width to full size). The card face scales along and fades out at the start.
     Closing is the same, shrinking back into the card. */
  const T = { dur: 820, ease: 'cubic-bezier(.25, .9, .3, 1)' };
  let busy = false;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const box = (r) => ({ left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });

  function morph(card, back) {
    card.style.visibility = '';
    const cardR = rect(card);
    card.style.visibility = 'hidden';
    const dR = rect(dlg);
    const dBg = getComputedStyle(dlg).backgroundColor, dRad = getComputedStyle(dlg).borderRadius;
    const cBg = getComputedStyle(card).backgroundColor;
    const k = cardR.w / dR.w;   // card width relative to dialog width

    const m = document.createElement('div'); m.className = 'pm-morph'; m.setAttribute('aria-hidden', 'true');
    const face = card.cloneNode(true); face.className += ' pm-morph__face'; face.removeAttribute('data-project');
    face.style.width = cardR.w + 'px'; face.style.height = cardR.h + 'px'; face.style.visibility = back ? 'visible' : 'hidden';   // closing: the card fades back in; opening stays as approved (white box, content grows in)
    const content = document.createElement('div'); content.className = 'pm-morph__content';
    content.style.width = dR.w + 'px'; content.style.height = (body.scrollHeight) + 'px';
    const copy = body.cloneNode(true); copy.removeAttribute('tabindex'); copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    copy.style.marginTop = -body.scrollTop + 'px';
    const xBtn = dlg.querySelector('.pm__close').cloneNode(true); xBtn.tabIndex = -1;
    content.append(copy, xBtn);
    m.append(content, face);
    dlg.append(m);
    dlg.classList.add('is-morphing');

    const o = { duration: T.dur, easing: T.ease, fill: 'both' }, lin = { duration: T.dur, easing: 'linear', fill: 'both' };
    const A = back ? dR : cardR, B = back ? cardR : dR;
    const run = m.animate([{ ...box(A), borderRadius: back ? dRad : '18px' }, { ...box(B), borderRadius: back ? '18px' : dRad }], o);
    // closing: the cross-fade runs on the same eased progress as the shrink, so card and dialog melt into each other while it moves
    const sync = { duration: T.dur, easing: T.ease, fill: 'both' };
    m.animate(back ? [{ backgroundColor: dBg }, { backgroundColor: dBg, offset: .2 }, { backgroundColor: cBg, offset: .7 }, { backgroundColor: cBg }] : [{ backgroundColor: cBg }, { backgroundColor: dBg, offset: .2 }, { backgroundColor: dBg }], back ? sync : lin);
    const small = `scale(${k})`, big = `scale(${1 / k})`;
    content.animate([{ transform: back ? 'scale(1)' : small }, { transform: back ? small : 'scale(1)' }], o);
    face.animate([{ transform: back ? big : 'scale(1)' }, { transform: back ? 'scale(1)' : big }], o);
    content.animate(back ? [{ opacity: 1 }, { opacity: 1, offset: .15 }, { opacity: 0, offset: .65 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 1 }], back ? sync : lin);
    face.animate(back ? [{ opacity: 0 }, { opacity: 0, offset: .15 }, { opacity: 1, offset: .65 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0, offset: .25 }, { opacity: 0 }], back ? sync : lin);
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
  const canMorph = (card) => !reduced && !!dlg.animate && !!card;

  async function open(card) {
    if (busy || !document.getElementById(card.dataset.project)) return;
    opener = card; fill(card);
    dlg.classList.toggle('is-fade', !canMorph(card));
    show();
    if (dlg.classList.contains('is-fade')) return;
    busy = true;
    requestAnimationFrame(() => dlg.classList.add('is-dim'));
    await morph(card, false);
    body.focus({ preventScroll: true });   // again: during the morph the content is hidden and cannot take focus
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
