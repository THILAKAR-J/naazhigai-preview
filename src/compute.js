'use strict';
// Computes a full year of daily panchangam for one location.
const { makeEngine } = require('./engine');

function computeYear(cfg) {
  const E = makeEngine(cfg.location);
  const A = E.A;
  const Y = cfg.year;
  const pad = (n) => String(n).padStart(2, '0');

  // Day keys: Dec 25 of previous year to Jan 7 of next year (margins for boundary rules)
  const keys = [];
  {
    let t = Date.parse((Y - 1) + '-12-20T00:00:00Z');
    const end = Date.parse((Y + 1) + '-01-25T00:00:00Z');
    while (t <= end) { keys.push(new Date(t).toISOString().slice(0, 10)); t += 86400000; }
  }

  // Sun & moon events per day
  const ev = {};
  for (const k of keys) {
    const m0 = E.istMidnight(k);
    const sunrise = E.riseSet(A.Body.Sun, +1, m0);
    const sunset = E.riseSet(A.Body.Sun, -1, m0);
    let moonrise = E.riseSet(A.Body.Moon, +1, m0, 1.0);
    if (moonrise && E.istKey(moonrise) !== k) moonrise = null; // no moonrise on this civil day
    let moonset = E.riseSet(A.Body.Moon, -1, m0, 1.0);
    if (moonset && E.istKey(moonset) !== k) moonset = null;
    ev[k] = { sunrise, sunset, moonrise, moonset };
  }
  for (let i = 0; i < keys.length - 1; i++) ev[keys[i]].nextSunrise = ev[keys[i + 1]].sunrise;

  const tStart = E.istMidnight(keys[0]);
  const tEnd = E.istMidnight(keys[keys.length - 1]);
  const tithiTL = E.timeline(E.tithiIdx, tStart, tEnd, 60);
  const nakTL = E.timeline(E.nakIdx, tStart, tEnd, 60);
  const moonRasiTL = E.timeline(E.moonRasiIdx, tStart, tEnd, 60);
  const sunRasiTL = E.timeline(E.sunRasiIdx, new Date(tStart.getTime() - 40 * 86400000), tEnd, 360);

  // Tamil months: a month starts on the civil day of sankranti if it happens before that day's sunset,
  // otherwise on the next day. (Overrides from published Tamil calendars can be applied via cfg.)
  const monthStarts = []; // {key, rasi, sankranti}
  for (let i = 1; i < sunRasiTL.length; i++) {
    const s = sunRasiTL[i].start;
    const k = E.istKey(s);
    let startKey = k;
    const ss = ev[k] ? ev[k].sunset : E.riseSet(A.Body.Sun, -1, E.istMidnight(k));
    if (s > ss) startKey = new Date(Date.parse(k + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
    const ovr = cfg.monthStartOverrides && cfg.monthStartOverrides[sunRasiTL[i].idx + ':' + startKey.slice(0, 4)];
    monthStarts.push({ key: ovr || startKey, computedKey: startKey, rasi: sunRasiTL[i].idx, sankranti: s });
  }

  const days = [];
  for (const k of keys) {
    const e = ev[k];
    if (!e.nextSunrise) continue;
    const tS = E.at(tithiTL, e.sunrise);
    const nS = E.at(nakTL, e.sunrise);
    const rS = E.at(moonRasiTL, e.sunrise);
    // all tithis / nakshatras touching the period sunrise..nextSunrise
    const tithis = tithiTL.filter((s) => s.end > e.sunrise && s.start < e.nextSunrise);
    const naks = nakTL.filter((s) => s.end > e.sunrise && s.start < e.nextSunrise);
    const rasis = moonRasiTL.filter((s) => s.end > e.sunrise && s.start < e.nextSunrise);
    // Tamil month & day
    let ms = null;
    for (const m of monthStarts) if (m.key <= k) ms = m;
    const tamilDay = ms ? Math.round((Date.parse(k) - Date.parse(ms.key)) / 86400000) + 1 : null;
    const dow = new Date(k + 'T00:00:00Z').getUTCDay();
    days.push({
      key: k, dow,
      sunrise: e.sunrise, sunset: e.sunset, nextSunrise: e.nextSunrise,
      moonrise: e.moonrise, moonset: e.moonset,
      tithi: tS.idx, tithiEnd: tS.end, tithis,
      nak: nS.idx, nakEnd: nS.end, naks,
      moonRasi: rS.idx, moonRasiEnd: rS.end, rasis,
      tamilMonth: ms ? ms.rasi : null, tamilDay,
    });
  }
  return { E, days, tithiTL, nakTL, moonRasiTL, sunRasiTL, monthStarts, ev, keys };
}

module.exports = { computeYear };
