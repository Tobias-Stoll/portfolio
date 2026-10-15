/* Case study timelines (Flex Ticket, Price Guarantee): the rail fills as you scroll, dots light up when the line reaches them,
   and the sticky step text settles with a small spring when it stops or starts moving.
   Without JS (or with reduced motion) the timeline is shown complete and still. */
document.querySelectorAll('.ft').forEach(fig => {
  const list = fig.querySelector('.ft__steps');
  const steps = [...list.querySelectorAll('.ft-step')];
  const main = steps.filter(s => !s.classList.contains('ft-step--branch'));
  const branch = list.querySelector('.ft-step--branch');
  const result = fig.nextElementSibling && fig.nextElementSibling.classList.contains('ft-result') ? fig.nextElementSibling : null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rail = document.createElement('span');
  rail.className = 'ft__rail'; rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<span class="ft__fill"></span>';
  list.prepend(rail);
  fig.classList.add('is-live');
  if (reduced) { fig.classList.add('is-static'); steps.forEach(s => s.classList.add('is-reached')); }
  if (result) result.classList.add('is-live');
  if (result && reduced) result.classList.add('is-reached');

  const dotY = s => { const d = s.querySelector('.ft__dot').getBoundingClientRect(); return d.top + d.height / 2; };
  let railTop = 0, railH = 0;
  const layout = () => {
    const top = list.getBoundingClientRect().top;
    railTop = dotY(main[0]) - top;
    // the rail runs down to where the branch curve starts (halfway into the gap above the branch)
    const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
    const branchStart = branch ? branch.getBoundingClientRect().top - top - gap / 2 - railTop : dotY(main[main.length - 1]) - top - railTop;
    // the main line runs on past the branch, down into the Result box, and turns green on the way
    railH = result ? result.getBoundingClientRect().top - top - railTop : branchStart;
    fig.style.setProperty('--ft-branch', branchStart + 'px');
    rail.style.top = railTop + 'px';
    rail.style.height = railH + 'px';
    fig.style.setProperty('--ft-rail-h', railH + 'px');
    fig.style.setProperty('--ft-b', (dotY(main[1]) - top - railTop) + 'px');
  };

  // sticky text: spring on stick / release (desktop only, where the text is sticky)
  const wide = matchMedia('(min-width: 881px)');
  // sticky blocks: the step text, or on the branch only the part under its label
  const texts = steps.map(s => ({ el: s.querySelector('.ft__stick') || s.querySelector('.ft__text'), stuck: false }));
  const STICK_TOP = 88;
  let lastY = scrollY;
  const settle = (el, k) => {
    el.style.setProperty('--ft-k', k);
    el.classList.remove('is-settling'); void el.offsetWidth; el.classList.add('is-settling');
  };
  texts.forEach(t => t.el.addEventListener('animationend', () => t.el.classList.remove('is-settling')));

  const update = () => {
    const anchor = innerHeight * 0.55;
    const top = list.getBoundingClientRect().top;
    if (!reduced) {
      const fill = Math.max(0, Math.min(railH, anchor - (top + railTop)));
      fig.style.setProperty('--ft-fill', fill + 'px');
      steps.forEach(s => s.classList.toggle('is-reached', dotY(s) <= anchor + 1));
      if (result) result.classList.toggle('is-reached', fill >= railH - 1);
    }
    const dir = scrollY >= lastY ? 1 : -1; lastY = scrollY;
    if (!reduced && wide.matches) {
      texts.forEach(t => {
        // measured from the step box, so the spring's own transform never feeds back
        const stepR = t.el.closest('.ft-step').getBoundingClientRect();
        const off = t.el.classList.contains('ft__stick') ? t.el.previousElementSibling.offsetTop + t.el.previousElementSibling.offsetHeight + 8 : 0;
        const stuck = stepR.top + off < STICK_TOP - 1 && stepR.bottom - t.el.offsetHeight > STICK_TOP + 1;
        if (stuck !== t.stuck) { t.stuck = stuck; t.el.classList.toggle('is-stuck', stuck); settle(t.el, stuck ? dir : -0.6 * dir); }
      });
    }
  };

  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  const relayout = () => { layout(); update(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  fig.querySelectorAll('img').forEach(i => i.complete || i.addEventListener('load', relayout, { once: true }));
  relayout();
});
