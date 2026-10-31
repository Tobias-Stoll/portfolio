/**
 * Design to Code hero: one token change travels through the workflow. A 12 s loop:
 * the reference token changes in Figma, the button follows, Token Bridge exports one commit,
 * the GitHub Action builds, Storybook updates. Then it changes back. Plays only while in view.
 */
(function () {
  var el = document.querySelector('[data-dch]');
  if (!el) return;
  var btn = document.querySelector('[data-dch-toggle]');
  var hex = el.querySelector('.dch__fig .dch__hex');
  var del = el.querySelector('.dch__diff .del'), add = el.querySelector('.dch__diff .add');
  var arrows = el.querySelectorAll('.dch__arrow');
  var row = el.querySelector('.dch__var.is-target');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [], loop = null, playing = !reduce, visible = false, toNew = true;
  var A = '#5F2CFF', B = '#0E8A7E';
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function run(a) { a.classList.remove('is-run'); void a.offsetWidth; a.classList.add('is-run'); }
  function cycle() {
    clear();
    var from = toNew ? A : B, to = toNew ? B : A;
    el.classList.remove('is-pressing', 'is-committed', 'is-building', 'is-built', 'is-synced');
    del.textContent = '- "$value": "' + from + '"'; add.textContent = '+ "$value": "' + to + '"';
    at(500, function () { row.classList.add('is-edit'); });
    at(1300, function () { el.classList.toggle('is-new', toNew); hex.textContent = to; });
    at(2600, function () { row.classList.remove('is-edit'); el.classList.add('is-pressing'); });
    at(2850, function () { el.classList.remove('is-pressing'); run(arrows[0]); });
    at(3750, function () { el.classList.add('is-committed', 'is-building'); });
    at(5300, function () { el.classList.remove('is-building'); el.classList.add('is-built'); run(arrows[1]); });
    at(6200, function () { el.classList.add('is-synced'); });
    at(11000, function () { toNew = !toNew; });
  }
  function still() { clear(); el.classList.add('is-new', 'is-committed', 'is-built', 'is-synced'); hex.textContent = B; del.textContent = '- "$value": "' + A + '"'; add.textContent = '+ "$value": "' + B + '"'; }
  function start() { if (loop || !playing || !visible) return; cycle(); loop = setInterval(cycle, 12000); }
  function stop() { clearInterval(loop); loop = null; clear(); }
  function sync() {
    el.classList.toggle('is-paused', !playing);
    if (btn) { btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); btn.querySelector('span').textContent = playing ? 'Pause' : 'Play'; }
    playing ? start() : stop();
  }
  if (reduce) still();
  if (btn) btn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }, { threshold: .3 }).observe(el);
  } else { visible = true; start(); }
})();
