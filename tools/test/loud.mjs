// Loud theme: switch, poster words, readable inks, smileys, Soft again; screenshots for a look.
import { chromium } from 'playwright-core';
const S = process.argv[2], BASE = process.env.BASE || 'http://127.0.0.1:8799/';
const b = await chromium.launch({ channel: 'chrome' });
const errs = [];
for (const [n, vp] of [['d', { width: 1300, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', (e) => errs.push(n + ': ' + e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(n + ' console: ' + m.text()));
  await p.goto(BASE); await p.waitForTimeout(1500);
  console.log(n, 'smileys on welcome:', await p.locator('#welcome-moods .smiley').count());
  await p.click('#vibe [data-vibe=loud]'); await p.waitForTimeout(900);
  console.log(n, 'vibe:', await p.evaluate(() => document.documentElement.dataset.vibe), '| h1 font:', await p.$eval('#welcome-q', (e) => getComputedStyle(e).fontFamily));
  await p.screenshot({ path: `${S}/loud-welcome-${n}.png` });
  await p.click('#welcome-moods .mood-card >> nth=6'); await p.waitForTimeout(1500);
  await p.click('[data-tab=words]'); await p.fill('#text', 'Do it scared / but do it anyway'); await p.fill('#underline', 'anyway');
  await p.click('[data-tab=picture]'); await p.click('#src-colors');
  console.log(n, 'colours label:', await p.textContent('#src-colors'), '| font:', await p.inputValue('#font'));
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${S}/loud-studio-${n}.png` });
  if (n === 'd') {
    const tiles = p.locator('#bg-grid button.pastel');
    for (const k of [0, 6]) { await tiles.nth(k).click(); await p.waitForTimeout(400); await p.$eval('#canvas', (c) => c.toDataURL('image/jpeg', .8)).then(async (u) => { const fs = await import('fs'); fs.writeFileSync(`${S}/loud-post-${k}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }); }
    await p.click('#vibe [data-vibe=soft]'); await p.waitForTimeout(700);
    console.log('back to soft:', await p.evaluate(() => document.documentElement.dataset.vibe), await p.inputValue('#font'));
    await p.click('#vibe [data-vibe=loud]'); await p.waitForTimeout(500);
  }
  console.log(n, 'width', await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]));
}
console.log('errors', errs.length ? errs : 'none');
await b.close();
