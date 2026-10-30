'use strict';
// Static site generator. Usage:
//   node src/build.js --target=prod                 -> dist/prod  (English at /, Tamil at /tamil/, pretty URLs)
//   node src/build.js --target=preview-en|preview-ta -> dist/preview-xx (flat files for a single-folder preview)
// Options: --today=YYYY-MM-DD (date used for the static "today" fallback), --other=<url> (preview language switch)
const fs = require('fs');
const path = require('path');
const cfg = require('../site.config');
// Google Analytics (GA4) tag, production build only, placed first inside <head> as Google asks.
function gtag() {
  if (DEV || !cfg.gaId) return '';
  return '<!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=' + cfg.gaId + '"></script>' +
    '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'' + cfg.gaId + '\');</script>';
}
// Google AdSense site-connection meta tag, production build only (not the noindex review build).
function adsenseMeta() {
  if (DEV || !cfg.adsenseId) return '';
  return '<meta name="google-adsense-account" content="' + cfg.adsenseId + '">';
}
// Production robots.txt: every crawler (search engines and AI assistants) is explicitly allowed.
function robotsProd() {
  const bots = ['*', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Googlebot', 'Bingbot', 'PerplexityBot', 'Amazonbot', 'Bytespider', 'Applebot', 'Meta-ExternalAgent', 'DuckAssistBot'];
  return bots.map((b) => 'User-agent: ' + b + '\nAllow: /\nDisallow: /admin/\n').join('\n') + '\nSitemap: ' + cfg.domain + '/sitemap.xml\n';
}
const { buildModel } = require('./panchang');
const N = require('./names');
const F = require('./format');
const { L, V } = require('./i18n');
const { C, TITHI_PAGES } = require('./copy');
const S = require('./shared');

const ROOT = path.join(__dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const TARGET = arg('target', 'prod');
const PREVIEW = TARGET.startsWith('preview');
const LANGS = PREVIEW ? [TARGET.split('-')[1]] : ['en', 'ta'];
const TODAY = arg('today', F.istKey(new Date()));
const OTHER = arg('other', '');
const DEV = process.argv.includes('--dev');            // review build: noindex everywhere
const BASE = arg('base', '').replace(/\/$/, '');      // e.g. /naazhigai-preview when hosted under a sub-path
const OUT = path.join(ROOT, 'dist', DEV ? 'dev' : TARGET);
const ADMIN = !PREVIEW && !DEV;                         // the /admin/ SEO panel ships with the production build only

// ---------------- SEO overrides (edited from /admin/, stored in data/seo-overrides.json) ----------------
// Keyed by a page's default path, e.g. "/rahu-kalam/" or "/tamil/tamil-daily-calendar/29-october-2026/".
// Fields: title, description, keywords, canonical, slug (last URL segment), previousSlugs (kept for 301s).
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const withSlug = (p, s) => p.replace(/[^/]+\/$/, s + '/');
const SEO = (() => {
  if (PREVIEW) return {};
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'seo-overrides.json'), 'utf8')).pages || {}; } catch (e) {
    if (e.code !== 'ENOENT') throw new Error('data/seo-overrides.json is not valid JSON: ' + e.message);
  }
  const out = {};
  const str = (x, n) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, n) : '');
  for (const [k, v] of Object.entries(raw)) {
    if (!/^\/(?:[a-z0-9-]+\/)*$/.test(k) || !v || typeof v !== 'object') { console.warn('SEO override skipped, bad page key: ' + k); continue; }
    const fixed = k === '/' || k === '/tamil/';
    const o = { title: str(v.title, 120), description: str(v.description, 320), keywords: str(v.keywords, 300), canonical: '', slug: '', previous: [] };
    if (v.canonical) { if (/^https:\/\/[^\s"'<>]+$/.test(v.canonical)) o.canonical = v.canonical; else console.warn('SEO override: canonical ignored for ' + k); }
    if (v.slug) { if (!fixed && SLUG_RE.test(v.slug) && withSlug(k, v.slug) !== k) o.slug = v.slug; else if (withSlug(k, v.slug) !== k) console.warn('SEO override: slug ignored for ' + k); }
    if (!fixed && Array.isArray(v.previousSlugs)) o.previous = v.previousSlugs.filter((s) => SLUG_RE.test(s) && s !== o.slug && withSlug(k, s) !== k);
    out[k] = o;
  }
  return out;
})();
const ADMIN_INDEX = [];
const PRIMARY = cfg.year;                                   // daily + monthly pages exist for this year only
const YEARS = [PRIMARY].concat(PREVIEW ? [] : (cfg.extraYears || []));
// pages that exist for every year (the rest: home, daily, monthly, soolam, about pages are primary-year only)
const YEARABLE = new Set(['timings', 'nalla-neram', 'gowri-nalla-neram', 'rahu-kalam', 'yamagandam', 'kuligai-neram',
  'muhurtham-dates', 'subha-muhurtham-dates', 'valarpirai-muhurtham-dates', 'theipirai-muhurtham-dates',
  'viratham', 'pradosham-dates', 'sankatahara-chaturthi-dates', 'sashti-viratham-dates', 'karthigai-viratham-dates',
  'chaturthi-viratham-dates', 'shivaratri-dates', 'thiruvonam-dates', 'chandra-darshan-dates',
  'tithi', 'pournami', 'amavasai', 'ashtami-navami', 'ashtami-navami-dashami', 'valarpirai-ashtami', 'theipirai-ashtami',
  'valarpirai-dates', 'theipirai-dates', 'tamil-holidays', 'tamil-festivals', 'tamil-months', 'retrograde',
  'prathamai-tithi', 'dwitiya-tithi', 'tritiya-tithi', 'chaturthi-tithi', 'panchami-tithi', 'sashti-tithi', 'saptami-tithi',
  'ashtami-tithi', 'navami-tithi', 'dashami-tithi', 'ekadashi-tithi', 'dwadashi-tithi', 'trayodashi-tithi', 'chaturdashi-tithi']);
const MODELS = {};
for (const y of YEARS) {
  const mu = require('../data/muhurtham-' + y + '.json').dates.map(([date, type]) => ({ date, type }));
  const fe = require('../data/festivals-' + y + '.json').items;
  MODELS[y] = { govtCount: require('../data/festivals-' + y + '.json').govtHolidayCount, muhurtham: mu, festivals: fe, M: buildModel(Object.assign({}, cfg, { year: y, muhurtham: mu, festivals: fe })) };
}
let Y, M, DAYS, BUILD_KEY, muhurtham, festivals;
const inYear = (k) => k.slice(0, 4) === String(Y);
const hasDay = (k) => k.slice(0, 4) === String(PRIMARY);   // a daily page exists for this date
const esc = F.esc;
function setYear(y) {
  Y = y; M = MODELS[y].M; DAYS = M.days; muhurtham = MODELS[y].muhurtham; festivals = MODELS[y].festivals;
  BUILD_KEY = inYear(TODAY) ? TODAY : (y === PRIMARY ? (TODAY < y + '-01-01' ? y + '-01-01' : y + '-12-31') : TODAY);
}
setYear(PRIMARY);

// ---------------- routing ----------------
function href(lang, r) {
  if (PREVIEW) {
    if (r.p === 'home') return 'index.html';
    if (r.p === 'page') return r.s + (r.y && r.y !== PRIMARY ? '-' + r.y : '') + '.html';
    if (r.p === 'day') return 'day-' + F.slugDay(r.k) + '.html';
    if (r.p === 'month') return 'month-' + F.slugMonth(PRIMARY, r.m) + '.html';
    if (r.p === 'sub') return r.s + '-' + F.slugMonth(r.y, r.m) + '.html';
  }
  return prodHref(lang, r);
}
// final production URL: the default path, with the last segment swapped if an admin slug is set
function prodHref(lang, r) {
  const p = defPath(lang, r); const o = SEO[p];
  return BASE + (o && o.slug ? withSlug(p, o.slug) : p);
}
// default path (no BASE, no slug override): the stable key used by data/seo-overrides.json
function defPath(lang, r) {
  const base = lang === 'ta' ? '/tamil' : '';
  if (r.p === 'home') return base + '/';
  if (r.p === 'page') return base + (r.y && r.y !== PRIMARY ? '/' + r.y : '') + '/' + r.s + '/';
  if (r.p === 'day') return base + '/tamil-daily-calendar/' + F.slugDay(r.k) + '/';
  if (r.p === 'month') return base + '/tamil-monthly-calendar/' + F.slugMonth(PRIMARY, r.m) + '/';
  if (r.p === 'sub') return base + '/' + r.s + '/' + F.slugMonth(r.y, r.m) + '/';
}
function outFile(lang, r) {
  if (r.p === 'page' && r.s === '404') return path.join(OUT, PREVIEW ? '404.html' : (lang === 'ta' ? 'tamil/404.html' : '404.html'));
  const h = href(lang, r);
  return PREVIEW ? path.join(OUT, h) : path.join(OUT, h.slice(BASE.length).replace(/^\//, ''), 'index.html');
}
const asset = (name) => (PREVIEW ? name : BASE + '/assets/' + name);
const abs = (lang, r) => cfg.domain + prodHref(lang, r).slice(BASE.length);
const pg = (s) => ({ p: 'page', s, y: YEARABLE.has(s) ? Y : PRIMARY });
const pgY = (s, y) => ({ p: 'page', s, y });
const day = (k) => ({ p: 'day', k });
const mon = (m) => ({ p: 'month', m });
const sub = (s, m) => ({ p: 'sub', s, m, y: Y });
const hdl = (lang, k) => (hasDay(k) ? href(lang, day(k)) : '');
const dayLink = (lang, k, txt) => hasDay(k) ? '<a href="' + href(lang, day(k)) + '">' + txt + '</a>' : txt;

// ---------------- small helpers ----------------
const ctx = (lang) => ({ y: Y, c: cfg.location.name[lang], b: cfg.brand[lang] });
const T = (lang, s, extra) => F.fill(s, Object.assign(ctx(lang), extra || {}));
const nm = (o, lang) => o[lang];
const tdShort = (d, lang) => N.TMONTH[d.tamilMonth][lang] + ' ' + d.tamilDay;
const yearName = (d) => N.TYEAR[d.tamilYear];
const vName = (v, lang) => (V[v.type + (v.label ? ':' + v.label : '')] || V[v.type])[lang];
function holidayOf(d) { let h = ''; for (const f of d.festivals) { if (f.holiday === 'public') return 'public'; if (f.holiday === 'bank') h = 'bank'; } return h; }
const isSubha = (d) => d.muhurtham === 'Subha Muhurtham';
const muLabel = (d, lang) => d.muhurtham ? (isSubha(d) ? L[lang].subha : L[lang].muhurtham) : '';
const spanText = (a, b, lang) => F.fmtD(F.istKey(a), lang, 'short') + ', ' + F.fmtT(a) + ' → ' + F.fmtD(F.istKey(b), lang, 'short') + ', ' + F.fmtT(b);
const dateTime = (t, lang) => F.fmtD(F.istKey(t), lang, 'med') + ', ' + F.fmtT(t);

function chandText(d, lang) {
  const Lx = L[lang];
  return d.rasis.map((s, i) => {
    const r = (s.idx + 5) % 12;
    const txt = N.RASI[r][lang] + ' (' + F.rasiStars(r, lang) + ')';
    return (s.end < d.nextSunrise && i < d.rasis.length - 1) ? txt + ' ' + Lx.until + ' ' + F.fmtT(s.end) + (F.istKey(s.end) > d.key ? ' ' + Lx.nextDay : '') : txt;
  }).join(', ' + Lx.then + ' ');
}

// localized day record (shared with the browser through data.js)
function rec(d, lang) {
  const Lx = L[lang]; const k = d.key; const p = F.parts(k);
  const prevK = M.addDays(k, -1), nextK = M.addDays(k, 1);
  const hol = holidayOf(d);
  const yr = yearName(d);
  return {
    k, u: href(lang, day(k)), dl: F.fmtD(k, lang, 'long'), dsy: F.fmtD(k, lang, 'med'), dsw: F.fmtD(k, lang, 'wd'),
    wd: N.WEEKDAY[d.dow][lang], mo: N.GMONTH[p.m - 1][lang] + ' ' + p.y, dn: p.d,
    tdt: N.TMONTH[d.tamilMonth].ta + ' ' + d.tamilDay + ' · ' + N.WEEKDAY[d.dow].ta,
    tdy: lang === 'en' ? N.TMONTH[d.tamilMonth].en + ' ' + d.tamilDay + ', ' + N.WEEKDAY_TAMIL_EN[d.dow] + ' · ' + yr.en + ' year' : yr.ta + ' ஆண்டு · ' + cfg.location.name.ta,
    td: F.tamilDate(d, lang), tdShort: tdShort(d, lang), tyw: lang === 'en' ? yr.en + ' year' : yr.ta + ' ஆண்டு',
    ti: N.TITHI[d.tithi][lang], tiI: d.tithi, pi: N.PIRAI[d.pirai][lang],
    tix: F.untilText(d.tithis, (i) => N.TITHI[i][lang], d.nextSunrise, k, Lx),
    nkx: F.untilText(d.naks, (i) => N.NAK[i][lang], d.nextSunrise, k, Lx),
    sr: F.fmtT(d.sunrise), ss: F.fmtT(d.sunset),
    nla: d.nalla.map((w) => F.range(w.start, w.end, k, Lx)),
    gd: d.gowriDay.filter((s) => s.good).map((s) => N.GOWRI[s.g][lang] + ' · ' + F.range(s.start, s.end, k, Lx)),
    rh: F.range(d.rahu.start, d.rahu.end, k, Lx), ym: F.range(d.yama.start, d.yama.end, k, Lx), kl: F.range(d.kuligai.start, d.kuligai.end, k, Lx),
    so: d.soolam.dir[lang], pa: d.soolam.par[lang], ch: chandText(d, lang),
    mu: muLabel(d, lang), muS: isSubha(d),
    fe: d.festivals.map((f) => f[lang]), hol, holL: hol === 'public' ? Lx.publicHoliday : hol === 'bank' ? Lx.bankHoliday : '',
    vi: d.virathams.map((v) => vName(v, lang)),
    pu: inYear(prevK) ? href(lang, day(prevK)) : '', pl: F.fmtD(prevK, lang, 'short'),
    nu: inYear(nextK) ? href(lang, day(nextK)) : '', nl: F.fmtD(nextK, lang, 'short')
  };
}
let RECS = {};
const RECS_BY_YEAR = {};
function makeRecs() { if (!RECS_BY_YEAR[Y]) { RECS_BY_YEAR[Y] = {}; for (const lang of LANGS) RECS_BY_YEAR[Y][lang] = DAYS.map((d) => rec(d, lang)); } RECS = RECS_BY_YEAR[Y]; }
makeRecs();
const recOf = (lang, k) => RECS[lang][DAYS.findIndex((d) => d.key === k)];

// ---------------- HTML building blocks ----------------
function table(head, rows, opt) {
  opt = opt || {};
  return '<div class="tw"><div class="scroll"><table class="t' + (opt.cls ? ' ' + opt.cls : '') + '"' + (opt.id ? ' id="' + opt.id + '"' : '') + '>' +
    (opt.caption ? '<caption class="sr">' + esc(opt.caption) + '</caption>' : '') +
    '<thead><tr>' + head.map((h) => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div></div>';
}
const dateCell = (lang, d) => '<td class="nw">' + dayLink(lang, d.key, '<time datetime="' + d.key + '">' + F.fmtD(d.key, lang, 'med') + '</time>') + '<small>' + esc(N.WEEKDAY[d.dow][lang]) + '</small></td>';
const rowAttrs = (lang, d, e, label) => ' data-d="' + d.key + '"' + (e ? ' data-e="' + e.key + '"' : '') + ' data-t="' + esc(label || (F.fmtD(d.key, lang, 'wd') + ' · ' + tdShort(d, lang))) + '" data-h="' + (hasDay(d.key) ? href(lang, day(d.key)) : '') + '"' + (d.key === BUILD_KEY || (e && d.key <= BUILD_KEY && e.key >= BUILD_KEY) ? ' class="is-today"' : '');
const sec = (id, h, note, inner) => '<section class="sec" aria-labelledby="' + id + '"><h2 id="' + id + '">' + h + '</h2>' + (note ? '<p class="note">' + note + '</p>' : '') + inner + '</section>';
const tag = (cls, txt) => '<span class="tag' + (cls ? ' ' + cls : '') + '">' + esc(txt) + '</span>';

// highlight cards for list pages: today / next / previous (static fallback; refreshed in the browser)
function highlights(lang, tid, items) { // items: [{s:key,e:key,label,h}]
  const Lx = L[lang];
  const now = items.find((x) => x.s <= BUILD_KEY && (x.e || x.s) >= BUILD_KEY);
  const next = items.find((x) => x.s > BUILD_KEY);
  const prev = items.slice().reverse().find((x) => (x.e || x.s) < BUILD_KEY);
  const cell = (x) => x ? (x.h ? '<a href="' + x.h + '">' + esc(x.label) + '</a>' : esc(x.label)) : esc(Lx.none);
  return '<div class="hl" data-hl="list" data-hl-for="' + tid + '" data-none="' + esc(Lx.none) + '" data-no="' + esc(Lx.notToday) + '" data-yes="' + esc(Lx.isTodayLong) + '">' +
    '<div class="box hl-now"><div class="lbl">' + esc(Lx.todayQ) + '</div><strong data-slot="now">' + (now ? esc(Lx.isTodayLong) : esc(Lx.notToday)) + '</strong></div>' +
    '<div class="box"><div class="lbl">' + esc(Lx.nextDate) + '</div><strong data-slot="next">' + cell(next) + '</strong></div>' +
    '<div class="box"><div class="lbl">' + esc(Lx.prevDate) + '</div><strong data-slot="prev">' + cell(prev) + '</strong></div></div>';
}
// highlight cards for year-long tables: today / tomorrow / yesterday values
function dayHighlights(lang, tid, valueOf) {
  const Lx = L[lang];
  const slot = (k, cls, lbl, s) => { const d = M.byKey[k]; const v = d && inYear(k) ? valueOf(d) : '–'; return '<div class="box' + cls + '"><div class="lbl">' + esc(lbl) + ' · <span data-slot-date="' + s + '">' + esc(F.fmtD(k, lang, 'short')) + '</span></div><strong data-slot="' + s + '">' + esc(v) + '</strong></div>'; };
  return '<div class="hl" data-hl="days" data-hl-for="' + tid + '">' + slot(BUILD_KEY, ' hl-now', Lx.today, 'now') + slot(M.addDays(BUILD_KEY, 1), '', Lx.tomorrow, 'next') + slot(M.addDays(BUILD_KEY, -1), '', Lx.yesterday, 'prev') + '</div>';
}
function monthChips(lang, cur) {
  return '<div class="chips">' + N.GMONTH.map((m, i) => '<a class="chip" href="' + href(lang, mon(i + 1)) + '"' + (cur === i + 1 ? ' aria-current="page"' : '') + '>' + esc(m[lang]) + '</a>').join('') + '</div>';
}
function monthAnchors(lang) {
  return '<div class="chips">' + N.GMONTH.map((m, i) => '<a class="chip" href="#m' + (i + 1) + '">' + esc(m[lang]) + '</a>').join('') + '</div>';
}
const methodBox = (lang, txt) => '<div class="method"><strong>' + esc(L[lang].method) + ':</strong> ' + esc(T(lang, txt)) + '</div>';
function faqBlock(lang, list) {
  if (!list || !list.length) return '';
  return sec('faq', esc(L[lang].faq), '', '<div class="faq">' + list.map(([q, a]) => '<div class="box"><h3>' + esc(T(lang, q)) + '</h3><p>' + esc(T(lang, a)) + '</p></div>').join('') + '</div>');
}
function weeklyTable(lang) {
  const Lx = L[lang];
  const fixed = (h) => { const s = new Date(Date.UTC(2000, 0, 1, 0, 0) + (h * 60 - 330) * 60000); const e = new Date(s.getTime() + 90 * 60000); return F.fmtT(s) + ' – ' + F.fmtT(e); };
  const todayDow = F.parts(BUILD_KEY).dow;
  const rows = [0, 1, 2, 3, 4, 5, 6].map((w) => '<tr data-dow="' + w + '"' + (w === todayDow ? ' class="is-today"' : '') + '><th scope="row">' + esc(N.WEEKDAY[w][lang]) + '</th><td class="nw">' + fixed(N.RAHU[w]) + '</td><td class="nw">' + fixed(N.YAMA[w]) + '</td><td class="nw">' + fixed(N.KULIGAI[w]) + '</td><td>' + esc(N.SOOLAM[w].dir[lang]) + '</td><td>' + esc(N.SOOLAM[w].par[lang]) + '</td></tr>');
  return table([Lx.weekday, Lx.rahu, Lx.yama, Lx.kuligai, Lx.soolam, Lx.pariharam], rows, { caption: Lx.weekly });
}
const fixedRange = (h) => { const s = new Date(Date.UTC(2000, 0, 1) + (h * 60 - 330) * 60000); return F.fmtT(s) + ' – ' + F.fmtT(new Date(s.getTime() + 90 * 60000)); };

const NAV = [['home', 'Today', 'இன்று'], ['tamil-daily-calendar', 'Daily', 'தினசரி'], ['tamil-monthly-calendar', 'Monthly', 'மாதம்'], ['nalla-neram', 'Nalla Neram', 'நல்ல நேரம்'], ['rahu-kalam', 'Rahu Kalam', 'ராகு காலம்'], ['muhurtham-dates', 'Muhurtham', 'முகூர்த்தம்'], ['pournami', 'Pournami', 'பௌர்ணமி'], ['amavasai', 'Amavasai', 'அமாவாசை'], ['viratham', 'Viratham', 'விரதம்'], ['tamil-festivals', 'Festivals', 'பண்டிகைகள்'], ['tamil-holidays', 'Holidays', 'விடுமுறைகள்'], ['timings', 'All timings', 'அனைத்து நேரங்கள்']];
const navRoute = (s) => (s === 'home' ? { p: 'home' } : pg(s));

// list of the main pages, used by explore chips, footer and site map
const GROUPS = [
  ['calendar', [['tamil-daily-calendar', 'Daily calendar', 'தினசரி காலண்டர்'], ['tamil-monthly-calendar', 'Monthly calendar', 'மாத காலண்டர்'], ['tamil-months', 'Tamil months', 'தமிழ் மாதங்கள்'], ['tamil-festivals', 'Festivals', 'பண்டிகைகள்'], ['tamil-holidays', 'Holidays', 'விடுமுறைகள்'], ['retrograde', 'Retrograde planets', 'வக்ர கிரகங்கள்']]],
  ['timings', [['timings', 'All timings', 'அனைத்து நேரங்கள்'], ['nalla-neram', 'Nalla Neram', 'நல்ல நேரம்'], ['gowri-nalla-neram', 'Gowri Nalla Neram', 'கௌரி நல்ல நேரம்'], ['rahu-kalam', 'Rahu Kalam', 'ராகு காலம்'], ['yamagandam', 'Yamagandam', 'எமகண்டம்'], ['kuligai-neram', 'Kuligai Neram', 'குளிகை நேரம்'], ['soolam-pariharam', 'Soolam & Pariharam', 'சூலம் & பரிகாரம்']]],
  ['muhurtham', [['muhurtham-dates', 'Muhurtham dates', 'முகூர்த்த நாட்கள்'], ['subha-muhurtham-dates', 'Subha Muhurtham', 'சுப முகூர்த்தம்'], ['valarpirai-muhurtham-dates', 'Valarpirai Muhurtham', 'வளர்பிறை முகூர்த்தம்'], ['theipirai-muhurtham-dates', 'Theipirai Muhurtham', 'தேய்பிறை முகூர்த்தம்']]],
  ['viratham', [['viratham', 'All viratham days', 'அனைத்து விரதங்கள்'], ['pradosham-dates', 'Pradosham', 'பிரதோஷம்'], ['sankatahara-chaturthi-dates', 'Sankatahara Chathurthi', 'சங்கடஹர சதுர்த்தி'], ['sashti-viratham-dates', 'Sashti Viratham', 'சஷ்டி விரதம்'], ['karthigai-viratham-dates', 'Karthigai Viratham', 'கார்த்திகை விரதம்'], ['chaturthi-viratham-dates', 'Chathurthi Viratham', 'சதுர்த்தி விரதம்'], ['shivaratri-dates', 'Shivaratri', 'சிவராத்திரி'], ['thiruvonam-dates', 'Thiruvonam', 'திருவோணம்'], ['chandra-darshan-dates', 'Chandra Darshan', 'சந்திர தரிசனம்'], ['ekadashi-tithi', 'Ekadasi', 'ஏகாதசி']]],
  ['tithi', [['tithi', 'All tithi', 'அனைத்து திதிகள்'], ['pournami', 'Pournami', 'பௌர்ணமி'], ['amavasai', 'Amavasai', 'அமாவாசை'], ['ashtami-navami', 'Ashtami & Navami', 'அஷ்டமி & நவமி'], ['ashtami-navami-dashami', 'Ashtami, Navami & Dasami', 'அஷ்டமி, நவமி & தசமி'], ['valarpirai-ashtami', 'Valarpirai Ashtami', 'வளர்பிறை அஷ்டமி'], ['theipirai-ashtami', 'Theipirai Ashtami', 'தேய்பிறை அஷ்டமி'], ['valarpirai-dates', 'Valarpirai dates', 'வளர்பிறை நாட்கள்'], ['theipirai-dates', 'Theipirai dates', 'தேய்பிறை நாட்கள்']]],
  ['site', [['about', 'About', 'எங்களைப் பற்றி'], ['disclaimer', 'Disclaimer', 'பொறுப்புத் துறப்பு'], ['privacy-policy', 'Privacy policy', 'தனியுரிமை'], ['terms-of-use', 'Terms of use', 'விதிமுறைகள்'], ['contact-us', 'Contact us', 'தொடர்பு'], ['site-map', 'Site map', 'தள வரைபடம்']]]
];
const GROUP_TITLE = { calendar: ['Calendar', 'காலண்டர்'], timings: ['Timings', 'நேரங்கள்'], muhurtham: ['Muhurtham', 'முகூர்த்தம்'], viratham: ['Viratham', 'விரதம்'], tithi: ['Tithi', 'திதி'], site: ['About', 'பற்றி'] };
const glink = (lang, it) => '<a href="' + href(lang, pg(it[0])) + '">' + esc(lang === 'en' ? it[1] : it[2]) + '</a>';
function exploreChips(lang) {
  const items = [].concat(GROUPS[1][1], GROUPS[2][1].slice(0, 2), GROUPS[3][1], GROUPS[4][1].slice(0, 3), GROUPS[0][1].slice(2));
  return '<div class="chips">' + items.map((it) => '<a class="chip" href="' + href(lang, pg(it[0])) + '">' + esc(lang === 'en' ? it[1] : it[2]) + '</a>').join('') + '</div>';
}

// ---------------- page shell ----------------
const LOGO = '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><rect class="lg-a" x="2" y="2" width="38" height="38" rx="10" stroke-width="2.5"/><circle class="lg-b" cx="21" cy="21" r="9" stroke-width="2.5"/><path d="M21 15v6l4 2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
function shell(lang, r, o) {
  const Lx = L[lang];
  const other = lang === 'en' ? 'ta' : 'en';
  const key = defPath(lang, r); const ov = SEO[key] || {};
  const dTitle = T(lang, o.title, o.vars) + ' | ' + cfg.brand[lang];
  const dDesc = T(lang, o.desc, o.vars);
  const dCanon = abs(lang, r);
  const title = ov.title || dTitle;
  const desc = ov.description || dDesc;
  const canon = esc(ov.canonical || dCanon);
  if (ADMIN && !(r.p === 'page' && r.s === '404')) ADMIN_INDEX.push({ k: key, u: prodHref(lang, r).slice(BASE.length), l: lang, g: r.p, y: r.y || (r.k ? +r.k.slice(0, 4) : PRIMARY), t: dTitle, d: dDesc, c: dCanon });
  const crumbs = [[Lx.home, { p: 'home' }]].concat(o.crumbs || []);
  const crumbHtml = r.p === 'home' ? '' : '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + crumbs.map((c, i) => '<li>' + (i < crumbs.length - 1 ? '<a href="' + href(lang, c[1]) + '">' + esc(c[0]) + '</a>' : '<span aria-current="page">' + esc(c[0]) + '</span>') + '</li>').join('') + '</ol></nav>';
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: abs(lang, c[1]) })) }];
  if (r.p === 'home') {
    ld.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.brand[lang], alternateName: lang === 'en' ? cfg.brand.ta : cfg.brand.en, url: abs(lang, { p: 'home' }), inLanguage: lang });
    ld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: cfg.brand.en, alternateName: cfg.brand.ta, url: cfg.domain + '/', logo: cfg.domain + '/assets/icon-512.png', email: cfg.contactEmail });
  }
  if (o.faq && o.faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: o.faq.map(([q, a]) => ({ '@type': 'Question', name: T(lang, q, o.vars), acceptedAnswer: { '@type': 'Answer', text: T(lang, a, o.vars) } })) });
  const is404 = r.p === 'page' && r.s === '404';
  const otherHref = PREVIEW ? OTHER : prodHref(other, is404 ? { p: 'home' } : r);
  const langLinks = '<span class="lang"><a href="' + href(lang, is404 ? { p: 'home' } : r) + '" aria-current="true">' + esc(Lx.lang) + '</a>' + (otherHref ? ' / <a href="' + esc(otherHref) + '" lang="' + other + '" hreflang="' + other + '">' + esc(Lx.otherLang) + '</a>' : '') + '</span>';
  const nav = '<nav class="navbox" aria-label="' + (lang === 'en' ? 'Main' : 'முதன்மை') + '"><ul class="nav">' + NAV.map(([s, en, ta]) => '<li><a href="' + href(lang, navRoute(s)) + '"' + (o.navCur === s ? ' aria-current="page"' : '') + '>' + esc(lang === 'en' ? en : ta) + '</a></li>').join('') + '</ul></nav>';
  const footer = '<footer class="site"><div class="wrap"><div class="cols">' +
    '<div><span class="brand">' + esc(cfg.brand[lang]) + '</span><p style="margin:10px 0 0;font-size:15px">' + esc(Lx.footerAbout) + '</p></div>' +
    GROUPS.filter((g) => g[0] !== 'tithi').map((g) => '<div><strong>' + esc(GROUP_TITLE[g[0]][lang === 'en' ? 0 : 1]) + '</strong><ul>' + g[1].map((it) => '<li>' + glink(lang, it) + '</li>').join('') + '</ul></div>').join('') +
    '</div><p class="fine">' + esc(T(lang, Lx.fine)) + '</p></div></footer>';
  const cfgJs = { lang, y: Y, dy: PRIMARY, today: BUILD_KEY, day: PREVIEW ? 'day-__SLUG__.html' : BASE + (lang === 'ta' ? '/tamil' : '') + '/tamil-daily-calendar/__SLUG__/', city: cfg.location.name[lang], wd: N.WEEKDAY.map((w) => w[lang]), mon: lang === 'en' ? N.GMONTH_SHORT : N.GMONTH.map((m) => m.ta), monEn: N.GMONTH.map((m) => m.en.toLowerCase()), todayWord: Lx.today };
  const hreflang = (PREVIEW || o.noindex) ? '' : '<link rel="alternate" hreflang="en" href="' + abs('en', r) + '"><link rel="alternate" hreflang="ta" href="' + abs('ta', r) + '"><link rel="alternate" hreflang="x-default" href="' + abs('en', r) + '">';
  return '<!doctype html>\n<html lang="' + lang + '"><head>' + gtag() + '<meta charset="utf-8">' + adsenseMeta() + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<title>' + esc(title) + '</title><meta name="claude:viewport-fit-sides" content="cover">' +
    '<meta name="description" content="' + esc(desc) + '">' + (ov.keywords ? '<meta name="keywords" content="' + esc(ov.keywords) + '">' : '') + ((o.noindex || DEV) ? '<meta name="robots" content="noindex,nofollow">' : '') +
    (o.noindex ? '' : '<link rel="canonical" href="' + canon + '">' + hreflang) +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="' + esc(cfg.brand[lang]) + '"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:url" content="' + canon + '"><meta property="og:locale" content="' + (lang === 'en' ? 'en_IN' : 'ta_IN') + '"><meta property="og:image" content="' + cfg.domain + '/assets/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="' + esc(cfg.brand.en + ' · ' + cfg.brand.ta + ' – Tamil calendar') + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + cfg.domain + '/assets/og.jpg">' +
    '<meta name="color-scheme" content="only light"><meta name="theme-color" content="#FFC21A"><link rel="icon" href="' + asset('favicon.svg') + '" type="image/svg+xml"><link rel="apple-touch-icon" href="' + asset('apple-touch-icon.png') + '"><link rel="manifest" href="' + asset('site.webmanifest') + '">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Hind+Madurai:wght@400;600;700&display=swap">' +
    '<link rel="stylesheet" href="' + asset('site.css') + '">' +
    '<script type="application/ld+json">' + JSON.stringify(ld.length === 1 ? ld[0] : ld).replace(/</g, '\\u003c') + '</script>' +
    '</head><body>' +
    '<a class="skip" href="#main">' + esc(Lx.skip) + '</a>' +
    '<div class="strip"><div class="wrap"><span><a data-nz-today href="' + href(lang, day(BUILD_KEY)) + '">' + esc(Lx.today) + ' · ' + esc(F.fmtD(BUILD_KEY, lang, 'wd')) + '</a> · ' + esc(cfg.location.name[lang]) + '</span>' + langLinks + '</div></div>' +
    '<header class="site"><div class="wrap"><a class="logo" href="' + href(lang, { p: 'home' }) + '">' + LOGO + '<span><b>' + esc(cfg.brand[lang]) + '</b><small>' + esc(lang === 'en' ? 'Tamil calendar ' + Y : 'தமிழ் காலண்டர் ' + Y) + '</small></span></a>' + nav + '</div></header>' +
    '<main id="main"><div class="wrap">' + crumbHtml +
    '<h1 class="page">' + T(lang, o.h1, o.vars) + '</h1>' +
    (o.years && o.years.length > 1 ? '<nav class="years" aria-label="' + (lang === 'en' ? 'Year' : 'ஆண்டு') + '">' + o.years.map(([y, rr]) => '<a class="chip' + (y === Y ? ' cur' : '') + '" href="' + href(lang, rr) + '"' + (y === Y ? ' aria-current="page"' : '') + '>' + y + '</a>').join('') + '</nav>' : '') +
    (o.lead ? '<p class="lead">' + esc(T(lang, o.lead, o.vars)) + '</p>' : '') +
    o.body + (o.faq ? faqBlock(lang, o.faq.map(([q, a]) => [T(lang, q, o.vars), T(lang, a, o.vars)])) : '') +
    '</div></main>' + footer +
    '<script>window.NZ_CFG=' + JSON.stringify(cfgJs).replace(/</g, '\\u003c') + ';</script>' +
    (o.data ? '<script src="' + asset('shared.js') + '"></script><script src="' + asset('data-' + lang + '.js') + '"></script>' : '') +
    '<script src="' + asset('site.js') + '" defer></script>' +
    '</body></html>\n';
}

