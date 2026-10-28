/* Custom cursor: ring follows the mouse (slight easing), grows over interactive elements, label from data-cursor. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ring = document.createElement('div'); ring.className = 'cursor'; ring.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span'); label.className = 'cursor__label'; label.setAttribute('aria-hidden', 'true');
  document.body.append(ring, label);
  document.documentElement.classList.add('has-cursor');

  const INTERACTIVE = 'a, button, [role="button"], summary, label, select, input[type="checkbox"], input[type="radio"], [data-cursor]';
  const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]';
  let x = -100, y = -100, cx = x, cy = y, on = false, raf = 0;

  function frame() {
    const k = reduce ? 1 : .35;
    cx += (x - cx) * k; cy += (y - cy) * k;
    ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    label.style.transform = `translate3d(${cx + 18}px, ${cy + 20}px, 0)`;
    raf = (Math.abs(x - cx) > .1 || Math.abs(y - cy) > .1) ? requestAnimationFrame(frame) : 0;
  }
  function update(t) {
    if (!t || !t.closest) return;
    const text = t.closest(TEXT);
    const hit = !text && t.closest(INTERACTIVE);
    const named = hit && hit.closest('[data-cursor]');
    const dark = !!t.closest('.cf');
    ring.classList.toggle('is-hover', !!hit);
    ring.classList.toggle('is-text', !!text);
    ring.classList.toggle('is-dark', dark);
    label.classList.toggle('is-dark', dark);
    const txt = named ? named.dataset.cursor : '';
    if (txt) label.textContent = txt;
    label.classList.toggle('is-on', !!txt);
  }
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!on) { on = true; cx = x; cy = y; ring.classList.add('is-on'); }
    update(e.target);
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  addEventListener('scroll', () => { if (on) update(document.elementFromPoint(x, y)); }, { passive: true });   // content moves under a still mouse
  document.documentElement.addEventListener('mouseleave', () => { on = false; ring.classList.remove('is-on'); label.classList.remove('is-on'); });
  addEventListener('pointerdown', () => ring.classList.add('is-down'));
  addEventListener('pointerup', () => ring.classList.remove('is-down'));
})();
