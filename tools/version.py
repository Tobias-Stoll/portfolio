#!/usr/bin/env python3
"""Site version: shown in every footer and appended to local CSS/JS links (cache busting).

  python3 tools/version.py           apply the version in VERSION to all pages
  python3 tools/version.py fix       +0.01  small fixes
  python3 tools/version.py feature   +0.10  bigger changes and new things
  python3 tools/version.py release   +1.00  milestone release
"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
vf = root / 'VERSION'
cur = float(vf.read_text().strip())
step = {'fix': 0.01, 'feature': 0.10, 'release': 1.00}.get(sys.argv[1] if len(sys.argv) > 1 else '', 0)
if step == 1.00:
    new = float(int(cur) + 1)
else:
    new = round(cur + step, 2)
v = f'{new:.2f}'.rstrip('0').rstrip('.') if new != int(new) else f'{int(new)}.0'
vf.write_text(v + '\n')

for page in root.glob('**/index.html'):
    if '.git' in page.parts: continue
    s = page.read_text()
    # local CSS and JS: add or replace ?v=
    s = re.sub(r'((?:href|src)="(?:\.\./)?assets/[^"?#]+\.(?:css|js))(?:\?v=[0-9.]+)?"', rf'\1?v={v}"', s)
    # footer version badge
    if 'class="site-version"' in s:
        s = re.sub(r'<span class="site-version">v[0-9.]+</span>', f'<span class="site-version">v{v}</span>', s)
    else:
        s = s.replace('Product Designer, Berlin</p>', f'Product Designer (UX/UI), Berlin · <span class="site-version">v{v}</span></p>', 1)
        s = s.replace('Designed &amp; built by Tobias Stoll', f'Designed &amp; built by Tobias Stoll · <span class="site-version">v{v}</span>', 1)
        s = s.replace('Designed & built by Tobias Stoll', f'Designed & built by Tobias Stoll · <span class="site-version">v{v}</span>', 1)
    page.write_text(s)
print('version', v)
