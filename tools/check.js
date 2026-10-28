// QA: broken internal links, leaked template values, duplicate titles/descriptions, missing h1/meta.
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2]); const flat = process.argv[3] === 'flat';
const files = []; (function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(dir);
const html = files.filter(f => f.endsWith('.html'));
const exists = (u, from) => {
  if (/^(https?:|mailto:|#|data:)/.test(u)) return true;
  u = u.split('#')[0]; if (!u) return true;
  let p = u.startsWith('/') ? path.join(dir, u) : path.join(path.dirname(from), u);
  if (u.endsWith('/')) p = path.join(p, 'index.html');
  return fs.existsSync(p);
};
let broken = 0, leaks = 0; const titles = {}, descs = {}; const problems = [];
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) if (!exists(m[1], f)) { broken++; if (broken < 15) problems.push('BROKEN ' + path.relative(dir,f) + ' -> ' + m[1]); }
  const bad = s.match(/undefined|NaN|\[object|\{[a-z]\}|Invalid Date/g);
  if (bad) { leaks++; if (leaks < 15) problems.push('LEAK ' + path.relative(dir,f) + ' ' + [...new Set(bad)].join(',')); }
  const t = (s.match(/<title>([^<]*)<\/title>/)||[])[1]; const d = (s.match(/name="description" content="([^"]*)"/)||[])[1];
  if (!t || !d) problems.push('MISSING title/desc ' + f);
  if (!/<h1[ >]/.test(s)) problems.push('NO H1 ' + f);
  (titles[t] = titles[t] || []).push(f); (descs[d] = descs[d] || []).push(f);
  if (t && t.length > 75) problems.push('LONG TITLE (' + t.length + ') ' + path.relative(dir,f) + ': ' + t);
  if (d && d.length > 170) problems.push('LONG DESC (' + d.length + ') ' + path.relative(dir,f));
}
const dupT = Object.entries(titles).filter(([k,v]) => v.length > 1), dupD = Object.entries(descs).filter(([k,v]) => v.length > 1);
console.log('pages', html.length, '| broken links', broken, '| leaked values', leaks, '| duplicate titles', dupT.length, '| duplicate descriptions', dupD.length);
dupT.slice(0,5).forEach(([k,v]) => console.log('DUP TITLE', k, v.map(x=>path.relative(dir,x)).join(' ')));
const counts = {}; problems.forEach(p => { const k = p.split(' ')[0] + ' ' + p.split(' ')[1]; counts[p.split(' ')[0]] = (counts[p.split(' ')[0]]||0)+1; });
console.log('problem counts', JSON.stringify(counts));
problems.filter(p=>!p.startsWith('LONG')).slice(0, 30).forEach(p => console.log(p));
problems.filter(p=>p.startsWith('LONG TITLE')).slice(0, 12).forEach(p => console.log(p));
const sizes = html.map(f => [fs.statSync(f).size, path.relative(dir,f)]).sort((a,b)=>b[0]-a[0]);
console.log('largest pages:', sizes.slice(0,6).map(x => (x[0]/1024).toFixed(0)+'KB '+x[1]).join(' | '));
console.log('typical daily page:', (sizes.find(x=>x[1].includes('daily-calendar/2'))||[0])[0]/1024|0, 'KB');
