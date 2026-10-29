/**
 * Project card rail: paddles, video on hover, and the project dialog.
 * A card button with data-project="<template id>" opens #pm with that template's content.
 * The card image grows into the first dialog visual (View Transitions API), else the dialog fades in.
 */
(() => {
  const rail = document.querySelector('.prail');
  if (!rail) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // paddles: one card per click, disabled at the ends
  const paddles = [...document.querySelectorAll('.prail__paddle')];
  const step = () => { const li = rail.querySelector('li'); return li ? li.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 20) : 400; };
  paddles.forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: step() * Number(b.dataset.dir), behavior: reduced ? 'auto' : 'smooth' })));
  const sync = () => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    paddles.forEach((b) => { b.disabled = Number(b.dataset.dir) < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; });
  };
  rail.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();

  // the Ride Recap story plays while you point at its card (user-started, so no extra pause control needed)
  rail.querySelectorAll('.pcard video').forEach((v) => {
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
      dlg.scrollTop = 0;
    }).finally(() => { if (to) to.style.viewTransitionName = ''; });
  }

  function close() {
    if (!dlg.open) return;
    const from = body.querySelector('.pm__fig--hero img');
    const to = opener && opener.querySelector('.pcard__frame img');
    const vt = !reduced && document.startViewTransition && from && to && dlg.scrollTop < 200;
    if (vt) from.style.viewTransitionName = 'pm-hero';
    morph(() => {
      if (from) from.style.viewTransitionName = '';
      if (vt) to.style.viewTransitionName = 'pm-hero';
      dlg.close();
    }).finally(() => { if (to) to.style.viewTransitionName = ''; });
  }

  rail.querySelectorAll('button.pcard[data-project]').forEach((c) => c.addEventListener('click', () => open(c)));
  dlg.querySelector('.pm__close').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });   // click on the backdrop
  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('pm-lock');
    document.body.append(...dlg.querySelectorAll('.cursor, .cursor__label'));
    if (opener) opener.focus({ preventScroll: true });
  });
})();
