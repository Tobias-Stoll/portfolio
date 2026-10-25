/* Scroll reveal: chapters and sections fade in as they come into view, one after the other.
   Runs only with JS, IntersectionObserver and no reduced-motion preference; otherwise everything is visible. */
(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...document.querySelectorAll('.cs-section, main > .section, main > .contact-block, .hero__work, .cases > .case-card')];
  if (!els.length) return;
  document.querySelectorAll('.cases > .case-card').forEach((el, i) => el.style.setProperty('--reveal-delay', (i % 3) * 90 + 'ms'));
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  els.forEach(el => { el.setAttribute('data-reveal', ''); io.observe(el); });
})();