const pages = []; // {lang, r, html}
function emit(lang, r, o) { pages.push({ lang, r, html: shell(lang, r, o) }); }
function copyOf(slug, lang) { return C[slug][lang]; }
function stdPage(lang, slug, body, extra) {
  const c = copyOf(slug, lang);
  const o = Object.assign({ title: c.title, h1: c.h1, desc: c.desc, lead: c.lead, crumbs: [[stripTags(T(lang, c.h1, (extra || {}).vars)), pg(slug)]], body, navCur: slug }, extra || {});
  if (C[slug].faq && !o.faq) o.faq = C[slug].faq[lang];
  if (YEARABLE.has(slug)) o.years = YEARS.map((y) => [y, pgY(slug, y)]);
  emit(lang, pg(slug), o);
}
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');

// ---------------- page builders ----------------
function buildHome(lang, slug) {
  const Lx = L[lang];
  const R = RECS[lang]; const r0 = recOf(lang, BUILD_KEY);
  const up = (pred) => S.upcomingFrom(R, BUILD_KEY, pred, 10);
  const imp = { 3: 1, 5: 1, 7: 1, 8: 1, 10: 1, 12: 1, 14: 1, 18: 1, 20: 1, 22: 1, 23: 1, 25: 1, 27: 1, 29: 1 };
  const body = '<div data-nz="bento" data-nz-key="' + BUILD_KEY + '">' + S.bento(r0, Lx, { nav: true, link: true }) + '</div>' +
    sec('det', esc(Lx.details), '', '<div data-nz="details">' + S.details(r0, Lx) + '</div>') +
    sec('cu', esc(Lx.comingUp), '', '<div data-nz="tiles">' + S.countdown(S.tilesFor(R, BUILD_KEY, Lx), Lx) + '</div>') +
    sec('umu', esc(Lx.upMu), '<a href="' + href(lang, pg('muhurtham-dates')) + '">' + esc(Lx.seeAll) + ' →</a>', '<div data-nz="up-mu">' + S.upcoming('mu', up((x) => !!x.mu), Lx) + '</div>') +
    '<div class="two">' +
      sec('uvi', esc(Lx.upVi), '<a href="' + href(lang, pg('viratham')) + '">' + esc(Lx.seeAll) + ' →</a>', '<div data-nz="up-vi">' + S.upcoming('vi', up((x) => x.vi.length > 0), Lx) + '</div>') +
      sec('uti', esc(Lx.upTi), '<a href="' + href(lang, pg('tithi')) + '">' + esc(Lx.seeAll) + ' →</a>', '<div data-nz="up-ti">' + S.upcoming('ti', up((x) => !!imp[x.tiI]), Lx) + '</div>') +
    '</div>' +
    sec('ufe', esc(Lx.upFe), '<a href="' + href(lang, pg('tamil-festivals')) + '">' + esc(Lx.seeAll) + ' →</a>', '<div data-nz="up-fe">' + S.upcoming('fe', up((x) => x.fe.length > 0), Lx) + '</div>') +
    sec('wk', esc(Lx.weekly), esc(Lx.weeklyNote), weeklyTable(lang)) +
    sec('mo', esc(T(lang, Lx.allMonths)), '', monthChips(lang)) +
    sec('ex', esc(Lx.explore), '', exploreChips(lang));
  const c = copyOf('home', lang);
  emit(lang, { p: 'home' }, { title: c.title, h1: c.h1, desc: c.desc, lead: c.lead, body, faq: C.home.faq[lang], navCur: 'home', data: true });
}

