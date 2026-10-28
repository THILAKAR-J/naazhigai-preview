'use strict';
const N = require('./names');
const IST = 330 * 60000;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));
const istKey = (d) => new Date(d.getTime() + IST).toISOString().slice(0, 10);

function fmtT(d) {
  const x = new Date(d.getTime() + IST);
  let h = x.getUTCHours(); const m = x.getUTCMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
}
// "7:30 AM – 9:00 AM", with "(next day)" when the end (or start) falls after the base civil day
function range(a, b, baseKey, L) {
  const s = fmtT(a) + (istKey(a) > baseKey ? ' ' + L.nextDay : '');
  const e = fmtT(b) + (istKey(b) > baseKey ? ' ' + L.nextDay : '');
  return s + ' – ' + e;
}
function untilText(segs, nameOf, end, baseKey, L) {
  const parts = [];
  segs.forEach((s, i) => {
    const nm = nameOf(s.idx);
    if (s.end < end && i < segs.length - 1) parts.push(nm + ' ' + L.until + ' ' + fmtT(s.end) + (istKey(s.end) > baseKey ? ' ' + L.nextDay : ''));
    else parts.push(nm);
  });
  return parts.join(', ' + L.then + ' ');
}
function parts(key) { const [y, m, d] = key.split('-').map(Number); return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; }
function fmtD(key, lang, style) {
  const p = parts(key);
  const mon = N.GMONTH[p.m - 1][lang];
  const wd = N.WEEKDAY[p.dow][lang];
  if (style === 'short') return lang === 'en' ? p.d + ' ' + N.GMONTH_SHORT[p.m - 1] : p.d + ' ' + mon;
  if (style === 'med') return lang === 'en' ? p.d + ' ' + N.GMONTH_SHORT[p.m - 1] + ' ' + p.y : p.d + ' ' + mon + ' ' + p.y;
  if (style === 'wd') return lang === 'en' ? wd.slice(0, 3) + ', ' + p.d + ' ' + N.GMONTH_SHORT[p.m - 1] + ' ' + p.y : wd + ', ' + p.d + ' ' + mon + ' ' + p.y;
  if (style === 'wdl') return wd + ', ' + p.d + ' ' + mon + ' ' + p.y;
  return p.d + ' ' + mon + ' ' + p.y;
}
const slugDay = (key) => { const p = parts(key); return String(p.d).padStart(2, '0') + '-' + N.GMONTH[p.m - 1].en.toLowerCase() + '-' + p.y; };
const slugMonth = (y, m) => N.GMONTH[m - 1].en.toLowerCase() + '-' + y;
function tamilDate(d, lang) {
  const mon = N.TMONTH[d.tamilMonth][lang];
  const wd = lang === 'en' ? N.WEEKDAY_TAMIL_EN[d.dow] : N.WEEKDAY[d.dow].ta;
  return mon + ' ' + d.tamilDay + ', ' + wd;
}
// nakshatra padas lying in a rasi, e.g. "Chithirai 3–4, Swathi, Visakam 1–3"
function rasiStars(r, lang) {
  const by = {};
  for (let p = r * 9; p < r * 9 + 9; p++) { const n = Math.floor(p / 4); (by[n] = by[n] || []).push((p % 4) + 1); }
  return Object.keys(by).map(Number).map((n) => {
    const ps = by[n];
    const nm = N.NAK[n][lang];
    return ps.length === 4 ? nm : nm + ' ' + (ps.length === 1 ? ps[0] : ps[0] + '–' + ps[ps.length - 1]);
  }).join(', ');
}

module.exports = { esc, fill, istKey, fmtT, range, untilText, parts, fmtD, slugDay, slugMonth, tamilDate, rasiStars };
