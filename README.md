# Huize Frankendael — websiteherbouw

Een herbouw van huizefrankendael.nl. De site is statisch: één Node-script leest
de inhoud uit `content/` en schrijft complete HTML-bestanden naar `dist/`. Er is
geen framework, geen CMS, geen database en geen buildtool-keten. De uitvoer is
een map met HTML, CSS, WebP-afbeeldingen en een redirecttabel — die kan op elke
statische host staan.

In de browser draait één klein inline script (menu, meelopende header,
lightbox, reveal-animatie). Er worden geen scripts van derden geladen en er
staan geen trackers of cookies in.

De inhoud komt van de oude site (crawl 26-08-2026). Wat er is aangetroffen en
wat daarvan stuk was, staat in `analysis/AUDIT.md`.

## Vereisten

- **Node.js** — geen dependencies, geen `npm install`. Gebouwd en getest op
  Node 24.
- **Python 3 met Pillow** — alleen nodig om de afbeeldingsladder opnieuw te
  genereren, niet voor een gewone build. Getest op Python 3.9 met Pillow 11.

## Bouwen

```sh
node scripts/build.mjs              # productie
PREVIEW=1 node scripts/build.mjs    # voorstel-deploy: noindex + banner
```

`PREVIEW=1` zet `<meta name="robots" content="noindex, nofollow">` op elke
pagina, schrijft een `robots.txt` met `Disallow: /` en plaatst bovenaan elke
pagina een balk die zegt dat dit een herbouw ter beoordeling is. Gebruik die
variant voor alles wat op een tijdelijk adres komt te staan, zodat een
voorstel-URL nooit naast de echte site geïndexeerd raakt.

De build wist `dist/` en bouwt hem opnieuw op. Er is geen incrementele modus;
een volledige build duurt een seconde.

Afbeeldingsladder opnieuw genereren (alleen nodig na het toevoegen of
vervangen van bestanden in `assets/masters/`):

```sh
python3 scripts/make-ladder.py
```

Dit schrijft WebP-varianten van 480, 800, 1200, 1600 en 2400 px naar
`assets/ladder/` en een manifest naar `content/media.json` met per variant de
bestandsnaam, breedte, hoogte en grootte. Bestaande varianten worden
overgeslagen, dus het script opnieuw draaien is goedkoop. De build leest
uitsluitend `content/media.json` en verzint dus nooit zelf een afmeting.

Lokaal bekijken:

```sh
python3 -m http.server 8811 --directory dist
```

Controleren:

```sh
node ~/.claude/skills/website-improver/scripts/check_site.mjs ./dist \
  --redirects ./content/redirects.mjs --langs nl,en
```

Die controle loopt alle gebouwde pagina's na op gebroken interne links,
ontbrekende metadata, taalattributen, hreflang en sitemapdekking, en
controleert daarnaast of elke live-URL uit de oude site ergens landt.

## Mappenstructuur

| Map | Wat erin staat |
|---|---|
| `content/` | Alle tekst, feiten, alt-teksten, galerijgroepen en de redirecttabel — dit is de enige plek waar je inhoud wijzigt. |
| `src/` | `styles.css`, het enige stijlbestand; de build hasht het en zet het als `styles.<hash>.css` in de uitvoer. |
| `scripts/` | `build.mjs` (de hele sitegenerator) en `make-ladder.py` (de afbeeldingsladder). |
| `assets/` | Bronbestanden: `masters/` (originele foto's), `ladder/` (gegenereerde WebP-varianten), `docs/` (PDF's en persscans), `logos/`. |
| `analysis/` | Het onderzoek naar de oude site: `AUDIT.md`, de crawl (`inventory.json`), de geëxtraheerde tekst, de per-pagina snapshots in `pages/` en het oude thema-CSS. Naslag, geen invoer voor de build. |
| `dist/` | De uitvoer. Wordt bij elke build volledig weggegooid en opnieuw geschreven — nooit met de hand bewerken. |

## Content wijzigen

