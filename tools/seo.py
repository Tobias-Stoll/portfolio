#!/usr/bin/env python3
"""SEO and GEO for the portfolio: titles, descriptions, canonical, Open Graph, JSON-LD,
sitemap.xml, robots.txt and llms.txt. Change BASE when the domain changes, then run:
  python3 tools/seo.py
"""
import json, re, pathlib, datetime
root = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://concept2design.de'
TODAY = datetime.date.today().isoformat()
NAME = 'Tobias Stoll'
PERSON_ID = BASE + '/#person'

PERSON = {
  '@type': 'Person', '@id': PERSON_ID, 'name': NAME,
  'jobTitle': 'Product Designer (UX/UI)',
  'description': 'Product designer (UX/UI) in Berlin. UX design, UI design and design systems for web, iOS and Android, from research to interactive prototypes in code. Open to freelance projects and selected roles.',
  'url': BASE + '/', 'image': BASE + '/assets/home/about-bike.jpg', 'email': 'mailto:tobiasstoll@pm.me',
  'address': {'@type': 'PostalAddress', 'addressLocality': 'Berlin', 'addressCountry': 'DE'},
  'knowsLanguage': ['de', 'en'],
  'knowsAbout': ['UX design', 'UI design', 'Product design', 'Design systems', 'Design tokens', 'Figma',
                 'User research', 'Information architecture', 'A/B testing', 'Interaction design',
                 'Prototyping', 'AI-assisted design to code'],
  'sameAs': ['https://www.linkedin.com/in/tobiasstoll-ux/', 'https://www.instagram.com/ridewithtobi/',
             'https://github.com/Tobias-Stoll'],
}
SERVICE = {
  '@type': 'ProfessionalService', '@id': BASE + '/#business', 'name': 'Concept2Design (Tobias Stoll UX/UI Design)',
  'url': BASE + '/', 'founder': {'@id': PERSON_ID}, 'image': BASE + '/assets/og/home.jpg',
  'description': 'Freelance UX/UI design, product design and design systems in Berlin, on site or remote.',
  'address': {'@type': 'PostalAddress', 'streetAddress': 'Pichelsdorfer Str. 73', 'postalCode': '13595',
              'addressLocality': 'Berlin', 'addressCountry': 'DE'},
  'areaServed': [{'@type': 'City', 'name': 'Berlin'}, {'@type': 'Country', 'name': 'Germany'}, 'DACH', 'Remote'],
  'knowsLanguage': ['de', 'en'],
  'makesOffer': [{'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': n}} for n in
                 ['UX design', 'UI design', 'Product design', 'Design systems and design tokens',
                  'User research and usability testing', 'Interactive prototypes in code']],
}

PAGES = [
  # path, title, description, og image source, type, indexed
  ('', 'Tobias Stoll · Product Designer (UX/UI) in Berlin',
   'Tobias Stoll is a product designer (UX/UI) in Berlin. UX design, UI design and design systems for web, iOS and Android, from research to interactive prototypes in code. Open to freelance projects and selected roles.',
   'home', 'home', True),
  ('invia/', 'Three Moments That Decide a Flight Booking · UX Case Study by Tobias Stoll',
   'UX/UI case study for Invia Flights (fluege.de): three KPI-driven booking features that raised conversion across the funnel. Includes an interactive playground of the Offer Box.',
   'invia', 'case', True),
  ('design-to-code/', 'Building a Design System as the Single Source of Truth · Design System Case Study by Tobias Stoll',
   'Design system case study: 60 legacy components merged into 30, 440+ design tokens in three tiers and a design to code workflow with Figma, GitHub and AI. By Tobias Stoll, UX/UI designer in Berlin.',
   'design-to-code', 'case', True),
  ('prime-league/', 'An Esports Platform People Can Follow · UX Case Study by Tobias Stoll',
   'UX case study for Prime League: research, a new information architecture around the match, a global sidebar, Discord notifications and a help center. 30 % more teams finished the season. By Tobias Stoll, UX designer in Berlin.',
   'prime-league', 'case', True),
  ('mpi-judo/', 'A Social Media Kit for a Judo Study · Project by Tobias Stoll',
   'Social media kit for the XPLO judo study at a Max Planck Institute: moodboard, color system, type, spacing and Instagram templates in Figma, so student assistants can post on brand. By Tobias Stoll.',
   'mpi-judo', 'article', True),
  ('ride-recap/', 'Ride Recap: Figma Motion for Social Media · Tutorial by Tobias Stoll',
   'Tutorial: an animated Instagram story from real ride data, built entirely in Figma with components, a custom shader and Figma Motion. By Tobias Stoll, product designer in Berlin.',
   'ride-recap', 'article', True),
  ('playground/', 'Offer Box Playground · Interactive Component by Tobias Stoll',
   'One component, four slots: an interactive playground of the Offer Box Tobias Stoll redesigned at Invia Flights. Built as a prototype in code.',
   'playground', 'page', True),
  ('impressum/', None, None, 'home', 'page', False),
  ('datenschutz/', None, None, 'home', 'page', False),
]

