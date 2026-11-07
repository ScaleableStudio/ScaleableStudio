# Scalable Studio System home site (V2)

Live at `https://scalablestudio.online` (GitHub Pages from this repository's `home/` folder).

## Design source

Ann's developer handoff **SS_Website_Homepage_V2** (November 2026), approved by Ann and Ken on 2026-11-06.
The original package is kept in Scriptorium at `Projects/ScaleableStudio/inbox/SS_Website_Homepage_V2/`.
The homepage is her `index.html` unchanged except for root paths to `/assets/` and share-preview tags.

Brand tokens (navy, gold, cream, ivory, sand; Georgia / Montserrat / Calibri-Carlito) are CSS variables in
`assets/styles.css`. **Locked components, do not restyle:** the top band (GOVERNED / SYSTEMS FOR SCALE,
TRUST | QUALITY | SCALE) and the footer (gold wordmark and gold rule on cream).

## Pages

- `index.html`: Home (sections: studio, work, ebooks, mark, about, contact call to action)
- `contact/index.html`: Contact, V2 design; email `founders@scalablestudio.online`
- `about/index.html`: redirects to `/#about` (About now lives on the homepage); keeps old links working
- `assets/styles.css`: Ann's V2 styles, then a marked section of additions for inner pages
- `assets/ss-logo.png` (144 px, shown at 48): header logo from Ann's `SSonlineLOGO.PNG` (Ken, 2026-11-06), white turned
  transparent, trimmed and centred. `assets/ss-logo-lockup.png` (880 px): About section; its white background is still
  hidden with `mix-blend-mode: multiply` until a transparent lockup arrives.
- Favicons from Ann's `ss-logo-mark.png` (gold bar on black): `/favicon.ico` (48), `assets/favicon-32.png`,
  `assets/favicon-192.png`, `assets/apple-touch-icon.png` (180).
- Logo and favicons are built by `../tools/build-icons.js` (sizes in `../tools/icons.json`) from the originals in
  Scriptorium; re-run it when Ann sends new files.

## Legal page (prepared, not published)

`../drafts/legal/index.html` holds the finished layout with sections for privacy, terms, refunds, disclaimer,
accessibility, data removal requests and contact. Each section is marked "Being prepared" and lists what it must
cover; the HTML comments hold facts about how the site works today. To publish: add approved wording, move it to
`home/legal/index.html`, remove its `noindex`, and add a `Legal` link to every page's footer.

## Open items

- Ebook kits: the page is prepared in `../drafts/ebook-kits/` (Ken, MAC order 2026-11-07). Ann adds kit folders; setting
  `visible` to true in its `kits.json` publishes /ebook-kits/ and repoints every `#ebooks` link (header, footer, card) at it.
- Transparent lockup file for the About section (see above).
- Legal wording (see above).
