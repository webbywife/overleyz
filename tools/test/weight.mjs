import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const files = [];
p.on('response', async (r) => { try { const buf = await r.body(); files.push([r.url().replace(/^https?:\/\/[^/]+\//, ''), buf.length]); } catch {} });
await p.goto(process.env.BASE || 'http://127.0.0.1:8799/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const total = files.reduce((a, [, n]) => a + n, 0);
const by = {};
for (const [u, n] of files) { const k = u.split('/').slice(0, 2).join('/').replace(/\/[^/]*\.\w+$/, '') || u; by[k] = (by[k] || 0) + n; }
console.log('requests', files.length, 'total', (total / 1e6).toFixed(2), 'MB');
console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} ${(n / 1e3).toFixed(0)}KB`).join(' | '));
await b.close();
