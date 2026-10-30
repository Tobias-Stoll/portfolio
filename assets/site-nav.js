/* Site Nav: stays open while scrolling; folds into a Menu button only on narrow screens. Keyboard shortcuts, scroll-spy.
   Shortcuts: H home, W work, F fun, A about, N notes, C opens the contact menu (email copy, LinkedIn, CV). Esc closes. Ignored while typing or with Ctrl/Cmd/Alt. */
(() => {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const btn = nav.querySelector('.site-nav__menu');
  const links = [...nav.querySelectorAll('a[data-key]')];
  const narrow = matchMedia('(max-width: 767px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cBtn = nav.querySelector('.site-nav__contact');
  const pop = document.getElementById('contact-pop');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  const setContact = (open, focus) => {
    pop.classList.toggle('is-open', open);
    pop.inert = !open;
    cBtn.setAttribute('aria-expanded', String(open));
    if (open) { setOpen(false); if (focus) pop.querySelector('.contact-pop__row').focus(); }
  };
  const update = () => {
    const folded = narrow.matches;   // desktop: the bar stays open on scroll
    nav.dataset.state = folded ? 'folded' : 'open';
    if (!folded) setOpen(false);
    nav.classList.toggle('is-scrolled', scrollY > 8);
  };

  // scroll-spy: the link of the section that sits under the top of the viewport
  const targets = links.map(a => a.getAttribute('href')).filter(h => h.startsWith('#') && h.length > 1)
    .map(h => ({ h, el: document.querySelector(h) })).filter(t => t.el);
  const bar = nav.querySelector('.site-nav__progress');   // case pages: how far down the page you are
  const spy = () => {
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--progress', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : 0);
    }
    if (!targets.length) {   // sub page: the section it belongs to stays marked (data-current="w" = Work)
      links.forEach(a => a.setAttribute('aria-current', String(a.dataset.key === nav.dataset.current)));
      return;
    }
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

  btn.addEventListener('click', () => { setContact(false); setOpen(!nav.classList.contains('is-open')); });
  cBtn.addEventListener('click', () => setContact(!pop.classList.contains('is-open'), true));
  pop.querySelector('.contact-pop__close').addEventListener('click', () => { setContact(false); cBtn.focus(); });
  pop.querySelector('[data-copy]').addEventListener('click', async (e) => {
    const row = e.currentTarget, label = row.querySelector('.contact-pop__label');
    const text = row.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = Object.assign(document.createElement('textarea'), { value: text }); document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch {} ta.remove(); }
    row.classList.add('is-copied'); label.textContent = 'Copied to clipboard';
    clearTimeout(row._t); row._t = setTimeout(() => { row.classList.remove('is-copied'); label.textContent = 'Email'; }, 2200);
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) { setOpen(false); setContact(false); } });

  const go = (href) => {
    if (!href.startsWith('#')) { location.href = href; return; }   // sub pages: the links point to the landing page
    const el = href === '#top' ? document.body : document.querySelector(href);
    if (!el) return;
    // a jump must not be caught by the Selected work snap (it would pull the page to the nearest snap point)
    const root = document.documentElement;
    root.classList.add('nav-jump');
    clearTimeout(go.t);
    const done = () => { clearTimeout(go.t); go.t = setTimeout(() => root.classList.remove('nav-jump'), 120); };
    if ('onscrollend' in window) addEventListener('scrollend', done, { once: true });
    go.t = setTimeout(() => root.classList.remove('nav-jump'), 1800);   // fallback
    if (href === '#top') scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', href === '#top' ? location.pathname : href);
  };
  // clicks take the same path as the shortcuts (no native anchor jump, which the snap would catch)
  links.forEach((a) => a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href.startsWith('#') || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    e.preventDefault(); go(href);
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (pop.classList.contains('is-open')) { setContact(false); cBtn.focus(); return; }
      if (nav.classList.contains('is-open')) { setOpen(false); btn.focus(); return; }
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = e.key.toLowerCase();
    if (k === 'c') { e.preventDefault(); setContact(!pop.classList.contains('is-open'), true); return; }
    const a = links.find(l => l.dataset.key === k);
    if (a) { e.preventDefault(); setContact(false); go(a.getAttribute('href')); }
  });
})();
