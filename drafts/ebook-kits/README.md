# Ebook kits page (hidden until switched on)

This folder feeds the page **https://scalablestudio.online/ebook-kits/**. It is not published yet.

## Adding a kit (Ann)

1. Make one sub-folder per kit, for example `ai-brand-governance/` (lower case, dashes, no spaces).
2. Drop that kit's files into it: PDFs, Word documents, images and so on. A cover image named `cover.png`
   (or `.jpg` / `.webp`) is shown as the kit's picture instead of being listed as a download.
3. Optional: add `kit.json` in the kit's folder to set its card text:

   ```json
   { "title": "AI Brand Governance Kit", "description": "One or two sentences.", "order": 1,
     "buyUrl": "https://...", "listed": true }
   ```

   Without it, the title comes from the folder name. `listed: false` hides a kit; `order` sorts the cards;
   `buyUrl` adds a "Get the kit" button (for example a Payhip link).

You can upload on github.com (Add file → Upload files) or push from a clone. Every change rebuilds the site.

## Switching the page on (Ken or Ann)

In `kits.json` set `"visible": true`. On the next build the page is published, and every "Ebook kits" link in
the header, footer and homepage card is pointed at `/ebook-kits/`. Set it back to `false` to hide it again.

## Important: this repository is public

Anything placed here can be seen and downloaded on GitHub straight away, **even while the page is hidden**.
Put paid kit files (the product itself) somewhere else, for example the store, and keep only covers, previews and
free samples here.

## How it works

`template.html` is the page design (same header and footer as the rest of the site). On each push,
`.github/scripts/build-ebook-kits.js` (run by `.github/workflows/home-pages.yml`) reads `kits.json` and the kit
folders, writes the cards into the template and copies the files beside the page. To preview locally:
`node .github/scripts/build-ebook-kits.js --preview` (writes to `_preview/`).
