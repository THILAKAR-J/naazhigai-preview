// Pozhudhu SEO admin API: Cloudflare Pages Function serving /admin/api/*
//
// Saving a change commits data/seo-overrides.json to GitHub; Cloudflare Pages then rebuilds the site
// (about 1-3 minutes), so every edit is versioned and can be undone from the GitHub history.
//
// Environment variables (Cloudflare Pages > Settings > Variables and Secrets):
//   ADMIN_PASSWORD   (secret, required)  password for /admin/
//   GITHUB_TOKEN     (secret, required)  fine-grained token: this repo only, "Contents: Read and write"
//   GITHUB_REPO      (optional)          default THILAKAR-J/naazhigai-preview
//   GITHUB_BRANCH    (optional)          default: main on pozhudhu.com / pozhudhu.pages.dev, dev on dev.pozhudhu.pages.dev
//   SESSION_SECRET   (optional)          extra key for signing login cookies

const FILE = 'data/seo-overrides.json';
const COOKIE = 'pz_admin';
const SESSION_HOURS = 12;
const LIMIT = { title: 120, description: 320, keywords: 300, canonical: 500 };
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIXED = new Set(['/', '/tamil/']);
const withSlug = (p, s) => p.replace(/[^/]+\/$/, s + '/');

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  const route = '/' + [].concat(params.path || []).join('/');
  const m = request.method;
  try {
    if (!env.ADMIN_PASSWORD) return json({ error: 'Admin is not set up yet: add ADMIN_PASSWORD in Cloudflare Pages settings.' }, 503);
    if (m !== 'GET' && request.headers.get('X-Requested-With') !== 'pozhudhu-admin') return json({ error: 'Bad request.' }, 400);
    if (route === '/login' && m === 'POST') return await login(request, env);
    if (route === '/logout' && m === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    if (!(await authed(request, env))) return json({ error: 'Please log in.' }, 401);
    if (route === '/session' && m === 'GET') return json({ ok: true, repo: repoOf(env), branch: branchOf(request, env), github: !!env.GITHUB_TOKEN });
    if (route === '/overrides' && m === 'GET') { const f = await readFile(request, env); return json({ pages: f.data.pages, sha: f.sha, branch: f.branch }); }
    if (route === '/save' && m === 'POST') return await save(request, env);
    if (route === '/history' && m === 'GET') return await history(request, env);
    return json({ error: 'Not found.' }, 404);
  } catch (e) {
    return json({ error: e.expose ? e.message : 'Something went wrong: ' + (e.message || e) }, e.status || 500);
  }
}

