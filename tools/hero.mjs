// Render real overleyz designs (via the app's own saved-design format) and save the canvases as PNGs.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = process.argv[2];
const today = new Date().toLocaleDateString('en-CA');
const base = { format: 'post', underline: '', size: 72, ink: '#3D2A33', paper: false, paperOp: 0.9, tx: 0.5, ty: 0.12, stickers: [], credit: '', creditOn: true, music: '' };
const designs = {
  simple: { ...base, bg: { kind: 'simple', id: 'st-004-vignette', color: '#F6E4E1' }, font: 'Kalam', text: 'Slow is still\nmoving forward.', underline: 'moving forward', ty: 0.2 },
  photo: { ...base, bg: { kind: 'photos', id: 'ig-mt-fuji-five-lakes-007', color: '#F5ECDD' }, font: 'Kalam', paper: true, text: 'The mountains are calling\nand I must go.', credit: 'John Muir, letter, 1873', ty: 0.08 },
  painting: { ...base, bg: { kind: 'backgrounds', id: '05-life', color: '#F5ECDD' }, font: 'Kalam', paper: true, text: 'Rest here a while.\nThe world will wait.', underline: 'The world will wait', ty: 0.08,
    stickers: [{ id: 'su-tutti-frutti-proud', x: 0.74, y: 0.72, scale: 1.05, rot: -6 }] },
};
const b = await chromium.launch({ channel: 'chrome' });
for (const [name, st] of Object.entries(designs)) {
  const p = await b.newPage({ viewport: { width: 1300, height: 1000 } });
  await p.addInitScript(([s, d]) => { localStorage.setItem('overleyz-v2', JSON.stringify(s)); localStorage.setItem('overleyz-asked', d); }, [st, today]);
  await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(2500);
  const data = await p.evaluate(() => document.querySelector('#canvas').toDataURL('image/png'));
  fs.writeFileSync(`${OUT}/hero-${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
  await p.close();
}
await b.close();
console.log('rendered', Object.keys(designs).join(', '));
