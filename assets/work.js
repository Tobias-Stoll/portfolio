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
})();
