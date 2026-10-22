// every lettering in the picker loads and draws (checks the font files are served and the FONTS table matches the select)
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
await p.goto(process.env.BASE || 'http://localhost:8799/');
await p.waitForSelector('#font', { state: 'attached' });
const res = await p.evaluate(async () => {
  const out = {};
  for (const o of document.querySelectorAll('#font option')) {
    const sel = document.querySelector('#font'); sel.value = o.value; sel.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 400));
    out[o.value] = [...document.fonts].filter((f) => f.status === 'loaded').length;
  }
  return out;
});
console.log(res);
const bad = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family));
console.log('font errors:', bad);
await b.close();
