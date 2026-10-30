/**
 * Prime League hero: animated recreation of the match-first UI.
 * A 14 s loop: countdown ticks, Discord toasts arrive, the player checks in, the tab moves to "watch",
 * a result reorders the standings. Plays only while in view; Pause stops it; reduced motion shows a still frame.
 */
(function () {
  var el = document.querySelector('[data-plh]');
  if (!el) return;
  var btn = document.querySelector('[data-plh-toggle]');
  var count = el.querySelector('.plh__count');
  var players = el.querySelector('.plh__players b');
  var toast = el.querySelector('.plh__toast');
  var tTitle = toast.querySelector('b'), tSub = toast.querySelector('small');
  var tabs = el.querySelectorAll('.plh__tabs span');
  var badge = el.querySelector('.plh__badge');
  var rows = Array.prototype.slice.call(el.querySelectorAll('.plh__stand li'));
  var check = el.querySelector('.plh__check');
  var toasts = [
    ['Spielzeit bestätigt', 'Kraken Kiel vs Berlin Owls · heute 20:00'],
    ['Berlin Owls hat eingecheckt', 'Dein Match startet in 15 Minuten'],
    ['Ergebnis eingetragen', 'Kraken Kiel gewinnt 2:0, Platz 2']
  ];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOOP = 14, t = 0, secs = 899, timer = null, playing = !reduce, visible = false, nBadge = 0;

  function order(list) { list.forEach(function (r, i) { r.style.top = (i * 2.2) + 'em'; r.firstElementChild.textContent = i + 1; }); }
  var start = rows.slice();
  function showToast(i) {
    tTitle.textContent = toasts[i][0]; tSub.textContent = toasts[i][1];
    toast.classList.add('is-on'); nBadge++; badge.textContent = nBadge; el.classList.add('has-badge');
    setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
  }
  function fmt(s) { var m = Math.floor(s / 60), x = s % 60; return '00:' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function reset() {
    t = 0; secs = 899; nBadge = 0; el.classList.remove('is-checked', 'has-badge', 'is-pressing');
    players.textContent = '4/5'; check.textContent = 'Check-in'; tabs.forEach(function (x, i) { x.classList.toggle('is-on', i === 0); });
    rows.forEach(function (r) { r.classList.remove('is-up'); }); start[2].lastElementChild.textContent = '8'; order(start); count.textContent = fmt(secs);
  }
  function step() {
    t++; secs = Math.max(0, secs - 1); count.textContent = fmt(secs);
    if (t === 2) showToast(0);
    if (t === 5) el.classList.add('is-pressing');
    if (t === 5) setTimeout(function () { el.classList.remove('is-pressing'); el.classList.add('is-checked'); players.textContent = '5/5'; check.textContent = 'Eingecheckt ✓'; }, 250);
    if (t === 7) showToast(1);
    if (t === 10) { tabs.forEach(function (x, i) { x.classList.toggle('is-on', i === 2); }); }
    if (t === 11) { showToast(2); var r = start.slice(); var up = r.splice(2, 1)[0]; r.splice(1, 0, up); up.classList.add('is-up'); up.lastElementChild.textContent = '11'; order(r); }
    if (t >= LOOP) reset();
  }
  function run() { if (!timer && playing && visible) timer = setInterval(step, 1000); }
  function stop() { clearInterval(timer); timer = null; }
  function sync() {
    el.classList.toggle('is-paused', !playing);
    if (btn) { btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); btn.querySelector('span').textContent = playing ? 'Pause' : 'Play'; }
    playing ? run() : stop();
  }
  order(start); count.textContent = fmt(secs);
  if (reduce) { el.classList.add('is-checked', 'has-badge'); players.textContent = '5/5'; check.textContent = 'Eingecheckt ✓'; badge.textContent = '1'; tTitle.textContent = toasts[0][0]; tSub.textContent = toasts[0][1]; toast.classList.add('is-on'); }
  if (btn) btn.addEventListener('click', function () { playing = !playing; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? run() : stop(); }, { threshold: .3 }).observe(el);
  } else { visible = true; run(); }
  sync();
})();
