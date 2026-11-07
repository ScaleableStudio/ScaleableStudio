#!/usr/bin/env node
// Builds the Ebook kits page from drafts/ebook-kits/ into the Pages output.
//   node .github/scripts/build-ebook-kits.js            -> writes into _site/ (CI, after home/ is copied there)
//   node .github/scripts/build-ebook-kits.js --preview  -> builds even when hidden, into _preview/
// Settings: drafts/ebook-kits/kits.json. Each sub-folder there is one kit (optional kit.json, optional cover image).
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const src = path.join(root, 'drafts', 'ebook-kits');
const preview = process.argv.includes('--preview');
const out = path.join(root, preview ? '_preview' : '_site');
const cfg = JSON.parse(fs.readFileSync(path.join(src, 'kits.json'), 'utf8'));

if (!cfg.visible && !preview) {
  console.log('ebook-kits: hidden (kits.json visible:false); nothing published');
  process.exit(0);
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = s => encodeURIComponent(s);
const types = new Set(cfg.fileTypes.map(t => t.toLowerCase()));
const isCover = f => /^cover\.(png|jpe?g|webp)$/i.test(f);
const titleFrom = d => d.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const size = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

const pageDir = path.join(out, cfg.path);
fs.mkdirSync(pageDir, { recursive: true });

const kits = fs.readdirSync(src, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.'))
  .map(d => {
    const dir = path.join(src, d.name);
    const metaPath = path.join(dir, 'kit.json');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    const files = fs.readdirSync(dir).filter(f => types.has(path.extname(f).toLowerCase())).sort();
    return { slug: d.name, dir, meta, files, title: meta.title || titleFrom(d.name), order: meta.order ?? 999 };
  })
  .filter(k => k.meta.listed !== false && k.files.length)
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

let cards;
if (!kits.length) {
  cards = `<p class="note">${esc(cfg.emptyMessage)}</p>`;
} else {
  cards = '<div class="work-grid">\n' + kits.map(k => {
    fs.mkdirSync(path.join(pageDir, k.slug), { recursive: true });
    for (const f of k.files) fs.copyFileSync(path.join(k.dir, f), path.join(pageDir, k.slug, f));
    const cover = k.files.find(isCover);
    const docs = k.files.filter(f => !isCover(f));
    const href = f => `/${cfg.path}/${url(k.slug)}/${url(f)}`;
    return `          <article class="work-card accent" id="${esc(k.slug)}">
            ${cover ? `<img class="kit-cover" src="${href(cover)}" alt="">` : ''}
            <p class="label">EBOOK KIT</p>
            <h3>${esc(k.title)}</h3>
            ${k.meta.description ? `<p class="muted">${esc(k.meta.description)}</p>` : ''}
            ${docs.length ? `<ul class="kit-files">${docs.map(f =>
              `<li><a href="${href(f)}">${esc(f)}</a><span>${size(fs.statSync(path.join(k.dir, f)).size)}</span></li>`).join('')}</ul>` : ''}
            ${k.meta.buyUrl ? `<p class="card-foot"><a class="button" href="${esc(k.meta.buyUrl)}">Get the kit</a></p>` : ''}
          </article>`;
  }).join('\n') + '\n        </div>';
}

const tpl = fs.readFileSync(path.join(src, 'template.html'), 'utf8');
if (!tpl.includes('<!-- KITS -->')) throw new Error('template.html has no <!-- KITS --> marker');
fs.writeFileSync(path.join(pageDir, 'index.html'), tpl.replace('<!-- KITS -->', cards));

// Point every existing "Ebook kits" link (homepage card anchor) at the new page.
let rewired = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  if (!p.endsWith('.html') || p.startsWith(pageDir)) return;
  const html = fs.readFileSync(p, 'utf8');
  const next = html.replace(/href="\/?#ebooks"/g, `href="/${cfg.path}/"`);
  if (next !== html) { fs.writeFileSync(p, next); rewired++; }
});
if (!preview) walk(out);

console.log(`ebook-kits: built /${cfg.path}/ with ${kits.length} kit(s)${preview ? ' (preview)' : `; links rewired in ${rewired} page(s)`}`);
