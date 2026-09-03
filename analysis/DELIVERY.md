# Oplevernotitie — herbouw huizefrankendael.nl

Datum: 26 augustus 2026. Basis: de crawl en audit van dezelfde datum
(`analysis/AUDIT.md`). De cijfers in de kolom "was" komen uit die audit, de
cijfers in de kolom "wordt" uit de gebouwde uitvoer in `dist/`.

## Was → wordt

| Meetpunt | Oude site | Nieuwe site |
|---|---|---|
| Scripts per pagina | 23 (jQuery, jquery-migrate, Bootstrap, Font Awesome als JS-injectie, swipebox, infinite-scroll, dompurify, underscore, vegas, wp-emoji, 3× analytics, Zenchef-SDK + iframe) | 1 klein inline script van ±1,6 kB (menu, meelopende header, lightbox, reveal). Geen enkel extern script. |
| Analytics-properties | 3: GA4 `G-X2DF19R0K5`, Universal Analytics `UA-115827137-1`, en `UA-24607675-1` als zichtbare tekst op de contactpagina. Geen cookiebanner, geen privacyverklaring. | Geen. Geen cookies, geen trackers, geen banner nodig. Er staat een privacyverklaring op `/nl/privacy/` en `/en/privacy/`. |
| Meta description | 281 van 439 pagina's zonder (17 van de 29 echte inhoudspagina's) | Alle 43 gebouwde pagina's hebben er precies één, in de eigen taal — en de 404-pagina ook. |
| Taalattribuut | `lang="en-US"` op álle pagina's, ook de Nederlandse — screenreaders lazen Nederlands voor met een Engelse stem | `lang="nl"` op de Nederlandse pagina's, `lang="en"` op de Engelse. |
| hreflang | Nergens | `nl`, `en` en `x-default` op elke pagina, én per regel in de sitemap. |
| Afbeeldingen zonder alt | 57 in de crawl; de galerij van 52 foto's had er geen enkele | 0 van de 370 `<img>`-tags in de uitvoer. Alt-teksten staan in beide talen in `content/media-meta.mjs`. |
| h1 | 342 van 439 pagina's hadden niet precies één h1 (bijlagepagina's 0, fotopagina 9, agenda 5) | Precies één h1 op elke pagina, zonder uitzondering. |
| Hero | PNG-schermafbeelding van 528 kB (`Schermafbeelding-2019-07-10-om-11.21.52.png`), fullscreen opgerekt, één vaste maat, niet gepreload — het LCP-element van de belangrijkste pagina's | Responsive WebP-ladder met `srcset`: 480 px = 37,9 kB, 800 px = 84,9 kB, 1200 px = 136,9 kB, 1600 px = 203,8 kB, met preload van de hero. Een mobiele bezoeker haalt 37,9 kB in plaats van 528 kB. |

Aanvullend, uit dezelfde bronnen: de HTML woog op de oude site 26–95 kB per
pagina, nu 6–52 kB met een gemiddelde van 15 kB. De stijl zit in één
CSS-bestand van ±31 kB met een hash in de naam, zodat het onbeperkt gecachet
kan worden.

De vijf sectiekleuren van de oude site zijn behouden als accentkleur, maar
witte tekst daarop haalde 1,92:1 (goud), 2,04:1 (aqua) en 2,6:1 (grijs) tegen
een norm van 4,5:1. Voor tekst is per kleur een donkere variant vastgelegd in
`content/site.mjs`; de originele middentinten worden alleen nog als vlak en
lijn gebruikt, niet als tekstkleur.

## De URL-migratie

De crawl van 26-08-2026 vond **439 live adressen** (status 200). Alle 439 staan
als `liveUrls` in `content/redirects.mjs`, en elk daarvan heeft een bestemming:

- **35 blijven op hetzelfde adres.** Dat zijn de echte inhoudspagina's waarvan
  het pad ongewijzigd is.
