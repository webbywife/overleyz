import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
await p.goto('about:blank');
console.log(await p.evaluate(() => ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus'].map((m) => `${m}: ${MediaRecorder.isTypeSupported(m)}`).join('\n')));
console.log(await p.evaluate(() => navigator.userAgent));
await b.close();
