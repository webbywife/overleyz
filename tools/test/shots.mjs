import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
for (const [n, vp] of [['d', { width: 1300, height: 950 }], ['m', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(1500);
  await p.click('[data-tab=stickers]'); await p.click('#st-grid button'); await p.waitForTimeout(400);
  await p.screenshot({ path: `${process.argv[2]}/ui-${n}.png`, fullPage: n === 'm' });
}
await b.close();
