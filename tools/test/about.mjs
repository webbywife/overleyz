import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const errs = [];
for (const [n, vp] of [['d', { width: 1200, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp });
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto((process.env.BASE || 'http://127.0.0.1:8799/') + 'about.html');
  console.log(n, await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]));
  await p.screenshot({ path: `${process.argv[2]}/about-${n}.png`, fullPage: true });
}
console.log('errors', errs.length ? errs : 'none');
await b.close();
