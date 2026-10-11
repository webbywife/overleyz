// Renders finished overleyz posts (1080×1350) straight from the app for the launch video.
import { chromium } from '../test/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const OUT = process.argv[2];
const base = { format: 'post', underline: '', size: 72, paper: false, paperOp: 0.9, tx: 0.5, ty: 0.14, stickers: [], credit: '', creditOn: true, music: '' };
const POSTS = [
  ['soft-1', 'soft', { bg: { kind: 'simple', id: 'st-045-vignette', color: '#F6E4E1' }, text: 'Slow is still / moving forward.', underline: 'moving forward', font: 'Kalam', ink: '#3D2A33' }],
  ['loud-1', 'loud', { bg: { kind: 'colors', id: '', color: '#0E0B14' }, text: 'Do it scared / but do it anyway', underline: 'anyway', font: 'Anton', size: 110, ink: '#FFFFFF', ty: 0.16 }],
  ['soft-2', 'soft', { bg: { kind: 'photos', id: 'ig-mt-fuji-five-lakes-007', color: '#F5ECDD' }, text: 'The mountains are calling / and I must go.', font: 'Kalam', ink: '#3D2A33', paper: true, credit: 'John Muir, letter, 1873', ty: 0.1 }],
  ['loud-2', 'loud', { bg: { kind: 'colors', id: '', color: '#D7FF3A' }, text: 'Rest is not / quitting.', underline: 'quitting', font: 'Heavy', size: 110, ink: '#0E0B14', ty: 0.22 }],
  ['loud-3', 'loud', { bg: { kind: 'colors', id: '', color: '#FF2E88' }, text: 'You are allowed / to start again.', underline: 'start again', font: 'Anton', size: 110, ink: '#0E0B14', ty: 0.16 }],
];
const b = await chromium.launch({ channel: 'chrome' });
const today = new Date().toLocaleDateString('en-CA');
for (const [name, vibe, st] of POSTS) {
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  await p.addInitScript(([s, v, d]) => { localStorage.setItem('overleyz-v2', JSON.stringify(s)); localStorage.setItem('overleyz-vibe', v); localStorage.setItem('overleyz-asked', d); }, [{ ...base, ...st }, vibe, today]);
  await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(2200);
  const url = await p.$eval('#canvas', (c) => c.toDataURL('image/png'));
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  await p.close();
}
console.log('posts done');
await b.close();