def ld_for(path, title, desc, img, kind):
    url = BASE + '/' + path
    if kind == 'home':
        graph = [PERSON, SERVICE, {'@type': 'WebSite', '@id': BASE + '/#website', 'url': BASE + '/',
                 'name': 'Tobias Stoll · Portfolio', 'inLanguage': 'en', 'publisher': {'@id': PERSON_ID}}]
    else:
        typ = {'case': 'CreativeWork', 'article': 'Article', 'page': 'WebPage'}[kind]
        node = {'@type': typ, 'headline': title.split(' · ')[0], 'name': title.split(' · ')[0],
                'description': desc, 'url': url, 'image': img, 'inLanguage': 'en',
                'author': {'@id': PERSON_ID}, 'creator': {'@id': PERSON_ID}, 'dateModified': TODAY}
        if kind == 'case': node['genre'] = 'UX case study'
        crumbs = {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Tobias Stoll · Portfolio', 'item': BASE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': title.split(' · ')[0], 'item': url}]}
        graph = [node, crumbs, {'@type': 'Person', '@id': PERSON_ID, 'name': NAME, 'url': BASE + '/'}]
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1)

for path, title, desc, og, kind, indexed in PAGES:
    p = root / path / 'index.html'
    s = p.read_text()
    url = BASE + '/' + path
    if title: s = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', s, count=1)
    if desc: s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', s, count=1)
    title = re.search(r'<title>(.*?)</title>', s).group(1)
    desc = re.search(r'<meta name="description" content="([^"]*)">', s).group(1)
    img = f'{BASE}/assets/og/{og}.jpg'
    pre = '../' if path else ''
    block = [f'<link rel="canonical" href="{url}">',
             f'<link rel="icon" href="{pre}assets/favicon.svg" type="image/svg+xml">',
             f'<link rel="icon" href="{pre}assets/favicon-32.png" sizes="32x32" type="image/png">',
             f'<link rel="apple-touch-icon" href="{pre}assets/apple-touch-icon.png">']
    if indexed:
        block += [f'<meta property="og:type" content="{"profile" if kind == "home" else "article"}">',
                  f'<meta property="og:site_name" content="Tobias Stoll · Portfolio">',
                  f'<meta property="og:title" content="{title}">',
                  f'<meta property="og:description" content="{desc}">',
                  f'<meta property="og:url" content="{url}">',
                  f'<meta property="og:image" content="{img}">',
                  '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
                  '<meta property="og:locale" content="en_US">',
                  '<meta name="twitter:card" content="summary_large_image">',
                  f'<meta name="author" content="{NAME}">',
                  f'<script type="application/ld+json">\n{ld_for(path, title, desc, img, kind)}\n</script>']
    blk = '<!-- @seo:start (generated by tools/seo.py) -->\n  ' + '\n  '.join(block) + '\n  <!-- @seo:end -->'
    if '<!-- @seo:start' in s:
        s = re.sub(r'<!-- @seo:start.*?<!-- @seo:end -->', blk.replace('\\', '\\\\'), s, flags=re.S)
    else:
        s = re.sub(r'(<meta name="description" content="[^"]*">\n)', lambda m: m.group(1) + '  ' + blk + '\n', s, count=1)
    p.write_text(s)

# sitemap, robots, llms.txt
urls = ''.join(f'  <url><loc>{BASE}/{p}</loc><lastmod>{TODAY}</lastmod></url>\n' for p, *_r, idx in PAGES if idx)
(root / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
(root / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n')
(root / 'llms.txt').write_text(f'''# Tobias Stoll · Product Designer (UX/UI) in Berlin

> Tobias Stoll is a product designer (UX/UI) based in Berlin, Germany, with six years of experience in UX. He designs web, iOS and Android products from research to UI, builds design systems with design tokens, and turns ideas into interactive prototypes in code with AI. Available for freelance projects (Berlin, DACH or remote) and selected roles. Works in German and English.

Business name: Concept2Design (Tobias Stoll UX/UI Design), Berlin
Contact: tobiasstoll@pm.me · LinkedIn: https://www.linkedin.com/in/tobiasstoll-ux/

## Services
- UX design and UI design for web, iOS and Android
- Product design, from requirements to clear decisions
- Design systems 0→1: design tokens, component libraries, Figma to code workflows
- User research, usability testing, information architecture, A/B testing
- Interactive prototypes in code, AI-assisted (Claude Code, Figma MCP)

## Case studies
- [Three moments that decide a flight booking]({BASE}/invia/): Invia Flights (fluege.de). Three KPI-driven booking features (Offer Box, Flex Ticket, Price Guarantee); conversion up across the funnel, all three still live.
- [Building a design system as the single source of truth]({BASE}/design-to-code/): design system for a company building safety-critical software. 60 legacy components merged into 30 core components, 440+ tokens in three tiers, 40 to 50 % less handover time (team estimate).
- [An esports platform people can follow]({BASE}/prime-league/): Prime League, one of the largest League of Legends competitions in the DACH region. Research-led information architecture around the match, a global sidebar, Discord notifications and a help center; 30 % more teams and players finished the season.

## More
- [Offer Box playground]({BASE}/playground/): interactive component built in code
- [A social media kit for a judo study]({BASE}/mpi-judo/): Max Planck Institute, XPLO judo study. Moodboard, 14-color system, type scale and Instagram templates in Figma for student assistants.
- [Ride Recap tutorial]({BASE}/ride-recap/): Figma Motion for social media
- Background: trained in hospitality, studied science, former esports commentator and host
- [Impressum]({BASE}/impressum/) · [Privacy]({BASE}/datenschutz/)
''')
(root / 'CNAME').write_text('concept2design.de\n')
print('seo done for', len(PAGES), 'pages')
