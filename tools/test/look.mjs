import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const errs = [];
const S = process.argv[2], BASE = process.env.BASE || 'http://127.0.0.1:8799/';
for (const [n, vp] of [['d', { width: 1300, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => errs.push(n + ': ' + e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(n + ' console: ' + m.text()));
  await p.addInitScript(() => { const k = 'overleyz-moods', d = new Date(); const log = {}; for (const [o, m] of [[0, 'grateful'], [1, 'hopeful'], [2, 'tired'], [4, 'brave'], [5, 'in-love'], [8, 'wanderlust']]) { const x = new Date(d); x.setDate(d.getDate() - o); log[x.toLocaleDateString('en-CA')] = m; } localStorage.setItem(k, JSON.stringify(log)); });
  await p.goto(BASE); await p.waitForTimeout(1800);
  await p.screenshot({ path: `${S}/look-welcome-${n}.png`, fullPage: true });
  console.log(n, 'month:', await p.textContent('#month-name'), '|', await p.textContent('#month-count'), '| faces:', await p.locator('#month img').count());
  await p.click('#month-prev'); console.log(n, 'prev →', await p.textContent('#month-name')); await p.click('#month-next');
  await p.click('#welcome-skip'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${S}/look-studio-${n}.png` });
  await p.mouse.wheel(0, 700); await p.waitForTimeout(600);
  await p.screenshot({ path: `${S}/look-scrolled-${n}.png` });
  console.log(n, 'scene items:', await p.locator('#scene > *').count(), '| width', await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]));
}
const a = await b.newPage({ viewport: { width: 1200, height: 900 } });
a.on('pageerror', (e) => errs.push('about: ' + e.message));
await a.goto(BASE + 'about.html'); await a.waitForTimeout(1500); await a.mouse.wheel(0, 900); await a.waitForTimeout(500);
await a.screenshot({ path: `${S}/look-about.png` });
console.log('errors', errs.length ? errs : 'none');
await b.close();
