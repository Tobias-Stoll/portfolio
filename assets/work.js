/* Selected work: the dot of the case in the middle of the screen is the active one (pill). Without JS the first stays active. */
(() => {
  const dots = [...document.querySelectorAll('.work-dots a')];
  const cases = dots.map((d) => document.querySelector(d.getAttribute('href'))).filter(Boolean);
  if (!cases.length || !('IntersectionObserver' in window)) return;
  const set = (id) => dots.forEach((d) => {
    const on = d.getAttribute('href') === '#' + id;
    d.classList.toggle('is-active', on);
    if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
  });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) set(e.target.id); }), { rootMargin: '-50% 0px -50% 0px' });
  cases.forEach((c) => io.observe(c));

  /* Keyboard: Selected work is one tab stop like the card rails (roving tabindex on the "View case study" buttons).
     Arrow down/right: next case, arrow up/left: previous, Home/End: first/last. The case scrolls into view. */
  const ctas = cases.map((c) => c.querySelector('.case__cta')).filter(Boolean);
  if (ctas.length) {
    const setCur = (a) => ctas.forEach((x) => { x.tabIndex = x === a ? 0 : -1; });
    setCur(ctas[0]);
    ctas.forEach((a) => a.addEventListener('focus', () => setCur(a)));
    document.getElementById('work').addEventListener('keydown', (e) => {
      const i = ctas.indexOf(document.activeElement);
      if (i < 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: ctas.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const t = ctas[Math.max(0, Math.min(ctas.length - 1, to))];
      const root = document.documentElement;
      root.classList.add('nav-jump');   // no snap fight while it scrolls (see work.css)
      t.closest('.case').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      t.focus({ preventScroll: true });
      clearTimeout(setCur.t); setCur.t = setTimeout(() => root.classList.remove('nav-jump'), 900);
    });
  }

  /* Snap (desktop): one zone from the hero through the cases down to the top of "Smaller projects".
     Inside it the snap is mandatory (hero, each case, Smaller projects are the stops; "How I work" is the exit stop).
     The zone is decided only once a scroll has come to rest, never during one: a trackpad swipe keeps its snap to the end,
     and nothing switches off halfway through (that let swipes overshoot and the way back up fail).
     Dots: visible only while a case fills the screen (live). */
  const work = document.getElementById('work');
  const wide = matchMedia('(min-width: 1024px)');
  const root = document.documentElement, after = work.nextElementSibling;
  let snapOn = false, raf = 0, rest = 0;
  const inZone = () => {
    if (!wide.matches) return false;
    if (!after) return work.getBoundingClientRect().bottom >= innerHeight / 2;
    const stop = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + (parseFloat(getComputedStyle(after).scrollMarginTop) || 0);
    // scrolling back up from Smaller projects: the snap only takes over once case 3 fills a good part of the screen again
    // (the section starts in the lower 60 % of the window). Right at the Smaller projects stop the page stays free.
    return after.getBoundingClientRect().top >= Math.max(stop - 4, innerHeight * .4);
  };
  const settle = () => {
    clearTimeout(rest);
    const want = inZone();
    if (want !== snapOn) { snapOn = want; root.classList.toggle('snap-work', want); }
  };
  const showDots = () => {
    raf = 0;
    const r = work.getBoundingClientRect();
    work.classList.toggle('dots-on', r.top <= innerHeight * .2 && r.bottom >= innerHeight * .8);
  };
  addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(showDots);
    clearTimeout(rest); rest = setTimeout(settle, 160);   // at rest (also covers browsers without the scrollend event)
  }, { passive: true });
  if ('onscrollend' in window) addEventListener('scrollend', settle);
  addEventListener('resize', () => { showDots(); settle(); }); wide.addEventListener('change', settle);
  showDots(); settle();

  /* Mouse push on the visuals, same spring as the notes (stiffness 250, damping 13), max 18 px like the reference tiles.
     The whole case is a link on top, so the tile under the mouse is found by position. Mouse only, off with reduced motion. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tiles = [...document.querySelectorAll('.case__tile')].map((t) => ({ t, f: t.querySelector('.case__frame') })).filter((x) => x.f);   // Selected work
  const K = 250, C = 13, GAIN = 7, MAX = 18, VMAX = 460;
  const state = new Map();
  let loop = 0, last = 0;
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  function tick(now) {
    const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
    state.forEach((s, f) => {
      s.vx += (-K * s.x - C * s.vx) * dt; s.vy += (-K * s.y - C * s.vy) * dt;
      s.x = clamp(s.x + s.vx * dt, MAX); s.y = clamp(s.y + s.vy * dt, MAX);
      if (Math.abs(s.x) < .05 && Math.abs(s.y) < .05 && Math.abs(s.vx) < .5 && Math.abs(s.vy) < .5) {
        f.style.removeProperty('--fx'); f.style.removeProperty('--fy'); state.delete(f);
      } else { f.style.setProperty('--fx', s.x.toFixed(2) + 'px'); f.style.setProperty('--fy', s.y.toFixed(2) + 'px'); }
    });
    loop = state.size ? requestAnimationFrame(tick) : 0;
  }
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const hit = tiles.find(({ t }) => { const r = t.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
    if (!hit) return;
    let s = state.get(hit.f); if (!s) { s = { x: 0, y: 0, vx: 0, vy: 0 }; state.set(hit.f, s); }
    s.vx = clamp(s.vx + e.movementX * GAIN, VMAX); s.vy = clamp(s.vy + e.movementY * GAIN, VMAX);
    if (!loop) { last = performance.now(); loop = requestAnimationFrame(tick); }
  });
})();
