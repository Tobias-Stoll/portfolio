/* Site navigation: show the divider once the page scrolls. */
(() => {
  const hd = document.querySelector('.hd');
  if (!hd) return;
  const on = () => hd.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', on, { passive: true }); on();
})();