// ---------------- auth ----------------
async function login(request, env) {
  const body = await request.json().catch(() => ({}));
  const ok = typeof body.password === 'string' && (await sameText(body.password, env.ADMIN_PASSWORD));
  if (!ok) { await new Promise((r) => setTimeout(r, 800)); return json({ error: 'Wrong password.' }, 401); }
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(exp + '.' + (await sign(env, 'v1.' + exp)), SESSION_HOURS * 3600) });
}
async function authed(request, env) {
  const raw = (request.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || +exp < Date.now() / 1000) return false;
  return sameText(sig, await sign(env, 'v1.' + exp));
}
const cookie = (v, age) => COOKIE + '=' + v + '; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=' + age;
async function sign(env, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ADMIN_PASSWORD + '\n' + (env.SESSION_SECRET || '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
// constant-time comparison (hash both sides first so lengths match)
async function sameText(a, b) {
  const h = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

// ---------------- GitHub ----------------
const repoOf = (env) => env.GITHUB_REPO || 'THILAKAR-J/naazhigai-preview';
function branchOf(request, env) {
  if (env.GITHUB_BRANCH) return env.GITHUB_BRANCH;
  const h = new URL(request.url).hostname;
  if (h === 'pozhudhu.com' || h === 'www.pozhudhu.com' || h === 'pozhudhu.pages.dev') return 'main';
  if (h.startsWith('dev.')) return 'dev';
  return null;
}
function fail(status, message) { const e = new Error(message); e.status = status; e.expose = true; return e; }
async function gh(env, p, init) {
  if (!env.GITHUB_TOKEN) throw fail(503, 'Admin is not set up yet: add GITHUB_TOKEN in Cloudflare Pages settings.');
  const headers = { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'pozhudhu-seo-admin' };
  if (init && init.body) headers['Content-Type'] = 'application/json';
  return fetch('https://api.github.com/repos/' + repoOf(env) + p, Object.assign({}, init, { headers }));
}
async function readFile(request, env) {
  const branch = branchOf(request, env);
  if (!branch) throw fail(503, 'Unknown deployment: set GITHUB_BRANCH in Cloudflare Pages settings.');
  const r = await gh(env, '/contents/' + FILE + '?ref=' + encodeURIComponent(branch));
  if (r.status === 404) return { branch, sha: null, data: { pages: {} } };
  if (r.status === 401 || r.status === 403) throw fail(502, 'GitHub refused the token (' + r.status + '). Check GITHUB_TOKEN has Contents read/write on ' + repoOf(env) + '.');
  if (!r.ok) throw fail(502, 'Could not read settings from GitHub (' + r.status + ').');
  const j = await r.json();
  let data; try { data = JSON.parse(b64decode(j.content)); } catch (e) { throw fail(500, FILE + ' in GitHub is not valid JSON.'); }
  if (!data || typeof data.pages !== 'object') data = { pages: {} };
  return { branch, sha: j.sha, data };
}
async function writeFile(env, branch, sha, data, message) {
  const sorted = {}; for (const k of Object.keys(data.pages).sort()) sorted[k] = data.pages[k];
  const text = JSON.stringify({ pages: sorted }, null, 2) + '\n';
  const body = { message, content: b64encode(text), branch };
  if (sha) body.sha = sha;
  return gh(env, '/contents/' + FILE, { method: 'PUT', body: JSON.stringify(body) });
}
async function history(request, env) {
  const branch = branchOf(request, env);
  const r = await gh(env, '/commits?path=' + encodeURIComponent(FILE) + '&sha=' + encodeURIComponent(branch || 'main') + '&per_page=15');
  if (!r.ok) throw fail(502, 'Could not read history from GitHub (' + r.status + ').');
  const list = await r.json();
  return json({ commits: list.map((c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split('\n')[0], date: c.commit.author && c.commit.author.date, url: c.html_url })) });
}

// ---------------- save ----------------
async function save(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.path !== 'string' || !body.fields || typeof body.fields !== 'object') throw fail(400, 'Bad request.');
  const key = body.path;
  const idx = await pageIndex(request, env);
  const page = idx.byKey.get(key);
  if (!page) throw fail(400, 'Unknown page: ' + key);

  const clean = (v, n, label) => {
    const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
    if (s.length > n) throw fail(400, label + ' is too long (max ' + n + ' characters).');
    return s;
  };
  const f = body.fields;
  const next = {
    title: clean(f.title, LIMIT.title, 'Meta title'),
    description: clean(f.description, LIMIT.description, 'Meta description'),
    keywords: clean(f.keywords, LIMIT.keywords, 'Meta keywords'),
    canonical: clean(f.canonical, LIMIT.canonical, 'Canonical URL'),
    slug: clean(f.slug, 120, 'URL slug').toLowerCase()
  };
  if (next.title === page.t) next.title = '';
  if (next.description === page.d) next.description = '';
  if (next.canonical === page.c) next.canonical = '';
  if (next.canonical && !/^https:\/\/[^\s"'<>]+$/.test(next.canonical)) throw fail(400, 'Canonical URL must be a full https:// address with no spaces.');
  if (next.slug && withSlug(key, next.slug) === key) next.slug = '';
  if (next.slug) {
    if (FIXED.has(key)) throw fail(400, 'The home page URL cannot be changed.');
    if (!SLUG_RE.test(next.slug)) throw fail(400, 'URL slug can only use a-z, 0-9 and single hyphens (for example: rahu-kalam-today).');
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const file = await readFile(request, env);
    const pages = file.data.pages;
    const cur = pages[key] || {};
    // URL clash check against every other page's default URL, custom URL and old (redirected) URLs
    if (next.slug) {
      const target = withSlug(key, next.slug);
      if (idx.byKey.has(target) && target !== key) throw fail(409, 'That URL already belongs to another page: ' + target);
      for (const [k, o] of Object.entries(pages)) {
        if (k === key || !o) continue;
        if (o.slug && withSlug(k, o.slug) === target) throw fail(409, 'That URL is already used by another page (' + k + ').');
        if ((o.previousSlugs || []).some((s) => withSlug(k, s) === target)) throw fail(409, 'That URL redirects to another page (' + k + '). Pick a different slug.');
      }
    }
    // remember old custom slugs so their URLs keep redirecting (301) to the current one
    let previous = Array.isArray(cur.previousSlugs) ? cur.previousSlugs.slice() : [];
    if (cur.slug && cur.slug !== next.slug) previous.push(cur.slug);
    previous = [...new Set(previous)].filter((s) => s && s !== next.slug).slice(-20);

    const entry = {};
    for (const k of ['title', 'description', 'keywords', 'canonical', 'slug']) if (next[k]) entry[k] = next[k];
    if (previous.length) entry.previousSlugs = previous;
    const empty = !Object.keys(entry).length;
    if (empty) delete pages[key]; else pages[key] = Object.assign(entry, { updated: new Date().toISOString() });

    const what = empty ? 'reset to default' : Object.keys(entry).filter((k) => !['updated', 'previousSlugs'].includes(k)).join(', ');
    const res = await writeFile(env, file.branch, file.sha, file.data, 'SEO admin: ' + key + ' (' + what + ')');
    if (res.ok) {
      const j = await res.json();
      return json({ ok: true, entry: empty ? null : pages[key], url: next.slug ? withSlug(key, next.slug) : key, commit: j.commit && j.commit.html_url, branch: file.branch });
    }
    if (res.status === 409 || res.status === 422) continue;   // file changed meanwhile: re-read and try again
    if (res.status === 401 || res.status === 403) throw fail(502, 'GitHub refused the save (' + res.status + '). The token needs Contents: Read and write.');
    throw fail(502, 'GitHub save failed (' + res.status + ').');
  }
  throw fail(409, 'Someone else saved at the same time. Please try again.');
}
async function pageIndex(request, env) {
  const r = await env.ASSETS.fetch(new URL('/admin/pages.json', request.url));
  if (!r.ok) throw fail(500, 'Page list (/admin/pages.json) is missing from this deployment.');
  const j = await r.json();
  return { byKey: new Map(j.pages.map((p) => [p.k, p])) };
}

// ---------------- utils ----------------
function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }, headers || {}) });
}
function b64encode(str) {
  const bytes = new TextEncoder().encode(str); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, '')); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
