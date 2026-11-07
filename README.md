# Scalable Studio System home site

Live at **https://scalablestudio.online** (GitHub Pages, custom domain).

- `home/` holds the site: `index.html` (Home, V2 design by Ann, 2026-11-06), `contact/`, `about/` (redirects to `/#about`), `assets/`. Notes in `home/info.md`.
- `drafts/` is not published. `drafts/legal/` is the prepared Legal page, waiting for approved wording.
  `drafts/ebook-kits/` feeds the Ebook kits page (/ebook-kits/): one sub-folder per kit, hidden until `kits.json` has
  `"visible": true`; built by `.github/scripts/build-ebook-kits.js`. See its README.md.
- Every push to `main` that changes `home/`, including uploads and deletes on github.com, publishes it through
  `.github/workflows/home-pages.yml`. Notes and settings (`*.md`, `*.json`) are not published.
- SideBOX (`sidebox.scalablestudio.online`) lives in the `website` repository.

Moved here from `website/home/` on 2026-11-04.
