/* Pozhudhu browser script: keeps "today" correct on a static site.
   - top strip date and link, highlighted rows, today/next/previous highlight cards
   - on pages that load the year data, re-renders today's panchangam and upcoming lists */
(function () {
  'use strict';
  var C = window.NZ_CFG || {};
  var nowIst = new Date(Date.now() + 330 * 60000);
  var K = nowIst.toISOString().slice(0, 10);
  var DOW = nowIst.getUTCDay();
  function parts(k) { var a = k.split('-'); return { y: +a[0], m: +a[1], d: +a[2] }; }
  function addDays(k, n) { return new Date(Date.parse(k + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function slug(k) { var p = parts(k); return (p.d < 10 ? '0' : '') + p.d + '-' + C.monEn[p.m - 1] + '-' + p.y; }
  function wdOf(k) { var p = parts(k); return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); }
  function fmt(k) { var p = parts(k); var wd = C.wd[wdOf(k)]; return (C.lang === 'en' ? wd.slice(0, 3) : wd) + ', ' + p.d + ' ' + C.mon[p.m - 1] + ' ' + p.y; }
  function fmtShort(k) { var p = parts(k); return p.d + ' ' + C.mon[p.m - 1]; }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  var inYear = parts(K).y === (C.dy || C.y); // daily pages exist for the primary year
  if (K === C.today) { return; } // the static page was built for today: nothing to change

  // top strip
  var a = document.querySelector('[data-nz-today]');
  if (a) {
    a.textContent = C.todayWord + ' · ' + fmt(K);
    if (inYear) a.setAttribute('href', C.day.replace('__SLUG__', slug(K))); else a.removeAttribute('href');
  }
  // highlighted rows and calendar cells
  each('[data-d]', function (el) {
    var s = el.getAttribute('data-d'), e = el.getAttribute('data-e') || s;
    el.classList.toggle('is-today', s <= K && K <= e);
  });
  each('[data-dow]', function (el) { el.classList.toggle('is-today', +el.getAttribute('data-dow') === DOW); });

  // today / next / previous cards on list pages
  each('[data-hl="list"]', function (box) {
    var t = document.getElementById(box.getAttribute('data-hl-for'));
    if (!t) return;
    var cur = null, next = null, prev = null;
    Array.prototype.forEach.call(t.querySelectorAll('tr[data-d]'), function (r) {
      var x = { s: r.getAttribute('data-d'), e: r.getAttribute('data-e') || r.getAttribute('data-d'), t: r.getAttribute('data-t'), h: r.getAttribute('data-h') };
      if (x.s <= K && K <= x.e) cur = x;
      if (x.s > K && !next) next = x;
      if (x.e < K) prev = x;
    });
    function put(slot, x, fallback) {
      var el = box.querySelector('[data-slot="' + slot + '"]');
      if (!el) return;
      el.textContent = '';
      if (x && x.h) { var l = document.createElement('a'); l.href = x.h; l.textContent = x.t; el.appendChild(l); } else el.textContent = x ? x.t : fallback;
    }
    var nowEl = box.querySelector('[data-slot="now"]');
    if (nowEl) nowEl.textContent = cur ? box.getAttribute('data-yes') : box.getAttribute('data-no');
    put('next', next, box.getAttribute('data-none'));
    put('prev', prev, box.getAttribute('data-none'));
  });

  // today / tomorrow / yesterday values on year-long timing pages
  each('[data-hl="days"]', function (box) {
    var map = {};
    var js = document.getElementById('nz-hv');
    if (js) { try { map = JSON.parse(js.textContent); } catch (e) { map = {}; } }
    else each('tr[data-d][data-v]', function (r) { map[r.getAttribute('data-d')] = r.getAttribute('data-v'); });
    [['now', K], ['next', addDays(K, 1)], ['prev', addDays(K, -1)]].forEach(function (p) {
      var v = box.querySelector('[data-slot="' + p[0] + '"]');
      var d = box.querySelector('[data-slot-date="' + p[0] + '"]');
      if (v) v.textContent = map[p[1]] || '–';
      if (d) d.textContent = fmtShort(p[1]);
    });
  });

  // pages with the year data: today's panchangam + upcoming lists
  var D = window.NZ_DATA, Lb = window.NZ_L, R = window.NZR;
  if (!D || !Lb || !R) return;
  var r = null;
  for (var i = 0; i < D.length; i++) if (D[i].k === K) { r = D[i]; break; }
  if (!r) return; // outside the calendar year: keep the static content
  var host = document.querySelector('[data-nz="bento"]');
  if (host) host.innerHTML = R.bento(r, Lb, { nav: !!document.querySelector('[data-nz="details"]'), link: true });
  var det = document.querySelector('[data-nz="details"]');
  if (det) det.innerHTML = R.details(r, Lb);
  var tiles = document.querySelector('[data-nz="tiles"]');
  if (tiles) tiles.innerHTML = R.countdown(R.tilesFor(D, K, Lb), Lb);
  var imp = { 3: 1, 5: 1, 7: 1, 8: 1, 10: 1, 12: 1, 14: 1, 18: 1, 20: 1, 22: 1, 23: 1, 25: 1, 27: 1, 29: 1 };
  var lists = [
    ['up-mu', 'mu', function (x) { return !!x.mu; }],
    ['up-vi', 'vi', function (x) { return x.vi.length > 0; }],
    ['up-ti', 'ti', function (x) { return !!imp[x.tiI]; }],
    ['up-fe', 'fe', function (x) { return x.fe.length > 0; }]
  ];
  lists.forEach(function (l) {
    var el = document.querySelector('[data-nz="' + l[0] + '"]');
    if (el) el.innerHTML = R.upcoming(l[1], R.upcomingFrom(D, K, l[2], 10), Lb);
  });
})();
