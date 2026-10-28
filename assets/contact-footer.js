/* Closing block: rolling verb (create, design, build, make; every 2.1 s) and email copy. */
(() => {
  const roll = document.getElementById('cf-roll');
  if (roll) {
    const words = [...roll.children];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const width = (w) => { roll.style.width = w.offsetWidth + 'px'; };
    const reset = (w) => { w.style.transition = 'none'; w.classList.remove('is-leaving'); void w.offsetWidth; w.style.transition = ''; };
    let i = 0, timer = 0;
    const step = () => {
      const cur = words[i]; i = (i + 1) % words.length; const next = words[i];
      reset(next);
      cur.classList.remove('is-current'); cur.classList.add('is-leaving');
      next.classList.add('is-current'); width(next);
      setTimeout(() => reset(cur), 600);   // park the old word below again, without animating back through the slot
    };
    const start = () => { if (!timer && !reduce.matches) timer = setInterval(step, 2100); };
    const stop = () => { clearInterval(timer); timer = 0; };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
      roll.classList.add('is-ready'); width(words[i]);
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(roll);
      else start();
    });
    addEventListener('resize', () => width(words[i]));
  }

  const btn = document.querySelector('.cf__mail');
  if (btn) {
    const status = btn.querySelector('[data-status]');
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try { await navigator.clipboard.writeText(text); }
      catch { const ta = Object.assign(document.createElement('textarea'), { value: text }); document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch {} ta.remove(); }
      btn.classList.add('is-copied'); status.textContent = 'Email address copied';
      clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('is-copied'); status.textContent = ''; }, 2200);
    });
  }
})();
