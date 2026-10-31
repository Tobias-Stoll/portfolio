/**
 * Design to Code hero: a button is rebuilt from tokens. 15 s loop:
 * in Figma color, padding and radius change one after another and the button follows each step,
 * Token Bridge exports all three as one commit, the GitHub Action builds, Storybook updates.
 * Next loop changes back. Plays only while in view; still frame for reduced motion.
 */
(function () {
  var el = document.querySelector('[data-dch]');
  if (!el) return;
  var btn = document.querySelector('[data-dch-toggle]');
  var diff = el.querySelector('[data-diff]');
  var arrows = el.querySelectorAll('.dch__arrow');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [], loop = null, playing = !reduce, visible = false, toNew = true;
  // Two states of the button. em values mirror the px values at the sketch's scale.
  var S = [
    { bg: '#5F2CFF', pad: [8, 16], r: 6,   em: { py: '.57em', px: '1.14em', r: '.43em' } },
    { bg: '#0E8A7E', pad: [12, 24], r: 999, em: { py: '.86em', px: '1.71em', r: '2em' } }
  ];
  function $(sel) { return el.querySelector(sel); }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function run(a) { a.classList.remove('is-run'); void a.offsetWidth; a.classList.add('is-run'); }
  function set(k, v) { el.style.setProperty(k, v); }
  function edit(row, on) { $('[data-row="' + row + '"]').classList.toggle('is-edit', on); }
  function figma(key, st) {
    if (key === 'bg') { set('--f-bg', st.bg); $('[data-val="bg"]').textContent = st.bg; }
    if (key === 'pad') { set('--f-py', st.em.py); set('--f-px', st.em.px); $('[data-val="pad"]').textContent = st.pad[0] + ' · ' + st.pad[1]; }
    if (key === 'r') { set('--f-r', st.em.r); $('[data-val="r"]').textContent = st.r; }
  }
  function storybook(st) {
    set('--s-bg', st.bg); set('--s-py', st.em.py); set('--s-px', st.em.px); set('--s-r', st.em.r);
    $('[data-sb="pad"]').textContent = st.pad[0] + 'px ' + st.pad[1] + 'px';
    $('[data-sb="r"]').textContent = st.r + 'px';
  }
  function writeDiff(a, b) {
    function l(c, k, v) { return '<div class="' + c + '">' + (c === 'del' ? '- ' : '+ ') + '"' + k + '": "' + v + '"</div>'; }
    diff.innerHTML = l('del', 'brand-600', a.bg) + l('add', 'brand-600', b.bg) +
      l('del', 'button-padding', a.pad[0] + 'px ' + a.pad[1] + 'px') + l('add', 'button-padding', b.pad[0] + 'px ' + b.pad[1] + 'px') +
      l('del', 'button-radius', a.r + 'px') + l('add', 'button-radius', b.r + 'px');
  }
  function cycle() {
    clear();
    var from = S[toNew ? 0 : 1], to = S[toNew ? 1 : 0];
    el.classList.remove('is-pressing', 'is-committed', 'is-building', 'is-built', 'is-synced');
    writeDiff(from, to);
    var t = 500;
    ['bg', 'pad', 'r'].forEach(function (k) {
      at(t, function () { edit(k, true); });
      at(t + 700, function () { figma(k, to); });
      at(t + 1500, function () { edit(k, false); });
      t += 1600;
    });
    at(t + 100, function () { el.classList.add('is-pressing'); });
    at(t + 350, function () { el.classList.remove('is-pressing'); run(arrows[0]); });
    at(t + 1250, function () { el.classList.add('is-committed', 'is-building'); });
    at(t + 2700, function () { el.classList.remove('is-building'); el.classList.add('is-built'); run(arrows[1]); });
    at(t + 3600, function () { el.classList.add('is-synced'); storybook(to); });
    at(14500, function () { toNew = !toNew; });
  }
  function still() {
    clear(); ['bg', 'pad', 'r'].forEach(function (k) { figma(k, S[1]); }); storybook(S[1]); writeDiff(S[0], S[1]);
    el.classList.add('is-committed', 'is-built', 'is-synced');
  }
  function start() { if (loop || !playing || !visible) return; cycle(); loop = setInterval(cycle, 15000); }
  function stop() { clearInterval(loop); loop = null; clear(); }
  function sync() {
    el.classList.toggle('is-paused', !playing);
    if (btn) { btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); btn.querySelector('span').textContent = playing ? 'Pause' : 'Play'; }
    playing ? start() : stop();
  }
  writeDiff(S[0], S[1]);
  if (reduce) still();
  if (btn) btn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }, { threshold: .3 }).observe(el);
  } else { visible = true; start(); }
})();