function gowriTables(lang, d) {
  const Lx = L[lang];
  const t = (slots, cap) => table([Lx.gowriSlot, Lx.time, ''], slots.map((s) => '<tr><th scope="row">' + esc(N.GOWRI[s.g][lang]) + '</th><td class="nw">' + F.range(s.start, s.end, d.key, Lx) + '</td><td>' + (s.good ? tag('g', Lx.good) : tag('r', Lx.avoid)) + '</td></tr>'), { caption: cap });
  return '<div class="two"><div><h3 class="h3">' + esc(Lx.dayLbl) + '</h3>' + t(d.gowriDay, Lx.gowriTable + ' · ' + Lx.dayLbl) + '</div><div><h3 class="h3">' + esc(Lx.nightLbl) + '</h3>' + t(d.gowriNight, Lx.gowriTable + ' · ' + Lx.nightLbl) + '</div></div>';
}

function buildDaily(lang) {
  const Lx = L[lang];
  DAYS.forEach((d, i) => {
    const r0 = RECS[lang][i]; const p = F.parts(d.key);
    const dl = F.fmtD(d.key, lang, 'long');
    const events = d.festivals.map((f) => tag(f.holiday ? 'r' : 'y', f[lang])).concat(d.virathams.map((v) => tag('k', vName(v, lang)))).concat(d.muhurtham ? [tag('g', muLabel(d, lang))] : []);
    const body = S.bento(r0, Lx, { nav: true }) +
      sec('det', esc(Lx.details), esc(T(lang, Lx.detailsNote, { d: dl })), S.details(r0, Lx)) +
      sec('ev', esc(Lx.onThisDay), '', events.length ? '<div class="chips">' + events.join('') + '</div>' : '<p class="empty">' + esc(Lx.noEvents) + '</p>') +
      sec('gw', esc(Lx.gowriTable), esc(Lx.gowriTableNote), gowriTables(lang, d)) +
      '<div class="pager">' + (r0.pu ? '<a href="' + r0.pu + '" rel="prev">‹ ' + esc(Lx.prevDay) + '</a>' : '<span></span>') + '<a href="' + href(lang, mon(p.m)) + '">' + esc(Lx.viewMonth) + ' · ' + esc(N.GMONTH[p.m - 1][lang]) + '</a>' + (r0.nu ? '<a href="' + r0.nu + '" rel="next">' + esc(Lx.nextDayLink) + ' ›</a>' : '<span></span>') + '</div>' +
      sec('mo', esc(T(lang, Lx.allMonths)), '', monthChips(lang, p.m));
    const ti = N.TITHI[d.tithi][lang], nk = N.NAK[d.nak][lang], td = tdShort(d, lang);
    const title = lang === 'en' ? F.fmtD(d.key, 'en', 'med') + ' Tamil Calendar: ' + td + ', ' + ti : dl + ' தமிழ் காலண்டர்: ' + td + ', ' + ti;
    const fe = d.festivals.map((f) => f[lang]).join(', ');
    const desc = lang === 'en'
      ? (fe ? dl + ': ' + fe + '. ' + td + ', ' + ti + ' tithi, ' + nk + ' nakshatram, Nalla Neram ' + (r0.nla[0] || '–') + '.'
            : dl + ' (' + td + ', ' + yearName(d).en + '): ' + ti + ' tithi, ' + nk + ' nakshatram, Nalla Neram ' + (r0.nla[0] || '–') + ', Rahu Kalam ' + r0.rh + ' – ' + cfg.location.name.en + '.')
      : (fe ? dl + ': ' + fe + '. ' + td + ', திதி ' + ti + ', நட்சத்திரம் ' + nk + ', நல்ல நேரம் ' + (r0.nla[0] || '–') + '.'
            : dl + ' (' + td + ', ' + yearName(d).ta + '): திதி ' + ti + ', நட்சத்திரம் ' + nk + ', நல்ல நேரம் ' + (r0.nla[0] || '–') + ', ராகு காலம் ' + r0.rh + ' – ' + cfg.location.name.ta + '.');
    const h1 = lang === 'en' ? esc(dl) + ' <mark>Tamil daily calendar</mark>' : esc(dl) + ' <mark>தமிழ் தினசரி காலண்டர்</mark>';
    emit(lang, day(d.key), { title, desc, h1, lead: '', body, navCur: 'tamil-daily-calendar', crumbs: [[Lx.dailyCal, pg('tamil-daily-calendar')], [dl, day(d.key)]] });
  });
}

