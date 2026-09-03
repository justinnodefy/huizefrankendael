#!/usr/bin/env node
// Statische build voor huizefrankendael.nl.
// Gebruik:  node scripts/build.mjs            (productie)
//           PREVIEW=1 node scripts/build.mjs  (voorstel: noindex + banner)
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { site } from '../content/site.mjs';
import { pages, nav, submenus } from '../content/copy.mjs';
import { alt as ALT, galleryGroups } from '../content/media-meta.mjs';
import { liveUrls, keepUrls, redirects, convenience } from '../content/redirects.mjs';

const PREVIEW = !!process.env.PREVIEW;
const ORIGIN = process.env.ORIGIN || site.domain;
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const ROOT = fileURLToPath(new URL('../', import.meta.url));

const media = JSON.parse(readFileSync(ROOT + 'content/media.json', 'utf8'));
const exhibitions = JSON.parse(readFileSync(ROOT + 'content/exhibitions.json', 'utf8'));

// ---------------------------------------------------------------- helpers
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const T = { nl: {
    home: 'Thuis', toContent: 'Naar de inhoud', menu: 'Menu', close: 'Sluiten',
    openTab: '(opent in een nieuw tabblad)', reserve: 'Reserveer bij Merkelbach',
    planEvent: 'Plan je evenement', visit: 'Bezoek het huis', openHouse: 'Open Huis',
    lastSunday: 'elke laatste zondag van de maand', guests: 'gasten', rooms: 'Ruimtes voor',
    proposal: 'VOORSTEL — dit is een herbouw ter beoordeling, niet de live site van Huize Frankendael.',
    followUs: 'Volg ons', visitTitle: 'Bezoeken', practical: 'Praktisch', legalNav: 'Privacy',
    langSwitch: 'English', langHref: '/en/', breadcrumbHome: 'Huize Frankendael',
    viewDoc: 'Bekijk de scan', inPress: 'Ook verschenen in', months: ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'],
    days: ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'],
    tour: 'rondleiding om 12.00 uur', apply: 'Solliciteer via', attn: 't.a.v.',
    kitchenTeam: 'Keuken', serviceTeam: 'Bediening (Nederlandstalig)', internshipT: 'Stage',
    downloadPdf: 'Vacature (PDF)', newsletterNote: 'De nieuwsbrieven openen op de site van onze e-mailprovider.',
  }, en: {
    home: 'Home', toContent: 'Skip to content', menu: 'Menu', close: 'Close',
    openTab: '(opens in a new tab)', reserve: 'Reserve at Merkelbach',
    planEvent: 'Plan your event', visit: 'Visit the house', openHouse: 'Open House',
    lastSunday: 'every last Sunday of the month', guests: 'guests', rooms: 'Rooms for',
    proposal: 'PROPOSAL — this is a rebuild for review, not the live Huize Frankendael site.',
    followUs: 'Follow us', visitTitle: 'Visiting', practical: 'Practical', legalNav: 'Privacy',
    langSwitch: 'Nederlands', langHref: '/nl/', breadcrumbHome: 'Huize Frankendael',
    viewDoc: 'View the scan', inPress: 'Also featured in', months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    tour: 'guided tour at noon', apply: 'Apply via', attn: 'attn.',
    kitchenTeam: 'Kitchen', serviceTeam: 'Service (Dutch speaking)', internshipT: 'Internship',
    downloadPdf: 'Vacancy (PDF)', newsletterNote: 'The newsletters open on the site of our email provider.',
  } };

