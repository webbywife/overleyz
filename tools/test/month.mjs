import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 900, height: 900 } });
await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(1200);
await p.click('#welcome-moods button:has-text("Grateful")'); await p.waitForTimeout(500);
await p.click('#open-checkin'); await p.waitForTimeout(300);
console.log('dots after reopening:', await p.locator('#month span[data-mood]').count(), await p.locator('#month span[data-mood]').first().getAttribute('title'));
await p.screenshot({ path: process.argv[2] + '/welcome.png' });
await b.close();
