/**
 * Decision 4: Token Bridge flow. Four scenes of 4 s each: Claude writes the JSON, the plugin imports it,
 * the plugin exports to GitHub, everyone shares the same names. Inside a scene, [data-at="ms"] fades in
 * and [data-press="ms"] presses a button. Plays only while in view; reduced motion shows the last scene.
 */
(function () {
  var el = document.querySelector('[data-tbh]');
  if (!el) return;
  var btn = document.querySelector('[data-tbh-toggle]');
  var scenes = el.querySelectorAll('[data-scene]');
  var steps = el.querySelectorAll('.tbh__steps li');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = 4200, timers = [], loop = null, i = 0, playing = !reduce, visible = false;
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function show(n, instant) {
    clear();
    scenes.forEach(function (sc, k) {
      sc.classList.toggle('is-now', k === n);
      sc.querySelectorAll('[data-at]').forEach(function (x) { x.classList.toggle('is-on', !!instant && k === n); });
    });
    steps.forEach(function (s, k) { s.classList.toggle('is-now', k === n); s.classList.toggle('is-done', k < n); });
    if (instant) return;
    var sc = scenes[n];
    sc.querySelectorAll('[data-at]').forEach(function (x) {
      timers.push(setTimeout(function () { x.classList.add('is-on'); }, +x.getAttribute('data-at')));
    });
    sc.querySelectorAll('[data-press]').forEach(function (x) {
      var t = +x.getAttribute('data-press');
      timers.push(setTimeout(function () { x.classList.add('is-pressing'); }, t));
      timers.push(setTimeout(function () { x.classList.remove('is-pressing'); }, t + 220));
    });
  }
  function tick() { show(i); i = (i + 1) % scenes.length; }
  function start() { if (loop || !playing || !visible) return; tick(); loop = setInterval(tick, DUR); }
  function stop() { clearInterval(loop); loop = null; clear(); }
  function sync() {
    if (btn) { btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); btn.querySelector('span').textContent = playing ? 'Pause' : 'Play'; }
    if (playing) { start(); } else { stop(); i = (i + scenes.length - 1) % scenes.length; show(i, true); i = (i + 1) % scenes.length; }
  }
  if (reduce) show(scenes.length - 1, true); else show(0, true);
  if (btn) btn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }, { threshold: .3 }).observe(el);
  } else { visible = true; start(); }
})();
