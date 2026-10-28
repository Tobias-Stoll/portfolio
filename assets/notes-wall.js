/* Notes wall as a masonry: every note reserves as many 4 px rows as its height needs, so short notes do not leave holes.
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
})();
