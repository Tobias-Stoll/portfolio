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

  /* 2 · Token map: switch the variant, follow a line, and one run through all three lines on first view */
  var tiersEl = document.querySelector('[data-tiers]');
  if (tiersEl) {
    var chains = {
      primary: { comp: 'button/primary/bg/default', sys: 'color/action/primary/bg/default', ref: 'purple/600', hex: '#5F2CFF' },
      secondary: { comp: 'button/secondary/bg/default', sys: 'color/action/secondary/bg/default', ref: 'cyan/600', hex: '#007B99' }
    };
    var buttons = tiersEl.querySelectorAll('[data-swap]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        var c = chains[b.getAttribute('data-swap')];
        tiersEl.setAttribute('data-theme', b.getAttribute('data-swap'));
        Array.prototype.forEach.call(buttons, function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        ['comp', 'sys', 'ref', 'hex'].forEach(function (k) {
          tiersEl.querySelectorAll('[data-' + k + ']').forEach(function (n) {
            if (k === 'hex') n.textContent = c[k];
            else n.innerHTML = c[k].replace(/\//g, '/<wbr>');
          });
        });
      });
    });

    /* lines: straight, with rounded corners, from each station up into the button (like the Invia timelines) */
    var svg = tiersEl.querySelector('.map__merge svg');
    var firstLink = tiersEl.querySelector('.map__link');
    var notes = tiersEl.querySelector('.map__notes-svg');
    var grid = tiersEl.querySelector('.map__grid');
    var mapBtn = tiersEl.querySelector('.map__button');
    function centers(box) {
      var cols = {};
      firstLink.querySelectorAll('i').forEach(function (n) {
        var r = n.getBoundingClientRect();
        cols[n.getAttribute('data-route')] = r.left + r.width / 2 - box.left;
      });
      return cols;
    }
    function f(n) { return n.toFixed(1); }
    function drawMerge() {
      if (!svg || !firstLink) return;
      var box = svg.getBoundingClientRect();
      if (!box.width) return;
      var w = box.width, h = box.height || 48, mid = w / 2, t = h / 2, R = 10;
      svg.setAttribute('viewBox', '0 0 ' + f(w) + ' ' + h);
      var cols = centers(box);
      svg.querySelectorAll('path').forEach(function (path) {
        var x = cols[path.getAttribute('data-route')], d;
        if (Math.abs(x - mid) < 2) d = 'M' + f(mid) + ' ' + h + ' V0';
        else {
          var dir = x < mid ? 1 : -1;
          d = 'M' + f(x) + ' ' + h + ' V' + f(t + R) + ' Q' + f(x) + ' ' + f(t) + ' ' + f(x + dir * R) + ' ' + f(t) +
              ' H' + f(mid - dir * R) + ' Q' + f(mid) + ' ' + f(t) + ' ' + f(mid) + ' ' + f(t - R) + ' V0';
        }
        path.setAttribute('d', d);
      });
      drawNotes();
    }
    /* blue arrows from each column label to what it defines on the button */
    function drawNotes() {
      if (!notes || !mapBtn) return;
      var g = grid.getBoundingClientRect(), b = mapBtn.getBoundingClientRect();
      if (!g.width) return;
      notes.setAttribute('viewBox', '0 0 ' + f(g.width) + ' ' + f(g.height));
      notes.querySelectorAll('path[data-note]').forEach(function (n) { n.remove(); });
      var s = parseFloat(getComputedStyle(mapBtn).getPropertyValue('--s')) || 1;
      var px = 16 * s, py = 8 * s;
      var L = b.left - g.left, T = b.top - g.top, Rr = b.right - g.left, B = b.bottom - g.top, CY = (T + B) / 2;
      function from(key) {
        var el = tiersEl.querySelector('.map__label[data-note="' + key + '"]').getBoundingClientRect();
        return { x: el.left + el.width / 2 - g.left, y: el.bottom - g.top + 4 };
      }
      function arrow(key, p0, c1, c2, p1) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('data-note', key);
        path.setAttribute('d', 'M' + f(p0.x) + ' ' + f(p0.y) + ' C' + f(c1.x) + ' ' + f(c1.y) + ' ' + f(c2.x) + ' ' + f(c2.y) + ' ' + f(p1.x) + ' ' + f(p1.y));
        path.setAttribute('marker-end', 'url(#map-arrow)');
        notes.appendChild(path);
      }
      var c = from('color'), r = from('radius'), p = from('padding');
      /* color: into the left face of the fill */
      var tc = { x: L - 4, y: CY + 4 };
      arrow('color', c, { x: c.x, y: CY + 4 }, { x: L - 70, y: CY + 4 }, tc);
      /* radius: down onto the top-left corner */
      var tr = { x: L - 2, y: T - 2 };
      arrow('radius', { x: r.x - 24, y: r.y }, { x: r.x - 60, y: r.y + 14 }, { x: L - 34, y: T - 26 }, tr);
      /* padding x: into the right padding band */
      var tx = { x: Rr - px / 2, y: CY };
      arrow('padx', p, { x: p.x, y: p.y + 40 }, { x: Rr + 60, y: CY }, { x: Rr + 4, y: CY });
      /* padding y: under the button, into the bottom padding band */
      var ty = { x: L + b.width * .62, y: B + 3 };
      arrow('pady', { x: p.x + 6, y: p.y }, { x: p.x + 70, y: p.y + 60 }, { x: ty.x + 40, y: B + 34 }, ty);
    }
    drawMerge();
    window.addEventListener('resize', drawMerge);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawMerge);
    window.addEventListener('load', drawMerge);

    /* follow a line: hover or focus a token or a station */
    var tour = null;
    function stopTour() { if (tour) { tour.forEach(clearTimeout); tour = null; } }
    function light(route) {
      if (route === tiersEl.getAttribute('data-active')) return;
      if (route) {
        tiersEl.setAttribute('data-active', route);
        /* restart the arrival bounce for every new line */
        mapBtn.style.animation = 'none'; void mapBtn.offsetWidth; mapBtn.style.animation = '';
      } else tiersEl.removeAttribute('data-active');
    }
    tiersEl.querySelectorAll('.map__chip, .map__route').forEach(function (n) {
      var route = n.getAttribute('data-route');
      if (n.classList.contains('map__chip')) n.setAttribute('tabindex', '0');
      ['mouseenter', 'focus'].forEach(function (ev) { n.addEventListener(ev, function () { stopTour(); light(route); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { n.addEventListener(ev, function () { light(null); }); });
    });

    /* one run on first view: color, radius, padding */
    var reduceMap = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMap && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        var steps = ['color', 'radius', 'padding', null];
        tour = steps.map(function (r, k) { return setTimeout(function () { light(r); if (r === null) tour = null; }, 400 + k * 1900); });
      }, { threshold: .6 });
      io.observe(tiersEl);
    }
  }
})();
