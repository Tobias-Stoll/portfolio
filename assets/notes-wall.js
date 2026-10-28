/* Notes wall: masonry layout and mouse push. Both below.
   Masonry: every note reserves as many 4 px rows as its height needs, so short notes do not leave holes.
   Order stays as in the page (form first, then newest first). Without JS the wall is a plain grid (the class is-masonry is only added here). */
(() => {
  const wall = document.getElementById('wall');
  if (!wall) return;
  const ROW = 4;
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => layout()) : null;
  const seen = new WeakSet();
  function layout() {
    const gap = parseFloat(getComputedStyle(wall).columnGap) || 12;
    wall.querySelectorAll(':scope > .note').forEach((n) => {
      n.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((n.offsetHeight + gap) / ROW));
      if (ro && !seen.has(n)) { seen.add(n); ro.observe(n); }
    });
  }
  wall.classList.add('is-masonry');
  layout();
  new MutationObserver(layout).observe(wall, { childList: true });
  addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  /* Mouse push (like the bento tiles on the reference site): moving the mouse over a note pushes it, then it springs back
     and swings back and forth a few times. A damped spring per note: stiffness 250, damping 13 (about 0.4 s per swing, as measured there).
     No growing. Mouse only, off with reduced motion. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const K = 250, C = 13, GAIN = 7, MAX = 16, VMAX = 420;
  const state = new Map();   // note -> { x, y, vx, vy }
  let raf = 0, last = 0;
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  function tick(now) {
    const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
    state.forEach((s, n) => {
      s.vx += (-K * s.x - C * s.vx) * dt; s.vy += (-K * s.y - C * s.vy) * dt;
      s.x = clamp(s.x + s.vx * dt, MAX); s.y = clamp(s.y + s.vy * dt, MAX);
      if (Math.abs(s.x) < .05 && Math.abs(s.y) < .05 && Math.abs(s.vx) < .5 && Math.abs(s.vy) < .5) {
        n.style.removeProperty('--nx'); n.style.removeProperty('--ny'); n.style.removeProperty('--nr'); state.delete(n);
      } else {
        n.style.setProperty('--nx', s.x.toFixed(2) + 'px'); n.style.setProperty('--ny', s.y.toFixed(2) + 'px');
        n.style.setProperty('--nr', (s.x * .12).toFixed(2) + 'deg');
      }
    });
    raf = state.size ? requestAnimationFrame(tick) : 0;
  }
  wall.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const n = e.target.closest && e.target.closest('.note');
    if (!n || n.classList.contains('note--plain') || n.parentElement !== wall) return;
    let s = state.get(n); if (!s) { s = { x: 0, y: 0, vx: 0, vy: 0 }; state.set(n, s); }
    s.vx = clamp(s.vx + e.movementX * GAIN, VMAX); s.vy = clamp(s.vy + e.movementY * GAIN, VMAX);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  });
})();
