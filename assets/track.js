// Event tracking on top of GoatCounter (no cookies, no personal data).
// Needs assets/count.js on the same page. Own visits stay hidden via #toggle-goatcounter.
//
// Events appear in the GoatCounter dashboard under "Events" with these paths:
//   scroll/<page>/<25|50|75|100>   deepest scroll point reached (share of <main>)
//   section/<page>/<section-id>    section scrolled into view
//   click/<target>                 contact + outbound clicks (email, linkedin, cv, repo, ...)
//   case/<slug>                    click on a case study card or link
//   ui/<page>/<label>              first use of an interactive element per page view
//   note/submit                    Notes wall form sent
//
// Optional overrides in HTML: data-track="my-label" on any element.
;(function () {
	'use strict'

	// ---------- helpers ----------
	var queue = [], tries = 0, seen = {}

	var page = (function () {
		var seg = location.pathname.split('/').filter(Boolean)
		if (seg[0] === 'portfolio') seg.shift() // github.io/portfolio fallback
		return seg[0] && seg[0] !== 'index.html' ? seg[0] : 'home'
	})()

	function slug(s, max) {
		return String(s || '')
			.toLowerCase()
			.replace(/[äöüß]/g, function (c) { return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c] })
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, max || 40)
	}

	function ready() {
		return window.goatcounter && typeof window.goatcounter.count === 'function'
	}

	function flush() {
		if (!ready()) {
			if (++tries < 40) setTimeout(flush, 250) // count.js loads async
			return
		}
		while (queue.length) {
			var e = queue.shift()
			window.goatcounter.count({ path: e.path, title: e.title, event: true })
		}
	}

	// Send one event. once=true: only once per page view.
	function track(path, title, once) {
		if (once) {
			if (seen[path]) return
			seen[path] = true
		}
		queue.push({ path: path, title: title || path })
		flush()
	}

	// ---------- scroll depth (share of <main>) ----------
	var main = document.querySelector('main') || document.body
	var marks = [25, 50, 75, 100], hit = {}, ticking = false

	function depth() {
		ticking = false
		var r = main.getBoundingClientRect()
		var total = r.height
		if (total <= window.innerHeight * 1.2) return // page barely scrolls
		var seenPx = window.innerHeight - r.top
		var pct = Math.min(100, Math.max(0, (seenPx / total) * 100))
		marks.forEach(function (m) {
			if (pct >= m - 0.5 && !hit[m]) {
				hit[m] = true
				track('scroll/' + page + '/' + m, 'Scroll ' + m + '% · ' + page)
			}
		})
	}

	window.addEventListener('scroll', function () {
		if (!ticking) { ticking = true; requestAnimationFrame(depth) }
	}, { passive: true })

	// ---------- section reach ----------
	function watchSections() {
		if (!('IntersectionObserver' in window)) return
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return
				var name = en.target.id || en.target.getAttribute('aria-labelledby')
				if (name) track('section/' + page + '/' + slug(name, 50), 'Section ' + name + ' · ' + page, true)
				io.unobserve(en.target)
			})
		}, { rootMargin: '0px 0px -40% 0px', threshold: 0 })
		document.querySelectorAll('main section[id], main section[aria-labelledby]').forEach(function (s) { io.observe(s) })
	}

	// ---------- clicks ----------
	function labelOf(el) {
		var d = el.dataset || {}
		if (d.track) return slug(d.track)
		if (d.step !== undefined) return 'step-' + (parseInt(d.step, 10) + 1)
		if (d.swap) return 'swap-' + slug(d.swap)
		if (d.shot) return 'shot-' + slug(d.shot)
		if (el.id) return slug(el.id)
		var aria = el.getAttribute('aria-label')
		if (aria) return slug(aria)
		return slug(el.textContent) || el.tagName.toLowerCase()
	}

	function linkTarget(a) {
		var href = a.getAttribute('href') || ''
		if (/^mailto:/i.test(href)) return 'click/email'
		if (/^tel:/i.test(href)) return 'click/phone'
		var u
		try { u = new URL(a.href, location.href) } catch (e) { return null }
		var host = u.hostname.replace(/^www\./, '')
		if (host === location.hostname.replace(/^www\./, '') || host === 'tobias-stoll.github.io' && /^\/portfolio/.test(u.pathname)) {
			// internal link: only case study cards are interesting
			var m = u.pathname.replace(/^\/portfolio/, '').match(/^\/(invia|design-to-code|prime-league|ride-recap|playground)\/?/)
			if (m && (a.closest('.case, .card, [class*="case"], [class*="card"]') || a.classList.contains('btn'))) return 'case/' + m[1]
			return null
		}
		if (host === 'linkedin.com' || host.slice(-13) === '.linkedin.com') return 'click/linkedin'
		if (host === 'instagram.com') return 'click/instagram'
		if (host === 'drive.proton.me') return 'click/cv'
		if (host === 'github.com') return 'click/repo'
		if (host === 'tobias-stoll.github.io' && /^\/DesignSystem/i.test(u.pathname)) return 'click/design-system'
		if (host === 'figma.com') return 'click/figma'
		return 'click/external/' + slug(host)
	}

	function onClick(e) {
		if (!e.isTrusted) return // ignore scripted clicks (auto-playing demos)
		var el = e.target.closest ? e.target.closest('[data-track], a[href], button, summary, [role="tab"], [role="switch"], label') : null
		if (!el) return

		// 1. explicit data-track always wins (counted every time)
		if (el.dataset && el.dataset.track) {
			track('click/' + slug(el.dataset.track), el.textContent.trim().slice(0, 60))
			return
		}

		// 2. links
		var a = el.closest('a[href]')
		if (a) {
			var t = linkTarget(a)
			if (t) track(t, (a.textContent || '').trim().slice(0, 60) || t)
			// in-page anchors for the main CTAs
			var h = a.getAttribute('href') || ''
			if (h === '#contact' || h === '#notes' || h === '#work') track('click/anchor-' + h.slice(1), a.textContent.trim().slice(0, 60))
			return
		}

		// 3. copy email button
		if (el.id === 'copy-mail') { track('click/email-copy', 'Copy email'); return }

		// 4. buttons, tabs, switches: first use per page view
		if (el.matches('button, summary, [role="tab"], [role="switch"]')) {
			var inForm = el.closest('form')
			if (inForm && el.type === 'submit') return // handled by submit
			track('ui/' + page + '/' + labelOf(el), (el.textContent || '').trim().slice(0, 60), true)
		}
	}

	// toggles (checkboxes, selects) via change
	function onChange(e) {
		if (!e.isTrusted) return
		var el = e.target
		if (!el || !el.matches) return
		if (el.matches('input[type="checkbox"], input[type="radio"], select')) {
			track('ui/' + page + '/' + labelOf(el), el.id || el.name || 'toggle', true)
		}
	}

	// Notes wall: count sends, never read the content
	function onSubmit(e) {
		var f = e.target
		if (f && f.id === 'note-form') track('note/submit', 'Notes form sent')
	}

	document.addEventListener('click', onClick, true)
	document.addEventListener('auxclick', onClick, true) // middle click
	document.addEventListener('change', onChange, true)
	document.addEventListener('submit', onSubmit, true)

	// ---------- start ----------
	function start() { watchSections(); depth() }
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
	else start()
})();