Alles wat op de site staat komt uit `content/`. De build bevat geen tekst
behalve interface-labels ("Menu", "Naar de inhoud", maandnamen). Wie een zin wil
veranderen, hoeft `scripts/build.mjs` niet open te doen.

| Bestand | Waarvoor |
|---|---|
| `content/site.mjs` | Zakelijke feiten die op meerdere plekken terugkomen: adres, telefoon, e-mail, openingstijden, Open Huis, capaciteit, team, stichting en ANBI-gegevens, nieuwsbriefarchief, recensies, vacatures, parkeren. Plus de sectiekleuren. |
| `content/copy.mjs` | De pagina's zelf: `pages` (21 pagina's), `nav` (hoofdmenu) en `submenus` (de linkerkolom per sectie). |
| `content/media-meta.mjs` | Alt-teksten per afbeelding (`alt`) en de indeling van de fotogalerij (`galleryGroups`). |
| `content/media.json` | Gegenereerd door `make-ladder.py` — niet met de hand bewerken. |
| `content/exhibitions.json` | Het tentoonstellingsarchief van de Frankendael Foundation. |
| `content/redirects.mjs` | De URL-migratie, zie hieronder. |

### Beide talen komen uit één structuur

Elke pagina in `pages` heeft `path`, `title`, `desc`, `h1` en `body` met een
`nl`- én een `en`-sleutel. De build loopt per pagina over beide talen en
schrijft twee HTML-bestanden. **Een pagina kan dus niet in één taal bestaan.**
Ontbreekt de Engelse tekst, dan valt de build om — er verschijnt geen halve
pagina en geen Nederlandse tekst onder een Engels adres.

Dat is met opzet zo: op de oude site was `/en/festivities/wedding/` een lege
huls met wel een hero en een submenu, en dat kan hier niet meer gebeuren.
De keerzijde is dat een nieuwe pagina altijd twee keer geschreven moet worden.

Dezelfde structuur levert automatisch de `hreflang`-verwijzingen (`nl`, `en`,
`x-default`), de taalwisselknop rechtsboven en de sitemapregels.

### Een pagina toevoegen

1. Voeg een object toe aan `pages` in `content/copy.mjs`:

   ```js
   {
     id: 'nieuwe-pagina', section: 'zakelijk', menu: null,
     path:  { nl: '/nl/zakelijk/iets/', en: '/en/business/something/' },
     hero:  'koetshuis-diner',            // slug uit content/media.json, of null
     title: { nl: '…', en: '…' },          // de <title>
     desc:  { nl: '…', en: '…' },          // de meta description — verplicht
     h1:    { nl: '…', en: '…' },
     body:  { nl: [ …blokken… ], en: [ …blokken… ] },
   }
   ```

   `section` bepaalt de kleur en het submenu en moet een van `thuis`, `over`,
   `fotos`, `zakelijk`, `feestelijk`, `kunst`, `agenda` zijn.

2. Moet de pagina in een menu? Zet hem in `nav` (hoofdmenu) of in de juiste
   lijst in `submenus`.

3. Neemt de pagina een adres van de oude site over? Verplaats dat adres dan van
   `redirects` naar `keepUrls` in `content/redirects.mjs`.

4. Draai de build. Die controleert zelf of alles klopt.

### Blokken

`body` is per taal een lijst van blokken. Elk blok is een object met één
herkenbare sleutel. In alinea's en lijstitems werkt `[tekst](url)` als link.
Dit zijn alle bloktypen die `renderBlocks` in `scripts/build.mjs` kent:

**Tekst, in de leeskolom**

| Blok | Werking |
|---|---|
| `{ h2: '…' }` | Tussenkop. Komt automatisch in de paginanavigatie naast de tekst. Met `anchor: '…'` geef je zelf een id op. |
| `{ h3: '…' }` | Subkop. |
| `{ p: '…' }` | Alinea. De eerste alinea van een pagina wordt automatisch de lead, tenzij de pagina `noLede: true` heeft. |
| `{ lede: '…' }` | Expliciete lead-alinea. |
| `{ ul: ['…', '…'] }` | Opsomming. |
| `{ note: '…' }` | Kleine terzijde-alinea. |
| `{ cta: [{ label, href, kind }] }` | Knoppenrij. `kind: 'ghost'` geeft de lichte variant. |
| `{ img: 'slug', caption: '…' }` | Afbeelding in de leeskolom, met bijschrift. |

