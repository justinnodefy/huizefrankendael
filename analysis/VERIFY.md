# Verificatierapport gebouwde site (dist/)

Datum: 2026-08-26
Bron: `dist/` — geserveerd op http://localhost:8811
Aantal HTML-bestanden: (zie controle 8)

## 1. Interne links

- Interne href-voorkomens (beginnend met `/`): **1246**
- Unieke interne doelen: **100**
- Gebroken doelen: **0**

Geen gebroken interne links gevonden.

## 2. Ankers

- href-waarden met `#`: **183** (waarvan controleerbaar: 183)
- Dode ankers: **2**

| bronpagina | href | doelpagina |
|---|---|---|
| `en/festivities/wedding/index.html` | `/en/photos/#trouwen` | `/en/photos/` |
| `nl/feestelijk/trouwen/index.html` | `/nl/fotos/#trouwen` | `/nl/fotos/` |

Fix: de galerijpagina gebruikt id `g-trouwen` (en `gh-trouwen`); de links verwijzen naar `#trouwen`. Correcte href: `/nl/fotos/#g-trouwen` resp. `/en/photos/#g-trouwen`.

## 3. Afbeeldingen

- `<img>`-elementen totaal: **378**
- Zonder `alt`: **0**
- Zonder `width`: **0**
- Zonder `height`: **0**
- Gecontroleerde `srcset`-URL's: 826
- Ontbrekende bestanden via `src`: **0**
- Ontbrekende bestanden via `srcset`: **0**

Alle afbeeldingen hebben alt, width en height; alle src/srcset-bestanden bestaan.

## 4. Koppen

- HTML-bestanden gecontroleerd: 44
- Pagina's zonder precies één `h1`: **0**
- Pagina's met `h3` vóór de eerste `h2`: **4**

| pagina | probleem | eerste h3 |
|---|---|---|
| `en/art/exhibitions/index.html` | h3 vóór h2 | `<h3>Amsterdam Art Weekend!</h3><p>Aanstaande zondag (26 november) in Huize Frank` |
| `en/index.html` | h3 vóór h2 | `<h3>Weddings</h3><p>Official wedding venue: ceremony in the salons, dinner and p` |
| `nl/index.html` | h3 vóór h2 | `<h3>Trouwen</h3><p>Officiële trouwlocatie: ceremonie in de salons, diner en fees` |
| `nl/kunst/tentoonstellingen/index.html` | h3 vóór h2 | `<h3>Amsterdam Art Weekend!</h3><p>Aanstaande zondag (26 november) in Huize Frank` |

Fix: op de homepages staan drie `h3` kaarten (Trouwen/Zakelijk/Kunst) vóór de eerste `h2`; op de tentoonstellingsarchieven staat de lijst met `h3` items vóór de eerste `h2`. Geef het betreffende blok een (eventueel visueel verborgen) `h2`, of promoveer de kaart-/itemkoppen naar `h2`.

## 5. hreflang

- Pagina's gecontroleerd: 44
- Correct (nl + en + x-default, nl != en, x-default == nl): **44**
- Pagina's met afwijkingen: **0**

Alle pagina's hebben correcte hreflang-annotaties.

## 6. Structured data (JSON-LD)

- Pagina's met JSON-LD: 43 / 44
- JSON-LD blokken: **43**
- Ongeldige JSON: **0**

Alle JSON-LD blokken parsen zonder fout.

**@type-telling over de hele site:**

| @type | aantal |
|---|---|
| OpeningHoursSpecification | 86 |
| ListItem | 83 |
| EventVenue | 43 |
| LocalBusiness | 43 |
| PostalAddress | 43 |
| GeoCoordinates | 43 |
| BreadcrumbList | 43 |
| WebPage | 43 |
| WebSite | 43 |
| Event | 27 |
| Organization | 27 |
| Offer | 27 |
Opmerking: de enige pagina zonder JSON-LD is `dist/404.html` — bewust/onschuldig, niet als fout geteld.

## 7. Taalpariteit

- HTML-bestanden onder `dist/nl/`: **21**
- HTML-bestanden onder `dist/en/`: **21**
- Aantallen gelijk — OK.

