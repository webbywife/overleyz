// Records the "send a note" video moments on a 9:16 phone screen, in two takes:
// A) Ley's studio: a finished note → envelope → To/From → Get the link.  B) Mia opens the link: envelope → words appear.
import { chromium } from '../test/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const OUT = process.argv[2];
const BASE = 'http://127.0.0.1:8799/';
const MUSIC = 'some-friendships-dont-age-they-just-get';
const DESIGN = {
  format: 'post', bg: { kind: 'colors', id: '', color: '#F8E6DA' }, text: 'Some friendships don’t age. / They just get better stories.',
  underline: 'better stories', font: 'Kalam', size: 72, ink: '#3D2A33', paper: false, paperOp: 0.9, tx: 0.5, ty: 0.16,
  stickers: [{ id: 'su-cocoa-the-brownie-warm', x: 0.3, y: 0.7, scale: 1.15, rot: -6 }, { id: 'su-tutti-frutti-excited', x: 0.7, y: 0.71, scale: 1.1, rot: 6 }],
  credit: '', creditOn: true, music: MUSIC,
};
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await ctx.addInitScript(([d, today]) => {
  delete Navigator.prototype.share;   // show the link box (desktop Chrome would open its own share sheet)
  if (!location.hash) localStorage.setItem('overleyz-v2', JSON.stringify(d));
  localStorage.setItem('overleyz-vibe', 'soft');
  localStorage.setItem('overleyz-asked', today);
  addEventListener('pointerdown', (e) => {   // a soft finger dot so viewers see the taps
    const dot = document.createElement('div');
    dot.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(45,3,88,.6);z-index:99999;pointer-events:none;transition:transform .5s ease, opacity .5s ease;`;
    document.documentElement.append(dot);
    requestAnimationFrame(() => { dot.style.transform = 'scale(1.6)'; dot.style.opacity = '0'; });
    setTimeout(() => dot.remove(), 600);
  }, true);
}, [DESIGN, new Date().toLocaleDateString('en-CA')]);
const p = await ctx.newPage();
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });

const now = () => Date.now() / 1000;
// films one take into <OUT>/<name>/: full-resolution screenshots back to back, each held until the next arrives
async function take(name, script) {
  const dir = `${OUT}/${name}`;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(`${dir}/frames`, { recursive: true });
  const frames = [], marks = {};
  const t0 = now(); let filming = true;
  const filmed = (async () => {
    while (filming) {
      const t = now() - t0, f = `${String(frames.length).padStart(5, '0')}.jpg`;
      await p.screenshot({ path: `${dir}/frames/${f}`, type: 'jpeg', quality: 90, animations: 'allow', caret: 'initial' }).catch(() => {});
      frames.push({ f, t });
    }
  })();
  await script((k) => { marks[k] = now() - t0; });
  filming = false; await filmed;
  const list = frames.map((x, i) => `file 'frames/${x.f}'\nduration ${((frames[i + 1]?.t ?? x.t + 0.5) - x.t).toFixed(3)}`).join('\n') + `\nfile 'frames/${frames.at(-1).f}'\n`;
  fs.writeFileSync(`${dir}/frames.txt`, list);
  fs.writeFileSync(`${dir}/marks.json`, JSON.stringify(marks, null, 1));
  console.log(name, frames.length, 'frames', marks);
}

// A) the studio
await p.goto(BASE);
await p.waitForSelector('#send-note'); await p.waitForTimeout(2500);
await p.evaluate(() => { document.querySelector('.frame').scrollIntoView({ block: 'start' }); scrollBy(0, -12); });
await p.waitForTimeout(600);
let link = '';
await take('a', async (mark) => {
  await p.waitForTimeout(200); mark('start');
  await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelector('#send-note').scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await p.waitForTimeout(900);
  await p.tap('#send-note'); mark('envelope');
  await p.waitForTimeout(700);
  await p.tap('#send-to'); await p.keyboard.type('Mia', { delay: 140 });
  await p.waitForTimeout(250);
  await p.tap('#send-from'); await p.keyboard.type('Ley', { delay: 140 });
  await p.waitForTimeout(400);
  // the recording runs on a local copy: show the real address in the link box
  await p.evaluate(() => document.querySelector('#send-go').addEventListener('click', () => { const i = document.querySelector('#send-link'); i.value = i.value.replace(location.origin + '/', 'https://overleyz.art/'); }));
  await p.tap('#send-go'); mark('link');
  await p.waitForTimeout(1800); mark('end');
  link = (await p.$eval('#send-link', (i) => i.value)).replace('https://overleyz.art/', BASE);
});
if (!link.includes('#n=')) throw new Error('no note link');

// B) Mia opens it
await p.goto('about:blank');
await p.goto(link);
await p.waitForSelector('#reveal-open'); await p.waitForTimeout(1800);
await take('b', async (mark) => {
  await p.waitForTimeout(200); mark('start');
  await p.waitForTimeout(2000);
  await p.tap('#reveal-open'); mark('open');
  await p.waitForTimeout(8600); mark('end');
});
fs.writeFileSync(`${OUT}/link.txt`, link);
await b.close();