**Volle breedte**

| Blok | Werking |
|---|---|
| `{ plate: 'slug', caption: '…' }` | Schermbrede foto. |
| `{ gateways: [{ img, title, text, link, href }] }` | Rij doorklikkaarten met genummerde titels. |
| `{ ohband: true }` | Open Huis-band met de eerstvolgende vier datums. |
| `{ feature: { label, h2, p: ['…'], cta: [] } }` | Donkere sectie met kop links en tekst rechts. |

**Data — deze blokken vullen zichzelf uit `content/site.mjs`**

| Blok | Vult |
|---|---|
| `{ hours: true }` | De openingstijdentabel. |
| `{ openhouse: true }` | De eerstvolgende zes Open Huis-datums. |
| `{ team: true }` | De teamlijst met functies en e-mailadressen. |
| `{ vacancies: true }` | De vacatures per afdeling, met sollicitatieadres. |
| `{ reports: true }` | De jaarverslagen van de stichting. |
| `{ parking: true }` | Parkeerinformatie en -links. |
| `{ newsletterarchive: true }` | De links naar eerdere nieuwsbrieven. |
| `{ reviews: true }` | De persvermeldingen, met scan waar die bestaat. |

**Verzamelingen**

| Blok | Vult |
|---|---|
| `{ gallery: true }` | De fotogalerij, ingedeeld volgens `galleryGroups` in `content/media-meta.mjs`. |
| `{ exhibitions: true }` | Het tentoonstellingsarchief uit `content/exhibitions.json`. |

De Open Huis-datums worden bij elke build berekend uit "elke laatste zondag van
de maand". Ze staan nergens getypt en kunnen dus niet verlopen. Dat is de reden
dat de nieuwe agenda geen data bevat die je moet bijhouden.

### Een afbeelding toevoegen

Zet het origineel in `assets/masters/`, draai `python3 scripts/make-ladder.py`,
en gebruik de slug (bestandsnaam zonder extensie, kleine letters, koppeltekens)
in een blok. Zet de alt-tekst in beide talen in `alt` in
`content/media-meta.mjs` — zonder alt-tekst valt het beeld terug op het
bijschrift.

## Hoe de migratie werkt

`content/redirects.mjs` is de complete kaart van de oude site naar de nieuwe.
Hij bevat vier lijsten:

- **`liveUrls`** — elke URL van de oude site die bij de crawl van 26-08-2026 een
  200 gaf: 439 adressen.
- **`keepUrls`** — adressen die op de nieuwe site bestaan en dus hun plek houden.
- **`redirects`** — `{ from, to, why }` per adres dat verhuist. Het `why`-veld
  legt de keuze vast, zodat later na te lezen is waarom een adres ergens landt.
- **`convenience`** — korte paden die nooit op de oude site stonden maar handig
  zijn om te kunnen noemen (`/contact`, `/trouwen`, `/english`, …).

De build schrijft deze tabel weg als `dist/_redirects` (Netlify) en
`dist/vercel.json`, telkens in beide slashvormen, als permanente 301.

**De build faalt als een adres geen bestemming heeft.** Na het schrijven van de
pagina's doet `scripts/build.mjs` drie controles, en breekt bij de eerste fout
af met `MIGRATIEFOUT — build afgebroken` en exitcode 1:

1. Elke URL uit `liveUrls` is gebouwd óf staat in de redirecttabel.
2. Elk intern redirectdoel bestaat werkelijk, en is niet zelf weer een redirect
   (geen ketens).
3. Elke URL uit `keepUrls` is daadwerkelijk gebouwd.

Praktisch gevolg: je kunt geen pagina hernoemen of weghalen zonder de
redirecttabel bij te werken. De build laat dat niet passeren, en er kan dus
geen adres stilletjes uit de lucht verdwijnen.

