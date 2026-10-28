'use strict';
// Builds the full site data model for a year: daily panchangam, viratham days, festivals, retrograde.
const { computeYear } = require('./compute');
const N = require('./names');

const MIN = 60000, HOUR = 3600000;

function buildModel(cfg) {
  const R = computeYear(cfg);
  const E = R.E, A = E.A;
  const Y = cfg.year;
  const byKey = {};
  for (const d of R.days) byKey[d.key] = d;
  const inYear = (k) => k.slice(0, 4) === String(Y);
  const addDays = (k, n) => new Date(Date.parse(k + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

  // ---------- per-day derived fields ----------
  for (const d of R.days) {
    d.pirai = d.tithi < 15 ? 'V' : 'T';
    d.tamilYear = (d.key >= cfg.tamilYearStart) ? cfg.tamilYearNew : cfg.tamilYearOld;
    // traditional fixed slots: values are clock hours (e.g. 15 = 3:00 PM), each 1.5 h long
    const fixed = (h) => { const s = new Date(E.istAt(d.key, 0, 0).getTime() + h * HOUR); return { start: s, end: new Date(s.getTime() + 1.5 * HOUR) }; };
    d.rahu = fixed(N.RAHU[d.dow]);
    d.yama = fixed(N.YAMA[d.dow]);
    d.kuligai = fixed(N.KULIGAI[d.dow]);
    // Gowri panchangam from actual sunrise / sunset
    const dayLen = (d.sunset - d.sunrise) / 8, nightLen = (d.nextSunrise - d.sunset) / 8;
    d.gowriDay = N.GOWRI_DAY[d.dow].split('').map((c, i) => ({ g: c, good: !!N.GOWRI_GOOD[c], start: new Date(d.sunrise.getTime() + i * dayLen), end: new Date(d.sunrise.getTime() + (i + 1) * dayLen) }));
    d.gowriNight = N.GOWRI_NIGHT[d.dow].split('').map((c, i) => ({ g: c, good: !!N.GOWRI_GOOD[c], start: new Date(d.sunset.getTime() + i * nightLen), end: new Date(d.sunset.getTime() + (i + 1) * nightLen) }));
    // Nalla Neram: good Gowri windows from sunrise to 10 PM, with Rahu Kalam and Yamagandam removed
    const limit = E.istAt(d.key, 22, 0);
    let wins = [];
    for (const s of d.gowriDay.concat(d.gowriNight)) {
      if (!s.good) continue;
      const a = s.start, b = s.end < limit ? s.end : limit;
      if (b <= a) continue;
      wins.push([a.getTime(), b.getTime()]);
    }
    const cut = (ws, c1, c2) => {
      const out = [];
      for (const [a, b] of ws) {
        if (b <= c1 || a >= c2) { out.push([a, b]); continue; }
        if (a < c1) out.push([a, c1]);
        if (b > c2) out.push([c2, b]);
      }
      return out;
    };
    wins = cut(wins, d.rahu.start.getTime(), d.rahu.end.getTime());
    wins = cut(wins, d.yama.start.getTime(), d.yama.end.getTime());
    wins.sort((x, y) => x[0] - y[0]);
    const merged = [];
    for (const w of wins) {
      if (merged.length && w[0] - merged[merged.length - 1][1] < MIN) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], w[1]);
      else merged.push(w.slice());
    }
    d.nalla = merged.filter((w) => w[1] - w[0] >= 20 * MIN).map((w) => ({ start: new Date(w[0]), end: new Date(w[1]) }));
    d.chandrashtamam = (d.moonRasi + 5) % 12;
    d.soolam = N.SOOLAM[d.dow];
    d.festivals = [];
    d.virathams = [];
    d.muhurtham = null;
  }

  // ---------- helpers over timelines ----------
  const segsOf = (tl, idx) => tl.filter((s) => s.idx === idx && s.end > E.istMidnight(addDays(Y + '-01-01', -3)) && s.start < E.istMidnight(addDays((Y + 1) + '-01-01', 3)));
  const dayOfInstant = (t) => { // civil day whose sunrise..nextSunrise contains t
    const k = E.istKey(t);
    const d = byKey[k];
    if (d && t < d.sunrise) return byKey[addDays(k, -1)];
    return d;
  };
  // sunrise rule: every day whose sunrise falls inside the segment; if none (kshaya), the day it begins
  function sunriseDays(seg) {
    const out = [];
    for (let k = E.istKey(seg.start); k <= E.istKey(seg.end); k = addDays(k, 1)) {
      const d = byKey[k];
      if (d && d.sunrise >= seg.start && d.sunrise < seg.end) out.push(d);
    }
    if (!out.length) { const d = dayOfInstant(seg.start); if (d) out.push(d); }
    return out;
  }
  function bestOverlapDay(seg, windowFn) { // day whose window overlaps the segment most; earliest on ties
    let best = null, bestOv = 0;
    for (let k = addDays(E.istKey(seg.start), -1); k <= addDays(E.istKey(seg.end), 1); k = addDays(k, 1)) {
      const d = byKey[k];
      if (!d || !d.nextSunrise) continue;
      const [w1, w2] = windowFn(d);
      const ov = E.overlap(w1.getTime(), w2.getTime(), seg.start.getTime(), seg.end.getTime());
      if (ov > bestOv + MIN) { best = d; bestOv = ov; }
    }
    return best;
  }
  function addV(d, type, extra) {
    if (!d || !inYear(d.key)) return;
    if (d.virathams.some((v) => v.type === type)) return;
    d.virathams.push(Object.assign({ type }, extra || {}));
  }

  // ---------- viratham days ----------
  const tithiSegs = (i) => segsOf(R.tithiTL, i);
  const nakSegs = (i) => segsOf(R.nakTL, i);
  const lists = { pradosham: [], sankatahara: [], sashti: [], karthigai: [], chaturthi: [], shivaratri: [], thiruvonam: [], chandraDarshan: [], ekadasi: [] };

  // Pradosham: Trayodasi prevailing over pradosha kalam (1.5 h before to 1.5 h after sunset)
  for (const i of [12, 27]) for (const seg of tithiSegs(i)) {
    const d = bestOverlapDay(seg, (x) => [new Date(x.sunset.getTime() - 1.5 * HOUR), new Date(x.sunset.getTime() + 1.5 * HOUR)]);
    if (d && inYear(d.key)) {
      const label = d.dow === 1 ? 'soma' : d.dow === 6 ? 'sani' : null;
      const pk = { start: new Date(d.sunset.getTime() - 1.5 * HOUR), end: new Date(d.sunset.getTime() + 1.5 * HOUR) };
      lists.pradosham.push({ d, pirai: i < 15 ? 'V' : 'T', label, window: pk, seg });
      addV(d, 'pradosham', { label });
    }
  }
  // Sankatahara Chaturthi: Krishna Chaturthi prevailing at moonrise (first such day)
  for (const seg of tithiSegs(18)) {
    let pick = null;
    for (let k = addDays(E.istKey(seg.start), -1); k <= addDays(E.istKey(seg.end), 1); k = addDays(k, 1)) {
      const d = byKey[k];
      if (d && d.moonrise && d.moonrise >= seg.start && d.moonrise < seg.end) { pick = d; break; }
    }
    if (!pick) pick = bestOverlapDay(seg, (x) => [x.sunset, x.nextSunrise]);
    if (pick && inYear(pick.key)) {
      const label = pick.dow === 2 ? 'angaraki' : null;
      lists.sankatahara.push({ d: pick, label, moonrise: pick.moonrise, seg });
      addV(pick, 'sankatahara', { label });
    }
  }
  // Sashti (Valarpirai Shashti), sunrise rule
  for (const seg of tithiSegs(5)) {
    const ds = sunriseDays(seg);
    const d = ds[0];
    if (d && inYear(d.key)) { lists.sashti.push({ d, seg }); addV(d, 'sashti'); }
  }
  // Chaturthi viratham (Valarpirai Chathurthi) prevailing at madhyahnam (middle fifth of daytime)
  for (const seg of tithiSegs(3)) {
    const d = bestOverlapDay(seg, (x) => { const L = x.sunset - x.sunrise; return [new Date(x.sunrise.getTime() + L * 0.4), new Date(x.sunrise.getTime() + L * 0.6)]; });
    if (d && inYear(d.key)) { lists.chaturthi.push({ d, seg }); addV(d, 'chaturthi'); }
  }
  // Masa Shivaratri: Krishna Chaturdashi prevailing at nishita (midnight between sunset and next sunrise)
  for (const seg of tithiSegs(28)) {
    let pick = null;
    for (let k = addDays(E.istKey(seg.start), -1); k <= addDays(E.istKey(seg.end), 1); k = addDays(k, 1)) {
      const d = byKey[k];
      if (!d || !d.nextSunrise) continue;
      const mid = new Date((d.sunset.getTime() + d.nextSunrise.getTime()) / 2);
      if (mid >= seg.start && mid < seg.end) { pick = d; break; }
    }
    if (!pick) pick = bestOverlapDay(seg, (x) => [x.sunset, x.nextSunrise]);
    if (pick && inYear(pick.key)) {
      const nishita = new Date((pick.sunset.getTime() + pick.nextSunrise.getTime()) / 2);
      const maha = pick.tamilMonth === 10; // Masi
      lists.shivaratri.push({ d: pick, maha, nishita, seg });
      addV(pick, 'shivaratri', { label: maha ? 'maha' : null });
    }
  }
  // Nakshatra days, sunrise rule (kshaya: the day it begins)
  for (const seg of nakSegs(2)) { const d = sunriseDays(seg)[0]; if (d && inYear(d.key)) { lists.karthigai.push({ d, seg }); addV(d, 'karthigai', { label: d.tamilMonth === 7 ? 'deepam' : null }); } }
  for (const seg of nakSegs(21)) { const d = sunriseDays(seg)[0]; if (d && inYear(d.key)) { lists.thiruvonam.push({ d, seg }); addV(d, 'thiruvonam'); } }
  // Ekadasi (both pakshas), sunrise rule
  for (const i of [10, 25]) for (const seg of tithiSegs(i)) {
    const d = sunriseDays(seg)[0];
    if (d && inYear(d.key)) { lists.ekadasi.push({ d, pirai: i < 15 ? 'V' : 'T', seg, vaikunta: i === 10 && d.tamilMonth === 8 }); addV(d, 'ekadasi', { label: (i === 10 && d.tamilMonth === 8) ? 'vaikunta' : null }); }
  }
  // Chandra Darshan: first evening after new moon when the crescent is likely visible:
  // moon age at sunset >= 18 h and moon sets at least 40 minutes after the sun.
  {
    let t = A.MakeTime(new Date(Date.UTC(Y - 1, 11, 1)));
    for (let n = 0; n < 15; n++) {
      const nm = A.SearchMoonPhase(0, t, 40);
      if (!nm) break;
      const nmD = nm.date;
      let k = E.istKey(nmD);
      for (let j = 0; j < 4; j++, k = addDays(k, 1)) {
        const d = byKey[k];
        if (!d) break;
        if (d.sunset <= nmD) continue;
        const age = (d.sunset - nmD) / HOUR;
        const mset = E.riseSet(A.Body.Moon, -1, d.sunset, 1);
        const lag = mset ? (mset - d.sunset) / MIN : 0;
        if (age >= 18 && lag >= 40) {
          if (inYear(d.key)) { lists.chandraDarshan.push({ d, moonset: mset, newMoon: nmD }); addV(d, 'chandra'); }
          break;
        }
      }
      t = A.MakeTime(new Date(nmD.getTime() + 5 * 86400000));
    }
  }
  for (const k of Object.keys(lists)) lists[k].sort((a, b) => a.d.key < b.d.key ? -1 : 1);

  // ---------- tithi day lists (sunrise rule, like printed Tamil calendars) ----------
  const tithiDays = {};
  for (const d of R.days) {
    if (!inYear(d.key)) continue;
    (tithiDays[d.tithi] = tithiDays[d.tithi] || []).push(d);
  }
  // Pournami / Amavasai with start-end of the tithi itself
  const moonDays = { pournami: [], amavasai: [] };
  for (const [name, i] of [['pournami', 14], ['amavasai', 29]]) {
    for (const seg of tithiSegs(i)) {
      const ds = sunriseDays(seg).filter((x) => inYear(x.key));
      if (!ds.length) continue;
      moonDays[name].push({ days: ds, seg });
    }
  }

  // ---------- muhurtham + festivals + holidays ----------
  for (const m of cfg.muhurtham) { const d = byKey[m.date]; if (d) d.muhurtham = m.type; }
  for (const f of cfg.festivals) { const d = byKey[f.date]; if (d) d.festivals.push(f); }

  // ---------- Tamil months table ----------
  const months = [];
  const ms = R.monthStarts.filter((m) => m.key <= (Y + 1) + '-01-15');
  for (let i = 0; i < ms.length - 1; i++) {
    const end = addDays(ms[i + 1].key, -1);
    if (end < Y + '-01-01' || ms[i].key > Y + '-12-31') continue;
    months.push({ rasi: ms[i].rasi, start: ms[i].key, end, days: Math.round((Date.parse(end) - Date.parse(ms[i].key)) / 86400000) + 1, sankranti: ms[i].sankranti, computedKey: ms[i].computedKey });
  }

  // ---------- retrograde (vakra) periods ----------
  const retro = [];
  const planets = [['Mercury', 'புதன்', A.Body.Mercury], ['Venus', 'சுக்கிரன்', A.Body.Venus], ['Mars', 'செவ்வாய்', A.Body.Mars], ['Jupiter', 'குரு (வியாழன்)', A.Body.Jupiter], ['Saturn', 'சனி', A.Body.Saturn], ['Uranus', 'யுரேனஸ்', A.Body.Uranus], ['Neptune', 'நெப்டியூன்', A.Body.Neptune], ['Pluto', 'புளூட்டோ', A.Body.Pluto]];
  for (const [en, ta, body] of planets) {
    const lonAt = (t) => A.Ecliptic(A.GeoVector(body, A.MakeTime(t), true)).elon;
    const rate = (t) => { const a = lonAt(new Date(t.getTime() - 6 * HOUR)), b = lonAt(new Date(t.getTime() + 6 * HOUR)); let x = b - a; if (x > 180) x -= 360; if (x < -180) x += 360; return x; };
    let t = new Date(Date.UTC(Y - 1, 6, 1)), prev = rate(t) < 0;
    let open = null;
    const end = new Date(Date.UTC(Y + 1, 6, 1));
    while (t < end) {
      const t2 = new Date(t.getTime() + 86400000);
      const r2 = rate(t2) < 0;
      if (r2 !== prev) {
        let a = t, b = t2;
        while (b - a > 10 * MIN) { const m = new Date((a.getTime() + b.getTime()) / 2); if ((rate(m) < 0) === prev) a = m; else b = m; }
        if (r2) open = b; else if (open) { retro.push({ en, ta, start: open, end: b }); open = null; } else retro.push({ en, ta, start: null, end: b });
        prev = r2;
      }
      t = t2;
    }
    if (open) retro.push({ en, ta, start: open, end: null });
  }
  const yS = new Date(Date.UTC(Y, 0, 1)), yE = new Date(Date.UTC(Y + 1, 0, 1));
  const retroYear = retro.filter((r) => (!r.end || r.end > yS) && (!r.start || r.start < yE));

  const yearDays = R.days.filter((d) => inYear(d.key));
  return { E, R, byKey, days: yearDays, allDays: R.days, lists, tithiDays, moonDays, months, retro: retroYear, addDays };
}

module.exports = { buildModel };
