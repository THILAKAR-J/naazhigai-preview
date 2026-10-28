// Re-checks every festival that has a rule against the computed panchangam, and muhurtham pirai.
const cfg = require('../site.config'); const { buildModel } = require('../src/panchang'); const N = require('../src/names');
const MON = N.TMONTH.map((m) => m.en);
for (const y of [cfg.year].concat(cfg.extraYears || [])) {
  const fe = require('../data/festivals-' + y + '.json').items;
  const mu = require('../data/muhurtham-' + y + '.json').dates.map(([date, type]) => ({ date, type }));
  const M = buildModel(Object.assign({}, cfg, { year: y, muhurtham: mu, festivals: fe }));
  let ok = 0, n = 0;
  for (const it of fe) {
    if (!it.rule) continue; n++;
    const [rule, mon] = it.rule.split('@'); const mi = MON.indexOf(mon); let c = [];
    if (rule.startsWith('tday:')) { const [, m, dn] = rule.split(':'); c = M.days.filter((d) => MON[d.tamilMonth] === m && d.tamilDay === +dn); }
    else if (rule.startsWith('nak:')) c = M.days.filter((d) => d.nak === +rule.split(':')[1] && d.tamilMonth === mi);
    else if (rule.startsWith('tithi:')) c = M.days.filter((d) => d.tithi === +rule.split(':')[1] && d.tamilMonth === mi);
    else if (rule === 'shivaratri') c = M.lists.shivaratri.filter((x) => x.d.tamilMonth === mi).map((x) => x.d);
    else if (rule === 'chaturthi') c = M.lists.chaturthi.filter((x) => x.d.tamilMonth === mi).map((x) => x.d);
    else if (rule === 'karthigai') c = M.lists.karthigai.filter((x) => x.d.tamilMonth === mi).map((x) => x.d);
    const ks = c.map((d) => d.key);
    if (ks.includes(it.date)) ok++; else console.log('  !! ' + y + ' ' + it.en + ' listed ' + it.date + ' computed ' + ks.join(','));
  }
  const piraiOk = mu.filter((m) => (m.type === 'Subha Muhurtham') === (M.byKey[m.date].pirai === 'V')).length;
  console.log(y + ': festival rules ' + ok + '/' + n + ', muhurtham type vs pirai ' + piraiOk + '/' + mu.length + ', Tamil months ' + M.months.map((m) => N.TMONTH[m.rasi].en.slice(0, 4) + ' ' + m.start.slice(5)).join(' '));
}
