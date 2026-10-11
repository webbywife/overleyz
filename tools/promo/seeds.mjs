// find a Math.random seed where "Brave" gives a soft watercolour post with short words (for the launch video)
import { chromium } from '../test/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ channel: 'chrome' });
for (let seed = 1; seed <= 40; seed++) {
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  await p.addInitScript((s) => { let a = s * 2654435761 >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, seed);
  await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(900);
  await p.click('#welcome-moods .mood-card[data-mood=brave]'); await p.waitForTimeout(500);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('overleyz-v2')));
  if (st.bg.kind === 'simple' && st.text.length < 60) console.log(seed, st.bg.kind, st.bg.id, st.bg.color, '|', st.text, '|', st.credit);
  await p.close();
}
await b.close();
