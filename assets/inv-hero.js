/**
 * Invia hero: sketch of the real flow. A 14 s loop: on the start page the search fills in with a
 * suggestion list, "Flüge finden" is pressed, the results page loads, the redesigned Offer Box appears.
 * Plays only while in view; Pause stops it; reduced motion shows the results as a still frame.
 */
(function () {
  var el = document.querySelector('[data-ivh]');
  if (!el) return;
  var btn = document.querySelector('[data-ivh-toggle]');
  var start = el.querySelector('.ivh__scene--start'), results = el.querySelector('.ivh__scene--results');
  var from = el.querySelector('[data-k="0"]'), to = el.querySelector('[data-k="1"]');
  var sug = el.querySelector('.ivh__suggest'), sugList = sug.querySelector('ul');
  var lists = [
    ['Berlin – Flughafen Berlin Brandenburg (BER)', 'Bergen – Flughafen Bergen (BGO)', 'Bern – Flughafen Bern-Belp (BRN)'],
    ['Ho-Chi-Minh-Stadt – Tan Son Nhat (SGN)', 'Hongkong – Chek Lap Kok (HKG)', 'Honolulu – Daniel K. Inouye (HNL)']
  ];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [], loop = null, playing = !reduce, visible = false;
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function scene(r) { start.classList.toggle('is-on', !r); results.classList.toggle('is-on', r); }
  function reset() {
    el.classList.remove('is-pressing', 'is-loading', 'is-results', 'is-focus');
    from.querySelector('b').textContent = ''; to.querySelector('b').textContent = '';
    sug.classList.remove('is-on'); scene(false);
  }
  function fill(field, typed, final, list, t0, left) {
    at(t0, function () { field.classList.add('is-typing'); sug.style.left = left; });
    for (var i = 1; i <= typed.length; i++) (function (i) { at(t0 + i * 160, function () { field.querySelector('b').textContent = typed.slice(0, i); }); })(i);
    var t1 = t0 + typed.length * 160 + 150;
    at(t1, function () { sugList.innerHTML = list.map(function (x) { return '<li>' + x + '</li>'; }).join(''); sug.classList.add('is-on'); });
    at(t1 + 900, function () { field.querySelector('b').textContent = final; sug.classList.remove('is-on'); field.classList.remove('is-typing'); });
    return t1 + 1150;
  }
  function play() {
    clear(); reset();
    var t = fill(from, 'BER', 'Berlin – Flughafen BER', lists[0], 500, '1em');
    t = fill(to, 'SG', 'Ho-Chi-Minh-Stadt (SGN)', lists[1], t + 200, '34%');
    at(t + 300, function () { el.classList.add('is-pressing'); });
    at(t + 550, function () { el.classList.remove('is-pressing'); scene(true); });
    at(t + 800, function () { el.classList.add('is-loading'); });
    at(t + 2700, function () { el.classList.add('is-results'); });
    at(t + 3600, function () { el.classList.add('is-focus'); });
  }
  function still() { clear(); scene(true); el.classList.add('is-loading', 'is-results', 'is-focus'); }
  function run() { if (loop || !playing || !visible) return; play(); loop = setInterval(play, 14000); }
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
