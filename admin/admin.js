// Pozhudhu SEO admin UI. Talks to /admin/api/* (functions/admin/api/[[path]].js).
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const FIXED = new Set(['/', '/tamil/']);
  const withSlug = (p, s) => p.replace(/[^/]+\/$/, s + '/');
  const lastSeg = (p) => (p.match(/([^/]+)\/$/) || [])[1] || '';
  const parentOf = (p) => p.replace(/[^/]+\/$/, '');
  const TYPE = { home: 'Home', page: 'Main page', sub: 'Month-wise page', month: 'Monthly calendar', day: 'Daily calendar' };
  const MAX_LIST = 300;

  const S = { domain: 'https://pozhudhu.com', pages: [], byKey: new Map(), ov: {}, pending: new Set(), sel: null, loaded: null, f: { q: '', lang: 'all', type: 'all', year: 'all', edited: false } };

  // ---------- API ----------
  async function api(path, body) {
    const res = await fetch('/admin/api' + path, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin',
      headers: Object.assign({ 'X-Requested-With': 'pozhudhu-admin' }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    let data = {}; try { data = await res.json(); } catch (e) { /* not json */ }
    if (!res.ok) { const e = new Error(data.error || 'Request failed (' + res.status + ').'); e.status = res.status; throw e; }
    return data;
  }

  // ---------- boot / login ----------
  async function boot() {
    try { show('app'); await start(await api('/session')); }
    catch (e) { show('login'); if (e.status !== 401) loginError(e.message); }
  }
  function show(which) { $('#boot').hidden = true; $('#login').hidden = which !== 'login'; $('#app').hidden = which !== 'app'; if (which === 'login') $('#pw').focus(); }
  function loginError(msg) { const el = $('#login-err'); el.textContent = msg || ''; el.hidden = !msg; }
  $('#login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); loginError('');
    const btn = ev.submitter || $('#login-form button'); btn.disabled = true;
    try { await api('/login', { password: $('#pw').value }); $('#pw').value = ''; show('app'); await start(await api('/session')); }
    catch (e) { loginError(e.message); }
    finally { btn.disabled = false; }
  });
  $('#btn-logout').addEventListener('click', async () => { if (!leaveOk()) return; await api('/logout', {}).catch(() => {}); location.reload(); });

  async function start(session) {
    const b = $('#branch');
    b.textContent = session.branch === 'main' ? 'Live site · main' : session.branch ? 'Preview · ' + session.branch : 'Branch not set';
    b.classList.toggle('live', session.branch === 'main');
    const [idx, ov] = await Promise.all([fetch('/admin/pages.json', { cache: 'no-store' }).then((r) => r.json()), api('/overrides').catch((e) => { toast(esc(e.message), true); return { pages: {} }; })]);
    S.domain = idx.domain || S.domain;
    S.pages = idx.pages; S.byKey = new Map(idx.pages.map((p) => [p.k, p]));
    S.ov = ov.pages || {};
    // anything saved in GitHub that this deployment does not show yet = waiting for the rebuild
    for (const [k, o] of Object.entries(S.ov)) { const p = S.byKey.get(k); if (p && p.u !== (o.slug ? withSlug(k, o.slug) : k)) S.pending.add(k); }
    const years = [...new Set(idx.pages.map((p) => p.y))].sort();
    $('#f-year').innerHTML = '<option value="all">All years</option>' + years.map((y) => '<option value="' + y + '">' + y + '</option>').join('');
    renderList();
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && S.byKey.has(hash)) select(hash); else loadHistory();
  }

  // ---------- list ----------
  const eff = (p) => { const o = S.ov[p.k] || {}; return { title: o.title || p.t, url: o.slug ? withSlug(p.k, o.slug) : p.k, edited: !!(o.title || o.description || o.keywords || o.canonical || o.slug) }; };
  function matches(p) {
    const f = S.f;
    if (f.lang !== 'all' && p.l !== f.lang) return false;
    if (f.type !== 'all' && p.g !== f.type) return false;
    if (f.year !== 'all' && String(p.y) !== f.year) return false;
    const e = eff(p);
    if (f.edited && !e.edited) return false;
    if (!f.q) return true;
    const hay = (p.k + ' ' + e.url + ' ' + p.t + ' ' + e.title).toLowerCase().replace(/-/g, ' ');
    return f.q.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  }
  function renderList() {
    const hits = S.pages.filter(matches);
    $('#count').textContent = hits.length.toLocaleString() + ' of ' + S.pages.length.toLocaleString() + ' pages';
    $('#list').innerHTML = hits.slice(0, MAX_LIST).map((p) => {
      const e = eff(p);
      const tag = S.pending.has(p.k) ? '<span class="tag pending">Updating</span>' : e.edited ? '<span class="tag edited">Edited</span>' : '';
      return '<li><button type="button" data-k="' + esc(p.k) + '"' + (S.sel === p.k ? ' aria-current="true"' : '') + '><span class="t" lang="' + p.l + '">' + esc(e.title) + '</span><span class="u">' + tag + esc(e.url) + '</span></button></li>';
    }).join('') + (hits.length > MAX_LIST ? '<li class="more">Showing first ' + MAX_LIST + '. Type more to narrow the list.</li>' : '') + (hits.length ? '' : '<li class="more">No pages match.</li>');
  }
  $('#list').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-k]'); if (b) select(b.dataset.k); });
  let qT; $('#q').addEventListener('input', (ev) => { clearTimeout(qT); qT = setTimeout(() => { S.f.q = ev.target.value.trim(); renderList(); }, 120); });
  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    S.f.lang = b.dataset.lang; renderList();
  }));
  $('#f-type').addEventListener('change', (ev) => { S.f.type = ev.target.value; renderList(); });
  $('#f-year').addEventListener('change', (ev) => { S.f.year = ev.target.value; renderList(); });
  $('#f-edited').addEventListener('change', (ev) => { S.f.edited = ev.target.checked; renderList(); });

  // ---------- editor ----------
  const F = { title: '#f-title', description: '#f-desc', keywords: '#f-keys', canonical: '#f-canon', slug: '#f-slug' };
  const val = (k) => $(F[k]).value.trim();
  const defaults = (p) => ({ title: p.t, description: p.d, keywords: '', canonical: p.c, slug: lastSeg(p.k) });
  function currentValues(p) { const o = S.ov[p.k] || {}; const d = defaults(p); return { title: o.title || d.title, description: o.description || d.description, keywords: o.keywords || '', canonical: o.canonical || d.canonical, slug: o.slug || d.slug }; }
  const dirty = () => S.sel && S.loaded && Object.keys(F).some((k) => val(k) !== S.loaded[k]);
  const leaveOk = () => !dirty() || confirm('You have unsaved changes on this page. Leave without saving?');

  function select(k) {
    if (k === S.sel) return;
    if (!leaveOk()) return;
    const p = S.byKey.get(k); if (!p) return;
    S.sel = k; history.replaceState(null, '', '#' + encodeURIComponent(k));
    $('#empty').hidden = true; $('#editor').hidden = false;
    fill(p); renderList();
    $('#main').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function fill(p) {
    const v = currentValues(p); S.loaded = v;
    for (const k of Object.keys(F)) $(F[k]).value = v[k];
    const fixed = FIXED.has(p.k);
    $('#f-slug').disabled = fixed;
    $('#slug-pre').textContent = S.domain.replace(/^https?:\/\//, '') + parentOf(p.k) + '‎';   // LRM keeps the trailing "/" in place
    $('#slug-help').textContent = fixed ? 'The home page URL cannot be changed.' : 'Lowercase letters, numbers and hyphens. The old URL will 301-redirect to the new one, and all links on the site update.';
    $('#ed-type').textContent = TYPE[p.g] + ' · ' + (p.l === 'ta' ? 'Tamil' : 'English') + ' · ' + p.y;
    $('#ed-title').textContent = v.title; $('#ed-title').lang = p.l;
    error('');
    update();
  }
  function update() {
    const p = S.byKey.get(S.sel); if (!p) return;
    const d = defaults(p);
    const t = val('title'), ds = val('description'), kw = val('keywords'), slug = val('slug').toLowerCase();
    const url = S.domain + (slug && !FIXED.has(p.k) ? withSlug(p.k, slug) : p.k);
    meter('#m-title', t.length, 30, 60, 120); meter('#m-desc', ds.length, 120, 160, 320);
    $('#m-keys').textContent = kw ? kw.split(',').filter((x) => x.trim()).length + ' keywords' : '';
    $('#serp-url').textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\//g, ' › ');
    $('#serp-title').textContent = t || d.title; $('#serp-desc').textContent = ds || d.description;
    const live = S.domain + p.u; const open = $('#ed-open'); open.href = live; open.textContent = live + ' ↗';
    const st = $('#ed-state');
    const isEdited = eff(p).edited;
    st.textContent = S.pending.has(p.k) ? 'Saved · updating site' : isEdited ? 'Edited' : 'Default';
    st.className = 'tag' + (S.pending.has(p.k) ? ' pending' : isEdited ? ' edited' : '');
    for (const k of Object.keys(F)) $(F[k]).closest('.field').classList.toggle('changed', val(k) !== S.loaded[k]);
    $('#btn-save').disabled = !dirty(); $('#btn-discard').disabled = !dirty();
    $('#btn-reset').disabled = !S.ov[p.k] || !eff(p).edited;
  }
  function meter(sel, n, lo, hi, max) {
    const el = $(sel); el.textContent = n + ' / ' + hi + (n > hi ? ' · too long for Google' : n && n < lo ? ' · a bit short' : '');
    el.className = 'meter' + (n > hi ? ' warn' : n >= lo ? ' good' : '');
  }
  Object.values(F).forEach((s) => $(s).addEventListener('input', update));
  $('#f-slug').addEventListener('blur', () => { const el = $('#f-slug'); el.value = el.value.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, ''); update(); });
  document.querySelectorAll('[data-default]').forEach((b) => b.addEventListener('click', () => {
    const p = S.byKey.get(S.sel); const k = b.dataset.default; $(F[k]).value = defaults(p)[k]; update(); $(F[k]).focus();
  }));
  $('#btn-discard').addEventListener('click', () => { const p = S.byKey.get(S.sel); if (p) fill(p); });
  $('#btn-reset').addEventListener('click', () => {
    const p = S.byKey.get(S.sel); if (!p) return;
    if (!confirm('Reset every SEO field on this page back to the default? If the URL slug was changed, the custom URL will redirect back to the default URL.')) return;
    const d = defaults(p); for (const k of Object.keys(F)) $(F[k]).value = d[k];
    saveNow();
  });
  $('#editor').addEventListener('submit', (ev) => { ev.preventDefault(); saveNow(); });
  window.addEventListener('hashchange', () => { const k = decodeURIComponent(location.hash.slice(1)); if (S.byKey.has(k)) select(k); });
  window.addEventListener('beforeunload', (ev) => { if (dirty()) { ev.preventDefault(); ev.returnValue = ''; } });

  function validate(p) {
    const slug = val('slug').toLowerCase(), canon = val('canonical');
    if (!val('title')) return 'Meta title cannot be empty. Press “Use default” to restore it.';
    if (!val('description')) return 'Meta description cannot be empty. Press “Use default” to restore it.';
    if (canon && !/^https:\/\/[^\s"'<>]+$/.test(canon)) return 'Canonical URL must be a full https:// address with no spaces.';
    if (!FIXED.has(p.k) && slug !== lastSeg(p.k)) {
      if (!slug) return 'URL slug cannot be empty. Press “Use default” to restore it.';
      if (!SLUG_RE.test(slug)) return 'URL slug can only use a-z, 0-9 and single hyphens, for example: rahu-kalam-today';
      const target = withSlug(p.k, slug);
      if (S.byKey.has(target)) return 'That URL already belongs to another page: ' + target;
      for (const [k, o] of Object.entries(S.ov)) {
        if (k === p.k || !o) continue;
        if (o.slug && withSlug(k, o.slug) === target) return 'That URL is already used by another page (' + k + ').';
        if ((o.previousSlugs || []).some((s) => withSlug(k, s) === target)) return 'That URL redirects to another page (' + k + '). Pick a different slug.';
      }
    }
    return '';
  }
  function error(msg) { const el = $('#ed-err'); el.textContent = msg; el.hidden = !msg; }

  async function saveNow() {
    const p = S.byKey.get(S.sel); if (!p) return;
    const bad = validate(p); if (bad) { error(bad); return; }
    error('');
    const btn = $('#btn-save'); btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const fields = {}; for (const k of Object.keys(F)) fields[k] = val(k);
      if (FIXED.has(p.k)) fields.slug = '';
      const r = await api('/save', { path: p.k, fields });
      if (r.entry) S.ov[p.k] = r.entry; else delete S.ov[p.k];
      S.pending.add(p.k);
      fill(p); renderList();
      toast('Saved. The site is rebuilding and will show this change in about 2 minutes.' + (r.commit ? ' <a href="' + esc(r.commit) + '" target="_blank" rel="noopener">View change</a>' : ''));
    } catch (e) {
      error(e.status === 401 ? 'Your login expired. Reload the page and log in again (copy your text first).' : e.message);
    } finally { btn.textContent = 'Update'; update(); }
  }

  // ---------- history ----------
  async function loadHistory() {
    const box = $('#history');
    try {
      const r = await api('/history');
      if (!r.commits.length) { box.innerHTML = ''; return; }
      box.innerHTML = '<h3>Recent changes</h3><ol>' + r.commits.map((c) => '<li><a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.message) + '</a><span>' + esc(c.date ? new Date(c.date).toLocaleString() : '') + '</span></li>').join('') + '</ol>';
    } catch (e) { box.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
  }
  $('#btn-history').addEventListener('click', () => {
    if (!leaveOk()) return;
    S.sel = null; S.loaded = null; history.replaceState(null, '', location.pathname);
    $('#editor').hidden = true; $('#empty').hidden = false; renderList(); loadHistory();
  });

  // ---------- toast ----------
  let tT;
  function toast(html, bad) {
    const el = $('#toast'); el.innerHTML = html; el.classList.toggle('bad', !!bad); el.hidden = false;
    clearTimeout(tT); tT = setTimeout(() => { el.hidden = true; }, bad ? 9000 : 7000);
  }

  boot();
})();