- **404 krijgen een 301** naar de pagina waar die inhoud nu staat. Het gros is
  een WordPress-bijlagepagina (één pagina per geüploade foto, zonder h1 en
  zonder tekst) die naar de dichtstbijzijnde inhoudspagina gaat, vaak met een
  anker naar het juiste blok — bijvoorbeeld
  `/nl/zakelijk/ruimtes/koetshuis/koetshuis-19` → `/nl/zakelijk/ruimtes/#koetshuis`.
- **0 zonder bestemming.**

De redirecttabel telt 406 regels: de 404 gecrawlde adressen plus twee adressen
die niet in de crawl zaten maar wel in oude links voorkomen
(`/en/restaurant/merkelbach` naar het eigen domein van het restaurant, en
`/nl/agenda/nieuwsbrief` naar de eigen nieuwsbriefpagina). Daarnaast staan er 8
gemakspaden in (`/contact`, `/trouwen`, `/fotos`, `/agenda`, `/english`,
`/kunst`, `/zakelijk`, `/feestelijk`). Samen 414 regels, elk in beide
slashvormen weggeschreven: 828 regels in `dist/_redirects`, en dezelfde set in
`dist/vercel.json`.

Elk `redirects`-item heeft naast `from` en `to` een `why`-veld dat de keuze
vastlegt, zodat over een jaar nog na te lezen is waarom een adres ergens landt.

**De build faalt als dat verandert.** `scripts/build.mjs` doet na het schrijven
van de pagina's drie controles en stopt bij de eerste fout met
`MIGRATIEFOUT — build afgebroken` en exitcode 1:

1. elke URL uit `liveUrls` is gebouwd óf staat in de redirecttabel;
2. elk intern redirectdoel bestaat werkelijk en is niet zelf weer een redirect
   (geen ketens, geen dubbele hops);
3. elke URL uit `keepUrls` is daadwerkelijk gebouwd.

Een pagina hernoemen of weghalen zonder de tabel bij te werken levert dus geen
site op. Er kan geen adres stilletjes uit de lucht verdwijnen.

Naast de 35 behouden adressen zijn er 8 adressen nieuw bijgekomen die op de
oude site niet werkten of niet bestonden — onder meer `/nl/over/ons-team/` (op
de oude site een 404 waar wél naartoe werd gelinkt vanuit het NL-menu),
`/nl/recensies/`, en de privacypagina's in beide talen.

## Wat dit niet repareert

Eerlijk over de grenzen van deze oplevering. Onderstaande punten staan ook in
`analysis/AUDIT.md` onder "Wat dit niet oplost".

**De nieuwsbriefaanmelding werkt nog steeds niet echt.** Op de oude site was
het formulier een letterlijke `//`. Voor een werkend formulier is het
formulier-ID van `huize-frankendael.email-provider.nl` nodig, en dat zit in het
account van de eigenaar. Tot die tijd is de aanmeldknop een voorgeadresseerde
e-mail. De archieflinks naar eerdere edities werken wel.

**De privacyverklaring is een concept met gaten.** Er staat een volledige tekst,
maar de verwerkingsverantwoordelijke, de bewaartermijn en de hostingpartij zijn
niet ingevuld. Die drie staan als zichtbare invulvelden in de gepubliceerde
pagina — met opzet, want in een comment zouden ze vergeten worden. Dit vraagt
juridische input, geen redactionele.

**De actualiteit van vacatures, tentoonstellingsagenda en de
wegwerkzaamheden-melding is niet vast te stellen.** Alleen de eigenaar weet wat
klopt. Wat wél is opgelost: het Open Huis wordt bij elke build berekend uit
"elke laatste zondag van de maand" in plaats van getypt, dus die informatie kan
per definitie niet verlopen. Dat is de reden dat de nieuwe agenda geen datums
bevat die iemand moet bijhouden. De wegwerkzaamheden-waarschuwing is niet
overgenomen omdat er geen datum bij stond.