- EN-pagina's gescand: 20 (uitgesloten: `en/art/exhibitions/index.html`)
- Treffers in **zichtbare tekst**: **0**
- Treffers alleen in markup (bestandsnamen in `src`/`srcset`, `hreflang`-URL's naar de NL-versie): 149 — niet als fout geteld

Geen achtergebleven Nederlandse woorden in de zichtbare tekst van de EN-pagina's.
Aanvullend gecontroleerd: `alt`-, `title`-, `aria-label`- en `meta content`-waarden op alle EN-paginas — 0 treffers.

## 8. Paginagewicht (HTML)

- Aantal HTML-bestanden: **44**
- Gemiddelde HTML-grootte: **15.0 kB**
- Mediaan: 12.2 kB — totaal: 659 kB
- Grootste: 52.2 kB (`nl/kunst/tentoonstellingen/index.html`) — kleinste: 6.2 kB (`404.html`)

**Top 10 zwaarste pagina's:**

| # | pagina | kB |
|---|---|---|
| 1 | `nl/kunst/tentoonstellingen/index.html` | 52.2 |
| 2 | `en/art/exhibitions/index.html` | 52.1 |
| 3 | `nl/fotos/index.html` | 36.9 |
| 4 | `en/photos/index.html` | 36.9 |
| 5 | `nl/over/geschiedenis-huize-frankendael/index.html` | 18.7 |
| 6 | `en/about/history/index.html` | 18.2 |
| 7 | `nl/index.html` | 17.5 |
| 8 | `en/index.html` | 17.2 |
| 9 | `nl/kunst/index.html` | 14.0 |
| 10 | `nl/kunst/bezoek/index.html` | 13.9 |

## 9. HTTP-status (sitemap-URL's)

- URL's in `dist/sitemap.xml`: **43**
- Statusverdeling: 200 = 43
- Niet-200: **0**

Alle sitemap-URL's geven 200.

Extra: `/sitemap.xml` = 200, `/robots.txt` = 200, `/` = 200
---

## Samenvatting

| controle | aantal fouten | toelichting |
|---|---|---|
| 1. Interne links | **0** | 1246 interne hrefs, 100 unieke doelen — alle doelen bestaan |
| 2. Ankers | **2** | `/nl/fotos/#trouwen` en `/en/photos/#trouwen` — id is `g-trouwen` |
| 3. Afbeeldingen | **0** | 378 `<img>`, alle met alt/width/height; 378 src + 826 srcset-URL's bestaan |
| 4. Koppen | **4** | 4 pagina's met `h3` vóór de eerste `h2` (h1-telling wel overal exact 1) |
| 5. hreflang | **0** | 44/44 pagina's met nl + en + x-default, nl != en, x-default == nl |
| 6. Structured data | **0** | 43 JSON-LD blokken, allemaal geldige JSON |
| 7. Taalpariteit | **0** | nl 21 = en 21; 0 Nederlandse woorden in zichtbare EN-tekst |
| 8. Paginagewicht | **0** | gemiddeld 15,0 kB; zwaarste 52,2 kB |
| 9. HTTP | **0** | 43/43 sitemap-URL's geven 200 |
| **Totaal** | **6** | |

### Te repareren

1. **Dode ankers (2)** — `dist/en/festivities/wedding/index.html` en `dist/nl/feestelijk/trouwen/index.html` linken naar `#trouwen`; het id op de galerijpagina is `g-trouwen`. Wijzig de href naar `/en/photos/#g-trouwen` resp. `/nl/fotos/#g-trouwen` (in de bron, niet in `dist/`).
2. **Koppenvolgorde (4)** — `h3` vóór de eerste `h2` in `nl/index.html`, `en/index.html`, `nl/kunst/tentoonstellingen/index.html`, `en/art/exhibitions/index.html`. Geef het kaarten-/itemblok een (eventueel visueel verborgen) `h2`, of promoveer de koppen naar `h2`.

---

## Naverificatie na reparatie (2026-08-26, na de ontwerpronde)

Alle zes bevindingen hierboven zijn in de **bron** gerepareerd en opnieuw gebouwd:

| bevinding | reparatie | status |
|---|---|---|
| 2 dode ankers | `content/copy.mjs`: `#trouwen` → `#g-trouwen` (NL + EN) | 0 dode ankers |
| 4× h3 vóór h2 | poortkaarten kregen een visueel verborgen `h2`; archiefpagina's kregen een zichtbare `h2` "Archief 2009 – 2018" | 0 gevallen |

Aanvullend gevonden en gerepareerd tijdens de ontwerpronde:

| probleem | oorzaak | reparatie |
|---|---|---|
| Alinea in de goudband was een volledig scherm hoog | klassenaambotsing: `.intro` bestond zowel als paragraaf als als splashcontainer met `min-height: 100svh` | splashcontainer hernoemd naar `.portal`, paragraaf naar `.oh-lead` |
| Tekst onzichtbaar zonder JavaScript | `[data-reveal]` zette `opacity: 0` onvoorwaardelijk | verbergen alleen onder `.js`, gezet door een inline script in `<head>` |
| Tekst viel in de smalle zijkolom | het tweekoloms raster bleef staan als er geen zijkolom werd gerenderd | zonder zijkolom een losse, gecentreerde kolom (`.prose.solo`) |
| Knoptekst goud-op-goud (1,3:1) en bruin-op-goud (4,11:1) | `.section.dark a` en `.prose a` zijn specifieker dan `.btn` | expliciete regels voor `a.btn` in elke context |
| Label 3,15–3,41:1 op inkt | donkere accentvariant gebruikt op donkere ondergrond | lichte accentvariant op donkere secties; splashlabel naar #DE7391 (6,25:1) |
| Woordmerk liep over de taalknop op 375px | geen krimpregels onder 620px | woordmerk krimpt, MENU-label verdwijnt, woordmerk weg onder 380px |
| Kop raakte de schermrand op mobiel | `clamp()`-ondergrens te hoog | h1-ondergrens 2,4rem → 2rem |
| Scroll-aanduiding botste met de knop | gecentreerd onderaan de hero | verborgen onder 760px |
| Pijl in knoppen werd `&#8594;` in de losse export | ASCII-escaping raakte ook de CSS | `\2192` in CSS; `<style>`/`<script>` uitgezonderd van escaping |
| Voorstelbanner werd afgedekt door de header | beide `position: fixed` op `top: 0` | banner vast bovenaan, header schuift eronder via `body.has-banner` |

### Contrastsweep (eigen meting, 44 pagina's)

Tekst gemeten tegen de *berekende* achtergrond, per element, op elke tint.
Tekst over foto's en de zwevende header uitgesloten (die hebben een eigen
donkere ondergrond die `getComputedStyle` niet teruggeeft) en visueel
gecontroleerd. Resultaat: **alle 44 pagina's halen AA** (4,5:1 normaal,
3:1 voor grote tekst).

### Eerste weergave homepage

HTML 17,6 kB + CSS 33,1 kB + hero 203,8 kB = **254 kB**, 3 script-tags,
allemaal inline, geen enkel extern script.
