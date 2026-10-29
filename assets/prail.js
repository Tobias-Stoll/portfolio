/**
 * Project card rail: paddles, video on hover, and the project dialog.
 * A card button with data-project="<template id>" opens #pm with that template's content.
 * The card image grows into the first dialog visual (View Transitions API), else the dialog fades in.
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
  const morph = (fn) => (!reduced && document.startViewTransition ? document.startViewTransition(fn).finished : Promise.resolve(fn()));
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

  function open(card) {
    const tpl = document.getElementById(card.dataset.project);
    if (!tpl) return;
    opener = card;
    const from = card.querySelector('.pcard__frame img');
    body.replaceChildren(tpl.content.cloneNode(true));
    body.querySelector('.pm__title')?.setAttribute('id', 'pm-title');
    const to = body.querySelector('.pm__fig--hero img');
    const vt = !reduced && document.startViewTransition && from && to;
    dlg.classList.toggle('is-morph', !!vt);
    if (vt) from.style.viewTransitionName = 'pm-hero';
    morph(() => {
      if (from) from.style.viewTransitionName = '';
      if (to) to.style.viewTransitionName = 'pm-hero';
      document.documentElement.classList.add('pm-lock');
      dlg.showModal();
      dlg.append(...document.querySelectorAll('body > .cursor, body > .cursor__label'));   // the custom cursor would sit under the top layer
      document.querySelector('.cursor__label')?.classList.remove('is-on');
      body.scrollTop = 0; bar();
      body.focus({ preventScroll: true });   // arrow keys and space scroll the content; Tab reaches the close button
    }).finally(() => { if (to) to.style.viewTransitionName = ''; });
  }

  function close() {
    if (!dlg.open) return;
    const from = body.querySelector('.pm__fig--hero img');
    const to = opener && opener.querySelector('.pcard__frame img');
    const vt = !reduced && document.startViewTransition && from && to && body.scrollTop < 200;
    if (vt) from.style.viewTransitionName = 'pm-hero';
    morph(() => {
      if (from) from.style.viewTransitionName = '';
      if (vt) to.style.viewTransitionName = 'pm-hero';
      dlg.close();
    }).finally(() => { if (to) to.style.viewTransitionName = ''; });
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