// volgende n "laatste zondagen van de maand", berekend bij de build
function lastSundays(n = 6, from = new Date()) {
  const out = [];
  let y = from.getFullYear(), m = from.getMonth();
  while (out.length < n) {
    const last = new Date(y, m + 1, 0);
    last.setDate(last.getDate() - last.getDay());
    if (last >= new Date(from.getFullYear(), from.getMonth(), from.getDate())) out.push(new Date(last));
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
const OPEN_DATES = lastSundays(6);

function fmtDate(d, lang) {
  const t = T[lang];
  return `${t.days[d.getDay()]} ${d.getDate()} ${t.months[d.getMonth()]} ${d.getFullYear()}`;
}
const isoDate = d => d.toISOString().slice(0, 10);

// afbeeldingshulpen -------------------------------------------------------
function pic(slug, { sizes = '(max-width: 46rem) 100vw, 46rem', cls = '', lang = 'nl', eager = false, altText = null } = {}) {
  const m = media[slug];
  if (!m) throw new Error(`onbekende afbeelding: ${slug}`);
  const vs = m.variants;
  const biggest = vs[vs.length - 1];
  const srcset = vs.map(v => `/assets/img/${v.file} ${v.w}w`).join(', ');
  const a = altText ?? (ALT[slug] ? ALT[slug][lang] : null);
  if (a == null) throw new Error(`geen alt-tekst voor: ${slug}`);
  return `<img src="/assets/img/${biggest.file}" srcset="${srcset}" sizes="${sizes}" width="${biggest.w}" height="${biggest.h}" alt="${esc(a)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${cls ? ` class="${cls}"` : ''}>`;
}
function heroPreload(slug) {
  const m = media[slug];
  const vs = m.variants;
  const srcset = vs.map(v => `/assets/img/${v.file} ${v.w}w`).join(', ');
  return `<link rel="preload" as="image" imagesrcset="${srcset}" imagesizes="100vw">`;
}
const bigVariant = slug => `/assets/img/${media[slug].variants[media[slug].variants.length - 1].file}`;

// inline markdown-achtige links + regeleinden
function inline(text, lang) {
  let s = esc(text);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${esc(href)}">${label}</a>`);
  return s.replace(/\n/g, '<br>');
}

// ---------------------------------------------------------------- blokken
// Blokken worden in segmenten gerenderd: 'prose' loopt in de tekstkolom,
// 'full' breekt uit over de volle breedte (beeldplaten, poorten, banden).

function seg(list, kind, html) {
  const last = list[list.length - 1];
  if (last && last.kind === kind && kind === 'prose') last.html += html;
  else list.push({ kind, html });
}

function renderBlocks(blocks, lang, page) {
  const t = T[lang];
  const out = [];
  const toc = [];
  let firstP = true;

  for (const b of blocks) {
    if (b.h2 !== undefined) {
      const id = b.anchor || anchorOf(b.h2);
      toc.push({ id, label: b.h2 });
      seg(out, 'prose', `<h2 id="${id}">${inline(b.h2, lang)}</h2>`);
    }
    else if (b.h3 !== undefined) seg(out, 'prose', `<h3>${inline(b.h3, lang)}</h3>`);
    else if (b.p !== undefined) {
      if (firstP && !page.noLede) { seg(out, 'prose', `<p class="lede-xl">${inline(b.p, lang)}</p>`); firstP = false; }
      else seg(out, 'prose', `<p>${inline(b.p, lang)}</p>`);
    }
    else if (b.lede !== undefined) { seg(out, 'prose', `<p class="lede-xl">${inline(b.lede, lang)}</p>`); firstP = false; }
    else if (b.ul) seg(out, 'prose', `<ul>${b.ul.map(li => `<li>${inline(li, lang)}</li>`).join('')}</ul>`);
    else if (b.note) seg(out, 'prose', `<p class="note">${inline(b.note, lang)}</p>`);
    else if (b.cta) seg(out, 'prose', `<div class="actions">${b.cta.map(c => `<a class="btn${c.kind === 'ghost' ? ' ghost' : ''}" href="${esc(c.href)}">${esc(c.label)}</a>`).join('')}</div>`);
    else if (b.img) seg(out, 'prose', `<figure>${pic(b.img, { lang })}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`);

    // ---- volle breedte
    else if (b.plate) {
      const a = ALT[b.plate] ? ALT[b.plate][lang] : b.caption;
      seg(out, 'full', `<figure class="plate" data-reveal>${pic(b.plate, { sizes: '100vw', lang, altText: a })}${b.caption ? `<figcaption class="cap">${esc(b.caption)}</figcaption>` : ''}</figure>`);
    }
    else if (b.gateways) {
      const cards = b.gateways.map((g, i) => `
        <a class="gate" href="${esc(g.href)}" data-reveal="${(i % 3) + 1}">
          ${pic(g.img, { sizes: '(max-width: 780px) 100vw, 33vw', lang, altText: (ALT[g.img] && ALT[g.img][lang]) || g.title })}
          <span class="txt"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p><span class="go">${esc(g.link)}</span></span>
        </a>`).join('');
      const gh = lang === 'nl' ? 'Ontdek Huize Frankendael' : 'Explore Huize Frankendael';
      seg(out, 'full', `<section aria-labelledby="gates-h"><h2 id="gates-h" class="visually-hidden">${esc(gh)}</h2><div class="gateways">${cards}</div></section>`);
    }
    else if (b.ohband) {
      const dates = OPEN_DATES.slice(0, 4).map(d =>
        `<li><span class="d">${d.getDate()}</span><span class="m">${esc(T[lang].months[d.getMonth()])} ${d.getFullYear()}</span></li>`).join('');
      seg(out, 'full', `<section class="oh-band"><div class="shell" data-reveal>
        <span class="label">${esc(t.openHouse)}</span>
        <h2>${esc(lang === 'nl' ? 'Elke laatste zondag staat het huis open' : 'The house opens every last Sunday')}</h2>
        <p class="oh-lead">${esc(lang === 'nl'
          ? 'Gratis toegang van 12.00 tot 17.00 uur, met om 12.00 uur een rondleiding langs het huis, de tuin en de kunst. Aanmelden is niet nodig.'
          : 'Free entry from 12 to 5 PM, with a guided tour of the house, garden and art at noon. No registration needed.')}</p>
        <ul class="dates">${dates}</ul>
      </div></section>`);
    }
    else if (b.feature) {
      const f = b.feature;
      seg(out, 'full', `<section class="section dark"><div class="shell"><div class="split" data-reveal>
        <div class="aside"><span class="label">${esc(f.label)}</span><h2>${esc(f.h2)}</h2></div>
        <div class="rich">${f.p.map(p => `<p>${inline(p, lang)}</p>`).join('')}
        ${f.cta ? `<div class="actions" style="display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.6rem">${f.cta.map(c => `<a class="btn${c.kind === 'ghost' ? ' ghost' : ''}" href="${esc(c.href)}">${esc(c.label)}</a>`).join('')}</div>` : ''}</div>
      </div></div></section>`);
    }

    // ---- data
    else if (b.hours) {
      seg(out, 'prose', `<table class="hours"><tbody>${site.hours.map(h =>
        `<tr><th scope="row">${esc(h.d[lang])}</th><td>${esc(h.t)}</td></tr>`).join('')}</tbody></table>`);
    }
    else if (b.openhouse) {
      seg(out, 'prose', `<ul class="oh-inline">${OPEN_DATES.map(d =>
        `<li><span class="d">${esc(fmtDate(d, lang))}</span><span class="t">12.00 – 17.00 · ${esc(t.tour)}</span></li>`).join('')}</ul>`);
    }
    else if (b.team) {
      seg(out, 'prose', `<ul class="team">${site.team.map(m =>
        `<li><span class="nm">${esc(m.name)}</span><span class="role">${esc(m.role[lang])}</span><a href="mailto:${m.email}">${m.email}</a></li>`).join('')}</ul>`);
    }
    else if (b.vacancies) {
      const v = site.vacancies;
      seg(out, 'prose',
        `<h2>${esc(t.kitchenTeam)}</h2><ul>${v.kitchen.roles[lang].map(r => `<li>${esc(r)}</li>`).join('')}</ul>` +
        `<p>${esc(t.apply)} <a href="mailto:${v.kitchen.apply}">${v.kitchen.apply}</a>, ${esc(t.attn)} ${esc(v.kitchen.attn)}.</p>` +
        `<h2>${esc(t.serviceTeam)}</h2><ul>${v.service.roles[lang].map(r => `<li>${esc(r)}</li>`).join('')}</ul>` +
        `<p>${esc(t.apply)} <a href="mailto:${v.service.apply}">${v.service.apply}</a>, ${esc(t.attn)} ${esc(v.service.attn)}.</p>` +
        `<h2>${esc(t.internshipT)}</h2><p>${esc(v.internship.title[lang])} — <a href="/assets/${v.internship.file}">${esc(t.downloadPdf)}</a>. ${esc(t.apply)} <a href="mailto:${v.internship.apply}">${v.internship.apply}</a>, ${esc(t.attn)} ${esc(v.internship.attn)}.</p>`);
    }
    else if (b.reports) {
      seg(out, 'prose', `<ul>${site.foundation.reports.map(r => `<li><a href="/assets/${r.file}">${esc(r.label[lang])}</a></li>`).join('')}</ul>`);
    }
    else if (b.parking) {
      seg(out, 'prose', `<p>${inline(site.parking.garage[lang], lang)}</p><p>${inline(site.parking.street[lang], lang)}</p>` +
        `<ul>${site.parking.links.map(l => `<li><a href="${l.url}">${esc(l.label[lang])}</a></li>`).join('')}</ul>`);
    }
    else if (b.newsletterarchive) {
      seg(out, 'prose', `<ul>${site.newsletter.archive.map(n => `<li><a href="${n.url}">${esc(n.label)}</a></li>`).join('')}</ul>` +
        `<p class="note">${esc(t.newsletterNote)}</p>`);
    }
    else if (b.reviews) {
      const r = site.reviews;
      seg(out, 'prose', `<ul class="reviews">${r.linked.map(x =>
        `<li><span class="outlet">${esc(x.outlet)}</span><span class="meta">${x.author ? esc(x.author) + ' · ' : ''}${x.year || ''}</span><a href="/assets/${x.file}">${esc(t.viewDoc)}</a></li>`).join('')}</ul>` +
        `<p>${esc(t.inPress)}: ${r.unlinked.map(x => esc(x.outlet) + (x.year ? ` (${x.year})` : '')).join(', ')}.</p>`);
    }

    // ---- galerij
    else if (b.gallery) {
      const navLinks = galleryGroups.map(g => `<li><a href="#g-${g.id}">${esc(g.title[lang])}</a></li>`).join('');
      let html = `<nav class="gal-nav" aria-label="${lang === 'nl' ? 'Fotogroepen' : 'Photo groups'}"><ul>${navLinks}</ul></nav>`;
      html += galleryGroups.map(g => {
        const imgs = g.imgs.filter(s => media[s]);
        const items = imgs.map(s => {
          const a = ALT[s] ? ALT[s][lang] : null;
          return `<figure><a href="${bigVariant(s)}" data-lightbox data-caption="${esc(a)}">${pic(s, { sizes: '(max-width: 720px) 50vw, 250px', lang })}</a></figure>`;
        }).join('');
        return `<section class="gal-group shell" id="g-${g.id}" aria-labelledby="gh-${g.id}">
          <div class="head"><h2 id="gh-${g.id}">${esc(g.title[lang])}</h2><span class="count">${imgs.length} ${lang === 'nl' ? "foto's" : 'photos'}</span></div>
          <div class="mosaic">${items}</div></section>`;
      }).join('');
      html += `<dialog class="lightbox"><button type="button" class="x" data-close>${esc(t.close)} ✕</button><div class="wrap"><figure><img alt="" width="1200" height="800"><figcaption></figcaption></figure></div></dialog>`;
      seg(out, 'full', html);
    }

    // ---- tentoonstellingsarchief
    else if (b.exhibitions) {
      const items = exhibitions.filter(e => e.paras.length || e.subs.length).map(e => {
        const img = e.imgs.map(n => slugOf(n)).find(s => media[s]);
        return `<article class="exhibit" id="${anchorOf(e.title)}">` +
          `<div>${img ? pic(img, { sizes: '(max-width: 800px) 100vw, 15rem', lang, altText: (ALT[img] && ALT[img][lang]) || e.title }) : ''}</div>` +
          `<div><h3>${esc(e.title)}</h3>` +
          (e.subs.length ? `<span class="label when">${e.subs.map(s => esc(s)).join(' · ')}</span>` : '') +
          e.paras.map(p => `<p>${inline(p, lang)}</p>`).join('') +
          `</div></article>`;
      }).join('');
      seg(out, 'full', `<div class="shell">${items}</div>`);
    }
  }
  return { segments: out, toc };
}

function slugOf(name) {
  return name.replace(/\.(jpe?g|png|gif|webp)$/i, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').toLowerCase();
}
function anchorOf(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'x';
}

// ---------------------------------------------------------------- layout
const FONTS = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Archivo:wght@400;500;600&display=swap';

function head({ lang, title, desc, path, page, cssFile }) {
  const altNl = page ? page.path.nl : '/nl/';
  const altEn = page ? page.path.en : '/en/';
  return `<!doctype html>
<html lang="${lang === 'nl' ? 'nl' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#14110C">
${PREVIEW ? '<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="canonical" href="${ORIGIN}${path}">
<link rel="alternate" hreflang="nl" href="${ORIGIN}${altNl}">
<link rel="alternate" hreflang="en" href="${ORIGIN}${altEn}">
<link rel="alternate" hreflang="x-default" href="${ORIGIN}${altNl}">
<link rel="icon" href="/assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/${cssFile}">
<script>document.documentElement.className+=' js'</script>
${page && page.hero ? heroPreload(page.hero) : ''}
</head>`;
}

const SECTION_HEX = { thuis: '#C8A44C', over: '#2E7C90', fotos: '#F5AE15', zakelijk: '#8C8385', feestelijk: '#C4285A', kunst: '#6FC3C3', agenda: '#8A8378' };

function header(lang, page, { solid = false } = {}) {
  const t = T[lang];
  const items = nav.map(n => {
    const isCurrent = page && n.href[lang] === page.path[lang];
    const inSection = page && !isCurrent && n.section === page.section && n.section !== 'thuis';
    return `<a href="${n.href[lang]}" style="--nc:${SECTION_HEX[n.section]}"${isCurrent || inSection ? ' aria-current="page"' : ''}>${esc(n.label[lang])}</a>`;
  }).join('');
  const other = page ? page.path[lang === 'nl' ? 'en' : 'nl'] : (lang === 'nl' ? '/en/' : '/nl/');
  return `<a class="skip" href="#main">${esc(t.toContent)}</a>
<header class="site-header${solid ? ' solid' : ''}" id="site-header">
  <div class="bar">
    <a class="brand" href="${lang === 'nl' ? '/nl/' : '/en/'}">
      <img src="/assets/logo-hf.png" width="46" height="25" alt="">
      <span class="wm"><i>Huize</i> Frankendael</span>
    </a>
    <nav id="mainnav" class="mainnav" aria-label="${lang === 'nl' ? 'Hoofdmenu' : 'Main menu'}">${items}</nav>
    <div class="header-aux">
      <a class="lang" href="${other}" lang="${lang === 'nl' ? 'en' : 'nl'}" hreflang="${lang === 'nl' ? 'en' : 'nl'}">${esc(t.langSwitch)}</a>
      <a class="mb-mark" href="${site.merkelbach.site}"><img src="/assets/logo-mb.png" width="62" height="25" alt="Restaurant Merkelbach"></a>
    </div>
    <button id="nav-toggle" aria-expanded="false" aria-controls="mainnav"><span class="lbl">${esc(t.menu)}</span><span class="bars" aria-hidden="true"></span></button>
  </div>
</header>`;
}

const KICKER = {
  nl: { thuis: 'Middenweg 72 · Amsterdam', over: 'Over het huis', fotos: 'Beeldarchief', zakelijk: 'Zakelijk', feestelijk: 'Feestelijk', kunst: 'Frankendael Foundation', agenda: 'Agenda' },
  en: { thuis: 'Middenweg 72 · Amsterdam', over: 'About the house', fotos: 'Image archive', zakelijk: 'Business', feestelijk: 'Festivities', kunst: 'Frankendael Foundation', agenda: 'Calendar' },
};

function heroBlock(page, lang) {
  const t = T[lang];
  if (!page.hero) {
    return `<div class="pagehead"><div class="shell"><span class="label">${esc(KICKER[lang][page.section])}</span><h1>${esc(page.h1[lang])}</h1></div></div>`;
  }
  const isHome = page.id === 'home';
  let extra = '';
  if (isHome) {
    extra = `<p class="lede">${esc(lang === 'nl'
      ? 'Rijksmonument uit 1660, officiële trouwlocatie en huis voor evenementen van 2 tot 300 gasten.'
      : 'A national monument from 1660, official wedding venue and event house for 2 to 300 guests.')}</p>
      <div class="actions">
        <a class="btn" href="${lang === 'nl' ? '/nl/thuis/contact/' : '/en/home/contact/'}">${esc(t.planEvent)}</a>
        <a class="btn ghost" href="${lang === 'nl' ? '/nl/kunst/bezoek/' : '/en/art/visiting/'}">${esc(t.visit)}</a>
      </div>`;
  }
  return `<div class="hero${isHome ? ' tall' : ''}">
  ${pic(page.hero, { sizes: '100vw', cls: 'bg', lang, eager: true })}
  <div class="inner">
    <span class="label">${esc(KICKER[lang][page.section])}</span>
    <h1>${esc(page.h1[lang])}</h1>
    ${extra}
  </div>
  ${isHome ? `<div class="scrollcue" aria-hidden="true"><span>${lang === 'nl' ? 'Scroll' : 'Scroll'}</span></div>` : ''}
</div>`;
}

function ledger(lang) {
  const t = T[lang];
  const next = OPEN_DATES[0];
  const rows = [
    { l: t.openHouse, v: esc(fmtDate(next, lang)), s: `12.00 – 17.00 · ${lang === 'nl' ? 'gratis' : 'free'}` },
    { l: lang === 'nl' ? 'Capaciteit' : 'Capacity', v: `2 – 300`, s: lang === 'nl' ? 'gasten, acht ruimtes' : 'guests, eight rooms' },
    { l: lang === 'nl' ? 'Adres' : 'Address', v: 'Middenweg 72', s: '1097 BS Amsterdam' },
    { l: lang === 'nl' ? 'Restaurant' : 'Restaurant', v: 'Merkelbach', s: lang === 'nl' ? 'zeven dagen per week' : 'seven days a week' },
  ];
  return `<div class="ledger"><div class="shell">${rows.map(r =>
    `<div class="item"><span class="label">${esc(r.l)}</span><span class="v">${r.v}<small>${esc(r.s)}</small></span></div>`).join('')}</div></div>`;
}

const SUB_LABEL = {
  nl: { over: 'Over', geschiedenis: 'Geschiedenis', team: 'Ons team', werken: 'Werken bij', contact: 'Contact', zakelijk: 'Zakelijk', 'zakelijk-ruimtes': 'Ruimtes', fotos: "Foto's", feestelijk: 'Feestelijk', trouwen: 'Trouwen', 'feest-ruimtes': 'Ruimtes', kunst: 'Kunst', tentoonstellingen: 'Tentoonstellingen', 'kunst-bezoek': 'Bezoek', 'kunst-over': 'De Foundation', route: 'Route & parkeren' },
  en: { over: 'About', geschiedenis: 'History', team: 'Our team', werken: 'Working here', contact: 'Contact', zakelijk: 'Business', 'zakelijk-ruimtes': 'Rooms', fotos: 'Photos', feestelijk: 'Festivities', trouwen: 'Wedding', 'feest-ruimtes': 'Rooms', kunst: 'Art', tentoonstellingen: 'Exhibitions', 'kunst-bezoek': 'Your visit', 'kunst-over': 'The Foundation', route: 'Route & parking' },
};

function subnavBlock(page, lang) {
  if (!page.menu || !submenus[page.menu]) return '';
  const items = submenus[page.menu].map(id => {
    const p = pages.find(x => x.id === id);
    if (!p) return '';
    const label = SUB_LABEL[lang][id] || p.h1[lang];
    return `<a href="${p.path[lang]}"${p.id === page.id ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  }).join('');
  return `<nav class="subnav" aria-label="${lang === 'nl' ? 'Sectiemenu' : 'Section menu'}"><div class="shell">${items}</div></nav>`;
}

function footer(lang) {
  const t = T[lang];
  const p = lang === 'nl'
    ? { contact: '/nl/thuis/contact/', route: '/nl/thuis/contact/route-parkeren/', visit: '/nl/kunst/bezoek/', privacy: '/nl/privacy/', reviews: '/nl/recensies/', news: '/nl/nieuwsbrief/', art: '/nl/kunst/', hist: '/nl/over/geschiedenis-huize-frankendael/', wed: '/nl/feestelijk/trouwen/', biz: '/nl/zakelijk/' }
    : { contact: '/en/home/contact/', route: '/en/home/contact/parking-route/', visit: '/en/art/visiting/', privacy: '/en/privacy/', reviews: '/en/reviews/', news: '/en/newsletter/', art: '/en/art/', hist: '/en/about/history/', wed: '/en/festivities/wedding/', biz: '/en/business/' };
  const L = lang === 'nl'
    ? { visit: 'Bezoeken', plan: 'Plannen', house: 'Het huis', tours: 'Bezoek & rondleidingen', route: 'Route & parkeren', hours: 'Contact & openingstijden', wed: 'Trouwen', biz: 'Zakelijk', art: 'Kunst & Foundation', hist: 'Geschiedenis', news: 'Nieuwsbrief', rest: 'In het rechter koetshuis, zeven dagen per week open voor koffie, lunch en borrel.', reviews: 'Recensies' }
    : { visit: 'Visiting', plan: 'Planning', house: 'The house', tours: 'Your visit & tours', route: 'Route & parking', hours: 'Contact & opening hours', wed: 'Weddings', biz: 'Business', art: 'Art & Foundation', hist: 'History', news: 'Newsletter', rest: 'In the right coach house, open seven days a week for coffee, lunch and drinks.', reviews: 'Reviews' };
  return `<footer class="site-footer">
  <div class="cols">
    <div class="mark">
      <img src="/assets/logo-hf.png" width="74" height="40" alt="">
      <span class="wordmark">Huize Frankendael</span>
      <p>${esc(site.address.street)}<br>${esc(site.address.zip)} ${esc(site.address.city)}<br>
      <a href="${site.phone.href}">${esc(site.phone.display)}</a><br>
      <a href="mailto:${site.email}">${site.email}</a></p>
    </div>
    <div>
      <h2>${esc(L.visit)}</h2>
      <ul>
        <li>${esc(t.openHouse)} · ${esc(t.lastSunday)}</li>
        <li><a href="${p.visit}">${esc(L.tours)}</a></li>
        <li><a href="${p.route}">${esc(L.route)}</a></li>
        <li><a href="${p.contact}">${esc(L.hours)}</a></li>
      </ul>
    </div>
    <div>
      <h2>${esc(L.plan)}</h2>
      <ul>
        <li><a href="${p.wed}">${esc(L.wed)}</a></li>
        <li><a href="${p.biz}">${esc(L.biz)}</a></li>
        <li><a href="${p.art}">${esc(L.art)}</a></li>
        <li><a href="${p.hist}">${esc(L.hist)}</a></li>
      </ul>
    </div>
    <div>
      <h2>Restaurant Merkelbach</h2>
      <p>${esc(L.rest)}</p>
      <ul>
        <li><a href="${site.merkelbach.site}">restaurantmerkelbach.nl</a></li>
        <li><a href="${site.merkelbach.booking}">${esc(t.reserve)}</a></li>
        <li><a href="${site.socials.instagram}">Instagram</a></li>
        <li><a href="${p.news}">${esc(L.news)}</a></li>
      </ul>
    </div>
  </div>
  <div class="legal"><div class="inner">
    <span>© ${new Date().getFullYear()} Huize Frankendael</span>
    <a href="${p.privacy}">${esc(t.legalNav)}</a>
    <a href="${p.reviews}">${esc(L.reviews)}</a>
    <span>${lang === 'nl' ? 'Rijksmonument · Watergraafsmeer' : 'National monument · Watergraafsmeer'}</span>
  </div></div>
</footer>`;
}

// structured data ---------------------------------------------------------
function schema(page, lang, path) {
  const nodes = [];
  const business = {
    '@type': ['EventVenue', 'LocalBusiness'],
    '@id': ORIGIN + '/#venue',
    name: 'Huize Frankendael',
    url: ORIGIN + '/',
    image: ORIGIN + bigVariant('vooraanzicht-zomer'),
    telephone: site.phone.intl,
    email: site.email,
    address: { '@type': 'PostalAddress', streetAddress: site.address.street, postalCode: site.address.zip, addressLocality: site.address.city, addressCountry: 'NL' },
    geo: { '@type': 'GeoCoordinates', latitude: site.address.geo.lat, longitude: site.address.geo.lng },
    sameAs: [site.socials.instagram, site.socials.facebookHF],
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '08:30', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '09:00', closes: '18:00' },
    ],
  };
  nodes.push(business);
  if (['home', 'agenda', 'kunst-bezoek', 'kunst'].includes(page.id)) {
    OPEN_DATES.slice(0, 3).forEach(d => nodes.push({
      '@type': 'Event',
      name: lang === 'nl' ? 'Open Huis Huize Frankendael' : 'Open House Huize Frankendael',
      startDate: `${isoDate(d)}T12:00:00+02:00`,
      endDate: `${isoDate(d)}T17:00:00+02:00`,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      isAccessibleForFree: true,
      location: { '@id': ORIGIN + '/#venue' },
      organizer: { '@type': 'Organization', name: site.foundation.name },
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: ORIGIN + (lang === 'nl' ? '/nl/kunst/bezoek/' : '/en/art/visiting/') },
      description: lang === 'nl' ? 'Gratis bezichtiging van Huize Frankendael, met om 12.00 uur een gratis rondleiding (max. 8 personen).' : 'Free visit of Huize Frankendael, with a free guided tour at noon (max. 8 people).',
    }));
  }
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Huize Frankendael', item: ORIGIN + (lang === 'nl' ? '/nl/' : '/en/') }];
  if (page.id !== 'home') crumbs.push({ '@type': 'ListItem', position: 2, name: page.h1[lang], item: ORIGIN + path });
  nodes.push({ '@type': 'BreadcrumbList', itemListElement: crumbs });
  nodes.push({ '@type': 'WebPage', url: ORIGIN + path, name: page.title[lang], inLanguage: lang === 'nl' ? 'nl' : 'en', isPartOf: { '@type': 'WebSite', url: ORIGIN + '/', name: 'Huize Frankendael' } });
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })}</script>`;
}

// externe links: nieuw tabblad + noopener + hint --------------------------
function externalize(html, lang) {
  const t = T[lang];
  return html.replace(/<a ([^>]*href="https?:\/\/[^"]*"[^>]*)>(.*?)<\/a>/gs, (m, attrs, inner) => {
    try {
      const href = attrs.match(/href="([^"]*)"/)[1];
      const host = new URL(href).host;
      if (host.endsWith('huizefrankendael.nl')) return m;
      if (/target=/.test(attrs)) return m;
      const imageOnly = /<img[^>]*>/.test(inner) && !inner.replace(/<img[^>]*>/, '').trim();
      const hint = imageOnly ? '' : `<span class="visually-hidden"> ${esc(t.openTab)}</span>`;
      return `<a ${attrs} target="_blank" rel="noopener noreferrer">${inner}${hint}</a>`;
    } catch { return m; }
  });
}

const APP_JS = `(function(){
var h=document.getElementById('site-header');
if(h&&!h.classList.contains('solid')){var on=function(){h.classList.toggle('stuck',window.scrollY>40);};on();addEventListener('scroll',on,{passive:true});addEventListener('hashchange',on);addEventListener('load',on);requestAnimationFrame(on);}
var b=document.getElementById('nav-toggle'),n=document.getElementById('mainnav');
if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);document.documentElement.style.overflow=o?'hidden':'';});}
var d=document.querySelector('dialog.lightbox');
if(d){var im=d.querySelector('img'),cap=d.querySelector('figcaption');
document.querySelectorAll('[data-lightbox]').forEach(function(a){a.addEventListener('click',function(e){
e.preventDefault();im.src=a.getAttribute('href');im.removeAttribute('srcset');im.alt=a.getAttribute('data-caption')||'';cap.textContent=a.getAttribute('data-caption')||'';d.showModal();});});
d.querySelector('[data-close]').addEventListener('click',function(){d.close();});
d.addEventListener('click',function(e){if(e.target===d||e.target.classList.contains('wrap'))d.close();});}
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('revealed');io.unobserve(en.target);}});},{rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('[data-reveal]').forEach(function(el){io.observe(el);});}
else{document.querySelectorAll('[data-reveal]').forEach(function(el){el.classList.add('revealed');});}
})();`;

function pagerail(page, lang, toc) {
  const t = T[lang];
  const onPage = lang === 'nl' ? 'Op deze pagina' : 'On this page';
  const help = lang === 'nl' ? 'Vragen of een rondleiding?' : 'Questions or a tour?';
  const list = toc.length > 1
    ? `<ul class="toc">${toc.map(x => `<li><a href="#${x.id}">${esc(x.label)}</a></li>`).join('')}</ul>`
    : '';
  return `<aside class="pagerail">
    <span class="label">${esc(list ? onPage : KICKER[lang][page.section])}</span>
    ${list}
    <div class="card">
      <p>${esc(help)}</p>
      <a class="tel" href="${site.phone.href}">${esc(site.phone.display)}</a>
      <a href="mailto:${site.email}">${site.email}</a>
    </div>
  </aside>`;
}

// ---------------------------------------------------------------- pagina's
function renderPage(page, lang, cssFile) {
  const t = T[lang];
  const path = page.path[lang];
  const { segments, toc } = renderBlocks(page.body[lang], lang, page);

  let railUsed = false;
  const bodyHtml = segments.map((s, i) => {
    if (s.kind === 'full') return s.html;
    const first = !railUsed;
    railUsed = true;
    const rail = (first && page.id !== 'home') ? pagerail(page, lang, toc) : '';
    // zonder zijkolom geen tweekoloms raster — anders valt de tekst in de smalle kolom
    const inner = rail
      ? `<div class="layout">${rail}<div class="prose" data-reveal>${s.html}</div></div>`
      : `<div class="prose solo" data-reveal>${s.html}</div>`;
    return `<section class="section${i === 0 ? '' : ' tight'}"><div class="shell">${inner}</div></section>`;
  }).join('\n');

  const doc = head({ lang, title: page.title[lang], desc: page.desc[lang], path, page, cssFile }) + `
<body class="s-${page.section}${PREVIEW ? ' has-banner' : ''}">
${PREVIEW ? `<div class="proposal"><p>${esc(t.proposal)}</p></div>` : ''}
${header(lang, page, { solid: !page.hero })}
<main id="main">
${heroBlock(page, lang)}
${page.id === 'home' ? ledger(lang) : ''}
${subnavBlock(page, lang)}
${bodyHtml}
</main>
${footer(lang)}
${schema(page, lang, path)}
<script>${APP_JS}</script>
</body>
</html>`;
  return externalize(doc, lang);
}

// intro/splash -------------------------------------------------------------
function renderIntro(cssFile) {
  const next = OPEN_DATES[0];
  const doc = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Huize Frankendael & Restaurant Merkelbach — Amsterdam</title>
<meta name="description" content="Huize Frankendael, het laatste buitenhuis van Amsterdam: evenementen, trouwen, kunst en Open Huis — met Restaurant Merkelbach in het koetshuis. Middenweg 72.">
<meta name="theme-color" content="#14110C">
${PREVIEW ? '<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="canonical" href="${ORIGIN}/">
<link rel="alternate" hreflang="nl" href="${ORIGIN}/nl/">
<link rel="alternate" hreflang="en" href="${ORIGIN}/en/">
<link rel="alternate" hreflang="x-default" href="${ORIGIN}/nl/">
<link rel="icon" href="/assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/${cssFile}">
<script>document.documentElement.className+=' js'</script>
${heroPreload('vooraanzicht-zomer')}
</head>
<body class="s-thuis${PREVIEW ? ' has-banner' : ''}">
${PREVIEW ? `<div class="proposal"><p>${esc(T.nl.proposal)}</p></div>` : ''}
<div class="langbar" id="langbar"><div class="inner">Looking for the English site? <a href="/en/">Continue in English →</a></div></div>
<div class="portal">
  <div class="stage">
    ${pic('vooraanzicht-zomer', { sizes: '100vw', lang: 'nl', eager: true })}
    <div class="inner">
      <span class="label">Middenweg 72 · Amsterdam</span>
      <h1>Huize Frankendael</h1>
      <p class="sub">Het laatste buitenhuis van Amsterdam — rijksmonument, trouwlocatie en huis voor kunst en evenementen.</p>
    </div>
  </div>
  <div class="doors">
    <section class="door" style="--dc:#C8A44C">
      <span class="label kind">Het huis</span>
      <h2>Huize Frankendael</h2>
      <ul class="lines">
        <li><a href="/nl/over/">Over het huis</a></li>
        <li><a href="/nl/over/geschiedenis-huize-frankendael/">Geschiedenis</a></li>
        <li><a href="/nl/feestelijk/trouwen/">Trouwen</a></li>
        <li><a href="/nl/zakelijk/">Vergaderen</a></li>
        <li><a href="/nl/feestelijk/">Feest</a></li>
        <li><a href="/nl/kunst/">Kunst</a></li>
        <li><a href="/nl/fotos/">Foto&#8217;s</a></li>
        <li><a href="/nl/thuis/contact/">Contact</a></li>
      </ul>
      <div class="actions"><a class="btn" href="/nl/">Naar de site</a><a class="btn ghost" href="/en/">English</a></div>
      <p class="facts"><b>Open Huis</b> elke laatste zondag · eerstvolgende ${esc(fmtDate(next, 'nl'))}, 12.00–17.00 uur, gratis.</p>
    </section>
    <section class="door" style="--dc:#DE7391">
      <span class="label kind">In het koetshuis</span>
      <h2>Restaurant Merkelbach</h2>
      <ul class="lines">
        <li><a href="https://restaurantmerkelbach.nl/">Website</a></li>
        <li><a href="https://restaurantmerkelbach.nl/menu">Menu</a></li>
        <li><a href="https://restaurantmerkelbach.nl/over-ons">Over</a></li>
        <li><a href="https://restaurantmerkelbach.nl/contact">Contact</a></li>
      </ul>
      <div class="actions"><a class="btn" href="${site.merkelbach.booking}">Reserveer een tafel</a></div>
      <p class="facts">Zeven dagen per week open voor koffie &amp; taart, &agrave;-la-cartelunch en borrel. Slow Food-keuken in het rechter koetshuis.</p>
    </section>
  </div>
</div>
<script>try{if(/^en\\b/i.test(navigator.language||'')){document.getElementById('langbar').style.display='block';}}catch(e){}</script>
${schema(pages[0], 'nl', '/')}
</body>
</html>`;
  return externalize(doc, 'nl');
}

// ---------------------------------------------------------------- output
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST + 'assets/img', { recursive: true });
cpSync(ROOT + 'assets/ladder', DIST + 'assets/img', { recursive: true });
mkdirSync(DIST + 'assets/docs', { recursive: true });
cpSync(ROOT + 'assets/docs', DIST + 'assets/docs', { recursive: true });
cpSync(ROOT + 'assets/logos/logo-hf-trim.png', DIST + 'assets/logo-hf.png');
cpSync(ROOT + 'assets/logos/logo-mb-trim.png', DIST + 'assets/logo-mb.png');
cpSync(ROOT + 'assets/logos/favicon-270.png', DIST + 'assets/favicon.png');

const css = readFileSync(ROOT + 'src/styles.css', 'utf8');
const hash = crypto.createHash('md5').update(css).digest('hex').slice(0, 8);
const cssFile = `styles.${hash}.css`;
writeFileSync(DIST + 'assets/' + cssFile, css);

const built = new Set(['/']);
writeFileSync(DIST + 'index.html', renderIntro(cssFile));

for (const page of pages) {
  for (const lang of ['nl', 'en']) {
    const path = page.path[lang];
    const dir = DIST + path.replace(/^\//, '');
    mkdirSync(dir, { recursive: true });
    writeFileSync(dir + 'index.html', renderPage(page, lang, cssFile));
    built.add(path.replace(/\/$/, '') || '/');
  }
}

// 404
writeFileSync(DIST + '404.html', head({ lang: 'nl', title: 'Pagina niet gevonden – Huize Frankendael', desc: 'Deze pagina bestaat niet (meer).', path: '/404.html', page: null, cssFile }) + `
<body class="s-thuis">${header('nl', null, { solid: true })}
<main id="main">
<div class="pagehead"><div class="shell"><span class="label">404</span><h1>Pagina niet gevonden</h1></div></div>
<section class="section"><div class="shell"><div class="prose" style="margin-inline:auto">
<p class="lede-xl">Deze pagina bestaat niet (meer).</p>
<p>Probeer de <a href="/nl/">homepage</a>, de <a href="/nl/fotos/">foto&#8217;s</a> of <a href="/nl/thuis/contact/">contact en openingstijden</a>.</p>
<p lang="en">This page does not exist (any more) — try the <a href="/en/">English homepage</a>.</p>
</div></div></section>
</main>${footer('nl')}
<script>${APP_JS}</script></body></html>`);

// ------------------------------------------------- redirects + controles
const allRedirects = [...redirects, ...convenience];
const redirectMap = new Map();
for (const r of allRedirects) {
  const bare = r.from.replace(/\/$/, '') || '/';
  redirectMap.set(bare, r.to);
}

// controle 1: elke live-URL is gebouwd of geredirect
const missing = [];
for (const u of liveUrls) {
  const bare = u.replace(/\/$/, '') || '/';
  if (!built.has(bare) && !redirectMap.has(bare)) missing.push(u);
}
// controle 2: elk redirectdoel bestaat (intern) en is geen redirect
const badTargets = [];
for (const [from, to] of redirectMap) {
  if (/^https?:\/\//.test(to)) continue;
  const bare = to.split('#')[0].replace(/\/$/, '') || '/';
  if (!built.has(bare)) badTargets.push(`${from} -> ${to} (doel niet gebouwd)`);
  if (redirectMap.has(bare)) badTargets.push(`${from} -> ${to} (doel is zelf een redirect)`);
}
// controle 3: keepUrls allemaal gebouwd
const keepMissing = keepUrls.filter(u => !built.has(u.replace(/\/$/, '') || '/'));

if (missing.length || badTargets.length || keepMissing.length) {
  console.error('MIGRATIEFOUT — build afgebroken');
  missing.slice(0, 20).forEach(m => console.error('  niet gedekt:', m));
  badTargets.slice(0, 20).forEach(m => console.error('  kapot doel:', m));
  keepMissing.forEach(m => console.error('  keep niet gebouwd:', m));
  process.exit(1);
}

// _redirects (Netlify) — beide slashvormen per regel
let redirLines = [];
for (const r of allRedirects) {
  const bare = r.from.replace(/\/$/, '') || '/';
  const dest = r.to;
  if (bare === '/') continue;
  redirLines.push(`${bare} ${dest} 301`);
  redirLines.push(`${bare}/ ${dest} 301`);
}
writeFileSync(DIST + '_redirects', redirLines.join('\n') + '\n');

// vercel.json equivalent
writeFileSync(DIST + 'vercel.json', JSON.stringify({
  trailingSlash: true,
  redirects: allRedirects.filter(r => (r.from.replace(/\/$/, '') || '/') !== '/').flatMap(r => {
    const bare = r.from.replace(/\/$/, '') || '/';
    return [{ source: bare, destination: r.to, permanent: true }, { source: bare + '/', destination: r.to, permanent: true }];
  }),
}, null, 1));

// sitemap met hreflang per entry
const smEntries = [];
const xh = (nlP, enP) => `    <xhtml:link rel="alternate" hreflang="nl" href="${ORIGIN}${nlP}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${enP}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${nlP}"/>`;
smEntries.push(`  <url>\n    <loc>${ORIGIN}/</loc>\n${xh('/nl/', '/en/')}\n  </url>`);
for (const page of pages) for (const lang of ['nl', 'en'])
  smEntries.push(`  <url>\n    <loc>${ORIGIN}${page.path[lang]}</loc>\n${xh(page.path.nl, page.path.en)}\n  </url>`);
writeFileSync(DIST + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${smEntries.join('\n')}\n</urlset>\n`);

writeFileSync(DIST + 'robots.txt', PREVIEW
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`build ok — ${built.size} pagina's, ${redirLines.length / 2} redirects (×2 slashvormen), css ${cssFile}${PREVIEW ? ' [PREVIEW/noindex]' : ''}`);
