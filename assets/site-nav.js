/* Site Nav: folds into a Menu button after 300 px of scroll (or on narrow screens), keyboard shortcuts, scroll-spy.
   Shortcuts: H home, W work, F fun, A about, N notes, C contact. Esc closes the menu. Ignored while typing or with Ctrl/Cmd/Alt. */
(() => {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const btn = nav.querySelector('.site-nav__menu');
  const links = [...nav.querySelectorAll('a[data-key]')];
  const narrow = matchMedia('(max-width: 767px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const FOLD_AT = 300;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  const update = () => {
    const folded = narrow.matches || scrollY > FOLD_AT;
    nav.dataset.state = folded ? 'folded' : 'open';
    if (!folded) setOpen(false);
  };

  // scroll-spy: the link of the section that sits under the top of the viewport
  const targets = links.map(a => a.getAttribute('href')).filter(h => h.length > 1)
    .map(h => ({ h, el: document.querySelector(h) })).filter(t => t.el);
  const spy = () => {
    const y = scrollY + innerHeight * .35;
    let cur = '#top';
    for (const t of targets) if (t.h !== '#top' && t.el.offsetTop <= y) cur = t.h;
    if (scrollY < 80) cur = '#top';
    links.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === cur)));
  };

  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); spy(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  narrow.addEventListener('change', update);
  update(); spy();

  btn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setOpen(false); });

  const go = (href) => {
    const el = href === '#top' ? document.body : document.querySelector(href);
    if (!el) return;
    if (href === '#top') scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', href === '#top' ? location.pathname : href);
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); btn.focus(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const a = links.find(l => l.dataset.key === e.key.toLowerCase());
    if (a) { e.preventDefault(); go(a.getAttribute('href')); }
  });
})();
