// SEO audit of a production build: node tools/seo-audit.js dist/prod
const fs = require('fs'), path = require('path');
const cfg = require('../site.config');
const dir = path.resolve(process.argv[2] || 'dist/prod');
const D = cfg.domain;
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(dir);
const html = files.filter((f) => f.endsWith('.html') && !path.relative(dir, f).startsWith('admin' + path.sep));   // /admin/ is private, noindex on purpose
const urlOf = (f) => { const r = '/' + path.relative(dir, f).split(path.sep).join('/'); return r.endsWith('/index.html') ? r.slice(0, -10) : r; };
const fileOfUrl = (u) => { if (!u.startsWith(D + '/')) return null; let p = u.slice(D.length); if (p.endsWith('/')) p += 'index.html'; const f = path.join(dir, p); return fs.existsSync(f) ? f : null; };
const err = []; const warn = []; const stat = { pages: 0, indexable: 0, ta: 0, en: 0 };
const titles = new Map(), descs = new Map();
const indexable = new Set();
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8'); const u = urlOf(f); stat.pages++;
  const is404 = /404\.html$/.test(f);
  const get = (re) => (s.match(re) || [])[1];
  const lang = get(/<html lang="([a-z]+)"/); if (!lang) err.push('no lang ' + u); else stat[lang]++;
  if ((u.startsWith('/tamil/') || u === '/tamil') && lang !== 'ta') err.push('tamil page not lang=ta ' + u);
  const title = get(/<title>([^<]*)<\/title>/); const desc = get(/<meta name="description" content="([^"]*)"/);
  if (!title) err.push('no title ' + u); if (!desc) err.push('no description ' + u);
  const h1s = (s.match(/<h1[ >]/g) || []).length; if (h1s !== 1) err.push(h1s + ' h1 ' + u);
  const noindex = /<meta name="robots" content="noindex/.test(s);
  const canon = get(/<link rel="canonical" href="([^"]+)"/);
  if (is404) { if (!noindex) err.push('404 indexable ' + u); if (canon) err.push('404 has canonical ' + u); continue; }
  if (noindex) { err.push('noindex on live page ' + u); continue; }
  stat.indexable++; indexable.add(D + u);
  if (canon !== D + u) err.push('canonical mismatch ' + u + ' -> ' + canon);
  const og = get(/<meta property="og:url" content="([^"]+)"/); if (og !== canon) err.push('og:url mismatch ' + u);
  const ogi = get(/<meta property="og:image" content="([^"]+)"/); if (!ogi || !fileOfUrl(ogi)) err.push('og:image missing ' + u);
  const alts = [...s.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  const hl = Object.fromEntries(alts.map((m) => [m[1], m[2]]));
  for (const k of ['en', 'ta', 'x-default']) { if (!hl[k]) err.push('missing hreflang ' + k + ' ' + u); else if (!fileOfUrl(hl[k])) err.push('hreflang ' + k + ' broken ' + u + ' -> ' + hl[k]); }
  if (hl[lang] && hl[lang] !== canon) err.push('hreflang self mismatch ' + u);
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { err.push('bad JSON-LD ' + u); continue; }
    for (const o of [].concat(j)) if (o['@type'] === 'BreadcrumbList') for (const it of o.itemListElement) if (!fileOfUrl(it.item)) err.push('breadcrumb url missing ' + u + ' -> ' + it.item);
  }
  if (titles.has(title)) err.push('duplicate title ' + u + ' = ' + titles.get(title)); else titles.set(title, u);
  if (descs.has(desc)) err.push('duplicate description ' + u); else descs.set(desc, u);
  if (title.length > 70) warn.push('title ' + title.length + ' chars ' + u);
  if (desc.length > 170 || desc.length < 70) warn.push('description ' + desc.length + ' chars ' + u);
  if (/naazhigai|நாழிகை|example\.com|placeholder|localhost|github\.io|lorem|pozhudhu\.in\b/i.test(s)) err.push('leftover text ' + u + ' ' + s.match(/naazhigai|நாழிகை|example\.com|placeholder|localhost|github\.io|lorem|pozhudhu\.in\b/i)[0]);
}
// sitemap
const sm = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const smSet = new Set(locs);
if (smSet.size !== locs.length) err.push('duplicate sitemap entries');
for (const l of locs) { if (!fileOfUrl(l)) err.push('sitemap url missing file ' + l); if (!indexable.has(l)) err.push('sitemap has non-indexable ' + l); }
for (const u of indexable) if (!smSet.has(u)) err.push('page not in sitemap ' + u);
for (const m of sm.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)) if (!fileOfUrl(m[1])) err.push('sitemap alternate missing ' + m[1]);
if (Buffer.byteLength(sm) > 50 * 1024 * 1024 || locs.length > 50000) err.push('sitemap too big');
const robots = fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: ' + D + '/sitemap.xml') || /Disallow: \/\s*$/m.test(robots)) err.push('robots.txt wrong');
for (const f of ['_headers', '_redirects', '404.html', 'assets/og.jpg', 'assets/site.webmanifest']) if (!fs.existsSync(path.join(dir, f))) err.push('missing ' + f);
console.log(JSON.stringify(stat), '| sitemap urls', locs.length, '| errors', err.length, '| warnings', warn.length);
err.slice(0, 40).forEach((e) => console.log('ERROR', e));
const wc = {}; warn.forEach((w) => { const k = w.split(' ')[0]; wc[k] = (wc[k] || 0) + 1; });
console.log('warnings by type', JSON.stringify(wc)); warn.slice(0, 8).forEach((w) => console.log('  warn', w));
process.exit(err.length ? 1 : 0);
