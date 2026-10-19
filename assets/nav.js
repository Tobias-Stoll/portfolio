/* Site navigation: divider once the page scrolls, and the reading progress bar where the page has one. */
(() => {
  const hd = document.querySelector('.site-header');
  if (!hd) return;
  const bar = hd.querySelector('.site-header__progress');
  let raf = 0;
  const on = () => {
    raf = 0;
    hd.classList.toggle('is-scrolled', scrollY > 8);
    if (bar) {   // reading progress: how far down the page you are
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--site-header-progress', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : 0);
    }
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(on); };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); on();
})();
