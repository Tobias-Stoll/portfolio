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

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: fold, shortcuts and active section live in assets/site-nav.js */

  /* ---------- More work: image follows the cursor ---------- */
  const peek = $('.peek');
  if (peek && matchMedia('(hover: hover)').matches) {
    $$('.work-row[data-preview]').forEach(row => {
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
  $$('.case-card__stage--anim').forEach(stage => {
    const fit = () => stage.style.setProperty('--s', stage.clientWidth / 432);
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
    if ('IntersectionObserver' in window) {
      // plays once when it scrolls into view (4.8 s), then rests on the new design
      new IntersectionObserver(([e]) => stage.classList.toggle('is-playing', e.isIntersecting), { threshold: .3 }).observe(stage);
      // hover or keyboard focus on the card plays it again
      const card = stage.closest('.case-card__link');
      const replay = () => { stage.classList.remove('is-playing'); void stage.offsetWidth; stage.classList.add('is-playing'); };
      card?.addEventListener('mouseenter', replay); card?.addEventListener('focus', replay);
    } else {
      stage.classList.add('is-playing');
    }
  });

  /* ---------- Hero: local time in Berlin (bottom right) ---------- */
  const heroTime = $('#hero-time');
  if (heroTime) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    const tick = () => {
      const now = new Date(); const parts = fmt.formatToParts(now);
      const v = (t) => parts.find((p) => p.type === t)?.value || '';
      heroTime.querySelector('.clock__h').textContent = v('hour');
      heroTime.querySelector('.clock__m').textContent = v('minute');
      heroTime.querySelector('.clock__tz').textContent = v('timeZoneName');
      heroTime.dateTime = now.toISOString();
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- Notes wall ---------- */
  const wall = $('#wall');
  const form = $('#note-form');
  const msg = $('#note-msg');
  const nameIn = $('#note-name');
  const count = $('#note-count');
  const err = $('#note-err');
  const status = $('#note-status');
  const live = Boolean(NOTES.url && NOTES.anonKey);

  // the form starts closed: a "Write a note" button first, the fields open on demand (keyboard users are not dropped into a text field)
  const intro = $('#note-intro'), fields = $('#note-fields'), opener = $('#note-open');
  if (intro && fields && opener) {
    intro.hidden = false; fields.hidden = true;
    const openForm = () => {
      if (!fields.hidden) return;
      fields.hidden = false; intro.hidden = true; opener.setAttribute('aria-expanded', 'true');
      msg.focus();
    };
    opener.addEventListener('click', openForm);
    intro.addEventListener('click', (e) => { if (!e.target.closest('button')) openForm(); });   // the whole page of the pad works for the mouse
  }
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
    el.style.setProperty('--note-tilt', `${((h % 7) - 3) * .8}deg`);
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