function dayEvents(d, lang) { return d.festivals.map((f) => f[lang]).concat(d.virathams.map((v) => vName(v, lang))).concat(d.muhurtham ? [muLabel(d, lang)] : []); }

function buildDailyIndex(lang) {
  let body = monthAnchors(lang);
  for (let m = 1; m <= 12; m++) {
    const ds = DAYS.filter((d) => F.parts(d.key).m === m);
    body += '<h2 class="month-h" id="m' + m + '"><a href="' + href(lang, mon(m)) + '">' + esc(N.GMONTH[m - 1][lang] + ' ' + Y) + '</a></h2><div class="chips daychips">' +
      ds.map((d) => { const ev = dayEvents(d, lang); return '<a class="chip' + (ev.length ? ' has-ev' : '') + '" data-d="' + d.key + '"' + (d.key === BUILD_KEY ? ' aria-current="date"' : '') + ' href="' + href(lang, day(d.key)) + '" title="' + esc(tdShort(d, lang) + ' · ' + N.TITHI[d.tithi][lang] + (ev.length ? ' · ' + ev.join(', ') : '')) + '"><span class="wd">' + esc(N.WEEKDAY_SHORT[d.dow][lang]) + '</span> ' + F.parts(d.key).d + ' ' + esc(lang === 'en' ? N.GMONTH_SHORT[m - 1] : '') + '</a>'; }).join('') + '</div>';
  }
  stdPage(lang, 'tamil-daily-calendar', body);
}

