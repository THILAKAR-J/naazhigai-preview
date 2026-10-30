'use strict';
// Edit this file to rebrand, change the domain, or move the calculations to another city.
module.exports = {
  brand: { en: 'Pozhudhu', ta: 'பொழுது' },
  domain: 'https://pozhudhu.com',                       // used for canonical URLs, sitemap and Open Graph (no trailing slash)
  year: 2026,
  location: { name: { en: 'Chennai', ta: 'சென்னை' }, lat: 13.0827, lon: 80.2707, elev: 6 },
  // Extra years published under /<year>/ for list pages (timings, muhurtham, viratham, tithi, festivals, holidays)
  extraYears: [2027],
  // Tamil year (60-year cycle) changes on Chithirai 1
  years: {
    2026: { tamilYearStart: '2026-04-14', tamilYearOld: 'Vishvavasu', tamilYearNew: 'Parabhava' },
    2027: { tamilYearStart: '2027-04-14', tamilYearOld: 'Parabhava', tamilYearNew: 'Plavanga' }
  },
  // Tamil month start dates as followed by Tamil Nadu calendars (Vakya tradition) where they differ
  // from the astronomical (Thirukanitha) sankranti rule. Key: "<sun rasi index>:<year>".
  // 9 = Makara (Thai), 4 = Simha (Avani), 5 = Kanya (Purattasi), 8 = Dhanus (Margazhi)
  monthStartOverrides: {
    '9:2026': '2026-01-15', '4:2026': '2026-08-18', '5:2026': '2026-09-18',
    '4:2027': '2027-08-18', '5:2027': '2027-09-18', '8:2027': '2027-12-17'
  },
  gaId: 'G-57E9J62JBG',          // Google Analytics 4 measurement ID (prod build only)
  adsenseId: 'ca-pub-7098902265764072',                 // Google AdSense publisher ID, site-verification meta tag (prod build only)
  contactEmail: 'contact@pozhudhu.com'                  // set up with Cloudflare Email Routing
};
