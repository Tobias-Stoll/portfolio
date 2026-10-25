/* Scroll reveal: chapters and sections fade in as they come into view, one after the other.
   On the landing page, Selected work waits for the first interaction (scroll, wheel, touch, key).
   Runs only with JS, IntersectionObserver and no reduced-motion preference; otherwise everything is visible. */
(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const gated = [...document.querySelectorAll('.hero__work, .cases > .case-card')];
  const els = [...document.querySelectorAll('.cs-section, main > .section, main > .contact-block')];
  if (!els.length && !gated.length) return;
  document.querySelectorAll('.cases > .case-card').forEach((el, i) => el.style.setProperty('--reveal-delay', 80 + (i % 3) * 90 + 'ms'));
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  els.forEach(el => { el.setAttribute('data-reveal', ''); io.observe(el); });

  if (!gated.length) return;
  gated.forEach(el => el.setAttribute('data-reveal', ''));
  const events = ['scroll', 'wheel', 'touchmove', 'keydown'];
  const open = () => {
    events.forEach(ev => removeEventListener(ev, open));
    gated.forEach(el => el.classList.add('is-in'));
  };
  if (scrollY > 0 || location.hash) { open(); return; }   // returning visitor or deep link: show at once
  events.forEach(ev => addEventListener(ev, open, { passive: true }));
})();
