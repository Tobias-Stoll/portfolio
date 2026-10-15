/* Lightbox: clickable screenshots (a.figure__link → image) open in a modal dialog.
   Native <dialog>: focus stays inside, Escape closes, focus returns to the screenshot.
   The image shows at its own size (never upscaled), shrunk only to fit the window.
   Without JS the link still opens the image. */
(() => {
  const links = [...document.querySelectorAll('a.figure__link[href$=".png"], a.figure__link[href$=".jpg"], a.figure__link[href$=".webp"]')];
  if (!links.length || typeof HTMLDialogElement !== 'function') return;

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-labelledby', 'lightbox-title');
  dlg.innerHTML =
    '<div class="lightbox__bar">' +
      '<p class="lightbox__title text-label" id="lightbox-title"></p>' +
      '<button type="button" class="btn btn--ghost lightbox__close" aria-label="Close">' +
        '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Close</button>' +
    '</div>' +
    '<div class="lightbox__stage"><img class="lightbox__img" alt=""></div>';
  document.body.append(dlg);
  const img = dlg.querySelector('.lightbox__img');
  const title = dlg.querySelector('.lightbox__title');

  // Title: the screenshot's own label, else the bold lead of its caption, else its alt text
  const clean = t => t.replace(/\s+/g, ' ').trim();
  const labelFor = a => {
    const item = a.closest('.ft-shot, .ft-step, .evo__step, .abtest__item, .platforms__item');
    const tag = item && item.querySelector('.ft-shot__tag, .ft__tag, .evo__tag, .abtest__tag');
    if (tag) return [...tag.childNodes].map(n => clean(n.textContent)).filter(Boolean).join(' · ');
    const fig = a.closest('figure');
    const lead = fig?.querySelector('figcaption b');
    const shared = fig && fig.querySelectorAll('a.figure__link').length > 1;   // pairs share one caption
    if (lead && !shared) return clean(lead.textContent).replace(/[.:,;]+$/, '');
    let alt = clean(a.querySelector('img')?.alt || '').split(/[:.](\s|$)/)[0];
    return alt ? (alt.length > 70 ? alt.slice(0, 67) + '…' : alt) : 'Screenshot';
  };

  links.forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;   // keep "open in new tab"
    e.preventDefault();
    const src = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = src ? src.alt : '';
    if (src && src.getAttribute('width')) { img.width = +src.getAttribute('width'); img.height = +src.getAttribute('height'); }
    img.classList.toggle('on-dark', !!(src && src.classList.contains('on-dark')));
    title.textContent = labelFor(a);
    dlg.showModal();
    document.documentElement.classList.add('has-lightbox');
    dlg.querySelector('.lightbox__close').focus();
  }));

  dlg.querySelector('.lightbox__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('lightbox__stage')) dlg.close(); });
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('has-lightbox'); img.removeAttribute('src'); });
})();
