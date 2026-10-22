// sticker search: finds across groups, hides the group tabs while searching, says so when nothing matches
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
await p.goto(process.env.BASE || 'http://localhost:8799/');
await p.evaluate(() => { document.querySelector('#welcome-skip')?.click(); document.querySelector('[data-tab=stickers]').click(); });
await p.waitForSelector('#st-grid button');
const count = async (q) => { await p.fill('#st-search', q); await p.waitForTimeout(300); return { q, tiles: await p.locator('#st-grid button').count(), tabsHidden: await p.locator('#st-groups').isHidden(), msg: await p.locator('#st-grid p').count() }; };
for (const q of ['', 'cookie', 'rain', 'May', 'heart', 'lonely', 'zzzz']) console.log(await count(q));
await b.close();
