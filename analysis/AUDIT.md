# Audit huizefrankendael.nl — 26 augustus 2026

Platform: WordPress, custom theme `huizefrankendael-v21` (webdesign loupe.nl),
jQuery 3.7.1 + jquery-migrate + Bootstrap bundle + Font Awesome (JS, via cdnjs)
+ Vegas slideshow + responsive-lightbox. 23 scripts per pagina.

Crawl: **456 paden gevonden, 439 met status 200; sitemap bevat 454 adressen.**
Daarvan zijn er ca. **45 echte inhoudspagina's**; de rest zijn
WordPress-bijlagepagina's (één pagina per geüploade foto, zonder h1 en zonder
tekst) die in de sitemap staan en intern gelinkt zijn.

## Kritiek

1. **Het Zenchef-reserveringswidget van Restaurant Merkelbach laadt op elke
   pagina en bedekt op mobiel het volledige scherm.** Het iframe
   (`bookings.zenchef.com/results`, rid 371618) staat `position:fixed; top:0`
   en is 812×368 px op een 375px-viewport; het paneel klapt op mobiel
   automatisch open en eet ~28% van het eerste scherm — óók op de trouw-,
   zakelijk- en kunstpagina's. Het restaurant is een ander bedrijf op een
   ander domein. Gevolg: de eigen conversie van de venue (eventaanvraag,
   bezoek) verdwijnt achter een restaurantwidget.

2. **Verminkte embedcode staat als zichtbare tekst op de site.** Vier plekken:
   - Homepage (`/` en `/nl/`): het Zenchef-bootstrapscript staat er twee keer
     in — één keer werkend, één keer met "slimme aanhalingstekens" kapotgeplakt,
     die versie rendert als zichtbare JavaScript-tekst.
   - Contact (NL+EN): de CSS van de Google Maps-embed (`.embed-container {…}`)
     staat als lopende tekst onder het kopje "Route"; de kaart zelf ontbreekt.
   - Contact (NL): een volledig Google Analytics-snippet (derde property:
     UA-24607675-1) staat als zichtbare tekst onder "Werken bij".
   - Agenda, Kunst en Nieuwsbrief: het aanmeldformulier voor de nieuwsbrief is
     een letterlijke `//` — er is dus nergens een werkende nieuwsbriefaanmelding.

3. **De site oogt verlaten door stilstaande inhoud.** "Nu": "Momenteel hebben
   wij geen tentoonstelling in huis." "Eerder": Museumnacht **2018** met de
   tekst "Kom aanstaande zaterdag…", Young Collectors Salon 18 oktober 2018,
   Public Art Amsterdam 2018. Tentoonstellingenpagina: "GEPLAND: Amsterdam Art
   Weekend! Aanstaande zondag (26 november)" — uit 2017. Vacature: stage-PDF
   uit 2018. Wegwerkzaamheden-waarschuwing zonder datum. Laatste nieuwsbrief:
   december 2017.

4. **De hero van de homepage is een PNG-schermafbeelding van 528 kB**
   (`Schermafbeelding-2019-07-10-om-11.21.52.png`), fullscreen opgerekt op
   zowel de splash (`/`) als `/nl/` en als fallback op meer pagina's; 2,6 s
   downloadtijd bovenop een TTFB van ~1,7 s. In de theme-JS staat bovendien
   nog een slide-URL naar `http://localhost/huizefrankendael-v21/…`.

5. **Drie Google Analytics-properties, geen cookiebanner.** GA4
   (G-X2DF19R0K5) + Universal Analytics (UA-115827137-1, verwerkt sinds 2023
   niets meer) laden op elke pagina zonder consent; de derde property staat
   als tekst op de contactpagina. AVG-risico en géén bruikbare meting
   (mail/telefoon-conversies worden niet gemeten). Er is nergens een
   privacyverklaring of cookiepagina.

## Toegankelijkheid

6. **Contrast**: witte tekst op de sectiekleuren faalt hard —
   goud #F5AE15 = 1,92:1, aqua #6FC3C3 = 2,04:1, grijs #A69FA0 = 2,6:1
   (norm 4,5:1). Petrol (8,9) en magenta (7,4) voldoen wél.
7. **h1-chaos**: 342 van 439 pagina's hebben niet precies één h1 (bijlage-
   pagina's: 0; fotopagina 9; agenda 5). 57 afbeeldingen zonder alt-tekst in de
   crawl; de galerij van 52 foto's heeft er geen enkele.
8. **`lang="en-US"` op álle pagina's**, ook de Nederlandse. Screenreaders
   lezen Nederlands voor met een Engelse stem. Geen `hreflang`, nergens.
   Geen skip-link.

## SEO

