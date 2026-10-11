import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const errs = [];
for (const [n, vp] of [['d', { width: 1200, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8799/'); await p.waitForTimeout(1500);
  await p.hover('.mood-card:nth-child(2)'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${process.argv[2]}/moods-${n}.png` });
  if (n === 'd') {
    await p.click('.mood-card[data-mood="brave"]'); await p.waitForTimeout(800);
    // select the words, then delete them with the button; select art if simple
    const box = await p.locator('#canvas').boundingBox();
    await p.click('[data-tab=picture]'); await p.click('[data-src=simple]'); await p.click('#bg-grid .vignette'); await p.waitForTimeout(500);
    await p.mouse.click(box.x + box.width / 2, box.y + box.height * 0.68); await p.waitForTimeout(300);
    console.log('art selected → tools:', await p.isVisible('#sel-tools'), '| remove label:', await p.getAttribute('#sel-del', 'aria-label'), '| turn hidden:', await p.isHidden('label.turn'));
    await p.keyboard.press('Delete'); await p.waitForTimeout(300);
    await p.mouse.click(box.x + box.width / 2, box.y + box.height * 0.18); await p.waitForTimeout(300);
    console.log('text selected → label:', await p.getAttribute('#sel-del', 'aria-label'));
    await p.click('#sel-del'); await p.waitForTimeout(300);
    console.log('words left:', JSON.stringify(await p.inputValue('#text')));
    await p.screenshot({ path: `${process.argv[2]}/panel-d.png` });
  }
}
console.log('errors', errs.length ? errs : 'none');
await b.close();
