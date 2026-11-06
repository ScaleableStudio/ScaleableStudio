// Builds the site's header logo and favicons from Ann's source PNGs. Settings: icons.json beside this file.
// Logo: trim to the inked area, pad to a centred square, turn white into transparency (colour-to-alpha,
// so anti-aliased edges carry no white fringe), then resize with ffmpeg (Lanczos).
// Favicons: resize the mark with ffmpeg to each listed size (.ico written by ffmpeg's ico encoder).
// Usage: node tools/build-icons.js        (from the home repository root)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const here = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'icons.json'), 'utf8'));
const src = (f) => path.resolve(here, cfg.sourceDir, f);
const out = (f) => path.resolve(here, cfg.outDir, f);
const ffDir = path.resolve(here, cfg.ffmpeg);
const ffmpeg = findFile(ffDir, 'ffmpeg.exe') || 'ffmpeg';

function findFile(dir, name) {
  if (!fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name.toLowerCase() === name) return p;
    if (e.isDirectory()) { const f = findFile(p, name); if (f) return f; }
  }
  return null;
}

// ---- minimal PNG reader / writer (8-bit RGB or RGBA, non-interlaced) ----
function readPng(file) {
  const b = fs.readFileSync(file);
  let o = 8, w, h, ct, depth, interlace; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; ct = d[9]; interlace = d[12]; }
    if (type === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (ct !== 2 && ct !== 6)) throw new Error(`${file}: need 8-bit RGB/RGBA, non-interlaced`);
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  const rgb = Buffer.alloc(w * h * bpp); let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= bpp ? rgb[i - bpp] : 0, u = y ? rgb[i - stride] : 0, c = x >= bpp && y ? rgb[i - stride - bpp] : 0;
      let v = raw[p++];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const q = a + u - c, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      rgb[i] = v & 255;
    }
  }
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = rgb[i * bpp]; px[i * 4 + 1] = rgb[i * bpp + 1]; px[i * 4 + 2] = rgb[i * bpp + 2];
    px[i * 4 + 3] = bpp === 4 ? rgb[i * bpp + 3] : 255;
  }
  return { w, h, px };
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function writePng(file, { w, h, px }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

// ---- logo preparation ----
function whiteToAlpha(img) {
  // Colour-to-alpha against white: alpha = 1 - min(r,g,b)/255, colour un-blended from white.
  const { px } = img;
  for (let i = 0; i < px.length; i += 4) {
    const a0 = px[i + 3] / 255, m = Math.min(px[i], px[i + 1], px[i + 2]);
    const a = 1 - m / 255;
    if (a <= 0.02) { px[i] = px[i + 1] = px[i + 2] = 0; px[i + 3] = 0; continue; }
    for (let k = 0; k < 3; k++) px[i + k] = Math.max(0, Math.min(255, Math.round((px[i + k] - 255 * (1 - a)) / a)));
    px[i + 3] = Math.round(255 * a * a0);
  }
  return img;
}
function trimToSquare(img, marginPercent) {
  const { w, h, px } = img; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, side = Math.ceil(Math.max(cw, ch) * (1 + 2 * marginPercent / 100));
  const outPx = Buffer.alloc(side * side * 4), ox = Math.floor((side - cw) / 2), oy = Math.floor((side - ch) / 2);
  for (let y = 0; y < ch; y++) px.copy(outPx, ((oy + y) * side + ox) * 4, ((y0 + y) * w + x0) * 4, ((y0 + y) * w + x1 + 1) * 4);
  return { w: side, h: side, px: outPx };
}
function resize(input, output, size) {
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', input, '-vf', `scale=${size}:${size}:flags=lanczos`, output]);
}

// ---- run ----
const tmp = path.join(here, '.logo-prepared.png');
let img = readPng(src(cfg.logo.source));
if (cfg.logo.whiteToAlpha) img = whiteToAlpha(img);
img = trimToSquare(img, cfg.logo.marginPercent);
writePng(tmp, img);
for (const o of cfg.logo.outputs) { resize(tmp, out(o.file), o.size); console.log(`logo    ${o.file}  ${o.size}px  ${fs.statSync(out(o.file)).size} B`); }
fs.unlinkSync(tmp);
for (const o of cfg.favicon.outputs) { resize(src(cfg.favicon.source), out(o.file), o.size); console.log(`favicon ${o.file}  ${o.size}px  ${fs.statSync(out(o.file)).size} B`); }
