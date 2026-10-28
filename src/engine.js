'use strict';
// Panchangam engine for a fixed location (default Chennai), using astronomy-engine.
// All instants are JS Date (UTC). Local civil time is IST (UTC+5:30).
const A = require('astronomy-engine');

const IST_MIN = 330;
const DEG = 180 / Math.PI;

function makeEngine(opts) {
  const lat = opts.lat, lon = opts.lon, elev = opts.elev || 0;
  const obs = new A.Observer(lat, lon, elev);

  // ---------- helpers ----------
  const norm = (x) => ((x % 360) + 360) % 360;
  const julianCenturies = (d) => (d.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  // Lahiri (Chitrapaksha) ayanamsa: J2000 value + IAU 2006 general precession in longitude.
  function ayanamsa(d) {
    const T = julianCenturies(d);
    const pA = 5028.796195 * T + 1.1054348 * T * T; // arcsec
    return 23.857092 + pA / 3600;
  }
  const sunTrop = (d) => A.SunPosition(A.MakeTime(d)).elon;
  const moonTrop = (d) => A.EclipticGeoMoon(A.MakeTime(d)).lon;
  const elong = (d) => norm(moonTrop(d) - sunTrop(d));
  const sunSid = (d) => norm(sunTrop(d) - ayanamsa(d));
  const moonSid = (d) => norm(moonTrop(d) - ayanamsa(d));

  // local (IST) calendar date of an instant, as 'YYYY-MM-DD'
  function istKey(d) {
    const x = new Date(d.getTime() + IST_MIN * 60000);
    return x.toISOString().slice(0, 10);
  }
  // instant of local IST midnight starting a 'YYYY-MM-DD'
  function istMidnight(key) {
    return new Date(Date.parse(key + 'T00:00:00Z') - IST_MIN * 60000);
  }
  function istAt(key, h, m) {
    return new Date(istMidnight(key).getTime() + (h * 60 + (m || 0)) * 60000);
  }

  function riseSet(body, dir, from, days) {
    const t = A.SearchRiseSet(body, obs, dir, A.MakeTime(from), days || 1.2);
    return t ? t.date : null;
  }

  // Generic timeline of a discrete index f(d) (integer) between start and end, found by stepping
  // and bisecting to ~20 s. Returns [{start, end, idx}].
  function timeline(f, start, end, stepMin) {
    const out = [];
    let t = start, cur = f(t), segStart = start;
    const step = stepMin * 60000;
    while (t < end) {
      const t2 = new Date(Math.min(t.getTime() + step, end.getTime()));
      const v2 = f(t2);
      if (v2 !== cur) {
        let a = t, b = t2;
        while (b - a > 20000) {
          const mid = new Date((a.getTime() + b.getTime()) / 2);
          if (f(mid) === cur) a = mid; else b = mid;
        }
        out.push({ start: segStart, end: b, idx: cur });
        segStart = b;
        cur = f(b);
        // if more than one change happened in the step, keep scanning from b
        t = b;
        continue;
      }
      t = t2;
    }
    out.push({ start: segStart, end: end, idx: cur });
    return out;
  }

  const tithiIdx = (d) => Math.floor(elong(d) / 12);           // 0..29
  const nakIdx = (d) => Math.floor(moonSid(d) / (360 / 27));    // 0..26
  const moonRasiIdx = (d) => Math.floor(moonSid(d) / 30);        // 0..11
  const sunRasiIdx = (d) => Math.floor(sunSid(d) / 30);          // 0..11

  function at(tl, d) {
    // binary search segment containing d
    let lo = 0, hi = tl.length - 1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (d < tl[m].start) hi = m - 1;
      else if (d >= tl[m].end) lo = m + 1;
      else return tl[m];
    }
    return null;
  }

  function overlap(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  }

  return {
    obs, ayanamsa, sunTrop, moonTrop, elong, sunSid, moonSid,
    istKey, istMidnight, istAt, riseSet, timeline, at, overlap,
    tithiIdx, nakIdx, moonRasiIdx, sunRasiIdx, IST_MIN, A
  };
}

module.exports = { makeEngine };