function buildMonthly(lang) {
  const Lx = L[lang];
  for (let m = 1; m <= 12; m++) {
    const ds = DAYS.filter((d) => F.parts(d.key).m === m);
    const first = ds[0], last = ds[ds.length - 1];
    const mname = N.GMONTH[m - 1][lang] + ' ' + Y;
    // highlights
    const box = (title, list) => '<div class="box" style="padding:18px 20px"><div class="lbl" style="color:var(--muted)">' + esc(title) + '</div>' + (list.length ? '<ul style="margin:8px 0 0;padding-left:18px;line-height:1.7">' + list.join('') + '</ul>' : '<p style="margin:8px 0 0">' + esc(Lx.none) + '</p>') + '</div>';
    const li = (d, txt) => '<li><a href="' + href(lang, day(d.key)) + '">' + esc(F.fmtD(d.key, lang, 'short')) + '</a> · ' + esc(txt) + '</li>';
    const hl = '<div class="hl">' +
      box(Lx.muhurtham, ds.filter((d) => d.muhurtham).map((d) => li(d, muLabel(d, lang)))) +
      box(N.TITHI[14][lang] + ' / ' + N.TITHI[29][lang], ds.filter((d) => d.tithi === 14 || d.tithi === 29).map((d) => li(d, N.TITHI[d.tithi][lang]))) +
      box(Lx.festivals, ds.filter((d) => d.festivals.length).map((d) => li(d, d.festivals.map((f) => f[lang]).join(', ')))) +
      box(Lx.virathams, ds.filter((d) => d.virathams.length).map((d) => li(d, d.virathams.map((v) => vName(v, lang)).join(', ')))) + '</div>';
    // grid
    const lead = first.dow;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<td class="off"></td>');
    for (const d of ds) {
      const ev = [];
      if (d.muhurtham) ev.push('<span class="e-mu">' + esc(muLabel(d, lang)) + '</span>');
      if (d.tithi === 14 || d.tithi === 29) ev.push('<span class="e-mo">' + esc(N.TITHI[d.tithi][lang]) + '</span>');
      for (const f of d.festivals) ev.push('<span class="e-fe">' + esc(f[lang]) + '</span>');
      for (const v of d.virathams) ev.push('<span>' + esc(vName(v, lang)) + '</span>');
      const shown = ev.slice(0, 3).join('') + (ev.length > 3 ? '<span>+' + (ev.length - 3) + '</span>' : '');
      cells.push('<td data-d="' + d.key + '"' + (d.key === BUILD_KEY ? ' class="is-today"' : '') + '><a href="' + href(lang, day(d.key)) + '" aria-label="' + esc(F.fmtD(d.key, lang, 'wdl') + ', ' + tdShort(d, lang) + ', ' + N.TITHI[d.tithi][lang] + (ev.length ? ', ' + dayEvents(d, lang).join(', ') : '')) + '"><span class="dn">' + F.parts(d.key).d + '</span><span class="tm">' + esc(tdShort(d, lang)) + '</span><span class="ti">' + esc(N.TITHI[d.tithi][lang]) + '</span><span class="ev">' + shown + '</span></a></td>');
    }
    while (cells.length % 7) cells.push('<td class="off"></td>');
    let grid = '';
    for (let i = 0; i < cells.length; i += 7) grid += '<tr>' + cells.slice(i, i + 7).join('') + '</tr>';
    const gridHtml = '<div class="tw"><div class="scroll"><table class="cal"><caption class="sr">' + esc(mname) + '</caption><thead><tr>' + N.WEEKDAY.map((w) => '<th scope="col"><abbr title="' + esc(w[lang]) + '">' + esc(lang === 'en' ? w.en.slice(0, 3) : w.ta) + '</abbr></th>').join('') + '</tr></thead><tbody>' + grid + '</tbody></table></div></div>' +
      '<div class="legend"><span><i style="background:var(--teal-soft)"></i>' + esc(Lx.muhurtham) + '</span><span><i style="background:var(--yellow)"></i>' + esc(N.TITHI[14][lang] + ' / ' + N.TITHI[29][lang]) + '</span><span><i style="background:var(--pink)"></i>' + esc(Lx.festival) + '</span><span><i style="background:var(--paper)"></i>' + esc(Lx.viratham) + '</span></div>';
    const rows = ds.map((d) => '<tr' + rowAttrs(lang, d) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '</td><td>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '</td><td>' + esc(N.NAK[d.nak][lang]) + '</td><td class="nw">' + esc(F.fmtT(d.sunrise) + ' / ' + F.fmtT(d.sunset)) + '</td><td>' + esc(dayEvents(d, lang).join(', ') || '–') + '</td></tr>');
    const tmRange = tdShort(first, lang) + ' – ' + tdShort(last, lang) + ' · ' + (lang === 'en' ? yearName(first).en + (yearName(last) !== yearName(first) ? ' / ' + yearName(last).en : '') + ' year' : yearName(first).ta + (yearName(last) !== yearName(first) ? ' / ' + yearName(last).ta : '') + ' ஆண்டு');
    const body = hl + sec('grid', esc(mname), esc(tmRange), gridHtml) +
      sec('list', esc(lang === 'en' ? 'Day by day' : 'நாள் வாரியாக'), '', table([Lx.date, Lx.tamilDate, Lx.pirai + ' · ' + Lx.tithi, Lx.nak, Lx.sunrise + ' / ' + Lx.sunset, Lx.festival + ' / ' + Lx.viratham], rows, { caption: mname })) +
      '<div class="pager">' + (m > 1 ? '<a href="' + href(lang, mon(m - 1)) + '" rel="prev">‹ ' + esc(N.GMONTH[m - 2][lang]) + '</a>' : '<span></span>') + (m < 12 ? '<a href="' + href(lang, mon(m + 1)) + '" rel="next">' + esc(N.GMONTH[m][lang]) + ' ›</a>' : '') + '</div>' +
      sec('mo', esc(T(lang, Lx.allMonths)), '', monthChips(lang, m));
    const nMu = ds.filter((d) => d.muhurtham).length, nFe = ds.filter((d) => d.festivals.length).length;
    const title = lang === 'en' ? mname + ' Tamil Calendar – ' + tdShort(first, 'en') + ' to ' + tdShort(last, 'en') : mname + ' தமிழ் காலண்டர் – ' + tdShort(first, 'ta') + ' – ' + tdShort(last, 'ta');
    const desc = lang === 'en' ? mname + ' Tamil calendar (' + tdShort(first, 'en') + ' – ' + tdShort(last, 'en') + '): ' + nMu + ' muhurtham days, ' + nFe + ' festival days, Pournami, Amavasai, viratham days and tithi for every date.' : mname + ' தமிழ் காலண்டர் (' + tdShort(first, 'ta') + ' – ' + tdShort(last, 'ta') + '): ' + nMu + ' முகூர்த்த நாட்கள், ' + nFe + ' பண்டிகை நாட்கள், பௌர்ணமி, அமாவாசை, விரதங்கள், ஒவ்வொரு நாளுக்கும் திதி.';
    const h1 = esc(mname) + ' <mark>' + (lang === 'en' ? 'Tamil monthly calendar' : 'தமிழ் மாத காலண்டர்') + '</mark>';
    emit(lang, mon(m), { title, desc, h1, lead: '', body, navCur: 'tamil-monthly-calendar', crumbs: [[Lx.monthlyCal, pg('tamil-monthly-calendar')], [mname, mon(m)]] });
  }
  // index
  const cards = N.GMONTH.map((g, i) => {
    const ds = DAYS.filter((d) => F.parts(d.key).m === i + 1);
    const nMu = ds.filter((d) => d.muhurtham).length, nFe = ds.filter((d) => d.festivals.length).length;
    return '<a class="box" href="' + href(lang, mon(i + 1)) + '" style="display:flex;flex-direction:column;gap:4px;padding:20px 22px;text-decoration:none;color:var(--ink)"><strong class="disp" style="font-size:28px;line-height:1.1">' + esc(g[lang]) + '</strong><span>' + esc(tdShort(ds[0], lang) + ' – ' + tdShort(ds[ds.length - 1], lang)) + '</span><span style="color:var(--muted);font-size:15px">' + esc(Lx.muhurtham + ': ' + nMu + ' · ' + Lx.festivals + ': ' + nFe) + '</span></a>';
  }).join('');
  stdPage(lang, 'tamil-monthly-calendar', '<div class="count">' + cards + '</div>');
}

// year table grouped by month
function yearTables(lang, tid, head, rowFn) {
  let html = monthAnchors(lang);
  for (let m = 1; m <= 12; m++) {
    const ds = DAYS.filter((d) => F.parts(d.key).m === m);
    html += '<h2 class="month-h" id="m' + m + '">' + esc(N.GMONTH[m - 1][lang] + ' ' + Y) + '</h2>' + table(head, ds.map(rowFn), { id: m === 1 ? tid : tid + m, caption: N.GMONTH[m - 1][lang] + ' ' + Y });
  }
  return html;
}

function buildTimings(lang) {
  const Lx = L[lang];
  const nallaV = (d) => RECS[lang][DAYS.indexOf(d)].nla.join('\n');
  const gowriV = (d) => d.gowriDay.filter((s) => s.good).map((s) => N.GOWRI[s.g][lang] + ' · ' + F.range(s.start, s.end, d.key, Lx)).join('\n');
  // Nalla Neram & Gowri: main page (today/tomorrow/yesterday + this month) and one page per month
  const gowriDayV = (d) => d.gowriDay.filter((s) => s.good).map((s) => N.GOWRI[s.g][lang] + ' · ' + F.range(s.start, s.end, d.key, Lx));
  const gowriNightV = (d) => d.gowriNight.filter((s) => s.good).map((s) => N.GOWRI[s.g][lang] + ' · ' + F.range(s.start, s.end, d.key, Lx));
  const kinds = {
    'nalla-neram': { v: nallaV, head: [Lx.date, Lx.tamilDate + ' · ' + Lx.tithi, Lx.nalla], cells: (d) => '<td class="nw">' + RECS[lang][DAYS.indexOf(d)].nla.map(esc).join('<br>') + '</td>' },
    'gowri-nalla-neram': { v: gowriV, head: [Lx.date, Lx.tamilDate + ' · ' + Lx.tithi, Lx.gowri + ' · ' + Lx.dayLbl, Lx.gowri + ' · ' + Lx.nightLbl], cells: (d) => '<td class="nw">' + gowriDayV(d).map(esc).join('<br>') + '</td><td class="nw">' + gowriNightV(d).map(esc).join('<br>') + '</td>' }
  };
  for (const slug of Object.keys(kinds)) {
    const K = kinds[slug];
    const monthTable = (m, id) => table(K.head, DAYS.filter((d) => F.parts(d.key).m === m).map((d) => '<tr' + rowAttrs(lang, d) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '<small>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '</small></td>' + K.cells(d) + '</tr>'), { id, caption: N.GMONTH[m - 1][lang] + ' ' + Y });
    const subChips = (cur) => '<div class="chips">' + N.GMONTH.map((g, i) => '<a class="chip" href="' + href(lang, sub(slug, i + 1)) + '"' + (cur === i + 1 ? ' aria-current="page"' : '') + '>' + esc(g[lang]) + '</a>').join('') + '</div>';
    const hv = {}; for (const d of DAYS) hv[d.key] = K.v(d);
    const bm = inYear(TODAY) ? F.parts(TODAY).m : 1;
    const c = copyOf(slug, lang);
    let body = (inYear(TODAY) ? dayHighlights(lang, 'yt', K.v) : '') + '<script type="application/json" id="nz-hv">' + JSON.stringify(hv).replace(/</g, '\\u003c') + '</script>' + methodBox(lang, C[slug].method[lang]) +
      sec('this', esc(N.GMONTH[bm - 1][lang] + ' ' + Y), '<a href="' + href(lang, sub(slug, bm)) + '">' + esc(lang === 'en' ? 'Open the ' + N.GMONTH[bm - 1].en + ' page' : N.GMONTH[bm - 1].ta + ' பக்கம்') + ' →</a>', monthTable(bm, 'yt')) +
      sec('bm', esc(Lx.byMonth), '', subChips(0));
    if (slug === 'nalla-neram') body += sec('mud', esc(lang === 'en' ? 'Nalla Neram on muhurtham days' : 'முகூர்த்த நாட்களில் நல்ல நேரம்'), '', table([Lx.date, Lx.tamilDate, Lx.muhurtham, Lx.nalla], DAYS.filter((d) => d.muhurtham).map((d) => '<tr' + rowAttrs(lang, d) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '</td><td>' + tag(isSubha(d) ? 'g' : 'y', muLabel(d, lang)) + '</td><td class="nw">' + RECS[lang][DAYS.indexOf(d)].nla.map(esc).join('<br>') + '</td></tr>')));
    stdPage(lang, slug, body);
    const base = stripTags(T(lang, c.h1));
    for (let m = 1; m <= 12; m++) {
      const mn = N.GMONTH[m - 1][lang] + ' ' + Y;
      const name = slug === 'nalla-neram' ? Lx.nalla : Lx.gowri;
      const mbody = methodBox(lang, C[slug].method[lang]) + sec('list', esc(name + ' · ' + mn), '', monthTable(m, 'yt')) +
        '<div class="pager">' + (m > 1 ? '<a href="' + href(lang, sub(slug, m - 1)) + '" rel="prev">‹ ' + esc(N.GMONTH[m - 2][lang]) + '</a>' : '<span></span>') + '<a href="' + href(lang, pg(slug)) + '">' + esc(base) + '</a>' + (m < 12 ? '<a href="' + href(lang, sub(slug, m + 1)) + '" rel="next">' + esc(N.GMONTH[m][lang]) + ' ›</a>' : '<span></span>') + '</div>' +
        sec('bm', esc(Lx.byMonth), '', subChips(m));
      const title = lang === 'en' ? name + ' ' + mn + ' – Daily Timings, ' + cfg.location.name.en : name + ' ' + mn + ' – தினசரி நேரங்கள்';
      const desc = lang === 'en' ? name + ' for every day of ' + mn + ' in ' + cfg.location.name.en + ', with Tamil date and tithi. Calculated from local sunrise and sunset.' : mn + ' மாதத்தின் ஒவ்வொரு நாளுக்குமான ' + name + ' – ' + cfg.location.name.ta + ', தமிழ் தேதி, திதியுடன். உள்ளூர் சூரிய உதயம், அஸ்தமனப்படி.';
      emit(lang, sub(slug, m), { title, desc, h1: esc(name) + ' <mark>' + esc(mn) + '</mark>', lead: T(lang, c.lead), body: mbody, navCur: slug === 'nalla-neram' ? 'nalla-neram' : 'timings', crumbs: [[base, pg(slug)], [mn, sub(slug, m)]], years: YEARS.map((y) => [y, { p: 'sub', s: slug, m, y }]) });
    }
  }
  // Rahu / Yama / Kuligai
  for (const [slug, key, arr] of [['rahu-kalam', 'rahu', N.RAHU], ['yamagandam', 'yama', N.YAMA], ['kuligai-neram', 'kuligai', N.KULIGAI]]) {
    const v = (d) => F.range(d[key].start, d[key].end, d.key, Lx);
    const todayDow = F.parts(BUILD_KEY).dow;
    const wk = table([Lx.weekday, Lx[key === 'kuligai' ? 'kuligai' : key]], [0, 1, 2, 3, 4, 5, 6].map((w) => '<tr data-dow="' + w + '"' + (w === todayDow ? ' class="is-today"' : '') + '><th scope="row">' + esc(N.WEEKDAY[w][lang]) + '</th><td class="nw">' + fixedRange(arr[w]) + '</td></tr>'));
    const body = (inYear(TODAY) ? dayHighlights(lang, 'yt', v) : '') + sec('wk', esc(lang === 'en' ? 'Weekday table' : 'கிழமை அட்டவணை'), '', wk) +
      '<section class="sec">' + yearTables(lang, 'yt', [Lx.date, Lx.tamilDate, Lx[key === 'kuligai' ? 'kuligai' : key]], (d) => '<tr data-d="' + d.key + '" data-v="' + esc(v(d)) + '"' + (d.key === BUILD_KEY ? ' class="is-today"' : '') + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '</td><td class="nw">' + v(d) + '</td></tr>') + '</section>';
    stdPage(lang, slug, body);
  }
  // Soolam (same every year: primary year only)
  if (Y === PRIMARY) {
    const todayDow = F.parts(BUILD_KEY).dow;
    const rows = [0, 1, 2, 3, 4, 5, 6].map((w) => '<tr data-dow="' + w + '"' + (w === todayDow ? ' class="is-today"' : '') + '><th scope="row">' + esc(N.WEEKDAY[w][lang]) + '</th><td>' + esc(N.SOOLAM[w].dir[lang]) + '</td><td>' + esc(N.SOOLAM[w].par[lang]) + '</td></tr>');
    const body = table([Lx.weekday, Lx.soolam + ' (' + Lx.direction + ')', Lx.pariharam], rows) +
      sec('how', esc(lang === 'en' ? 'How to use the pariharam' : 'பரிகாரம் செய்வது எப்படி'), '', '<div class="prose"><p>' + (lang === 'en' ? 'Before leaving in the soolam direction, take a little of the pariharam item: a bite of jaggery, a spoon of curd or milk, or a touch of balm (thailam) on Thursdays. Then start the journey.' : 'சூலத் திசையில் புறப்படும் முன், பரிகாரப் பொருளைச் சிறிது எடுத்துக்கொள்ளுங்கள்: வெல்லம், தயிர் அல்லது பால்; வியாழக்கிழமை தைலம். பிறகு பயணத்தைத் தொடங்குங்கள்.') + '</p></div>');
    stdPage(lang, 'soolam-pariharam', body);
  }
  // Timings hub
  {
    const r0 = Y === PRIMARY ? recOf(lang, BUILD_KEY) : null;
    const cards = GROUPS[1][1].slice(1).map((it) => '<a class="box" href="' + href(lang, pg(it[0])) + '" style="display:block;padding:20px 22px;text-decoration:none;color:var(--ink)"><strong class="disp" style="font-size:24px">' + esc(lang === 'en' ? it[1] : it[2]) + '</strong><span style="display:block;color:var(--muted)">' + esc(T(lang, C[it[0]][lang].lead)).slice(0, 110) + (T(lang, C[it[0]][lang].lead).length > 110 ? '…' : '') + '</span></a>').join('');
    const showToday = Y === PRIMARY && inYear(TODAY);
    const body = (showToday ? '<div data-nz="bento" data-nz-key="' + BUILD_KEY + '">' + S.bento(r0, Lx, { nav: false, link: true }) + '</div>' : '') +
      sec('pages', esc(lang === 'en' ? 'Timing pages' : 'நேரப் பக்கங்கள்'), '', '<div class="count">' + cards + '</div>') +
      sec('wk', esc(Lx.weekly), esc(Lx.weeklyNote), weeklyTable(lang));
    stdPage(lang, 'timings', body, { data: showToday });
  }
}

function muTable(lang, list, tid) {
  const Lx = L[lang];
  const rows = list.map((d) => '<tr' + rowAttrs(lang, d) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '</td><td>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '</td><td>' + esc(N.NAK[d.nak][lang]) + '</td><td class="nw">' + RECS[lang][DAYS.indexOf(d)].nla.slice(0, 2).map(esc).join('<br>') + '</td><td>' + tag(isSubha(d) ? 'g' : 'y', muLabel(d, lang)) + '</td></tr>');
  return table([Lx.date, Lx.tamilDate, Lx.pirai + ' · ' + Lx.tithi, Lx.nak, Lx.nalla, Lx.muhurtham], rows, { id: tid });
}
function buildMuhurtham(lang) {
  const Lx = L[lang];
  const all = DAYS.filter((d) => d.muhurtham);
  const sets = [['muhurtham-dates', all], ['subha-muhurtham-dates', all.filter(isSubha)], ['valarpirai-muhurtham-dates', all.filter((d) => d.pirai === 'V')], ['theipirai-muhurtham-dates', all.filter((d) => d.pirai === 'T')]];
  for (const [slug, list] of sets) {
    const items = list.map((d) => ({ s: d.key, label: F.fmtD(d.key, lang, 'wd') + ' · ' + tdShort(d, lang), h: hdl(lang, d.key) }));
    const byM = N.GMONTH.map((g, i) => [g[lang], list.filter((d) => F.parts(d.key).m === i + 1).length, i + 1]).filter((x) => x[1] > 0);
    const body = highlights(lang, 'mt', items) +
      sec('list', esc(T(lang, copyOf(slug, lang).h1)), '', muTable(lang, list, 'mt')) +
      sec('bm', esc(Lx.byMonth), '', '<div class="chips">' + byM.map((x) => Y === PRIMARY ? '<a class="chip" href="' + href(lang, mon(x[2])) + '">' + esc(x[0]) + ' · ' + x[1] + '</a>' : '<span class="chip">' + esc(x[0]) + ' · ' + x[1] + '</span>').join('') + '</div>') +
      sec('rel', esc(lang === 'en' ? 'More muhurtham lists' : 'மேலும் முகூர்த்தப் பட்டியல்கள்'), '', '<div class="chips">' + GROUPS[2][1].map((it) => '<a class="chip" href="' + href(lang, pg(it[0])) + '"' + (it[0] === slug ? ' aria-current="page"' : '') + '>' + esc(lang === 'en' ? it[1] : it[2]) + '</a>').join('') + '</div>') +
      (C['muhurtham-dates'].method ? '<div style="margin-top:28px">' + methodBox(lang, C['muhurtham-dates'].method[lang]) + '</div>' : '');
    const vars = { n: list.length, s: all.filter(isSubha).length };
    stdPage(lang, slug, body, { vars, navCur: 'muhurtham-dates', faq: slug === 'muhurtham-dates' ? C['muhurtham-dates'].faq[lang] : undefined });
  }
}

function buildViratham(lang) {
  const Lx = L[lang];
  const spanSeg = (seg) => spanText(seg.start, seg.end, lang);
  const defs = [
    ['pradosham-dates', M.lists.pradosham, [Lx.date, Lx.tamilDate, Lx.pirai + ' · ' + Lx.tithi, Lx.pradoshaKalam, Lx.type], (x) => ['<td>' + esc(N.PIRAI[x.pirai][lang] + ' · ' + N.TITHI[12][lang]) + '</td>', '<td class="nw">' + F.range(x.window.start, x.window.end, x.d.key, Lx) + '</td>', '<td>' + (x.label ? tag('y', V['pradosham:' + x.label][lang]) : tag('', V.pradosham[lang])) + '</td>']],
    ['sankatahara-chaturthi-dates', M.lists.sankatahara, [Lx.date, Lx.tamilDate, Lx.moonrise, Lx.type], (x) => ['<td class="nw">' + (x.moonrise ? F.fmtT(x.moonrise) : '–') + '</td>', '<td>' + (x.label ? tag('y', V['sankatahara:angaraki'][lang]) : tag('', V.sankatahara[lang])) + '</td>']],
    ['sashti-viratham-dates', M.lists.sashti, [Lx.date, Lx.tamilDate, N.TITHI[5][lang] + ' (' + Lx.starts + ' → ' + Lx.ends + ')', Lx.occasion], (x) => ['<td class="nw">' + spanSeg(x.seg) + '</td>', '<td>' + (x.d.festivals.length ? esc(x.d.festivals.map((f) => f[lang]).join(', ')) : '–') + '</td>']],
    ['karthigai-viratham-dates', M.lists.karthigai, [Lx.date, Lx.tamilDate, N.NAK[2][lang] + ' (' + Lx.starts + ' → ' + Lx.ends + ')', Lx.occasion], (x) => ['<td class="nw">' + spanSeg(x.seg) + '</td>', '<td>' + (x.d.festivals.length ? esc(x.d.festivals.map((f) => f[lang]).join(', ')) : '–') + '</td>']],
    ['chaturthi-viratham-dates', M.lists.chaturthi, [Lx.date, Lx.tamilDate, N.TITHI[3][lang] + ' (' + Lx.starts + ' → ' + Lx.ends + ')', Lx.occasion], (x) => ['<td class="nw">' + spanSeg(x.seg) + '</td>', '<td>' + (x.d.festivals.length ? esc(x.d.festivals.map((f) => f[lang]).join(', ')) : '–') + '</td>']],
    ['shivaratri-dates', M.lists.shivaratri, [Lx.date, Lx.tamilDate, Lx.nishita, Lx.type], (x) => ['<td class="nw">' + F.fmtT(x.nishita) + (F.istKey(x.nishita) > x.d.key ? ' ' + Lx.nextDay : '') + '</td>', '<td>' + (x.maha ? tag('y', V['shivaratri:maha'][lang]) : tag('', V.shivaratri[lang])) + '</td>']],
    ['thiruvonam-dates', M.lists.thiruvonam, [Lx.date, Lx.tamilDate, N.NAK[21][lang] + ' (' + Lx.starts + ' → ' + Lx.ends + ')'], (x) => ['<td class="nw">' + spanSeg(x.seg) + '</td>']],
    ['chandra-darshan-dates', M.lists.chandraDarshan, [Lx.date, Lx.tamilDate, Lx.sunset, Lx.moonset], (x) => ['<td class="nw">' + F.fmtT(x.d.sunset) + '</td>', '<td class="nw">' + (x.moonset ? F.fmtT(x.moonset) : '–') + '</td>']]
  ];
  for (const [slug, list, head, cells] of defs) {
    const items = list.map((x) => ({ s: x.d.key, label: F.fmtD(x.d.key, lang, 'wd') + ' · ' + tdShort(x.d, lang), h: hdl(lang, x.d.key) }));
    const rows = list.map((x) => '<tr' + rowAttrs(lang, x.d) + '>' + dateCell(lang, x.d) + '<td>' + esc(tdShort(x.d, lang)) + '</td>' + cells(x).join('') + '</tr>');
    const body = highlights(lang, 'vt', items) + (C[slug].method ? methodBox(lang, C[slug].method[lang]) : '') +
      sec('list', esc(T(lang, copyOf(slug, lang).h1)), '', table(head, rows, { id: 'vt' })) +
      sec('rel', esc(lang === 'en' ? 'Other viratham days' : 'பிற விரத நாட்கள்'), '', '<div class="chips">' + GROUPS[3][1].map((it) => '<a class="chip" href="' + href(lang, pg(it[0])) + '"' + (it[0] === slug ? ' aria-current="page"' : '') + '>' + esc(lang === 'en' ? it[1] : it[2]) + '</a>').join('') + '</div>');
    stdPage(lang, slug, body, { vars: { n: list.length }, navCur: 'viratham' });
  }
  // hub
  const vd = DAYS.filter((d) => d.virathams.length);
  const items = vd.map((d) => ({ s: d.key, label: F.fmtD(d.key, lang, 'wd') + ' · ' + d.virathams.map((v) => vName(v, lang)).join(', '), h: hdl(lang, d.key) }));
  const rows = vd.map((d) => '<tr' + rowAttrs(lang, d) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '<small>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '</small></td><td>' + d.virathams.map((v) => tag(v.label ? 'y' : '', vName(v, lang))).join(' ') + '</td></tr>');
  const body = highlights(lang, 'vt', items) + sec('types', esc(lang === 'en' ? 'Viratham types' : 'விரத வகைகள்'), '', '<div class="chips">' + GROUPS[3][1].slice(1).map((it) => '<a class="chip" href="' + href(lang, pg(it[0])) + '">' + esc(lang === 'en' ? it[1] : it[2]) + '</a>').join('') + '</div>') +
    sec('list', esc(T(lang, copyOf('viratham', lang).h1)), '', table([Lx.date, Lx.tamilDate, Lx.viratham], rows, { id: 'vt' }));
  stdPage(lang, 'viratham', body);
}

function tithiRows(lang, list) {
  const Lx = L[lang];
  return list.map((d) => {
    const seg = d.tithis[0];
    return '<tr' + rowAttrs(lang, d) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '</td><td>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '</td><td class="nw">' + esc(F.fmtT(seg.end) + (F.istKey(seg.end) > d.key ? ' ' + Lx.nextDay : '')) + '</td></tr>';
  });
}
function buildTithi(lang) {
  const Lx = L[lang];
  const head = [Lx.date, Lx.tamilDate, Lx.pirai + ' · ' + Lx.tithi, Lx.tithi + ' ' + Lx.ends];
  const listPage = (slug, list, title, h1raw, desc, lead) => {
    const h1 = T(lang, h1raw, { n: list.length });
    const items = list.map((d) => ({ s: d.key, label: F.fmtD(d.key, lang, 'wd') + ' · ' + N.PIRAI[d.pirai][lang] + ' ' + N.TITHI[d.tithi][lang], h: hdl(lang, d.key) }));
    const body = highlights(lang, 'tt', items) + methodBox(lang, C.tithi.method[lang]) + sec('list', esc(stripTags(h1)), '', table(head, tithiRows(lang, list), { id: 'tt' })) +
      sec('rel', esc(lang === 'en' ? 'Other tithi' : 'பிற திதிகள்'), '', tithiChips(lang, slug));
    const o = { title, h1, desc, lead, body, crumbs: [[lang === 'en' ? 'Tithi' : 'திதி', pg('tithi')], [stripTags(h1), pg(slug)]], navCur: 'tithi', vars: { n: list.length }, years: YEARS.map((y) => [y, pgY(slug, y)]) };
    emit(lang, pg(slug), o);
  };
  for (const [slug, idx] of TITHI_PAGES) {
    const list = DAYS.filter((d) => idx.includes(d.tithi));
    const n0 = N.TITHI[idx[0]][lang];
    const title = lang === 'en' ? n0 + ' Tithi {y} – All ' + n0 + ' Dates' : n0 + ' திதி {y} – அனைத்து ' + n0 + ' நாட்களும்';
    const h1 = lang === 'en' ? n0 + ' tithi {y}' : n0 + ' திதி {y}';
    const desc = lang === 'en' ? 'All {n} ' + n0 + ' tithi dates of {y}, Valarpirai and Theipirai, with Tamil date and end time for {c}.' : '{y} ஆண்டின் {n} ' + n0 + ' திதி நாட்களும் – வளர்பிறை, தேய்பிறை – தமிழ் தேதி, முடியும் நேரத்துடன் ({c}).';
    const lead = lang === 'en' ? 'Every date in {y} on which ' + n0 + ' is the tithi at sunrise.' : '{y}-இல் சூரிய உதயத்தில் ' + n0 + ' திதி இருக்கும் அனைத்து நாட்களும்.';
    listPage(slug, list, title, h1, desc, lead);
  }
  const combo = [['ashtami-navami', [7, 8, 22, 23]], ['ashtami-navami-dashami', [7, 8, 9, 22, 23, 24]], ['valarpirai-ashtami', [7]], ['theipirai-ashtami', [22]]];
  for (const [slug, idx] of combo) {
    const c = copyOf(slug, lang);
    listPage(slug, DAYS.filter((d) => idx.includes(d.tithi)), c.title, c.h1, c.desc, c.lead);
  }
  // Pournami / Amavasai
  for (const [slug, key, i] of [['pournami', 'pournami', 14], ['amavasai', 'amavasai', 29]]) {
    const list = M.moonDays[key];
    const items = list.map((x) => ({ s: x.days[0].key, e: x.days[x.days.length - 1].key, label: x.days.map((d) => F.fmtD(d.key, lang, 'wd')).join(' + ') + ' · ' + tdShort(x.days[0], lang), h: hdl(lang, x.days[0].key) }));
    const rows = list.map((x) => {
      const d = x.days[0], e = x.days[x.days.length - 1];
      const names = [N.TMONTH[d.tamilMonth][lang] + ' ' + N.TITHI[i][lang]].concat(x.days.flatMap((dd) => dd.festivals.map((f) => f[lang])));
      const dates = x.days.map((dd) => dayLink(lang, dd.key, '<time datetime="' + dd.key + '">' + F.fmtD(dd.key, lang, 'med') + '</time>')).join(' +<br>');
      return '<tr' + rowAttrs(lang, d, e.key !== d.key ? e : null, items[list.indexOf(x)].label) + '><td class="nw">' + dates + '<small>' + esc(x.days.map((dd) => N.WEEKDAY[dd.dow][lang]).join(' + ')) + '</small></td><td>' + esc(x.days.map((dd) => tdShort(dd, lang)).join(' + ')) + '</td><td class="nw">' + esc(dateTime(x.seg.start, lang)) + '</td><td class="nw">' + esc(dateTime(x.seg.end, lang)) + '</td><td>' + esc(Array.from(new Set(names)).join(', ')) + '</td></tr>';
    });
    const body = highlights(lang, 'mt', items) + methodBox(lang, C.tithi.method[lang]) +
      sec('list', esc(T(lang, copyOf(slug, lang).h1)), '', table([Lx.date, Lx.tamilDate, Lx.starts, Lx.ends, Lx.occasion], rows, { id: 'mt' })) +
      sec('rel', esc(lang === 'en' ? 'Other tithi' : 'பிற திதிகள்'), '', tithiChips(lang, slug));
    stdPage(lang, slug, body, { navCur: slug, crumbs: [[lang === 'en' ? 'Tithi' : 'திதி', pg('tithi')], [stripTags(T(lang, copyOf(slug, lang).h1)), pg(slug)]] });
  }
  // Valarpirai / Theipirai periods
  for (const [slug, P] of [['valarpirai-dates', 'V'], ['theipirai-dates', 'T']]) {
    const runs = [];
    let cur = null;
    for (const d of DAYS) { if (d.pirai === P) { if (!cur) { cur = [d, d]; runs.push(cur); } else cur[1] = d; } else cur = null; }
    const items = runs.map(([a, b]) => ({ s: a.key, e: b.key, label: F.fmtD(a.key, lang, 'short') + ' – ' + F.fmtD(b.key, lang, 'med'), h: hdl(lang, a.key) }));
    const rows = runs.map(([a, b], j) => '<tr' + rowAttrs(lang, a, b, items[j].label) + '><td class="nw">' + dayLink(lang, a.key, F.fmtD(a.key, lang, 'med')) + '<small>' + esc(tdShort(a, lang)) + '</small></td><td class="nw">' + dayLink(lang, b.key, F.fmtD(b.key, lang, 'med')) + '<small>' + esc(tdShort(b, lang)) + '</small></td><td class="tnum">' + (Math.round((Date.parse(b.key) - Date.parse(a.key)) / 86400000) + 1) + '</td><td>' + esc(N.TITHI[b.tithi][lang]) + '</td></tr>');
    const body = highlights(lang, 'pt', items) + sec('list', esc(T(lang, copyOf(slug, lang).h1)), '', table([Lx.from, Lx.to, Lx.days, lang === 'en' ? 'Last tithi' : 'கடைசி திதி'], rows, { id: 'pt' })) +
      sec('rel', esc(lang === 'en' ? 'Other tithi' : 'பிற திதிகள்'), '', tithiChips(lang, slug));
    stdPage(lang, slug, body, { navCur: 'tithi', crumbs: [[lang === 'en' ? 'Tithi' : 'திதி', pg('tithi')], [stripTags(T(lang, copyOf(slug, lang).h1)), pg(slug)]] });
  }
  // Tithi hub
  const rows = TITHI_PAGES.map(([slug, idx]) => '<tr><th scope="row"><a href="' + href(lang, pg(slug)) + '">' + esc(N.TITHI[idx[0]][lang]) + '</a><small lang="' + (lang === 'en' ? 'ta' : 'en') + '">' + esc(N.TITHI[idx[0]][lang === 'en' ? 'ta' : 'en']) + '</small></th><td class="tnum">' + DAYS.filter((d) => d.tithi === idx[0]).length + '</td><td class="tnum">' + DAYS.filter((d) => d.tithi === idx[1]).length + '</td></tr>')
    .concat([['pournami', 14], ['amavasai', 29]].map(([slug, i]) => '<tr><th scope="row"><a href="' + href(lang, pg(slug)) + '">' + esc(N.TITHI[i][lang]) + '</a><small>' + esc(N.TITHI[i][lang === 'en' ? 'ta' : 'en']) + '</small></th><td class="tnum">' + (i === 14 ? DAYS.filter((d) => d.tithi === 14).length : '–') + '</td><td class="tnum">' + (i === 29 ? DAYS.filter((d) => d.tithi === 29).length : '–') + '</td></tr>'));
  const body = methodBox(lang, C.tithi.method[lang]) + sec('idx', esc(lang === 'en' ? 'Tithi index' : 'திதி அட்டவணை'), '', table([Lx.tithi, N.PIRAI.V[lang] + ' · ' + Lx.days, N.PIRAI.T[lang] + ' · ' + Lx.days], rows)) +
    sec('rel', esc(lang === 'en' ? 'Tithi lists' : 'திதிப் பட்டியல்கள்'), '', '<div class="chips">' + GROUPS[4][1].slice(1).map((it) => '<a class="chip" href="' + href(lang, pg(it[0])) + '">' + esc(lang === 'en' ? it[1] : it[2]) + '</a>').join('') + '</div>');
  stdPage(lang, 'tithi', body);
}
function tithiChips(lang, cur) {
  const items = [['pournami', N.TITHI[14][lang]], ['amavasai', N.TITHI[29][lang]]].concat(TITHI_PAGES.map(([s, idx]) => [s, N.TITHI[idx[0]][lang]]));
  return '<div class="chips">' + items.map(([s, t]) => '<a class="chip" href="' + href(lang, pg(s)) + '"' + (s === cur ? ' aria-current="page"' : '') + '>' + esc(t) + '</a>').join('') + '</div>';
}

function buildCalendarInfo(lang) {
  const Lx = L[lang];
  // holidays (one row per date)
  const holDays = DAYS.filter((d) => d.festivals.some((f) => f.holiday));
  const hItems = holDays.map((d) => ({ s: d.key, label: F.fmtD(d.key, lang, 'wd') + ' · ' + d.festivals.filter((f) => f.holiday).map((f) => f[lang]).join(' / '), h: hdl(lang, d.key) }));
  const hRows = holDays.map((d, j) => { const fs = d.festivals.filter((f) => f.holiday); const bank = fs.every((f) => f.holiday === 'bank'); return '<tr' + rowAttrs(lang, d, null, hItems[j].label) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '<small>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '</small></td><td>' + esc(fs.map((f) => f[lang]).join(' / ')) + '</td><td>' + tag(bank ? 'y' : 'r', bank ? Lx.bankHoliday : Lx.publicHoliday) + (d.dow === 0 || d.dow === 6 ? ' ' + tag('', Lx.weekend) : '') + '</td></tr>'; });
  stdPage(lang, 'tamil-holidays', highlights(lang, 'ht', hItems) + sec('list', esc(T(lang, copyOf('tamil-holidays', lang).h1)), '', table([Lx.date, Lx.tamilDate, Lx.holiday, Lx.type], hRows, { id: 'ht' })) + '<div style="margin-top:28px">' + methodBox(lang, C['tamil-holidays'].method[lang]) + '</div>', { vars: { n: MODELS[Y].govtCount || holDays.length } });
  // festivals
  const feDays = DAYS.filter((d) => d.festivals.length);
  const fItems = feDays.map((d) => ({ s: d.key, label: F.fmtD(d.key, lang, 'wd') + ' · ' + d.festivals.map((f) => f[lang]).join(', '), h: hdl(lang, d.key) }));
  const fRows = feDays.map((d, j) => { const h = holidayOf(d); return '<tr' + rowAttrs(lang, d, null, fItems[j].label) + '>' + dateCell(lang, d) + '<td>' + esc(tdShort(d, lang)) + '</td><td>' + esc(N.PIRAI[d.pirai][lang] + ' · ' + N.TITHI[d.tithi][lang]) + '<small>' + esc(N.NAK[d.nak][lang]) + '</small></td><td>' + esc(d.festivals.map((f) => f[lang]).join(', ')) + '</td><td>' + (h ? tag(h === 'bank' ? 'y' : 'r', h === 'bank' ? Lx.bankHoliday : Lx.publicHoliday) : '–') + '</td></tr>'; });
  stdPage(lang, 'tamil-festivals', highlights(lang, 'ft', fItems) + sec('list', esc(T(lang, copyOf('tamil-festivals', lang).h1)), '', table([Lx.date, Lx.tamilDate, Lx.tithi + ' · ' + Lx.nak, Lx.festival, Lx.holiday], fRows, { id: 'ft' })), { vars: { n: festivals.length } });
  // Tamil months
  const mItems = M.months.map((m) => ({ s: m.start, e: m.end, label: N.TMONTH[m.rasi][lang] + ' · ' + F.fmtD(m.start, lang, 'short') + ' – ' + F.fmtD(m.end, lang, 'med'), h: hdl(lang, m.start) }));
  const dlink = (k) => dayLink(lang, k, esc(F.fmtD(k, lang, 'wd')));
  const mRows = M.months.map((m, j) => '<tr data-d="' + m.start + '" data-e="' + m.end + '" data-t="' + esc(mItems[j].label) + '" data-h="' + mItems[j].h + '"' + (m.start <= BUILD_KEY && m.end >= BUILD_KEY ? ' class="is-today"' : '') + '><th scope="row">' + esc(N.TMONTH[m.rasi][lang]) + '<small>' + esc(N.TMONTH[m.rasi][lang === 'en' ? 'ta' : 'en'] + ' · ' + N.RASI[m.rasi][lang]) + '</small></th><td class="nw">' + dlink(m.start) + '</td><td class="nw">' + dlink(m.end) + '</td><td class="tnum">' + m.days + '</td><td class="nw">' + esc(dateTime(m.sankranti, lang)) + '</td></tr>');
  stdPage(lang, 'tamil-months', highlights(lang, 'tm', mItems).replace(esc(L[lang].isTodayLong), esc(L[lang].isTodayLong)) + methodBox(lang, C['tamil-months'].method[lang]) + sec('list', esc(T(lang, copyOf('tamil-months', lang).h1)), '', table([Lx.tamilMonth, Lx.starts, Lx.ends, Lx.days, Lx.sankranti], mRows, { id: 'tm' })));
  // retrograde
  const rRows = M.retro.map((x) => '<tr><th scope="row">' + esc(lang === 'en' ? x.en : x.ta) + '<small>' + esc(lang === 'en' ? x.ta : x.en) + '</small></th><td class="nw">' + (x.start ? esc(dateTime(x.start, lang)) : '–') + '</td><td class="nw">' + (x.end ? esc(dateTime(x.end, lang)) : '–') + '</td><td class="tnum">' + (x.start && x.end ? Math.round((x.end - x.start) / 86400000) : '–') + '</td></tr>');
  stdPage(lang, 'retrograde', sec('list', esc(T(lang, copyOf('retrograde', lang).h1)), esc(lang === 'en' ? 'Times are in IST. A period that started in the previous year or ends in the next is shown in full.' : 'நேரங்கள் இந்திய நேரப்படி. முந்தைய ஆண்டில் தொடங்கிய அல்லது அடுத்த ஆண்டில் முடியும் காலமும் முழுமையாகக் காட்டப்பட்டுள்ளது.'), table([Lx.planet, Lx.starts, Lx.ends, Lx.days], rRows)));
}

function buildSiteInfo(lang) {
  const Lx = L[lang];
  // site map
  const groups = GROUPS.map((g) => '<div><h3>' + esc(GROUP_TITLE[g[0]][lang === 'en' ? 0 : 1]) + '</h3><ul>' + g[1].map((it) => '<li>' + glink(lang, it) + '</li>').join('') + '</ul></div>').join('') +
    '<div><h3>' + esc(Lx.monthlyCal) + '</h3><ul>' + N.GMONTH.map((g, i) => '<li><a href="' + href(lang, mon(i + 1)) + '">' + esc(g[lang] + ' ' + Y) + '</a></li>').join('') + '</ul></div>' +
    '<div><h3>' + esc(Lx.tithi) + '</h3><ul>' + TITHI_PAGES.map(([s, idx]) => '<li><a href="' + href(lang, pg(s)) + '">' + esc(N.TITHI[idx[0]][lang]) + '</a></li>').join('') + '</ul></div>';
  stdPage(lang, 'site-map', '<div class="links-grid">' + groups + '</div>');
  const city = cfg.location.name[lang];
  const P = (arr) => '<div class="prose">' + arr.map((x) => x.startsWith('## ') ? '<h2>' + esc(x.slice(3)) + '</h2>' : '<p>' + x + '</p>').join('') + '</div>';
  const en = lang === 'en';
  stdPage(lang, 'about', P(en ? [
    esc(cfg.brand.en) + ' is a Tamil calendar for ' + esc(city) + '. It gives the daily panchangam, timings, muhurtham dates, viratham days, festivals and holidays for ' + Y + ', in English and Tamil.',
    '## How the panchangam is made',
    'Sunrise, sunset, moonrise, tithi, nakshatram and the Tamil month are calculated from the positions of the sun and moon for ' + esc(city) + ' (Thirukanitha method, Lahiri ayanamsa). Tamil month start dates follow the Tamil Nadu calendar tradition. A date is listed under the tithi or nakshatram running at sunrise, and end times are shown so you can see changes during the day.',
    'Rahu Kalam, Yamagandam and Kuligai follow the traditional fixed table used in Tamil calendars. Gowri Panchangam and Nalla Neram are calculated from local sunrise and sunset.',
    'Muhurtham dates come from published ' + Y + ' Tamil calendars. Public holidays come from the Tamil Nadu Government list.',
    '## Corrections',
    'If something looks wrong, please write to us from the <a href="' + href(lang, pg('contact-us')) + '">contact page</a>.'
  ] : [
    esc(cfg.brand.ta) + ' – ' + esc(city) + ' நகருக்கான தமிழ் காலண்டர். ' + Y + ' ஆண்டுக்கான தினசரி பஞ்சாங்கம், நேரங்கள், முகூர்த்த நாட்கள், விரதங்கள், பண்டிகைகள், விடுமுறைகள் – தமிழிலும் ஆங்கிலத்திலும்.',
    '## பஞ்சாங்கம் எப்படி கணக்கிடப்படுகிறது',
    'சூரிய உதயம், அஸ்தமனம், சந்திர உதயம், திதி, நட்சத்திரம், தமிழ் மாதம் ஆகியவை ' + esc(city) + ' நகருக்கான சூரிய, சந்திர நிலைகளிலிருந்து கணக்கிடப்படுகின்றன (திருக்கணித முறை, லஹிரி அயனாம்சம்). தமிழ் மாதத் தொடக்கங்கள் தமிழ்நாட்டு மரபைப் பின்பற்றுகின்றன. சூரிய உதயத்தில் இருக்கும் திதி / நட்சத்திரத்தின் கீழ் தேதி பட்டியலிடப்படுகிறது; முடியும் நேரமும் தரப்பட்டுள்ளது.',
    'ராகு காலம், எமகண்டம், குளிகை பாரம்பரிய நிலையான அட்டவணைப்படி. கௌரி பஞ்சாங்கம், நல்ல நேரம் உள்ளூர் சூரிய உதயம், அஸ்தமனப்படி.',
    'முகூர்த்த நாட்கள் வெளியிடப்பட்ட ' + Y + ' தமிழ் காலண்டர்களிலிருந்து. அரசு விடுமுறைகள் தமிழ்நாடு அரசு அறிவிப்பிலிருந்து.',
    '## திருத்தங்கள்',
    'ஏதேனும் தவறு தெரிந்தால் <a href="' + href(lang, pg('contact-us')) + '">தொடர்புப் பக்கம்</a> வழியாக எழுதுங்கள்.'
  ]));
  stdPage(lang, 'disclaimer', P(en ? ['The panchangam, timings and dates on this site are calculated with care and are for general guidance only. Different panchangams (Vakya and Thirukanitha) can differ by a few hours, which sometimes changes the tithi or nakshatram shown for a date.', 'For weddings, griha pravesam and other important events, please confirm the muhurtham and lagnam with your family priest or astrologer. ' + esc(cfg.brand.en) + ' is not responsible for decisions taken from this information.'] : ['இந்தத் தளத்திலுள்ள பஞ்சாங்கம், நேரங்கள், தேதிகள் கவனத்துடன் கணக்கிடப்பட்டவை; பொது வழிகாட்டலுக்கு மட்டுமே. வாக்கிய, திருக்கணித பஞ்சாங்கங்களுக்கு இடையே சில மணி நேர வேறுபாடு இருக்கலாம்; அதனால் ஒரு தேதிக்கான திதி அல்லது நட்சத்திரம் மாறலாம்.', 'திருமணம், கிரகப்பிரவேசம் போன்ற முக்கிய நிகழ்வுகளுக்கு முகூர்த்தம், லக்னத்தை உங்கள் குடும்ப புரோகிதர் அல்லது ஜோதிடரிடம் உறுதி செய்யுங்கள். இந்தத் தகவல்களின் அடிப்படையில் எடுக்கப்படும் முடிவுகளுக்கு ' + esc(cfg.brand.ta) + ' பொறுப்பல்ல.']));
  stdPage(lang, 'privacy-policy', P(en ? [
    'Last updated: October 30, 2026',
    'Welcome to ' + esc(cfg.brand.en) + ' (<a href="' + cfg.domain + '/">' + cfg.domain + '/</a>). Your privacy is very important to us, and we are committed to keeping your online experience simple and secure.',
    '## 1. Information Collection',
    'We do not collect any personal information.',
    'When you visit ' + cfg.domain + '/, you can browse our site freely without providing any personal details such as your name, email address, phone number, or physical address. We do not require account registration, login credentials, or personal form submissions to access our content.',
    '## 2. Cookies and Tracking',
    'We do not use cookies to identify you personally or to build a profile of you. We use <strong>Google Analytics</strong>, which sets cookies to count visits and understand how the site is used, in aggregate. The site also uses <strong>Google AdSense</strong>, so Google and its advertising partners may use cookies to show and measure ads, including ads based on your earlier visits to this and other websites. Fonts are loaded from Google Fonts. You can block or delete cookies in your browser settings, and you can manage ad personalisation at <a href="https://adssettings.google.com" rel="noopener">adssettings.google.com</a>. Read how Google uses data from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>.',
    'Standard web server logs created automatically are used strictly for basic operational security and website functionality, not for identifying individual users.',
    '## 3. Third-Party Links',
    'Our website may contain links to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and we cannot accept responsibility or liability for their respective privacy policies. We encourage you to review the privacy policy of any site you visit.',
    '## 4. Children’s Privacy',
    'Because we do not collect any personal information, our website does not collect data from children under the age of 13 (or any other age group).',
    '## 5. Changes to This Privacy Policy',
    'We may update this Privacy Policy from time to time to reflect changes in our practices or website operations. Any updates will be posted directly on this page with an updated “Last updated” date.',
    '## 6. Contact Us',
    'If you have any questions about this Privacy Policy, feel free to reach out to us:',
    'Website: <a href="' + cfg.domain + '/">' + cfg.domain + '/</a>',
    'Email: <a href="mailto:' + esc(cfg.privacyEmail) + '">' + esc(cfg.privacyEmail) + '</a>'
  ] : [
    'கடைசியாகப் புதுப்பிக்கப்பட்டது: அக்டோபர் 30, 2026',
    esc(cfg.brand.ta) + ' (<a href="' + cfg.domain + '/">' + cfg.domain + '/</a>) தளத்திற்கு வரவேற்கிறோம். உங்கள் தனியுரிமை எங்களுக்கு மிகவும் முக்கியம்; உங்கள் இணைய அனுபவத்தை எளிமையாகவும் பாதுகாப்பாகவும் வைத்திருக்க உறுதிபூண்டுள்ளோம்.',
    '## 1. தகவல் சேகரிப்பு',
    'நாங்கள் எந்தத் தனிப்பட்ட தகவலையும் சேகரிப்பதில்லை.',
    'நீங்கள் ' + cfg.domain + '/ தளத்தைப் பார்வையிடும்போது, உங்கள் பெயர், மின்னஞ்சல் முகவரி, தொலைபேசி எண் அல்லது முகவரி போன்ற எந்த விவரங்களையும் அளிக்காமலே தளத்தை உலாவலாம். எங்கள் உள்ளடக்கத்தைப் பார்க்க கணக்குப் பதிவு, உள்நுழைவு விவரங்கள் அல்லது தனிப்பட்ட படிவச் சமர்ப்பிப்புகள் தேவையில்லை.',
    '## 2. குக்கீகள் மற்றும் கண்காணிப்பு',
    'உங்களைத் தனிப்பட்ட முறையில் அடையாளம் காணவோ, உங்களைப் பற்றிய விவரக்குறிப்பை உருவாக்கவோ நாங்கள் குக்கீகளைப் பயன்படுத்துவதில்லை. வருகைகளை எண்ணவும், தளம் எவ்வாறு பயன்படுத்தப்படுகிறது என்பதை ஒட்டுமொத்தமாக அறியவும் <strong>Google Analytics</strong> குக்கீகளை அமைக்கிறது. இந்தத் தளம் <strong>Google AdSense</strong>-ஐயும் பயன்படுத்துகிறது; எனவே Google மற்றும் அதன் விளம்பரக் கூட்டாளர்கள், இந்தத் தளத்திலும் பிற தளங்களிலும் உங்கள் முந்தைய வருகைகளின் அடிப்படையிலான விளம்பரங்கள் உட்பட, விளம்பரங்களைக் காட்டவும் அளவிடவும் குக்கீகளைப் பயன்படுத்தலாம். எழுத்துருக்கள் Google Fonts-இலிருந்து ஏற்றப்படுகின்றன. உங்கள் உலாவி அமைப்புகளில் குக்கீகளைத் தடுக்கலாம் அல்லது நீக்கலாம்; விளம்பரத் தனிப்பயனாக்கத்தை <a href="https://adssettings.google.com" rel="noopener">adssettings.google.com</a> இல் நிர்வகிக்கலாம். Google சேவைகளைப் பயன்படுத்தும் தளங்களின் தரவை Google எவ்வாறு பயன்படுத்துகிறது என்பதை <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a> இல் படிக்கலாம்.',
    'தானாக உருவாகும் வழக்கமான வலைத்தளச் சர்வர் பதிவுகள் அடிப்படைப் பாதுகாப்பு மற்றும் தளச் செயல்பாட்டுக்கு மட்டுமே பயன்படுத்தப்படுகின்றன; தனிப்பட்ட பயனர்களை அடையாளம் காண அல்ல.',
    '## 3. மூன்றாம் தரப்பு இணைப்புகள்',
    'எங்கள் தளத்தில் எங்களால் நடத்தப்படாத வெளித் தளங்களுக்கான இணைப்புகள் இருக்கலாம். அந்தத் தளங்களின் உள்ளடக்கம் மற்றும் நடைமுறைகள் மீது எங்களுக்குக் கட்டுப்பாடு இல்லை; அவற்றின் தனியுரிமைக் கொள்கைகளுக்கு நாங்கள் பொறுப்பேற்க இயலாது. நீங்கள் பார்வையிடும் ஒவ்வொரு தளத்தின் தனியுரிமைக் கொள்கையையும் படிக்குமாறு பரிந்துரைக்கிறோம்.',
    '## 4. குழந்தைகளின் தனியுரிமை',
    'நாங்கள் எந்தத் தனிப்பட்ட தகவலையும் சேகரிக்காததால், 13 வயதுக்குட்பட்ட குழந்தைகளிடமிருந்து (அல்லது வேறு எந்த வயதினரிடமிருந்தும்) எங்கள் தளம் தரவு சேகரிப்பதில்லை.',
    '## 5. இந்தத் தனியுரிமைக் கொள்கையில் மாற்றங்கள்',
    'எங்கள் நடைமுறைகள் அல்லது தளச் செயல்பாடுகளில் ஏற்படும் மாற்றங்களைப் பிரதிபலிக்க இந்தத் தனியுரிமைக் கொள்கையை அவ்வப்போது புதுப்பிக்கலாம். புதுப்பிப்புகள் “கடைசியாகப் புதுப்பிக்கப்பட்டது” தேதியுடன் இந்தப் பக்கத்திலேயே வெளியிடப்படும்.',
    '## 6. எங்களைத் தொடர்பு கொள்ள',
    'இந்தத் தனியுரிமைக் கொள்கை பற்றி ஏதேனும் கேள்விகள் இருந்தால் தயங்காமல் எங்களைத் தொடர்பு கொள்ளுங்கள்:',
    'இணையதளம்: <a href="' + cfg.domain + '/">' + cfg.domain + '/</a>',
    'மின்னஞ்சல்: <a href="mailto:' + esc(cfg.privacyEmail) + '">' + esc(cfg.privacyEmail) + '</a>'
  ]));
  stdPage(lang, 'terms-of-use', P(en ? ['You may read, print and share pages from this site for personal use. Please link back instead of copying whole tables onto another website.', 'The information is provided as is, without warranty. See the <a href="' + href(lang, pg('disclaimer')) + '">disclaimer</a>.'] : ['தனிப்பட்ட பயன்பாட்டுக்காக இந்தத் தளப் பக்கங்களைப் படிக்கலாம், அச்சிடலாம், பகிரலாம். முழு அட்டவணைகளை வேறு தளத்தில் நகலெடுப்பதற்குப் பதிலாக இணைப்பு தாருங்கள்.', 'தகவல்கள் உள்ளபடியே, உத்தரவாதமின்றி வழங்கப்படுகின்றன. <a href="' + href(lang, pg('disclaimer')) + '">பொறுப்புத் துறப்பைப்</a> பாருங்கள்.']));
  stdPage(lang, 'contact-us', P(en ? ['For corrections, suggestions or questions, email us at:', '<strong style="font-size:22px;user-select:all">' + esc(cfg.contactEmail) + '</strong>', 'Please include the page link and the date you are asking about.'] : ['திருத்தங்கள், பரிந்துரைகள், கேள்விகளுக்கு மின்னஞ்சல்:', '<strong style="font-size:22px;user-select:all">' + esc(cfg.contactEmail) + '</strong>', 'பக்க இணைப்பையும், நீங்கள் கேட்கும் தேதியையும் சேர்த்து எழுதுங்கள்.']));
  // 404
  const c = copyOf('404', lang);
  emit(lang, pg('404'), { title: c.title, h1: c.h1, desc: c.desc, lead: c.lead, noindex: true, body: '<div class="chips"><a class="chip" href="' + href(lang, { p: 'home' }) + '">' + esc(Lx.today) + '</a><a class="chip" href="' + href(lang, pg('site-map')) + '">' + esc(lang === 'en' ? 'Site map' : 'தள வரைபடம்') + '</a></div>' + sec('ex', esc(Lx.explore), '', exploreChips(lang)), crumbs: [[c.title, pg('404')]] });
}

// ---------------- run ----------------
fs.rmSync(OUT, { recursive: true, force: true });
for (const y of YEARS) {
  setYear(y); makeRecs();
  for (const lang of LANGS) {
    if (y === PRIMARY) { buildHome(lang); buildDaily(lang); buildDailyIndex(lang); buildMonthly(lang); buildSiteInfo(lang); }
    buildTimings(lang); buildMuhurtham(lang); buildViratham(lang); buildTithi(lang); buildCalendarInfo(lang);
  }
}
setYear(PRIMARY); makeRecs();
// SEO slug safety: a custom URL must never land on another page's URL. Fail the build (the live site stays as it was).
const DEFAULT_PATHS = new Set(pages.map((p) => defPath(p.lang, p.r)));
const SLUG_REDIRECTS = [];
for (const [k, o] of Object.entries(SEO)) {
  if (!DEFAULT_PATHS.has(k)) { console.warn('SEO override for a page that does not exist (ignored): ' + k); continue; }
  const fin = o.slug ? withSlug(k, o.slug) : k;
  if (o.slug) {
    if (DEFAULT_PATHS.has(fin)) throw new Error('SEO slug clash: ' + k + ' -> ' + fin + ' is already another page. Change the slug in /admin/.');
    SLUG_REDIRECTS.push([k, fin]);
  }
  for (const s of o.previous) { const from = withSlug(k, s); if (!DEFAULT_PATHS.has(from) && from !== fin) SLUG_REDIRECTS.push([from, fin]); }
}
const written = new Map();
for (const p of pages) {
  const f = outFile(p.lang, p.r);
  if (written.has(f)) throw new Error('Two pages would be written to ' + path.relative(OUT, f) + ' (' + written.get(f) + ' and ' + defPath(p.lang, p.r) + '). Check URL slugs in /admin/.');
  written.set(f, defPath(p.lang, p.r));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, p.html);
}
// assets
const assetDir = PREVIEW ? OUT : path.join(OUT, 'assets');
fs.mkdirSync(assetDir, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'assets/site.css'), path.join(assetDir, 'site.css'));
fs.copyFileSync(path.join(ROOT, 'assets/site.js'), path.join(assetDir, 'site.js'));
for (const f of ['favicon.svg', 'og.jpg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(assetDir, f));
fs.writeFileSync(path.join(assetDir, 'site.webmanifest'), JSON.stringify({ name: cfg.brand.en + ' – Tamil Calendar', short_name: cfg.brand.en, lang: 'en', start_url: BASE + '/', display: 'standalone', background_color: '#FFFDF5', theme_color: '#FFC21A', icons: [{ src: BASE + '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: BASE + '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2) + '\n');
fs.copyFileSync(path.join(__dirname, 'shared.js'), path.join(assetDir, 'shared.js'));
for (const lang of LANGS) {
  const Lx = L[lang];
  const labels = {}; for (const k of ['tithi', 'pirai', 'notMuhurtham', 'noHoliday', 'nalla', 'gowri', 'dayLbl', 'goodTimes', 'rahu', 'yama', 'kuligai', 'avoid', 'caution', 'moreInfo', 'details', 'tamilDate', 'nak', 'sunrise', 'sunset', 'chandrashtamam', 'soolam', 'pariharam', 'muhurtham', 'no', 'holiday', 'festival', 'viratham', 'none', 'noRows', 'date', 'occasion', 'isToday', 'dayTo', 'daysTo']) labels[k] = Lx[k];
  fs.writeFileSync(path.join(assetDir, 'data-' + lang + '.js'), 'window.NZ_L=' + JSON.stringify(labels) + ';\nwindow.NZ_DATA=' + JSON.stringify(RECS[lang]) + ';\n');
}
if (!PREVIEW) {
  const urls = pages.filter((p) => !(p.r.p === 'page' && p.r.s === '404'));
  const seen = new Set();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  for (const p of urls) {
    const loc = abs(p.lang, p.r); if (seen.has(loc)) continue; seen.add(loc);
    const ov = SEO[defPath(p.lang, p.r)];
    if (ov && ov.canonical && ov.canonical !== loc) continue;   // page points its canonical elsewhere: keep it out of the sitemap
    xml += '<url><loc>' + loc + '</loc><lastmod>' + F.istKey(new Date()) + '</lastmod><xhtml:link rel="alternate" hreflang="en" href="' + abs('en', p.r) + '"/><xhtml:link rel="alternate" hreflang="ta" href="' + abs('ta', p.r) + '"/></url>\n';
  }
  xml += '</urlset>\n';
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), DEV ? 'User-agent: *\nDisallow: /\n' : robotsProd());
  if (DEV) fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  // Cloudflare Pages: cache + security headers, and old URL redirects
  fs.writeFileSync(path.join(OUT, '_headers'), [
    '/*', '  X-Content-Type-Options: nosniff', '  Referrer-Policy: strict-origin-when-cross-origin', '  X-Frame-Options: SAMEORIGIN', '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
    '', '/assets/*', '  Cache-Control: public, max-age=86400, stale-while-revalidate=604800',
    '', '/admin/*', '  X-Robots-Tag: noindex, nofollow', '  Cache-Control: no-store', ''].join('\n'));
  fs.writeFileSync(path.join(OUT, '_redirects'), [
    BASE + '/amavasya/ ' + BASE + '/amavasai/ 301', BASE + '/tamil/amavasya/ ' + BASE + '/tamil/amavasai/ 301',
    BASE + '/2027/amavasya/ ' + BASE + '/2027/amavasai/ 301', BASE + '/tamil/2027/amavasya/ ' + BASE + '/tamil/2027/amavasai/ 301']
    .concat(SLUG_REDIRECTS.map(([a, b]) => BASE + a + ' ' + BASE + b + ' 301')).concat(['']).join('\n'));
}
// SEO admin panel (static UI + page index; the save API lives in functions/admin/api/)
if (ADMIN) {
  const adminOut = path.join(OUT, 'admin');
  fs.mkdirSync(adminOut, { recursive: true });
  for (const f of ['index.html', 'admin.css', 'admin.js']) fs.copyFileSync(path.join(ROOT, 'admin', f), path.join(adminOut, f));
  fs.writeFileSync(path.join(adminOut, 'pages.json'), JSON.stringify({ domain: cfg.domain, built: new Date().toISOString(), pages: ADMIN_INDEX }));
}
console.log('Built ' + pages.length + ' pages for ' + TARGET + ' (static today = ' + BUILD_KEY + ') into ' + path.relative(ROOT, OUT));
