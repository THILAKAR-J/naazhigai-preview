'use strict';
// Edit this file to rebrand, change the domain, or move the calculations to another city.
module.exports = {
  brand: { en: 'Naazhigai', ta: 'நாழிகை' },          // placeholder brand name
  domain: 'https://www.example.com',                   // used for canonical URLs, sitemap and Open Graph
  year: 2026,
  location: { name: { en: 'Chennai', ta: 'சென்னை' }, lat: 13.0827, lon: 80.2707, elev: 6 },
  // Tamil year (60-year cycle) changes on Chithirai 1
  tamilYearStart: '2026-04-14', tamilYearOld: 'Vishvavasu', tamilYearNew: 'Parabhava',
  // Tamil month start dates as followed by Tamil Nadu calendars (Vakya tradition) where they differ
  // from the astronomical (Thirukanitha) sankranti rule. Key: "<sun rasi index>:<year>".
  // 9 = Makara (Thai), 4 = Simha (Avani), 5 = Kanya (Purattasi)
  monthStartOverrides: { '9:2026': '2026-01-15', '4:2026': '2026-08-18', '5:2026': '2026-09-18' },
  contactEmail: 'hello@example.com'                    // placeholder
};
