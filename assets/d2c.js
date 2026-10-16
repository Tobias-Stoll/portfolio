/**
 * Design to Code case study.
 * 1. The 60 → 30 merge loop: 60 uneven tiles merge pairwise into 30 clean ones, plays while in view, can be paused.
 * 2. The token tiers: swapping the reference color changes every component, system and component tokens stay.
 */
(function () {
  /* 1 · Merge loop */
  var merge = document.querySelector('[data-merge]');
  if (merge) {
    var field = merge.querySelector('.merge__field');
    var count = merge.querySelector('.merge__count');
    var label = merge.querySelector('.merge__label');
    var pill = merge.querySelector('.merge__pill');
    var btn = merge.querySelector('.merge__btn');
    var W = 720, H = 480, N = 60;
    var greys = ['var(--color-neutral-200, #DCD8D0)', 'var(--color-neutral-300, #CFCAC1)', 'var(--color-neutral-100, #E7E3DC)', 'var(--color-neutral-400, #BDB7AD)'];
    function r(n) { var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
    function pct(v, of) { return (v / of * 100).toFixed(3) + '%'; }
    var tiles = [];
    for (var i = 0; i < N; i++) {
      var el = document.createElement('span');
      el.className = 'merge__tile';
      el.setAttribute('aria-hidden', 'true');
      var col = i % 10, row = Math.floor(i / 10);
      var w0 = 36 + r(i) * 28, h0 = 30 + r(i + 100) * 38;
      var cx = col * 72 + 36 + (r(i + 200) - .5) * 14, cy = row * 80 + 40 + (r(i + 300) - .5) * 14;
      var j = Math.floor(i / 2);
      el.style.backgroundColor = greys[Math.floor(r(i + 500) * 4)];
      el.style.borderRadius = Math.round(2 + r(i + 400) * 10) + 'px';
      el.style.transform = 'rotate(' + ((r(i + 600) - .5) * 8).toFixed(1) + 'deg)';
      el.style.transitionDelay = (col * 25 + row * 15) + 'ms';
      tiles.push({
        el: el,
        before: [cx - w0 / 2, cy - h0 / 2, w0, h0],
        after: [(j % 6) * 120 + 12, Math.floor(j / 6) * 96 + 16, 96, 64]
      });
      field.appendChild(el);
    }
    var after = false;
    function render() {
      merge.classList.toggle('is-after', after);
      tiles.forEach(function (t) {
        var b = after ? t.after : t.before;
        t.el.style.left = pct(b[0], W); t.el.style.top = pct(b[1], H);
        t.el.style.width = pct(b[2], W); t.el.style.height = pct(b[3], H);
      });
      count.textContent = after ? '30' : '60';
      label.textContent = after ? 'standardized core components' : 'components, grown over years';
      pill.textContent = after ? 'After' : 'Before';
    }
    render();

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var playing = !reduce, visible = false, timer = null;
    function sync() {
      clearInterval(timer); timer = null;
      if (playing && visible) timer = setInterval(function () { after = !after; render(); }, 2800);
      btn.textContent = playing ? 'Pause' : 'Play';
      btn.setAttribute('aria-pressed', String(!playing));
    }
    btn.addEventListener('click', function () { playing = !playing; sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: .3 }).observe(merge);
    } else { visible = true; sync(); }
    if (reduce) { after = true; render(); }
  }

  /* 2 · Token tiers: follow the primary or the secondary button down to its locked value */
  var tiersEl = document.querySelector('[data-tiers]');
  if (tiersEl) {
    var chains = {
      primary: { comp: 'button/primary/bg/default', sys: 'color/action/primary/bg/default', ref: 'purple/600', hex: '#5F2CFF', label: 'Create account' },
      secondary: { comp: 'button/secondary/bg/default', sys: 'color/action/secondary/bg/default', ref: 'cyan/600', hex: '#007B99', label: 'Log in' }
    };
    var buttons = tiersEl.querySelectorAll('[data-swap]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        var c = chains[b.getAttribute('data-swap')];
        tiersEl.setAttribute('data-theme', b.getAttribute('data-swap'));
        Array.prototype.forEach.call(buttons, function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        ['comp', 'sys', 'ref', 'hex', 'label'].forEach(function (k) {
          tiersEl.querySelectorAll('[data-' + k + ']').forEach(function (n) {
            if (k === 'comp' || k === 'sys' || k === 'ref') n.innerHTML = c[k].replace(/\//g, '/<wbr>');
            else n.textContent = c[k];
          });
        });
      });
    });
    /* draw the three lines from the measured column centers into the button */
    var svg = tiersEl.querySelector('.map__merge svg');
    var lastLink = tiersEl.querySelectorAll('.map__link');
    lastLink = lastLink[lastLink.length - 1];
    function drawMerge() {
      if (!svg || !lastLink) return;
      var box = svg.getBoundingClientRect();
      if (!box.width) return;
      var w = box.width, h = 56, mid = w / 2;
      svg.setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h);
      var lines = lastLink.querySelectorAll('i');
      svg.querySelectorAll('path').forEach(function (path, k) {
        var r = lines[k].getBoundingClientRect();
        var x = r.left + r.width / 2 - box.left;
        path.setAttribute('d', 'M' + x.toFixed(1) + ' 0 C' + x.toFixed(1) + ' ' + h * .6 + ' ' + mid.toFixed(1) + ' ' + h * .4 + ' ' + mid.toFixed(1) + ' ' + h);
      });
    }
    drawMerge();
    window.addEventListener('resize', drawMerge);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawMerge);

    /* follow a line: hover or focus a chip or a route label to highlight that line */
    tiersEl.querySelectorAll('.map__chip, .map__route').forEach(function (n) {
      var route = n.getAttribute('data-route');
      if (n.classList.contains('map__chip')) n.setAttribute('tabindex', '0');
      ['mouseenter', 'focus'].forEach(function (ev) { n.addEventListener(ev, function () { tiersEl.setAttribute('data-active', route); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { n.addEventListener(ev, function () { tiersEl.removeAttribute('data-active'); }); });
    });
  }
})();
