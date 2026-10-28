/* Shared renderers: used by the build (Node) for static HTML and by the browser to refresh
   "today" sections from the year data, so pages stay correct on any day without a rebuild. */
(function (root) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lines(arr, cls) { return (arr && arr.length ? arr : ['–']).map(function (x) { return '<div class="' + (cls || 'time') + '">' + esc(x) + '</div>'; }).join(''); }

  // r = day record (localized strings), L = labels
  function bento(r, L, opt) {
    opt = opt || {};
    var tags = '<span class="tag">' + esc(L.tithi) + ' · ' + esc(r.ti) + '</span><span class="tag">' + esc(r.pi) + '</span>' +
      '<span class="tag' + (r.mu ? ' g' : '') + '">' + esc(r.mu || L.notMuhurtham) + '</span>' +
      '<span class="tag' + (r.hol ? ' r' : '') + '">' + esc(r.hol ? r.holL : L.noHoliday) + '</span>' +
      (r.fe || []).concat(r.vi || []).map(function (x) { return '<span class="tag k">' + esc(x) + '</span>'; }).join('');
    var nav = opt.nav ? '<div class="pn">' + (r.pu ? '<a href="' + esc(r.pu) + '">‹ ' + esc(r.pl) + '</a>' : '<span></span>') + (r.nu ? '<a href="' + esc(r.nu) + '">' + esc(r.nl) + ' ›</a>' : '') + '</div>' : '';
    var open = opt.link ? '<p style="margin:14px 0 0;font-weight:700"><a href="' + esc(r.u) + '">' + esc(L.moreInfo) + ' →</a></p>' : '';
    return '<div class="bento">' +
      '<section class="box today" aria-label="' + esc(r.dl) + '">' +
        '<div class="lbl">' + esc(r.wd) + ' · ' + esc(r.mo) + '</div>' +
        '<div class="big"><time datetime="' + esc(r.k) + '">' + esc(r.dn) + '</time></div>' +
        '<div class="tdate" lang="ta">' + esc(r.tdt) + '</div>' +
        '<div class="tsub">' + esc(r.tdy) + '</div>' +
        '<div class="tags">' + tags + '</div>' + nav + open +
      '</section>' +
      '<div class="bento-r">' +
        '<section class="box good" aria-label="' + esc(L.goodTimes) + '">' +
          '<div class="lbl">' + esc(L.nalla) + '</div>' +
          '<div class="good-grid"><div>' + lines(r.nla) + '</div>' +
          '<div><div class="lbl">' + esc(L.gowri) + ' · ' + esc(L.dayLbl) + '</div>' + lines(r.gd, 'time small') + '</div></div>' +
        '</section>' +
        '<div class="trio">' +
          '<section class="box tile rahu" aria-label="' + esc(L.rahu) + '"><span class="tag r" style="align-self:flex-start">' + esc(L.avoid) + '</span><div class="lbl" style="margin-top:8px">' + esc(L.rahu) + '</div><div class="time">' + esc(r.rh) + '</div></section>' +
          '<section class="box tile yama" aria-label="' + esc(L.yama) + '"><span class="tag r" style="align-self:flex-start">' + esc(L.avoid) + '</span><div class="lbl" style="margin-top:8px">' + esc(L.yama) + '</div><div class="time">' + esc(r.ym) + '</div></section>' +
          '<section class="box tile kul" aria-label="' + esc(L.kuligai) + '"><span class="tag y" style="align-self:flex-start">' + esc(L.caution) + '</span><div class="lbl" style="margin-top:8px">' + esc(L.kuligai) + '</div><div class="time">' + esc(r.kl) + '</div></section>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function details(r, L) {
    var rows = [
      [L.tamilDate, r.td + ' · ' + r.tyw],
      [L.tithi, r.tix], [L.nak, r.nkx], [L.pirai, r.pi],
      [L.sunrise + ' / ' + L.sunset, r.sr + ' / ' + r.ss],
      [L.chandrashtamam, r.ch],
      [L.soolam + ' · ' + L.pariharam, r.so + ' · ' + r.pa],
      [L.muhurtham, r.mu || L.no],
      [L.holiday, r.hol ? r.holL : L.no],
      [L.festival + ' / ' + L.viratham, (r.fe || []).concat(r.vi || []).join(', ') || L.none]
    ];
    return '<div class="tw"><div class="scroll"><table class="t kv"><caption class="sr">' + esc(L.details) + '</caption><tbody>' +
      rows.map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }

  // Upcoming tables on the home page. items: [{r, extra}] ; kind decides the columns
  function upcoming(kind, items, L) {
    var head, cells;
    if (kind === 'mu') {
      head = [L.date, L.tamilDate, L.pirai + ' · ' + L.tithi, L.muhurtham];
      cells = function (r) { return '<td>' + esc(r.pi) + ' · ' + esc(r.ti) + '</td><td><span class="tag ' + (r.muS ? 'g' : 'y') + '">' + esc(r.mu) + '</span></td>'; };
    } else if (kind === 'vi') {
      head = [L.date, L.tamilDate, L.viratham];
      cells = function (r) { return '<td>' + esc((r.vi || []).join(', ')) + '</td>'; };
    } else if (kind === 'ti') {
      head = [L.date, L.tamilDate, L.pirai + ' · ' + L.tithi];
      cells = function (r) { return '<td>' + esc(r.pi) + ' · ' + esc(r.ti) + '</td>'; };
    } else {
      head = [L.date, L.tamilDate, L.occasion, L.holiday];
      cells = function (r) { return '<td>' + esc((r.fe || []).join(', ')) + '</td><td>' + (r.hol ? '<span class="tag r">' + esc(r.holL) + '</span>' : '–') + '</td>'; };
    }
    if (!items.length) return '<p class="empty">' + esc(L.noRows) + '</p>';
    var body = items.map(function (r) {
      return '<tr><td class="nw"><a href="' + esc(r.u) + '"><time datetime="' + esc(r.k) + '">' + esc(r.dsy) + '</time></a><small>' + esc(r.wd) + '</small></td><td>' + esc(r.tdShort) + '</td>' + cells(r) + '</tr>';
    }).join('');
    return '<div class="tw"><div class="scroll"><table class="t"><thead><tr>' + head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
  }

  function countdown(tiles, L) {
    return '<div class="count">' + tiles.map(function (t, i) {
      var n = t.n === 0 ? L.isToday : String(t.n);
      var lbl = t.n === 0 ? '' : (t.n === 1 ? L.dayTo : L.daysTo);
      return '<a class="box c' + (i + 1) + '" href="' + esc(t.u) + '"><span class="n">' + esc(n) + '</span><span class="lbl">' + esc(lbl) + '</span><strong>' + esc(t.name) + '</strong><span>' + esc(t.sub) + '</span></a>';
    }).join('') + '</div>';
  }

  // pick upcoming records from a sorted list of records, starting at today
  function upcomingFrom(days, todayKey, pred, n) {
    var out = [];
    for (var i = 0; i < days.length && out.length < n; i++) if (days[i].k >= todayKey && pred(days[i])) out.push(days[i]);
    return out;
  }
  function dayDiff(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
  function tilesFor(days, todayKey, L) {
    var tiles = [];
    var mu = upcomingFrom(days, todayKey, function (r) { return !!r.mu; }, 1)[0];
    if (mu) tiles.push({ n: dayDiff(todayKey, mu.k), name: mu.mu, sub: mu.dsw + ' · ' + mu.tdShort, u: mu.u });
    var fe = upcomingFrom(days, todayKey, function (r) { return (r.fe || []).length > 0; }, 1)[0];
    if (fe) tiles.push({ n: dayDiff(todayKey, fe.k), name: fe.fe[0], sub: fe.dsw + (fe.hol ? ' · ' + fe.holL : ''), u: fe.u });
    var mo = upcomingFrom(days, todayKey, function (r) { return r.tiI === 14 || r.tiI === 29; }, 1)[0];
    if (mo) tiles.push({ n: dayDiff(todayKey, mo.k), name: mo.ti, sub: mo.dsw + ' · ' + mo.tdShort, u: mo.u });
    var vi = upcomingFrom(days, todayKey, function (r) { return (r.vi || []).length > 0; }, 1)[0];
    if (vi) tiles.push({ n: dayDiff(todayKey, vi.k), name: vi.vi[0], sub: vi.dsw + ' · ' + vi.tdShort, u: vi.u });
    return tiles;
  }

  var api = { esc: esc, bento: bento, details: details, upcoming: upcoming, countdown: countdown, upcomingFrom: upcomingFrom, tilesFor: tilesFor, dayDiff: dayDiff };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NZR = api;
})(typeof window !== 'undefined' ? window : this);