9. **281/439 pagina's zonder meta description** (17 van 29 echte
   inhoudspagina's). Homepagetitel is "NEDERLANDS | Huize Frankendael";
   scheidingstekens wisselen (`|` en `-`).
10. **Structured data**: alleen Yoast-standaard (WebSite/WebPage/
    BreadcrumbList/ImageObject) — geen LocalBusiness/EventVenue, geen Event
    (terwijl het Open Huis elke laatste zondag een perfect terugkerend Event
    is), geen TouristAttraction. Gecontroleerd per paginatype via de crawl.
11. **~250 bijlagepagina's** in sitemap en interne links: dunne duplicaten die
    crawlbudget opsouperen. 5 interne 404-links op kunstpagina's.
12. **Dode links op inhoudspagina's**: NL "Team" → `/nl/over/ons-team/` = 404
    (de EN-teampagina bestaat wél); "info@huizefrankendael.nl" op werken-bij
    linkt naar een 404-pagina i.p.v. mailto; reserveringslinks naar SeatMe
    (dienst bestaat niet meer) op Over (NL+EN); recensiepagina: 5 van 7 links
    dood (4 PDF's 404, NRC-link 404); vacaturepagina bedieningsmedewerker
    toont een 404-afbeelding.
13. **De geschiedenispagina hotlinkt 6 afbeeldingen van amsterdam.nl — alle
    zes 404.** De rijkste pagina van de site (1.600 woorden monumentbeschrijving)
    toont zes kapotte afbeeldingen met verweesde bijschriften. De tekst is
    integraal overgenomen van de gemeentepagina, inclusief `iprox-` CMS-markup.

## Performance

14. 23 scripts per pagina (jQuery, migrate, Bootstrap, Font Awesome als
    JS-injectie, swipebox, infinite-scroll, dompurify, underscore, vegas,
    wp-emoji, 3× analytics, Zenchef SDK + iframe). HTML zelf is 26–95 kB.
15. Galerijthumbnails zijn 600×600 maar worden op 87×87 getoond (7× te groot);
    heroes zijn 1500px JPEG's zonder `srcset`, niet gepreload; de PNG-hero van
    528 kB is het LCP-element van de belangrijkste pagina's.
16. Google Fonts laadt 6 gewichten × 2 families incl. italics.

## Inhoud & structuur

17. De splashpagina (`/`) toont alleen een foto met twee linkkolommen: geen
    waardepropositie, geen praktische feiten, verdubbelt de klikafstand.
    De Merkelbach-kolom verlaat het domein zonder dat te melden.
18. Boven de vouw staat nergens een call-to-action; de beslissende feiten
    (Open Huis laatste zondag, adres, 2–300 personen) staan halverwege
    pagina's of in de zijbalk van de kunstpagina.
19. Aliassen dubbel geïndexeerd: `/nl/zakelijk/` = `/nl/zakelijk/algemeen/`,
    idem feestelijk, `/en/home` = `/en/`, `/en/business/general` enz.
20. **De Engelse trouwpagina is leeg** — `/en/festivities/wedding/` heeft een
    hero en submenu maar nul tekst, terwijl trouwen commercieel de
    belangrijkste dienst is en expats een logische doelgroep.
21. Inconsistenties: EN-home zegt "last 18th-century estate", NL zegt 17e
    eeuw (het huis is 1659/1660 gesticht, gevel ±1733); telefoonnummer in vier
    notaties; "laatste buitenhuis" vs "enige overgebleven buitenplaats".
22. Sterke inhoud die behouden moet blijven: de geschiedenistekst, het
    tentoonstellingsarchief 2009–2018 (±3.700 woorden cultuurgeschiedenis van
    de Frankendael Foundation), de ANBI-verantwoording (RSIN 820472657,
    bestuur, jaarverslagen), de recensies, de praktische bezoek/parkeer/route-
    informatie, en 141 bruikbare eigen foto's tot 2048px.

## Wat dit niet oplost

- Nieuwsbriefaanmelding vereist het formulier-ID van de e-mailprovider
  (huize-frankendael.email-provider.nl) van de eigenaar; tot die tijd is de
  aanmeldknop een voorgeadresseerde mail.
- Privacyverklaring vereist juridische input van de eigenaar (welke entiteit,
  bewaartermijnen); de nieuwe site levert een ingevuld concept met expliciete
  invulvelden.
- Actuele vacatures, tentoonstellingsagenda en de wegwerkzaamheden-status
  moet de eigenaar bevestigen; de nieuwe structuur maakt "verlopen" onmogelijk
  door terugkerende feiten (Open Huis) te berekenen i.p.v. te typen.
- Analytics is bewust weggelaten tot de eigenaar kiest voor een
  consent-oplossing of een cookieloze teller (bijv. Plausible).
