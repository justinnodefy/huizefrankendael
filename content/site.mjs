// Zakelijke feiten — één bron voor beide talen.
// Alles hier komt van de oude site (huizefrankendael.nl, crawl 26-08-2026).

export const site = {
  name: 'Huize Frankendael',
  domain: 'https://huizefrankendael.nl',
  tagline: {
    nl: 'Het laatste buitenhuis van Amsterdam',
    en: 'The last country estate of Amsterdam',
  },
  address: {
    street: 'Middenweg 72',
    zip: '1097 BS',
    city: 'Amsterdam',
    country: 'NL',
    maps: 'https://www.google.com/maps/place/Huize+Frankendael/@52.3511713,4.9313448,17z',
    geo: { lat: 52.3511713, lng: 4.9313448 },
  },
  phone: { display: '020 – 423 39 30', intl: '+31 20 423 39 30', href: 'tel:+31204233930' },
  email: 'info@huizefrankendael.nl',
  socials: {
    instagram: 'https://www.instagram.com/huize_frankendael/',
    facebookHF: 'https://www.facebook.com/pages/Huize-Frankendael-restaurant-Merkelbach/177468635632918',
    facebookMB: 'https://www.facebook.com/restaurantmerkelbach',
    facebookFF: 'https://www.facebook.com/frankendaelfoundation',
  },
  merkelbach: {
    name: 'Restaurant Merkelbach',
    site: 'https://restaurantmerkelbach.nl/',
    booking: 'https://bookings.zenchef.com/results?rid=371618',
  },

  // Openingstijden van huis & restaurant (koffie, taart, à-la-cartelunch, borrel).
  hours: [
    { d: { nl: 'Maandag', en: 'Monday' }, t: '8.30 – 18.00' },
    { d: { nl: 'Dinsdag', en: 'Tuesday' }, t: '8.30 – 18.00' },
    { d: { nl: 'Woensdag', en: 'Wednesday' }, t: '8.30 – 18.00' },
    { d: { nl: 'Donderdag', en: 'Thursday' }, t: '8.30 – 18.00' },
    { d: { nl: 'Vrijdag', en: 'Friday' }, t: '8.30 – 18.00' },
    { d: { nl: 'Zaterdag', en: 'Saturday' }, t: '8.30 – 18.00' },
    { d: { nl: 'Zondag', en: 'Sunday' }, t: '9.00 – 18.00' },
  ],
  hoursNote: {
    nl: 'In mei t/m september zijn er in de weekenden veel huwelijken in huis; de lunchtijden zijn op die dagen vaak aangepast. Het online reserveringssysteem van Merkelbach geeft dit automatisch aan.',
    en: 'From May through September we host many weddings during the weekends; lunch hours are often adjusted on those days. Merkelbach’s online reservation system will indicate this automatically.',
  },

  // Open Huis: elke laatste zondag van de maand. Datums worden bij de build
  // berekend, zodat deze informatie nooit kan verouderen.
  openHouse: {
    time: '12.00 – 17.00',
    tourTime: '12.00 – 13.00',
    tourMax: 8,
    free: true,
    groupTour: { price: '€ 50,–', max: 15 },
  },

  capacity: { min: 2, max: 300, partyMin: 10, privateDinnerMin: 15 },

  team: [
    { name: 'Bodo Groen', role: { nl: 'financieel directeur', en: 'financial director' }, email: 'bureau@huizefrankendael.nl' },
    { name: 'Geert Burema', role: { nl: 'chef de cuisine, gastronomisch directeur', en: 'chef de cuisine, gastronomy director' }, email: 'geert@restaurantmerkelbach.nl' },
    { name: 'Lise Schmetz', role: { nl: 'eventmanager', en: 'event manager' }, email: 'lise@huizefrankendael.nl' },
    { name: 'Kitty Ludwig', role: { nl: 'banquetingmanager', en: 'banqueting manager' }, email: 'kitty@huizefrankendael.nl' },
    { name: 'Jascha Goudt', role: { nl: 'restaurantmanager', en: 'restaurant manager' }, email: 'jascha@restaurantmerkelbach.nl' },
  ],

  foundation: {
    name: 'Stichting Huize Frankendael / Frankendael Foundation',
    rsin: '820472657',
    anbi: true,
    board: ['Nynke de Haan', 'Joram Kraaijeveld', 'Caroline Vos', 'Bodo Groen'],
    reports: [
      { label: { nl: 'Jaarverslag 2015 (PDF)', en: 'Annual report 2015 (PDF)' }, file: 'docs/Jaarverslag-2015.pdf' },
      { label: { nl: 'Activiteitenverslag 2015 (PDF)', en: 'Activities report 2015 (PDF)' }, file: 'docs/Activiteitenverslag-2015.pdf' },
    ],
  },

  newsletter: {
    // Aanmeldformulier op de oude site was kapot (letterlijke "//").
    // Externe archieflinks werken nog; aanmelden gaat tijdelijk per mail
    // tot de eigenaar het formulier-ID van email-provider.nl aanlevert.
    signupMail: 'mailto:info@huizefrankendael.nl?subject=Aanmelden%20nieuwsbrief',
    archive: [
      { label: 'Nieuwsbrief december 2017', url: 'https://huize-frankendael.email-provider.nl/web/s9jpl03cra/uaffvi9ru3' },
      { label: 'Nieuwsbrief oktober 2017', url: 'https://huize-frankendael.email-provider.nl/web/s9jpl03cra/kv8gbezynx' },
      { label: 'Nieuwsbrief september 2017', url: 'https://huize-frankendael.email-provider.nl/web/s9jpl03cra/fumdbo2xmk' },
      { label: 'Nieuwsbrief mei 2017', url: 'https://huize-frankendael.email-provider.nl/web/s9jpl03cra/ihlbi4bfwi' },
      { label: 'Nieuwsbrief april 2017', url: 'https://huize-frankendael.email-provider.nl/web/s9jpl03cra/lnwmqnzibh' },
      { label: 'Nieuwsbrief maart 2017', url: 'https://huize-frankendael.email-provider.nl/web/s9jpl03cra/9puupax80j' },
    ],
  },

  reviews: {
    // Van /en/reviews. Vier PDF-scans en de NRC-link zijn op de oude site
    // al dood (404); die vermeldingen blijven als tekst zonder link.
    linked: [
      { outlet: 'Het Parool', author: 'Johannes van Dam', year: 2008, file: 'docs/Het_Parool_Johannes_van_Dam_27-12-2008.jpg', kind: 'jpg' },
      { outlet: 'De Telegraaf', year: 2009, file: 'docs/De_Telegraaf_01-03-2009.jpg', kind: 'jpg' },
    ],
    unlinked: [
      { outlet: 'Food & Wines', year: 2009 },
      { outlet: 'Misset Horeca', year: 2009 },
      { outlet: 'Time Out Amsterdam', year: 2008 },
      { outlet: 'Green2' },
      { outlet: 'nrc.next', year: 2011 },
    ],
  },

  vacancies: {
    // Zoals vermeld op de oude site (NL + EN samengevoegd). De eigenaar moet
    // bevestigen wat actueel is — zie README.
    kitchen: {
      roles: { nl: ['Souschef en chef de partie', 'Afwasser'], en: ['Sous chef and chef de partie', 'Pot washer'] },
      apply: 'geert@restaurantmerkelbach.nl', attn: 'Geert Burema',
    },
    service: {
      roles: { nl: ['Restaurantmanager', 'Ervaren bedieningsmedewerkers'], en: ['Restaurant manager', 'Experienced serving staff'] },
      note: { nl: '', en: 'Dutch speaking only' },
      apply: 'info@huizefrankendael.nl', attn: 'Bodo Groen',
    },
    internship: {
      title: { nl: 'Stagiair(e) operationeel eventmanagement', en: 'Intern, operational event management' },
      file: 'docs/Vacature-Stagiaire-Huize-Frankendael.pdf',
      apply: 'info@huizefrankendael.nl', attn: 'Bodo Groen',
    },
  },

  parking: {
    garage: { nl: 'Parkeergarage VOMAR, schuin tegenover Huize Frankendael: veilig en overdekt (± € 6,00 p/u).', en: 'VOMAR multi-storey car park, diagonally opposite Huize Frankendael: secure and covered (± €6.00 per hour).' },
    street: { nl: 'Betaald parkeren ma t/m za 9.00–21.00 uur: Hugo de Vrieslaan ± € 3,90 p/u, Middenweg ± € 5,00 p/u. Op zondag is parkeren gratis.', en: 'Paid street parking Mon–Sat 9 AM–9 PM: Hugo de Vrieslaan ± €3.90/h, Middenweg ± €5.00/h. Parking is free on Sundays.' },
    links: [
      { label: { nl: 'Actuele parkeertarieven (amsterdam.nl)', en: 'Current parking rates (amsterdam.nl)' }, url: 'https://www.amsterdam.nl/parkeren/' },
      { label: { nl: 'P+R in Amsterdam', en: 'P+R in Amsterdam' }, url: 'https://www.amsterdam.nl/parkeren/parkeren-reizen/' },
    ],
  },
};

// De vijf sectiekleuren van de oude site, met per kleur een donkere variant
// die wél leesbaar is als tekstkleur op licht (de originele middentinten
// haalden 1,9–2,6:1 met witte tekst).
export const sections = {
  thuis:      { accent: '#1F191A', dark: '#1F191A', tint: '#EFEDEA' },
  over:       { accent: '#005164', dark: '#005164', tint: '#E7F0F2' },
  fotos:      { accent: '#F5AE15', dark: '#7D5606', tint: '#FBEED2' },
  zakelijk:   { accent: '#A69FA0', dark: '#5F5758', tint: '#EFEDED' },
  feestelijk: { accent: '#AB0C40', dark: '#AB0C40', tint: '#F8E7ED' },
  kunst:      { accent: '#6FC3C3', dark: '#20716F', tint: '#E4F3F3' },
  agenda:     { accent: '#555555', dark: '#4A4A4A', tint: '#ECECEC' },
};
