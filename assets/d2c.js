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
      label.textContent = after ? 'core components' : 'components';
      pill.textContent = after ? 'After' : 'Before';
    }
    render();

    /* plays 3 times (60 → 30), then rests on 30; Play starts it again */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var RUNS = 3, steps = 0, playing = !reduce, visible = false, timer = null;
    var ICON_PAUSE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/></svg>';
    var ICON_PLAY = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7z" fill="currentColor"/></svg>';
    function tick() {
      after = !after; render(); steps++;
      if (steps >= RUNS * 2 - 1) { playing = false; sync(); }
    }
    function sync() {
      clearInterval(timer); timer = null;
      if (playing && visible) timer = setInterval(tick, 2800);
      btn.innerHTML = (playing ? ICON_PAUSE : ICON_PLAY) + '<span>' + (playing ? 'Pause' : 'Play') + '</span>';
      btn.setAttribute('aria-label', playing ? 'Pause the animation' : 'Play the animation');
    }
    btn.addEventListener('click', function () {
      if (!playing && steps >= RUNS * 2 - 1) { steps = 0; after = false; render(); }
      playing = !playing; sync();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: .3 }).observe(merge);
    } else { visible = true; sync(); }
    if (reduce) { after = true; render(); sync(); }
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
        tiersEl.querySelectorAll('[data-btnname]').forEach(function (n) { n.textContent = 'Button / ' + (b.getAttribute('data-swap') === 'primary' ? 'Primary' : 'Secondary'); });
        drawMerge();
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

  /* 3 · Atom (decision 1): the electrons stand still for reduced motion */
})();

/* Atom in perspective: the orbits are seen from the side, nodes in front are larger and sit above the core.
   The plane sways a little on its own, follows the mouse with a soft spring and settles back when the mouse leaves. */
(function () {
  var frame = document.querySelector('.atom__frame');
  if (!frame) return;
  var svg = frame.querySelector('.atom__svg');
  var orbits = svg.querySelectorAll('.atom__orbit');
  var spokes = svg.querySelectorAll('.atom__spokes line');
  var electrons = svg.querySelectorAll('.atom__electron');
  var core = frame.querySelector('.atom__core');
  var CX = 500, CY = 340, W = 1000, H = 680;
  /* angle in degrees, 90 = front (bottom), 270 = back (top) */
  var plan = {
    claude:    { orbit: 0, a: 180 },
    bridge:    { orbit: 0, a: 250 },
    mcp:       { orbit: 0, a: 112 },
    github:    { orbit: 1, a: 0 },
    storybook: { orbit: 1, a: 302 },
    marketing: { orbit: 1, a: 66 }
  };
  var RX = [330, 405];
  var nodes = Array.prototype.map.call(frame.querySelectorAll('.atom__node'), function (el) {
    var p = plan[el.getAttribute('data-node')] || { orbit: 0, a: 0 };
    el.style.left = ''; el.style.top = '';
    return { el: el, orbit: p.orbit, a: p.a };
  });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var tilt = 0.55, spin = 0, par = 0;           /* current values */
  var tTilt = 0.55, tSpin = 0, tPar = 0;        /* targets */
  var hover = false, t0 = performance.now(), running = false, visible = false;

  function point(orbit, deg) {
    var r = deg * Math.PI / 180;
    return { x: CX + RX[orbit] * Math.cos(r), y: CY + RX[orbit] * tilt * Math.sin(r), d: Math.sin(r) };
  }
  function place(el, p, base) {
    var depth = (p.d + 1) / 2;                  /* 0 back, 1 front */
    el.style.left = (p.x / W * 100).toFixed(3) + '%';
    el.style.top = (p.y / H * 100).toFixed(3) + '%';
    el.style.setProperty('--s', (base + (1 - base) * depth).toFixed(3));
    el.style.zIndex = p.d > 0.1 ? 3 : 1;
    el.style.opacity = (0.82 + 0.18 * depth).toFixed(3);
  }
  function draw(now) {
    var t = (now - t0) / 1000;
    var sway = reduce ? 0 : 7 * Math.sin(t / 5.5);
    var k = 0.075;
    tilt += (tTilt - tilt) * k; spin += (tSpin - spin) * k; par += (tPar - par) * k;
    var off = spin + (hover ? 0 : sway);
    orbits[0].setAttribute('rx', RX[0]); orbits[1].setAttribute('rx', RX[1]);
    orbits[0].setAttribute('ry', (RX[0] * tilt).toFixed(1));
    orbits[1].setAttribute('ry', (RX[1] * tilt).toFixed(1));
    nodes.forEach(function (n, i) {
      var p = point(n.orbit, n.a + off);
      place(n.el, p, 0.84);
      if (spokes[i]) { spokes[i].setAttribute('x2', p.x.toFixed(1)); spokes[i].setAttribute('y2', p.y.toFixed(1)); }
    });
    core.style.setProperty('--px', (par * -10).toFixed(2) + 'px');
    if (!reduce) {
      electrons.forEach(function (e, i) {
        var deg = (t * (i ? 16 : 26) + (i ? 200 : 20)) % 360;
        var p = point(i, deg);
        e.setAttribute('cx', p.x.toFixed(1)); e.setAttribute('cy', p.y.toFixed(1));
        e.setAttribute('r', (3.5 + 2.5 * (p.d + 1) / 2).toFixed(2));
      });
    } else {
      electrons.forEach(function (e) { e.style.display = 'none'; });
    }
  }
  function loop(now) {
    draw(now);
    if (running) requestAnimationFrame(loop);
  }
  function sync() {
    var should = visible && !reduce;
    if (should && !running) { running = true; requestAnimationFrame(loop); }
    if (!should) running = false;
  }
  frame.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = frame.getBoundingClientRect();
    var mx = (e.clientX - r.left) / r.width - 0.5;   /* -0.5 … 0.5 */
    var my = (e.clientY - r.top) / r.height - 0.5;
    tSpin = mx * -30;                 /* the plane turns toward the cursor */
    tTilt = 0.55 + my * 0.2;          /* higher cursor, flatter view */
    tPar = mx;
    hover = true;
  });
  frame.addEventListener('pointerleave', function () { tSpin = 0; tTilt = 0.55; tPar = 0; hover = false; });

  draw(performance.now());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }).observe(frame);
  } else { visible = true; sync(); }
})();
