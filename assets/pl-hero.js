/**
 * Prime League hero: animated sketch of the concept, in the style of the shipped product.
 * An 18 s loop over three tabs: play (match page, time confirmed, check-in), prepare (signature champions
 * of the opponent), watch (stream with chat). Plays only while in view; Pause stops it;
 * reduced motion shows a still frame of the first tab.
 */
(function () {
  var el = document.querySelector('[data-plh]');
  if (!el) return;
  var btn = document.querySelector('[data-plh-toggle]');
  var count = el.querySelector('.plh__count');
  var players = el.querySelector('.plh__players b');
  var check = el.querySelector('.plh__check');
  var toast = el.querySelector('.plh__toast');
  var tTitle = toast.querySelector('b'), tSub = toast.querySelector('small');
  var tabs = el.querySelectorAll('.plh__tabs span');
  var scenes = el.querySelectorAll('.plh__scene');
  var badge = el.querySelector('.plh__badge');
  var toasts = [
    ['Spielzeit bestätigt', 'KRA vs. OWL · 07.11. 20:00'],
    ['Neuer Kommentar in deinem Match', 'OWL: Bis heute Abend, GL HF'],
  ];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOOP = 18, t = 0, secs = 900, timer = null, playing = !reduce, visible = false, nBadge = 0;

  function fmt(s) { var m = Math.floor(s / 60), x = s % 60; return '00:' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function scene(i) {
    tabs.forEach(function (x, k) { x.classList.toggle('is-on', k === i); });
    scenes.forEach(function (x, k) { x.classList.toggle('is-on', k === i); });
  }
  function showToast(i) {
    tTitle.textContent = toasts[i][0]; tSub.textContent = toasts[i][1];
    toast.classList.add('is-on'); nBadge++; badge.textContent = nBadge; el.classList.add('has-badge');
    setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
  }
  function reset() {
    t = 0; secs = 900; nBadge = 0;
    el.classList.remove('is-checked', 'has-badge', 'is-pressing');
    players.textContent = '4/5'; check.textContent = 'Check-in'; count.textContent = fmt(secs); scene(0);
  }
  function step() {
    t++; secs = Math.max(0, secs - 1); count.textContent = fmt(secs);
    if (t === 1) showToast(0);
    if (t === 4) { el.classList.add('is-pressing'); setTimeout(function () { el.classList.remove('is-pressing'); el.classList.add('is-checked'); players.textContent = '5/5'; check.textContent = 'Eingecheckt ✓'; }, 250); }
    if (t === 6) scene(1);
    if (t === 9) showToast(1);
    if (t === 12) scene(2);
    if (t >= LOOP) reset();
  }
  function run() { if (!timer && playing && visible) timer = setInterval(step, 1000); }
  function stop() { clearInterval(timer); timer = null; }
  function sync() {
    el.classList.toggle('is-paused', !playing);
    if (btn) { btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); btn.querySelector('span').textContent = playing ? 'Pause' : 'Play'; }
    playing ? run() : stop();
  }
  reset();
  if (reduce) { el.classList.add('is-checked', 'has-badge'); players.textContent = '5/5'; check.textContent = 'Eingecheckt ✓'; badge.textContent = '1'; tTitle.textContent = toasts[0][0]; tSub.textContent = toasts[0][1]; toast.classList.add('is-on'); }
  if (btn) btn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? run() : stop(); }, { threshold: .3 }).observe(el);
  } else { visible = true; run(); }
  sync();
})();
