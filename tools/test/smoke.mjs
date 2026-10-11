import { chromium } from 'playwright-core';
const S = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (const [name, vp] of [['desktop', { width: 1300, height: 1000 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined }); });
  page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(name + ' console: ' + m.text()));
  await page.goto(process.env.BASE || 'http://127.0.0.1:8799/');
  await page.waitForTimeout(1500);
  if (await page.isVisible('#welcome')) {
    console.log(name, 'check-in shown:', await page.textContent('#welcome-q'));
    await page.click('#welcome-moods button:has-text("Hopeful")'); await page.waitForTimeout(600);
    console.log(name, 'after check-in music:', await page.inputValue('#music') ? 'picked' : 'none', '| month dots:', await page.locator('#month span[data-mood]').count());
  }
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  console.log(name, 'scrollWidth/innerWidth', sw);
  if (name === 'desktop') {
    await page.click('[data-tab=stickers]'); console.log('sticker groups:', (await page.locator('#st-groups button').allTextContents()).join(', ')); await page.click('#st-grid button'); await page.waitForTimeout(300);
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

    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save-image')]);
    await dl.saveAs(`${S}/ov-out.jpg`);
    await page.click('#surprise'); await page.waitForTimeout(900);
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#save-image')]);
    await dl2.saveAs(`${S}/ov-surprise.jpg`);
    await page.selectOption('#music', { index: 1 });
    await page.click('#make-reel');
    await page.waitForSelector('#reel-actions:not([hidden])', { timeout: 30000 });
    console.log('reel status:', await page.textContent('#reel-status'));
    const [vdl] = await Promise.all([page.waitForEvent('download'), page.click('#save-reel')]);
    await vdl.saveAs(`${S}/ov-reel.${vdl.suggestedFilename().split('.').pop()}`);
    console.log('reel file', vdl.suggestedFilename());
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#send-note'); await page.fill('#send-to', 'Mia'); await page.fill('#send-from', 'Ley'); await page.click('#send-go');
    const link = await page.inputValue('#send-link');
    console.log('note link length', link.length);
    const r = await browser.newPage({ viewport: { width: 390, height: 844 } });
    r.on('pageerror', (e) => errors.push('reveal: ' + e.message));
    await r.goto(link); await r.waitForTimeout(1200);
    console.log('reveal:', await r.textContent('#reveal-to'), '/', await r.textContent('#reveal-from'), '| welcome hidden:', await r.isHidden('#welcome'));
    await r.click('#reveal-open'); await r.waitForTimeout(8800);
    console.log('play again shown:', await r.isVisible('#reveal-again'));
    await r.screenshot({ path: `${S}/ov-reveal.png` });
    const bad = await browser.newPage();
    bad.on('pageerror', (e) => errors.push('bad link: ' + e.message));
    await bad.goto((process.env.BASE || 'http://127.0.0.1:8799/') + '#n=' + Buffer.from(JSON.stringify({ v: 1, b: ['photos', '../../etc'], t: '<img src=x onerror=alert(1)>'.repeat(30), st: [['nope', 9, 9, 99, 999]], i: 'red', fo: 'Comic' })).toString('base64url'));
    await bad.waitForTimeout(1000);
    console.log('hostile link → reveal heading:', await bad.textContent('#reveal-to'), '| img injected:', await bad.locator('body img[src=x]').count());
  }
  await page.screenshot({ path: `${S}/ov-${name}.png`, fullPage: false });
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
