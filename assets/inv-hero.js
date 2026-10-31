/**
 * Invia hero: simplified sketch of the booking funnel start. A 12 s loop: the search fills in,
 * the button is pressed, results load, the Offer Box appears and gets the focus.
 * Plays only while in view; Pause stops it; reduced motion shows the results as a still frame.
 */
(function () {
  var el = document.querySelector('[data-ivh]');
  if (!el) return;
  var btn = document.querySelector('[data-ivh-toggle]');
  var fields = el.querySelectorAll('.ivh__field');
  var values = ['Berlin (BER)', 'Ho-Chi-Minh-Stadt (SGN)', 'Sa, 09.11.', 'Sa, 16.11.'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [], loop = null, playing = !reduce, visible = false;

  function clear() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function reset() {
    el.classList.remove('is-pressing', 'is-loading', 'is-results', 'is-focus');
    fields.forEach(function (f) { f.classList.remove('is-typing'); f.querySelector('b').textContent = ''; });
  }
  function type(f, text, start) {
    at(start, function () { f.classList.add('is-typing'); });
    for (var i = 1; i <= text.length; i++) (function (i) { at(start + i * 55, function () { f.querySelector('b').textContent = text.slice(0, i); }); })(i);
    at(start + text.length * 55 + 120, function () { f.classList.remove('is-typing'); });
  }
  function play() {
    clear(); reset();
    var t = 400;
    fields.forEach(function (f, i) { type(f, values[i], t); t += values[i].length * 55 + 250; });
    at(t + 200, function () { el.classList.add('is-pressing'); });
    at(t + 450, function () { el.classList.remove('is-pressing'); el.classList.add('is-loading'); });
    at(t + 2200, function () { el.classList.remove('is-loading'); el.classList.add('is-results'); });
    at(t + 3200, function () { el.classList.add('is-focus'); });
  }
  function still() { clear(); fields.forEach(function (f, i) { f.querySelector('b').textContent = values[i]; }); el.classList.add('is-results', 'is-focus'); }
  function run() { if (loop || !playing || !visible) return; play(); loop = setInterval(play, 12000); }
  function stop() { clearInterval(loop); loop = null; clear(); }
  function sync() {
    el.classList.toggle('is-paused', !playing);
    if (btn) { btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); btn.querySelector('span').textContent = playing ? 'Pause' : 'Play'; }
    if (playing) run(); else { stop(); still(); }
  }
  if (reduce) still();
  if (btn) btn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? run() : stop(); }, { threshold: .3 }).observe(el);
  } else { visible = true; run(); }
})();
