#!/usr/bin/env node
// Bouwt één zelfstandig HTML-bestand van de homepage: CSS inline, elke
// afbeelding als data-URI, geen externe verzoeken. Bedoeld om te mailen of
// als artifact te delen, zodat de eigenaar kan kijken zonder iets te draaien.
//
//   node scripts/bundle-preview.mjs            -> preview/huize-frankendael.html
//   node scripts/bundle-preview.mjs /nl/fotos/ -> andere pagina bundelen
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST = ROOT + 'dist/';
const page = process.argv[2] || '/nl/';
const outDir = ROOT + 'preview/';
mkdirSync(outDir, { recursive: true });

const srcFile = join(DIST, page.replace(/^\//, ''), 'index.html');
if (!existsSync(srcFile)) { console.error('geen build gevonden:', srcFile); process.exit(1); }
let html = readFileSync(srcFile, 'utf8');

const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };
const dataUri = (p) => {
  const f = join(DIST, p.replace(/^\//, '').split('?')[0]);
  if (!existsSync(f)) return null;
  const ext = f.split('.').pop().toLowerCase();
  return `data:${MIME[ext] || 'application/octet-stream'};base64,${readFileSync(f).toString('base64')}`;
};

// 1. stylesheet inline
const cssHref = html.match(/<link rel="stylesheet" href="(\/assets\/styles\.[a-f0-9]+\.css)">/);
if (cssHref) {
  const css = readFileSync(join(DIST, cssHref[1].replace(/^\//, '')), 'utf8');
  html = html.replace(cssHref[0], `<style>\n${css}\n</style>`);
}

// 2. srcset weg — één variant per afbeelding houdt het bestand hanteerbaar
html = html.replace(/\s+srcset="[^"]*"/g, '').replace(/\s+sizes="[^"]*"/g, '');
html = html.replace(/<link rel="preload"[^>]*>/g, '');

// 3. elke resterende /assets-verwijzing als data-URI
const seen = new Map();
html = html.replace(/(src|href)="(\/assets\/[^"]+)"/g, (m, attr, p) => {
  if (/\.(pdf)$/i.test(p)) return `${attr}="#"`;
  if (!seen.has(p)) seen.set(p, dataUri(p));
  const d = seen.get(p);
  return d ? `${attr}="${d}"` : m;
});

// 4. interne links dood maken: één losse pagina kan nergens heen navigeren
html = html.replace(/href="\/(?!\/)[^"]*"/g, 'href="#" data-local');

// 5. de bestaande voorstelbanner vermeldt ook dat dit een losse export is
html = html.replace(
  /<div class="proposal"><p>[^<]*<\/p><\/div>/,
  '<div class="proposal"><p>Voorstel — losse exportpagina van een herbouw, niet de live site. Interne links zijn uitgeschakeld.</p></div>');

// 6. ASCII-veilig maken zodat de pagina ook zonder charset-header klopt.
//    <style> en <script> blijven ongemoeid: CSS en JS decoderen geen
//    HTML-entiteiten, dus daar zou &#8594; letterlijk in beeld komen.
const guarded = [];
html = html.replace(/<(style|script)\b[\s\S]*?<\/\1>/g, (m) => {
  guarded.push(m);
  return `@@GUARD${guarded.length - 1}@@`;
});
html = html.replace(/[^\x00-\x7F]/g, (ch) => {
  const cp = ch.codePointAt(0);
  return cp > 0xFFFF ? ch : `&#${cp};`;
});
html = html.replace(/@@GUARD(\d+)@@/g, (_, i) => guarded[+i]);

const out = outDir + 'huize-frankendael.html';
writeFileSync(out, html);
const kb = Buffer.byteLength(html) / 1024;
console.log(`${out} — ${kb.toFixed(0)} kB, ${seen.size} ingesloten bestanden`);
