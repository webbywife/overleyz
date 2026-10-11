// Records the launch-video app moments on a 9:16 phone screen: check-in → soft post → LOUD flip.
import { chromium } from '../test/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const OUT = process.argv[2];
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
// sharp 1080×1920 frames: full-resolution screenshots taken back to back while the script taps through
fs.mkdirSync(`${OUT}/frames`, { recursive: true });
for (const f of fs.readdirSync(`${OUT}/frames`)) fs.unlinkSync(`${OUT}/frames/${f}`);
const frames = [];
let t0 = null, filming = false;
const marks = {};
const now = () => Date.now() / 1000;
const mark = (k) => { marks[k] = now() - t0; };
async function film() {
  while (filming) {
    const t = now() - t0;
    const name = `${String(frames.length).padStart(5, '0')}.jpg`;
    await p.screenshot({ path: `${OUT}/frames/${name}`, type: 'jpeg', quality: 90, animations: 'allow', caret: 'initial' }).catch(() => {});
    frames.push({ name, t });
  }
}
await p.addInitScript(() => {
  let a = 32 * 2654435761 >>> 0;   // same "Brave" post every time
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const d = new Date(), log = {};
  for (const [o, m] of [[1, 'hopeful'], [2, 'tired'], [3, 'grateful'], [5, 'in-love'], [6, 'wanderlust'], [8, 'friends']]) { const x = new Date(d); x.setDate(d.getDate() - o); log[x.toLocaleDateString('en-CA')] = m; }
  localStorage.setItem('overleyz-moods', JSON.stringify(log));
  addEventListener('pointerdown', (e) => {   // a soft finger dot so viewers see the taps
    const dot = document.createElement('div');
    dot.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(45,3,88,.6);z-index:99999;pointer-events:none;transition:transform .5s ease, opacity .5s ease;`;
    document.documentElement.append(dot);
    requestAnimationFrame(() => { dot.style.transform = 'scale(1.6)'; dot.style.opacity = '0'; });
    setTimeout(() => dot.remove(), 600);
  }, true);
});
await p.goto('http://127.0.0.1:8799/');
await p.waitForSelector('#welcome-moods .mood-card'); await p.waitForTimeout(700);
t0 = now(); filming = true; const filmed = film();
await p.waitForTimeout(300);
mark('welcome');
await p.waitForTimeout(2200);
await p.tap('#welcome-moods .mood-card[data-mood=brave]');
mark('tap');
await p.waitForTimeout(400); await p.evaluate(() => scrollTo(0, 0));
mark('soft');
await p.waitForTimeout(2600);
await p.tap('#vibe [data-vibe=loud]');
mark('loud');
await p.waitForTimeout(2800);
mark('end');
filming = false; await filmed;
await p.close(); await ctx.close();
// ffmpeg concat list: each frame held until the next one arrived (Chrome only sends frames when something changes)
const list = frames.map((f, i) => `file 'frames/${f.name}'\nduration ${((frames[i + 1]?.t ?? f.t + 0.5) - f.t).toFixed(3)}`).join('\n') + `\nfile 'frames/${frames.at(-1).name}'\n`;
fs.writeFileSync(`${OUT}/frames.txt`, list);
fs.writeFileSync(`${OUT}/marks.json`, JSON.stringify(marks, null, 1));
console.log(frames.length, 'frames', marks);
await b.close();
