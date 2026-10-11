import { chromium } from 'playwright-core';
const S = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (const [name, vp] of [['desktop', { width: 1300, height: 1000 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(name + ' console: ' + m.text()));
  await page.goto('http://127.0.0.1:8799/');
  await page.waitForTimeout(1500);
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  console.log(name, 'scrollWidth/innerWidth', sw);
  if (name === 'desktop') {
    await page.click('[data-tab=stickers]'); await page.click('#st-grid button'); await page.waitForTimeout(300);
    await page.click('[data-tab=words]'); await page.fill('#text', 'Rest is part\nof the journey.'); await page.fill('#underline', 'the journey');
    const box = await page.locator('#canvas').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.35, { steps: 5 }); await page.mouse.up();
    await page.click('[data-tab=picture]'); await page.click('[data-src=photos]'); await page.waitForTimeout(400);
    await page.click('#bg-grid button:nth-child(3)'); await page.waitForTimeout(800);
    await page.click('#moods button:has-text("Heartbroken")');
    await page.click('[data-tab=words]'); await page.click('#q-src [data-src=classics]');
    console.log('heartbroken classics:', await page.textContent('#q-count'));
    await page.click('#q-list li:nth-child(5) button'); await page.waitForTimeout(500);
    await page.click('[data-tab=share]');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save-image')]);
    await dl.saveAs(`${S}/ov-out.jpg`);
    await page.click('#surprise'); await page.waitForTimeout(900);
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#save-image')]);
    await dl2.saveAs(`${S}/ov-surprise.jpg`);
    await page.click('#make-reel');
    await page.waitForSelector('#reel-actions:not([hidden])', { timeout: 30000 });
    console.log('reel status:', await page.textContent('#reel-status'));
    const [vdl] = await Promise.all([page.waitForEvent('download'), page.click('#save-reel')]);
    await vdl.saveAs(`${S}/ov-reel.${vdl.suggestedFilename().split('.').pop()}`);
    console.log('reel file', vdl.suggestedFilename());
  }
  await page.screenshot({ path: `${S}/ov-${name}.png`, fullPage: false });
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
