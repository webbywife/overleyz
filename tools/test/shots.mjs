import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
for (const [n, vp] of [['d', { width: 1300, height: 950 }], ['m', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(1500);
  if (n === 'd') { await p.click('#tab-picture [data-src=simple]'); await p.waitForTimeout(500); await p.click('#bg-grid .vignette:nth-of-type(4)'); await p.click('.pastel-row button:nth-child(3)'); await p.waitForTimeout(600); }
  await p.screenshot({ path: `${process.argv[2]}/ui-${n}.png`, fullPage: n === 'm' });
}
await b.close();
