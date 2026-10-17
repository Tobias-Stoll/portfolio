/**
 * Landing page behaviour: header state, km markers + route line, row previews,
 * Fun video, notes wall (Supabase, moderated) and copy email.
 */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
   * Notes backend. Leave empty for preview mode (nothing is stored).
   * Setup: see tools/notes/README.md. The anon key is public by design; the
   * row level security policies decide what it can do.
   * ------------------------------------------------------------------ */
  const NOTES = {
    url: 'https://paaocbyjevitxiugvdar.supabase.co',
    anonKey: 'sb_publishable_oIb6RLrCkn1BmzIxIODrZQ_lo2UHQHC',   // publishable key: public by design, grants and RLS decide what it can do
  };
  /* Publishable keys go in the apikey header only. A legacy anon key (a JWT, starts with eyJ) also goes in Authorization. */
  const notesHeaders = (extra = {}) => Object.assign(
    { apikey: NOTES.anonKey },
    NOTES.anonKey.startsWith('eyJ') ? { Authorization: `Bearer ${NOTES.anonKey}` } : {},
    extra
  );
  const RIDE_KM = 207; // Dresden → Berlin, 4 Oct 2026

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: border on scroll, active section ---------- */
  const header = $('.hd');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const navLinks = $$('.hd__nav a');
  const sections = navLinks.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- km markers + route line ---------- */
  const kickers = $$('.kicker[data-km]');
  const route = $('.route');
  const line = $('.route__line');
  const track = $('.route__track');
  const marks = $('.route__marks');
  let samples = [];   // [{len, y}] along the path, for scroll → length lookup
  let total = 0;
  let dots = [];
  let rider;

  const docTop = el => el.getBoundingClientRect().top + scrollY;

  function labelKm() {
    if (kickers.length < 2) return;
    const first = docTop(kickers[0]);
    const last = docTop(kickers[kickers.length - 1]);
    kickers.forEach(k => {
      const km = Math.round(RIDE_KM * (docTop(k) - first) / Math.max(1, last - first));
      k.dataset.kmLabel = String(km).padStart(3, '0');
    });
  }

  function buildRoute() {
    if (!route || getComputedStyle(route).display === 'none') return;
    const wrap = $('.wrap');
    const x0 = wrap.getBoundingClientRect().left + 8; // just left of the content column
    route.setAttribute('height', 0); // measure the page without the old route height
    route.setAttribute('height', document.documentElement.scrollHeight);
    route.setAttribute('viewBox', `0 0 ${innerWidth} ${document.documentElement.scrollHeight}`);
    route.setAttribute('width', innerWidth);

    const pts = kickers.map(k => ({ x: x0 - 24, y: docTop(k) + 8 }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const dy = b.y - a.y;
      const swing = (i % 2 ? -1 : 1) * Math.min(28, x0 - 40); // gentle S-curves in the gutter
      d += ` C ${a.x + swing} ${a.y + dy * .35}, ${b.x - swing} ${b.y - dy * .35}, ${b.x} ${b.y}`;
    }
    line.setAttribute('d', d);
    track.setAttribute('d', d);
    total = line.getTotalLength();
    line.style.strokeDasharray = `${total}`;

    samples = [];
    for (let l = 0; l <= total; l += 12) samples.push({ len: l, y: line.getPointAtLength(l).y });

    marks.innerHTML = '';
    dots = pts.map(p => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 6);
      c.setAttribute('class', 'route__dot');
      marks.appendChild(c);
      return { el: c, y: p.y };
    });
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', 12); halo.setAttribute('class', 'route__rider-halo');
    rider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rider.setAttribute('r', 5); rider.setAttribute('class', 'route__rider');
    marks.append(halo, rider);
    rider.halo = halo;
    drawRoute();
  }

  function drawRoute() {
    if (!samples.length) return;
    const target = scrollY + innerHeight * .55;
    let len = total;
    if (!reduced) {
      const hit = samples.find(s => s.y >= target);
      len = hit ? hit.len : total;
    }
    line.style.strokeDashoffset = `${total - len}`;
    const p = line.getPointAtLength(len);
    rider.setAttribute('cx', p.x); rider.setAttribute('cy', p.y);
    rider.halo.setAttribute('cx', p.x); rider.halo.setAttribute('cy', p.y);
    dots.forEach(dot => dot.el.classList.toggle('is-passed', dot.y <= p.y + 1));
  }

  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawRoute(); }); }, { passive: true });
  let rt;
  const relayout = () => { clearTimeout(rt); rt = setTimeout(() => { labelKm(); buildRoute(); }, 120); };
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  if (document.fonts) document.fonts.ready.then(relayout);
  labelKm();
  buildRoute();

  /* ---------- More work: image follows the cursor ---------- */
  const peek = $('.peek');
  if (peek && matchMedia('(hover: hover)').matches) {
    $$('.row[data-preview]').forEach(row => {
      row.addEventListener('mouseenter', () => { peek.src = row.dataset.preview; peek.classList.add('is-on'); });
      row.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
      row.addEventListener('mousemove', e => {
        peek.style.left = `${Math.min(e.clientX + 40 + peek.offsetWidth / 2, innerWidth - peek.offsetWidth / 2 - 16)}px`;
        const h = peek.offsetHeight / 2;
        peek.style.top = `${Math.max(h + 16, Math.min(e.clientY, innerHeight - h - 16))}px`;
      });
    });
  }

  /* ---------- Fun: play the story while it's on screen ---------- */
  // WCAG 2.2.2: the looping video gets a visible pause/play control; a pause by the user is respected
  const video = $('.fun video');
  const vidBtn = $('#vid-toggle');
  let userPaused = false;
  const setVidBtn = () => { const on = !video.paused; vidBtn.innerHTML = on ? '<span aria-hidden="true">❚❚</span> Pause video' : '<span aria-hidden="true">▶</span> Play video'; vidBtn.setAttribute('aria-pressed', String(!on)); };
  if (video && vidBtn) {
    vidBtn.hidden = false;
    vidBtn.addEventListener('click', () => {
      if (video.paused) { userPaused = false; video.play().catch(() => {}); } else { userPaused = true; video.pause(); }
    });
    video.addEventListener('play', setVidBtn); video.addEventListener('pause', setVidBtn); setVidBtn();
  }
  if (video && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) { video.preload = 'auto'; video.play().catch(() => {}); }
      else if (!e.isIntersecting) video.pause();
    }, { threshold: .35 }).observe(video);
  }

  /* ---------- Invia card: offer box animation ---------- */
  $$('.case__stage--anim').forEach(stage => {
    const fit = () => stage.style.setProperty('--s', stage.clientWidth / 432);
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
    if ('IntersectionObserver' in window) {
      // plays once when it scrolls into view (4.8 s), then rests on the new design
      new IntersectionObserver(([e]) => stage.classList.toggle('is-playing', e.isIntersecting), { threshold: .3 }).observe(stage);
      // hover or keyboard focus on the card plays it again
      const card = stage.closest('.case__link');
      const replay = () => { stage.classList.remove('is-playing'); void stage.offsetWidth; stage.classList.add('is-playing'); };
      card?.addEventListener('mouseenter', replay); card?.addEventListener('focus', replay);
    } else {
      stage.classList.add('is-playing');
    }
  });

  /* ---------- Notes wall ---------- */
  const wall = $('#wall');
  const form = $('#note-form');
  const msg = $('#note-msg');
  const nameIn = $('#note-name');
  const count = $('#note-count');
  const err = $('#note-err');
  const status = $('#note-status');
  const live = Boolean(NOTES.url && NOTES.anonKey);
  const papers = [
    ['--color-amber-100', '--color-red-500'],
    ['--color-cyan-100', '--color-cyan-600'],
    ['--color-green-100', '--color-green-600'],
    ['--color-red-100', '--color-purple-600'],
    ['--color-blue-100', '--color-amber-500'],
  ];
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

  function noteEl({ name, message, created_at }, { pending = false } = {}) {
    const h = Math.abs(hash(message + (created_at || '')));
    const [paper, pin] = papers[h % papers.length];
    const el = document.createElement('article');
    el.className = 'note';
    el.style.setProperty('--_paper', `var(${paper})`);
    el.style.setProperty('--_pin', `var(${pin})`);
    el.style.setProperty('--_r', `${((h % 7) - 3) * .8}deg`);
    const p = document.createElement('p'); p.className = 'note__text'; p.textContent = message;
    const by = document.createElement('p'); by.className = 'note__by'; by.textContent = name || 'Anonymous';
    el.append(p);
    if (pending) {
      const chip = document.createElement('span');
      chip.className = 'chip note__pending'; chip.textContent = 'Only you see this until it is approved';
      el.append(chip);
    }
    el.append(by);
    return el;
  }

  async function loadNotes() {
    if (!live) return;
    try {
      const r = await fetch(`${NOTES.url}/rest/v1/notes?select=name,message,created_at&order=created_at.desc&limit=60`, {
        headers: notesHeaders(),
      });
      if (!r.ok) throw new Error(r.status);
      (await r.json()).forEach(n => wall.appendChild(noteEl(n)));
    } catch (e) {
      console.warn('[notes] could not load', e);
    }
  }

  const updateCount = () => { count.textContent = `${msg.value.length} / 280`; };
  msg.addEventListener('input', () => { updateCount(); if (msg.value.trim()) setError(''); });
  updateCount();

  function setError(text) {
    err.textContent = text;
    msg.closest('.form-field').classList.toggle('form-field--error', Boolean(text));
    msg.setAttribute('aria-invalid', text ? 'true' : 'false');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    const message = msg.value.trim();
    const name = nameIn.value.trim().slice(0, 40);
    if ($('#note-website').value) return;            // bot filled the honeypot
    if (!message) { setError('Write a few words first.'); msg.focus(); return; }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      if (live) {
        const r = await fetch(`${NOTES.url}/rest/v1/notes`, {
          method: 'POST',
          headers: notesHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
          body: JSON.stringify({ name: name || null, message }),
        });
        if (!r.ok) throw new Error(r.status);
      }
      const el = noteEl({ name, message, created_at: new Date().toISOString() }, { pending: true });
      el.classList.add('is-new');
      form.after(el);
      form.reset(); updateCount(); setError('');
      status.textContent = live
        ? 'Pinned. It shows up for everyone once I have read it.'
        : 'Preview mode: your note is shown here, but not saved yet.';
    } catch (e2) {
      status.textContent = '';
      setError('Your note could not be sent. Check your connection and try again.');
    } finally {
      btn.disabled = false;
    }
  });
  loadNotes();

  /* ---------- Copy email ---------- */
  const copyBtn = $('#copy-mail');
  const mail = $('#mail');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mail.textContent.trim());
      copyBtn.textContent = 'Copied';
    } catch {
      const sel = getSelection(); const range = document.createRange();
      range.selectNodeContents(mail); sel.removeAllRanges(); sel.addRange(range);
      copyBtn.textContent = 'Selected, press ⌘C';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 2200);
  });

  /* ---------- My path: draw the line once it scrolls into view ---------- */
  const path = $('.path');
  if (path && !matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    path.classList.add('is-armed');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { path.classList.add('is-drawn'); io.disconnect(); }
    }), { threshold: .6 });
    io.observe(path);
  }

  /* ---------- About photo: two shots, one polaroid ---------- */
  const polaroid = $('#polaroid');
  if (polaroid) {
    const toggles = [...document.querySelectorAll('.shot-toggle button')];
    const show = shot => {
      if (polaroid.dataset.shot === shot) return;
      polaroid.dataset.shot = shot;
      toggles.forEach(b => b.setAttribute('aria-pressed', b.dataset.shot === shot));
      polaroid.classList.remove('is-flipping'); void polaroid.offsetWidth; polaroid.classList.add('is-flipping');
    };
    polaroid.addEventListener('animationend', () => polaroid.classList.remove('is-flipping'));
    $('#polaroid-flip').addEventListener('click', () => show(polaroid.dataset.shot === 'bike' ? 'stage' : 'bike'));
    toggles.forEach(b => b.addEventListener('click', () => show(b.dataset.shot)));
  }
})();
