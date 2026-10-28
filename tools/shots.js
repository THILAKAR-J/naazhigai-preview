const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2]; const base = 'http://localhost:8080';
  const pages = process.argv.slice(3);
  const b = await chromium.launch();
  const res = [];
  for (const [w, h, name] of [[1280, 900, 'desk'], [390, 844, 'mob']]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push(String(e)));
    for (const u of pages) {
      await pg.goto(base + u, { waitUntil: 'networkidle' }).catch(e => errs.push('nav ' + e));
      const ov = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
      const f = out + '/' + name + '-' + scheme + '-' + u.replace(/\W+/g, '_') + '.png';
      await pg.screenshot({ path: f, fullPage: false });
      res.push(name + ' ' + scheme + ' ' + u + ' overflowX=' + (ov.sw > ov.cw ? 'YES(' + ov.sw + '>' + ov.cw + ')' : 'no') + ' height=' + ov.h);
    }
    if (errs.length) res.push('ERRORS ' + name + ' ' + scheme + ': ' + [...new Set(errs)].slice(0, 5).join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(res.join('\n'));
})();
