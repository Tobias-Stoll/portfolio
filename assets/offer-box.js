/* Offer Box playground: autoplay tour, controls, hints. */
(() => {
  const ob = document.getElementById('ob');
  const $ = id => document.getElementById(id);
  const ctl = { h: $('lay-h'), v: $('lay-v'), ribbon: $('t-ribbon'), chips: $('t-chips'), bagNone: $('bag-none'), bagIcons: $('bag-icons'), bagText: $('bag-text'), slots: $('t-slots') };
  const tour = $('tour'), tourBtn = $('tour-btn'), steps = [...tour.querySelectorAll('.pgx-step')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATES = [
    { layout: 'h', ribbon: false, chips: false, bags: 'none'  },  // a regular offer
    { layout: 'h', ribbon: true,  chips: false, bags: 'text'  },  // top choice, baggage as text
    { layout: 'h', ribbon: true,  chips: true,  bags: 'icons' },  // top choice + chips, baggage as icons
    { layout: 'v', ribbon: false, chips: true,  bags: 'icons' },  // chips without banner, stacked prices
  ];
  let step = 0, timer = null, playing = false;

  function apply(s) {
    ob.dataset.layout = s.layout; ob.dataset.ribbon = s.ribbon; ob.dataset.chips = s.chips; ob.dataset.bags = s.bags;
    ctl.ribbon.checked = s.ribbon;
    ctl.h.setAttribute('aria-pressed', s.layout === 'h'); ctl.v.setAttribute('aria-pressed', s.layout === 'v');
    ctl.chips.checked = s.chips;
    ctl.bagNone.setAttribute('aria-pressed', s.bags === 'none'); ctl.bagIcons.setAttribute('aria-pressed', s.bags === 'icons'); ctl.bagText.setAttribute('aria-pressed', s.bags === 'text');
  }
  function current() { return { layout: ob.dataset.layout, ribbon: ob.dataset.ribbon === 'true', chips: ob.dataset.chips === 'true', bags: ob.dataset.bags }; }
  function morph(next) {
    if (document.startViewTransition && !reduced) document.startViewTransition(() => apply(next));
    else apply(next);
  }
  function mark() {
    steps.forEach((b, i) => { b.classList.toggle('is-on', i === step); b.setAttribute('aria-current', i === step ? 'step' : 'false'); });
    const bar = steps[step].querySelector('.pgx-step__bar');   // restart the progress fill
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
  }

  function play() {
    playing = true; tour.classList.remove('is-paused'); tour.classList.add('is-playing'); mark();
    tourBtn.setAttribute('aria-pressed', 'true'); tourBtn.innerHTML = '<span class="pgx-tour-ico" aria-hidden="true">❚❚</span>Pause tour';
    clearInterval(timer);
    let ticks = 0;
    timer = setInterval(() => {
      step = (step + 1) % STATES.length; morph(STATES[step]); mark();
      // WCAG 2.2.2: the tour stops by itself after one full round (about 11 s) and rests on step 1
      if (++ticks >= STATES.length) { pause(); yourTurn(); }
    }, 2800);
  }
  function pause() {
    playing = false; clearInterval(timer); tour.classList.add('is-paused'); tour.classList.remove('is-playing');
    tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.innerHTML = '<span class="pgx-tour-ico" aria-hidden="true">▶</span>Play tour';
  }
  tourBtn.addEventListener('click', () => {
    if (playing) pause(); else { step = 0; morph(STATES[0]); mark(); play(); }
  });


  // When the tour ends by itself: point at the controls once. Any control interaction retires the cue.
  const shell = $('shell'), panel = $('panel');
  function yourTurn() { shell.classList.remove('is-your-turn'); void shell.offsetWidth; shell.classList.add('is-your-turn'); }
  panel.addEventListener('click', () => shell.classList.remove('is-your-turn'));
  // Steps are clickable: jump to that state and pause
  steps.forEach((b, i) => b.addEventListener('click', () => { pause(); step = i; morph(STATES[i]); mark(); }));

  // Taking over: any control pauses the tour
  const take = fn => () => { pause(); morph({ ...current(), ...fn() }); };
  ctl.h.addEventListener('click', take(() => ({ layout: 'h' })));
  ctl.v.addEventListener('click', take(() => ({ layout: 'v' })));
  ctl.ribbon.addEventListener('change', take(() => ({ ribbon: ctl.ribbon.checked })));
  ctl.chips.addEventListener('change', take(() => ({ chips: ctl.chips.checked })));
  ctl.bagNone.addEventListener('click', take(() => ({ bags: 'none' })));
  ctl.bagIcons.addEventListener('click', take(() => ({ bags: 'icons' })));
  ctl.bagText.addEventListener('click', take(() => ({ bags: 'text' })));
  ctl.slots.addEventListener('change', () => { ob.dataset.slots = ctl.slots.checked; });

  // Hints (stops, baggage): tap toggles on touch, Escape and outside clicks close it
  ob.querySelectorAll('.has-tip').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); const open = !b.classList.contains('is-open');
    ob.querySelectorAll('.has-tip').forEach(x => x.classList.remove('is-open')); b.classList.toggle('is-open', open);
  }));
  document.addEventListener('click', () => ob.querySelectorAll('.has-tip.is-open').forEach(x => x.classList.remove('is-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ob.querySelectorAll('.has-tip.is-open').forEach(x => x.classList.remove('is-open')); });

  // Both prices are equal choices
  const toast = $('toast'); let tt;
  ob.querySelectorAll('.price').forEach(b => b.addEventListener('click', () => {
    ob.querySelectorAll('.price').forEach(x => x.classList.toggle('is-picked', x === b));
    toast.textContent = `${b.dataset.name} selected. In the live product this continues to booking.`;
    toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2200);
  }));

  apply(STATES[0]); mark();
  // Stop the tour when the tab is hidden, so it never runs unseen
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });

  // Autoplay once while visible, never for reduced motion
  if (reduced) { pause(); return; }
  if ('IntersectionObserver' in window) {
    let started = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { started = true; play(); }
      else if (!e.isIntersecting && playing) { clearInterval(timer); timer = null; }
      else if (e.isIntersecting && playing && !timer) play();
    }, { threshold: .4 }).observe(ob);
  } else play();
})();

/* Keep the playground stage at the tallest height it has reached, so toggling does not shift the page */
(function () {
  var st = document.querySelector('#playground .pgx-stage');
  if (!st || !('ResizeObserver' in window)) return;
  var max = 0, w = 0;
  new ResizeObserver(function () {
    if (st.offsetWidth !== w) { w = st.offsetWidth; max = 0; st.style.minHeight = ''; }
    var h = st.scrollHeight;
    if (h > max) { max = h; st.style.minHeight = h + 'px'; }
  }).observe(st.firstElementChild || st);
})();
