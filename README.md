# Pozhudhu (pozhudhu.com) – Tamil Calendar (static site)

A complete Tamil calendar website in the "Bold Poster" design (light theme only): 1056 pages
in English and Tamil, with 2027 versions of every list page under `/2027/`, built as plain HTML so it is fast, cheap to host and easy for Google to read.

Brand, domain, city and contact email live in `site.config.js`.

## Quick start

```bash
npm install
npm run build          # writes dist/prod (English at /, Tamil at /tamil/)
npm run check          # broken links, leaked values, duplicate titles
npm run audit          # SEO: canonical, hreflang, sitemap, robots, JSON-LD, titles, descriptions
npm run check-data     # festival rules and muhurtham re-checked against the calculations
npm run serve          # http://localhost:8080 to look at it locally
```

Upload the **contents of `dist/prod`** to any static host: Netlify, Vercel, Cloudflare Pages,
GitHub Pages, or plain nginx/Apache. `404.html`, `sitemap.xml` and `robots.txt` are at the root.

## Hosting on Cloudflare Pages (pozhudhu.com)

- Workers & Pages → Create → Pages → Connect to Git → this repo
- Production branch `main`, build command `npm run build`, output directory `dist/prod`
- Custom domains: `pozhudhu.com` (and `www.pozhudhu.com`, redirected to the apex)
- `_headers` (security + asset caching) and `_redirects` (old `/amavasya/` URLs) are generated into `dist/prod`
- Every push to `main` redeploys. The `gh-pages` branch is the noindex review copy on GitHub Pages.
- Submit `https://pozhudhu.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- If you add analytics or ads, update the Privacy Policy text in `src/build.js` (search for `privacy-policy`).

## What is on the site

| Section | Pages |
|---|---|
| Home (today's panchangam, upcoming muhurtham, viratham, tithi, festivals) | `/` and `/tamil/` |
| Daily calendar, one page per day of 2026 | `/tamil-daily-calendar/28-october-2026/` |
| Monthly calendar grids | `/tamil-monthly-calendar/october-2026/` |
| Timings: Nalla Neram, Gowri Nalla Neram (each with 12 month pages), Rahu Kalam, Yamagandam, Kuligai, Soolam | `/nalla-neram/`, `/nalla-neram/october-2026/` … |
| Muhurtham: all, Subha, Valarpirai, Theipirai | `/muhurtham-dates/` … |
| Viratham: Pradosham, Sankatahara, Sashti, Karthigai, Chathurthi, Shivaratri, Thiruvonam, Chandra Darshan | `/pradosham-dates/` … |
| Tithi: Pournami, Amavasai, all 14 tithis, Ashtami/Navami lists, Valarpirai/Theipirai periods | `/pournami/` … |
| Tamil holidays (TN Govt G.O.), festivals, Tamil months, retrograde planets | `/tamil-holidays/` … |
| Site map, About, Disclaimer, Privacy, Terms, Contact, 404 | |

"Today" stays correct without a rebuild: `assets/site.js` updates the today card, highlighted rows and
"next / previous date" boxes in the visitor's browser (India time).

## Where the data comes from

- **Calculated** (`src/engine.js`, `src/compute.js`, `src/panchang.js`) for Chennai: sunrise, sunset, moonrise,
  tithi and nakshatram with end times, Tamil month and date, Chandrashtamam, Gowri Panchangam,
  every viratham day, Pournami/Amavasai start and end, Tamil month sankranti, planetary retrogrades.
  Thirukanitha method, Lahiri ayanamsa, using the `astronomy-engine` library.
- **Traditional fixed tables** (`src/names.js`): Rahu Kalam, Yamagandam, Kuligai, Soolam and Pariharam.
- **Editable data files** (`data/`):
  - `muhurtham-2026.json` – the 44 muhurtham dates published in 2026 Tamil calendars.
  - `festivals-2026.json` – TN Government holidays (24) and Tamil festivals.
- **Tamil month start dates** follow Tamil Nadu calendars (Vakya tradition). Three months differ from the
  pure astronomical rule in 2026 (Thai 1 = 15 Jan, Avani 1 = 18 Aug, Purattasi 1 = 18 Sep); they are set in
  `monthStartOverrides` in `site.config.js`.

### Checks that were run

- Tamil date matched the published 2026 Tamil calendar on 115 of 115 check dates (`data/reference-checks.json`).
- Tithi at sunrise matched on 108 of 115. The 7 differences are days where a tithi changes within about an
  hour of sunrise; Vakya calendars and Thirukanitha calculations differ there. Each page shows the tithi end
  time, so the change is visible.
- All 19 festivals tied to a tithi, nakshatram or Tamil date (Pongal, Thaipusam, Masi Magam, Panguni Uthiram,
  Chithra Pournami, Vaikasi Visakam, Aadi Perukku, Mahalaya Amavasai, Skanda Sashti, Karthigai Deepam,
  Vaikunta Ekadasi, Arudra Darshan …) fall on the date given by the rule.

### Things to know

- **Nalla Neram** is calculated: the good Gowri parts between sunrise and 10 PM, with Rahu Kalam and
  Yamagandam removed. Printed wall calendars use their own Nalla Neram, so times can differ. Each page explains this.
- Ramzan, Bakrid, Muharram and Milad-un-Nabi dates follow the Government list and may be revised after moon sighting.
- 2027 list pages (timings, muhurtham, viratham, tithi, festivals, holidays, Tamil months, retrograde) are built
  from `data/muhurtham-2027.json` (63 dates) and `data/festivals-2027.json` (TN Govt G.O. dated 22 Oct 2026).
  Daily and monthly pages exist for 2026 only, so 2027 dates are not links.
- To make 2027 the main year in January: set `year: 2027`, `extraYears: [2028]` (with its data files), rebuild.
- Dev/review build: `node src/build.js --dev --base=/naazhigai-preview` (noindex everywhere).

## Changing the city

Edit `location` in `site.config.js` (name, latitude, longitude) and rebuild. Every calculated value follows.

## Project layout

```
site.config.js      brand, domain, year, city, Tamil month overrides
data/               muhurtham, festivals/holidays, validation checkpoints
src/engine.js       astronomy (sun/moon positions, ayanamsa, rise/set)
src/compute.js      day-by-day tithi, nakshatram, Tamil date
src/panchang.js     viratham rules, Gowri, Nalla Neram, retrogrades
src/names.js        English + Tamil names, fixed timing tables
src/i18n.js, src/copy.js   labels, titles, meta descriptions, FAQs (English + Tamil)
src/shared.js       renderers shared by the build and the browser
src/build.js        the page generator
assets/             site.css (design system, light theme only), site.js, favicon
tools/              check.js (QA), serve.js (local server)
dist/prod/          ready-to-upload website
```
