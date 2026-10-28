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

  /* Snap: mandatory only while the work section covers the middle of the screen (desktop). Before and after, free scrolling.
     Dots: visible only while a case fills the screen. */
  const work = document.getElementById('work');
  const wide = matchMedia('(min-width: 1024px)');
  let snapOn = false, raf = 0;
  const check = () => {
    raf = 0;
    const r = work.getBoundingClientRect(), mid = innerHeight / 2;
    const want = wide.matches && r.top <= mid && r.bottom >= mid;
    if (want !== snapOn) { snapOn = want; document.documentElement.classList.toggle('snap-work', want); }
    // dots: only while a case fills the screen; they fade out before the next section (Smaller projects) comes in
    work.classList.toggle('dots-on', r.top <= innerHeight * .2 && r.bottom >= innerHeight * .8);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
  addEventListener('resize', check); wide.addEventListener('change', check); check();

  /* Mouse push on the visuals, same spring as the notes (stiffness 250, damping 13), max 18 px like the reference tiles.
     The whole case is a link on top, so the tile under the mouse is found by position. Mouse only, off with reduced motion. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tiles = [...work.querySelectorAll('.case__tile')].map((t) => ({ t, f: t.querySelector('.case__frame') })).filter((x) => x.f);
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
  work.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const hit = tiles.find(({ t }) => { const r = t.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
    if (!hit) return;
    let s = state.get(hit.f); if (!s) { s = { x: 0, y: 0, vx: 0, vy: 0 }; state.set(hit.f, s); }
    s.vx = clamp(s.vx + e.movementX * GAIN, VMAX); s.vy = clamp(s.vy + e.movementY * GAIN, VMAX);
    if (!loop) { last = performance.now(); loop = requestAnimationFrame(tick); }
  });
})();