**Analytics is bewust weggelaten**, niet vergeten. Er wordt op dit moment niets
gemeten. De keuze tussen niets meten, een cookieloze teller of Analytics-met-
consent ligt bij de eigenaar; de privacytekst hangt van die keuze af.

**Dode externe bronnen komen niet terug.** Op de recensiepagina waren 4
PDF-scans en de NRC-link al 404 op de oude site; die vermeldingen staan nu als
tekst zonder link. Ze worden pas weer links als de scans worden aangeleverd. De
geschiedenispagina hotlinkte 6 afbeeldingen van amsterdam.nl die alle zes 404
gaven; die zijn vervangen door één eigen foto, niet door zes nieuwe
illustraties met de oorspronkelijke bijschriften.

**De herkomst van de geschiedenistekst is ongewijzigd.** De ±1.600 woorden
monumentbeschrijving zijn integraal van de gemeentepagina overgenomen. De
`iprox-`CMS-markup is eruit, maar de tekst is niet herschreven en de
auteursrechtelijke situatie is niet gecontroleerd.

**Het Zenchef-widget is weg, de afhankelijkheid niet.** Het reserveren van een
tafel gaat nu via een link naar de reserveringspagina van Merkelbach in plaats
van een iframe dat op elke pagina meelaadde en op mobiel 28% van het eerste
scherm opat. Maar Merkelbach blijft een ander bedrijf op een ander domein, en
wie een tafel wil reserveren verlaat de site.

## Risico bij livegang

**Rankings wiebelen twee tot vier weken.** Dat hoort bij elke migratie: Google
moet 439 adressen opnieuw beoordelen en de 301's volgen. Verwacht in die
periode schommelingen in posities en vertoningen. Dat is geen reden om terug te
draaien; terugdraaien halverwege maakt het juist erger, omdat er dan een tweede
migratie overheen komt.

**Een migratie behoudt, maar tovert niet.** De 301's dragen over wat de oude
adressen aan waarde hadden. Ze maken geen nieuwe waarde. Wat de nieuwe site
wél verandert — meta descriptions op alle pagina's, correcte taal en hreflang,
één h1 per pagina, een hero die 37,9 kB weegt in plaats van 528 kB — verbetert
de uitgangspositie, maar dat is een kwestie van maanden, niet van dagen.

**Het aantal geïndexeerde pagina's daalt zichtbaar, en dat is de bedoeling.**
Van 439 live adressen naar 43 gebouwde pagina's. Circa 250 daarvan waren
WordPress-bijlagepagina's: één pagina per foto, zonder kop en zonder tekst, wél
in de sitemap en wél intern gelinkt. Ze verdwijnen als eigen adres en gaan naar
de inhoudspagina waar de foto hoort. In de Search Console ziet dat er de eerste
weken uit als verlies. Het is opgeruimd crawlbudget.

**Adressen zonder interne link en zonder sitemapvermelding zijn onvindbaar voor
een crawl.** De 439 adressen zijn gevonden via de sitemap (454 adressen) en de
interne links. Alles wat daar niet in staat, is met geen enkele crawl te
vinden: oude campagnelinks, adressen op drukwerk, links vanaf externe sites
naar paden die al eerder waren verwijderd. Die komen pas ná livegang boven,
in de Search Console onder "Niet gevonden (404)" en in de serverlogs.

Reken daar dus op, in plaats van erop te hopen dat het niet gebeurt: loop de
eerste vier weken na livegang wekelijks de 404-rapportage na en voeg wat
daarin opduikt toe aan `redirects` in `content/redirects.mjs`. Dat is één regel
per adres, en de build controleert daarna zelf of het doel bestaat. In de
tussentijd vangt `dist/404.html` onbekende adressen op met doorverwijzingen naar
de homepage, de foto's en de contactpagina, in beide talen.