## Voor livegang

Vijf dingen liggen open. Dit zijn **geen aannames die nog geverifieerd moeten
worden — het zijn vragen waarop het antwoord ontbreekt.** Ze zijn bewust niet
ingevuld, omdat een verzonnen antwoord hier schade doet: een juridisch onjuiste
privacytekst, een vacature die niet bestaat, of een waarschuwing voor
wegwerkzaamheden die allang voorbij zijn.

**1. Het formulier-ID van de e-mailprovider voor de nieuwsbrief**

Op de oude site was het aanmeldformulier een letterlijke `//` — er was dus
nergens een werkende aanmelding. De archieflinks naar
`huize-frankendael.email-provider.nl` werken nog wel, en staan op
`/nl/nieuwsbrief/` en `/en/newsletter/`. Aanmelden gaat op dit moment via een
voorgeadresseerde e-mail (`site.newsletter.signupMail` in `content/site.mjs`).

*Nodig:* het formulier- of lijst-ID uit het account bij de e-mailprovider.
Daarmee kan de mailtoknop een echt aanmeldformulier worden.

**2. De juridische entiteit, de bewaartermijn en de hostingpartij in de
privacytekst**

Er staat een privacyverklaring op `/nl/privacy/` en `/en/privacy/`, met drie
gaten die zichtbaar in de gepubliceerde pagina staan:

- `[RECHTSPERSOON INVULLEN — bedrijfsnaam, KvK-nummer en vestigingsadres]`
- `[BEWAARTERMIJN INVULLEN — bijv. maximaal 2 jaar na het laatste contact.]`
- `[HOSTINGPARTIJ INVULLEN.]`

en dezelfde drie in het Engels (`LEGAL ENTITY / RETENTION PERIOD / HOSTING
PROVIDER TO CONFIRM`). Ze staan opzettelijk in de zichtbare tekst en niet in
een comment: zo kan de pagina niet per ongeluk half ingevuld live gaan.

*Nodig:* welke rechtspersoon verwerkingsverantwoordelijke is (Huize Frankendael
of de stichting, met KvK-nummer), hoe lang e-mail en offerteaanvragen bewaard
blijven, en wie de site host.

**3. Welke vacatures actueel zijn**

`site.vacancies` in `content/site.mjs` bevat wat op de oude site stond: keuken
(souschef, chef de partie, afwasser), bediening (restaurantmanager, ervaren
bedieningsmedewerkers) en een stageplaats operationeel eventmanagement. De
stage-PDF waarnaar wordt verwezen dateert uit 2018.

*Nodig:* per functie een bevestiging dat de vacature open staat, en een actuele
stage-PDF — of het besluit om de vacaturepagina leeg te laten tot er weer iets
open staat.

**4. Of de wegwerkzaamheden-melding nog klopt**

De oude site had een waarschuwing over wegwerkzaamheden zonder datum, waardoor
niet vast te stellen is of hij nog geldt. Hij is **niet** overgenomen in de
herbouw.

*Nodig:* een besluit. Als er nu werkzaamheden zijn die de bereikbaarheid raken,
hoort er een melding op `/nl/thuis/contact/route-parkeren/` met een einddatum
erbij; anders blijft het zoals het nu is.

**5. De keuze voor analytics**

Er is nu geen enkele meting. Op de oude site laadden drie
Analytics-properties zonder toestemming en zonder cookiebanner; die zijn alle
drie verwijderd. De privacytekst zegt op dit moment expliciet dat er geen
cookies en geen trackers zijn — die zin klopt alleen zolang dat zo blijft.

*Nodig:* een keuze uit drie:

- niets meten (dan hoeft er niets te gebeuren);
- een cookieloze teller zoals Plausible — geen banner nodig, maar de
  privacytekst moet worden aangepast;
- Google Analytics terug, mét een consent-oplossing en een aangepaste
  privacytekst.

Zonder besluit blijft de site zoals hij nu is: geen meting, geen banner.
