# Portfolio · Tobias Stoll

Portfolio site, built on my own [Design System](https://github.com/Tobias-Stoll/DesignSystem).

| Page | Path |
|---|---|
| Design to Code: A Token Workflow | [`/design-to-code/`](design-to-code/) |

## How it uses the Design System

- Tokens, text styles and the Button come from the Design System via jsDelivr, pinned to one commit, so a change there never breaks this site by accident.
- Everything new here (header, case study layout, figures, footer) lives in [`assets/site.css`](assets/site.css) and uses tokens only. These pieces move into Figma and the Design System later.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000/design-to-code/
```
