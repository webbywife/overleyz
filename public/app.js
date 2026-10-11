// overleyz — notes on pictures. Everything happens in the browser: nothing is uploaded or stored on a server.
const $ = (s) => document.querySelector(s);
const canvas = $('#canvas');
const ctx = canvas.getContext('2d');

const FORMATS = { post: [1080, 1350], square: [1080, 1080], story: [1080, 1920] };
const FONTS = {
  Kalam: { css: '300 {s}px Kalam', scale: 1, lead: 1.3 },
  Caveat: { css: '500 {s}px Caveat', scale: 1.12, lead: 1.15 },
  Nanum: { css: '{s}px Nanum', scale: 1.25, lead: 1.1 },
  Newsreader: { css: 'italic {s}px Newsreader', scale: 0.92, lead: 1.3 },
  Poppins: { css: '600 {s}px Poppins', scale: 0.78, lead: 1.35 },
};
const INKS = ['#3D2A33', '#2F2030', '#FFFFFF', '#7A3B4C', '#2E4A3F', '#2D3E5C', '#8A5A2B'];
const PAPERS = ['#F5ECDD', '#F6E4E1', '#E6ECDD', '#ECE6F2', '#F8F0D8', '#F8E6DA', '#E3ECF3', '#FFFDF9'];
const PAPER_TINT = '#F5ECDD';

let catalog = { backgrounds: [], photos: [], stickers: [], quotes: [] };
const cache = new Map();
let state = defaults();
let selected = null;           // 'text' | sticker index | null
let boxes = { text: null };    // last drawn text box, for hit-testing
let anim = null;               // reel animation time (seconds) while recording

function defaults() {
  return {
    format: 'post',
    bg: { kind: 'backgrounds', id: '', color: '#F5ECDD' },
    text: 'Slow is still / moving forward.', underline: 'moving forward',
    font: 'Kalam', size: 72, ink: INKS[0], paper: true, paperOp: 0.9, tx: 0.5, ty: 0.14,
    stickers: [], credit: '', creditOn: true,
  };
}
let mood = '';                  // filter for quotes, paintings and photos
let qSrc = 'all';

// ---------- images ----------
function load(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((res, rej) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    }));
  }
  return cache.get(src);
}
const bgSrc = (bg) => bg.kind === 'backgrounds' ? `assets/bg/${bg.id}.webp` : bg.kind === 'photos' ? `assets/photo/${bg.id}.webp` : null;
let uploaded = null;           // ImageBitmap/Image of the visitor's own photo (memory only)

// ---------- drawing ----------
function cover(img, W, H, zoom = 1) {
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

function wrap(text, maxW) {
  // respect line breaks; split a part that is too wide into evenly balanced lines (no lonely last word)
  const out = [];
  for (const part of text.split(/\n|\s\/\s|\//)) {
    const words = part.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    const full = ctx.measureText(words.join(' ')).width;
    let n = Math.max(1, Math.ceil(full / maxW));
    for (;;) {
      const target = full / n, lines = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (cur && ctx.measureText(t).width > target * 1.08 && lines.length < n - 1) { lines.push(cur); cur = w; } else cur = t;
      }
      lines.push(cur);
      if (lines.every((l) => ctx.measureText(l).width <= maxW) || n > 8) { out.push(...lines); break; }
      n++;
    }
  }
  return out.filter((l, i, a) => l || (i > 0 && i < a.length - 1));
}

async function draw(t = null) {
  const [W, H] = FORMATS[state.format];
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  const zoom = t === null ? 1 : 1 + 0.08 * Math.min(1, t / 8);

  // background
  ctx.fillStyle = state.bg.color || PAPER_TINT;
  ctx.fillRect(0, 0, W, H);
  const src = state.bg.kind === 'upload' ? null : bgSrc(state.bg);
  try {
    if (state.bg.kind === 'upload' && uploaded) cover(uploaded, W, H, zoom);
    else if (src && state.bg.id) cover(await load(src), W, H, zoom);
  } catch { /* keep the paper colour */ }

  // words
  const f = FONTS[state.font];
  const size = Math.round(state.size * f.scale);
  ctx.font = f.css.replace('{s}', size);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  const lines = wrap(state.text, W * 0.82);
  const lh = size * f.lead;
  const blockH = lines.length * lh;
  const cx = state.tx * W;
  const top = Math.max(20, Math.min(H - blockH - 20, state.ty * H));
  const widest = Math.max(1, ...lines.map((l) => ctx.measureText(l).width));
  boxes.text = { x: cx - widest / 2 - 30, y: top - 30, w: widest + 60, h: blockH + 50 };

  if (state.paper && lines.length) {             // soft paper band, full width, long feathered edges
    const pad = size * 0.8, fe = size * 1.8;
    const y0 = top - pad, y1 = top + blockH + pad * 0.7;
    const rgba = (o) => hexA(PAPER_TINT, o), a = state.paperOp;
    const g = ctx.createLinearGradient(0, y0 - fe, 0, y1 + fe);
    const span = y1 - y0 + 2 * fe;
    for (let k = 0; k <= 8; k++) {                 // smooth ease, not a straight ramp
      const u = k / 8, e = u * u * (3 - 2 * u);
      g.addColorStop((fe * u) / span, rgba(a * e));
      g.addColorStop(1 - (fe * u) / span, rgba(a * e));
    }
    g.addColorStop(fe / span, rgba(a)); g.addColorStop(1 - fe / span, rgba(a));
    if (y0 - fe <= 0) { ctx.fillStyle = rgba(a); ctx.fillRect(0, 0, W, Math.max(0, y0)); }
    ctx.fillStyle = g; ctx.fillRect(0, Math.max(0, y0 - fe), W, y1 + fe - Math.max(0, y0 - fe));
  }

  ctx.fillStyle = state.ink;
  const ul = state.underline.trim();
  let ulDone = false;
  lines.forEach((line, i) => {
    let alpha = 1;
    if (t !== null) alpha = Math.max(0, Math.min(1, (t - 0.8 - i * 0.7) / 0.6));
    if (!alpha) return;
    ctx.globalAlpha = alpha;
    const y = top + size + i * lh;
    ctx.fillText(line, cx, y);
    if (ul && !ulDone && line.toLowerCase().includes(ul.toLowerCase())) {
      const k = line.toLowerCase().indexOf(ul.toLowerCase());
      const lw = ctx.measureText(line).width;
      const x0 = cx - lw / 2 + ctx.measureText(line.slice(0, k)).width;
      const x1 = x0 + ctx.measureText(line.slice(k, k + ul.length)).width;
      ctx.strokeStyle = state.ink; ctx.lineWidth = Math.max(2, size * 0.035); ctx.lineCap = 'round';
      ctx.beginPath();
      for (let s = 0; s <= 30; s++) { const u = s / 30; ctx.lineTo(x0 + u * (x1 - x0), y + size * 0.2 + Math.sin(u * 5.5) * 2 + u * 2); }
      ctx.stroke();
      ulDone = true;
    }
  });
  ctx.globalAlpha = 1;
  if (state.credit && state.creditOn && lines.length) {
    const cs = Math.round(Math.max(24, size * 0.38));
    ctx.font = `italic ${cs}px Newsreader`;
    ctx.globalAlpha = t === null ? 0.85 : Math.max(0, Math.min(0.85, (t - 0.8 - lines.length * 0.7) / 0.6));
    ctx.fillText(`— ${state.credit}`, cx, top + size + (lines.length - 1) * lh + cs * 2.1);
    ctx.globalAlpha = 1;
    boxes.text.h += cs * 2;
  }

  // stickers
  for (const [i, s] of state.stickers.entries()) {
    let pop = 1;
    if (t !== null) { const u = (t - 2.6 - i * 0.35) / 0.45; if (u <= 0) continue; pop = u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) * Math.cos(u * 6); }
    try {
      const img = await load(`assets/sticker/${s.id}.webp`);
      const base = W * 0.26 / Math.max(img.width, img.height);
      const w = img.width * base * s.scale * pop, h = img.height * base * s.scale * pop;
      ctx.save(); ctx.translate(s.x * W, s.y * H); ctx.rotate(s.rot * Math.PI / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      if (selected === i && t === null) { ctx.setLineDash([10, 8]); ctx.strokeStyle = '#B5737C'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12); }
      ctx.restore();
      s._w = w; s._h = h;
    } catch { /* skip a missing sticker */ }
  }
  if (selected === 'text' && t === null) {
    const b = boxes.text;
    ctx.setLineDash([10, 8]); ctx.strokeStyle = '#B5737C'; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.setLineDash([]);
  }
  ctx.setLineDash([]);

  // the small mark (kept on every picture)
  ctx.font = `600 ${Math.round(W * 0.026)}px Poppins`;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(30,18,24,.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  ctx.fillStyle = 'rgba(255,250,242,.95)';
  ctx.fillText('#leyzays', W * 0.04, H - W * 0.04);
  ctx.textAlign = 'right';
  ctx.fillText('overleyz.art', W * 0.96, H - W * 0.04);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

let pending = false;
function redraw() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(async () => { pending = false; await draw(); save(); });
}

// ---------- moving things on the picture ----------
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
}
function hit(p) {
  const [W, H] = FORMATS[state.format];
  for (let i = state.stickers.length - 1; i >= 0; i--) {
    const s = state.stickers[i];
    if (!s._w) continue;
    const dx = p.x - s.x * W, dy = p.y - s.y * H, a = -s.rot * Math.PI / 180;
    const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(rx) <= s._w / 2 + 10 && Math.abs(ry) <= s._h / 2 + 10) return i;
  }
  const b = boxes.text;
  if (b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return 'text';
  return null;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = toCanvas(e);
  selected = hit(p);
  syncSelTools();
  if (selected !== null) {
    const [W, H] = FORMATS[state.format];
    const o = selected === 'text' ? { x: state.tx * W, y: state.ty * H } : { x: state.stickers[selected].x * W, y: state.stickers[selected].y * H };
    drag = { dx: p.x - o.x, dy: p.y - o.y };
    canvas.setPointerCapture(e.pointerId);
  }
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || selected === null) return;
  const [W, H] = FORMATS[state.format];
  const p = toCanvas(e);
  const x = Math.min(1, Math.max(0, (p.x - drag.dx) / W)), y = Math.min(1, Math.max(0, (p.y - drag.dy) / H));
  if (selected === 'text') { state.tx = x; state.ty = y; } else { state.stickers[selected].x = x; state.stickers[selected].y = y; }
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function syncSelTools() {
  const isSticker = typeof selected === 'number';
  $('#sel-tools').hidden = !isSticker;
  if (isSticker) {
    $('#sel-size').value = state.stickers[selected].scale;
    $('#sel-rot').value = state.stickers[selected].rot;
  }
}
$('#sel-size').addEventListener('input', (e) => { state.stickers[selected].scale = +e.target.value; redraw(); });
$('#sel-rot').addEventListener('input', (e) => { state.stickers[selected].rot = +e.target.value; redraw(); });
$('#sel-del').addEventListener('click', () => { state.stickers.splice(selected, 1); selected = null; syncSelTools(); redraw(); });
$('#sel-front').addEventListener('click', () => { const [s] = state.stickers.splice(selected, 1); state.stickers.push(s); selected = state.stickers.length - 1; redraw(); });

// ---------- panels ----------
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== `tab-${b.dataset.tab}`; });
}));

let bgSource = 'backgrounds';
function renderBgGrid() {
  const grid = $('#bg-grid');
  grid.replaceChildren();
  if (bgSource === 'colors') {
    for (const c of PAPERS) {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', `Plain paper ${c}`);
      b.setAttribute('aria-pressed', state.bg.kind === 'colors' && state.bg.color === c);
      const sw = document.createElement('span'); sw.className = 'swatch-tile'; sw.style.background = c;
      b.append(sw);
      b.addEventListener('click', () => { state.bg = { kind: 'colors', id: '', color: c }; renderBgGrid(); redraw(); });
      grid.append(b);
    }
    return;
  }
  const items = catalog[bgSource].filter((x) => !mood || x.mood === mood);
  for (const item of (items.length ? items : catalog[bgSource])) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', state.bg.kind === bgSource && state.bg.id === item.id);
    b.title = item.place ? `${item.place}${item.scene ? ' — ' + item.scene : ''}` : item.theme;
    const img = document.createElement('img');
    img.loading = 'lazy'; img.alt = b.title || 'painting';
    img.src = `assets/${bgSource === 'backgrounds' ? 'bg' : 'photo'}/t/${item.id}.webp`;
    b.append(img);
    b.addEventListener('click', () => { state.bg = { kind: bgSource, id: item.id, color: PAPER_TINT }; renderBgGrid(); redraw(); });
    grid.append(b);
  }
}
document.querySelectorAll('#tab-picture .subtabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#tab-picture .subtabs button').forEach((x) => x.setAttribute('aria-selected', x === b));
  bgSource = b.dataset.src;
  renderBgGrid();
}));
document.querySelectorAll('input[name=format]').forEach((r) => r.addEventListener('change', () => { state.format = r.value; redraw(); }));
$('#upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    uploaded = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    uploaded = await load(URL.createObjectURL(file));
  }
  state.bg = { kind: 'upload', id: '', color: PAPER_TINT };
  renderBgGrid(); redraw();
});

function bindWords() {
  const t = $('#text'), u = $('#underline'), f = $('#font'), sz = $('#size'), p = $('#paper'), po = $('#paper-op');
  t.value = state.text.replace(/\s\/\s/g, '\n'); u.value = state.underline; f.value = state.font; sz.value = state.size; p.checked = state.paper; po.value = state.paperOp;
  t.oninput = () => { state.text = t.value; state.credit = ''; redraw(); };
  const cr = $('#credit-on'); cr.checked = state.creditOn; cr.onchange = () => { state.creditOn = cr.checked; redraw(); };
  u.oninput = () => { state.underline = u.value; redraw(); };
  f.onchange = async () => { state.font = f.value; await document.fonts.load(FONTS[f.value].css.replace('{s}', 40)); redraw(); };
  sz.oninput = () => { state.size = +sz.value; redraw(); };
  p.onchange = () => { state.paper = p.checked; redraw(); };
  po.oninput = () => { state.paperOp = +po.value; redraw(); };
  const inks = $('#inks');
  inks.replaceChildren();
  for (const c of INKS) {
    const b = document.createElement('button');
    b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', `Ink ${c}`);
    b.setAttribute('aria-pressed', state.ink === c);
    b.addEventListener('click', () => { state.ink = c; bindWords(); redraw(); });
    inks.append(b);
  }
}

function quoteMatches(f) {
  return catalog.quotes.filter((x) => (!mood || x.m === mood)
    && (qSrc === 'all' || (qSrc === 'leyzays') === (x.by === 'leyzays'))
    && (!f || `${x.q} ${x.t || ''} ${x.by} ${x.work || ''}`.toLowerCase().includes(f)));
}
function useQuote(q) {
  state.text = q.q;
  state.underline = '';
  state.credit = q.by === 'leyzays' ? '' : `${q.by}${q.work ? ', ' + q.work : ''}`;
  bindWords(); redraw();
}
function renderQuotes(filter = $('#q-search').value) {
  const list = $('#q-list');
  list.replaceChildren();
  const found = quoteMatches(filter.trim().toLowerCase());
  $('#q-count').textContent = `(${found.length})`;
  for (const q of found.slice(0, 120)) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    if (q.by !== 'leyzays') b.className = 'classic';
    b.append(q.q.replace(/\s\/\s/g, ' '));
    const small = document.createElement('small');
    small.textContent = q.by === 'leyzays' ? `leyzays · ${q.t}` : `${q.by} · ${q.work}`;
    b.append(small);
    b.addEventListener('click', () => useQuote(q));
    li.append(b); list.append(li);
  }
}
document.querySelectorAll('#q-src button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#q-src button').forEach((x) => x.setAttribute('aria-selected', x === b));
  qSrc = b.dataset.src; renderQuotes();
}));

function renderMoods() {
  const el = $('#moods');
  el.replaceChildren();
  for (const [key, label] of [['', 'Any'], ...Object.entries(catalog.moods)]) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', mood === key);
    b.textContent = label;
    b.addEventListener('click', () => { mood = key; renderMoods(); renderQuotes(); renderBgGrid(); renderStickers(); });
    el.append(b);
  }
}
$('#surprise').addEventListener('click', () => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const qs = quoteMatches('');
  if (qs.length) useQuote(pick(qs));
  const pool = ['backgrounds', 'photos'].flatMap((k) => catalog[k].filter((x) => !mood || x.mood === mood).map((x) => [k, x]));
  if (pool.length) { const [k, x] = pick(pool); state.bg = { kind: k, id: x.id, color: PAPER_TINT }; }
  renderBgGrid(); redraw();
});

$('#q-search').addEventListener('input', (e) => renderQuotes(e.target.value));

let stGroup = 'Sugar Valley';
function renderStickers() {
  const groups = [...new Set(catalog.stickers.map((s) => s.group))].sort((a, b) => (b === 'Sugar Valley') - (a === 'Sugar Valley'));
  const gEl = $('#st-groups');
  gEl.replaceChildren();
  for (const g of groups) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = g; b.setAttribute('aria-selected', g === stGroup);
    b.addEventListener('click', () => { stGroup = g; renderStickers(); });
    gEl.append(b);
  }
  const grid = $('#st-grid');
  grid.replaceChildren();
  let list = catalog.stickers.filter((x) => x.group === stGroup);
  if (mood && list.some((x) => x.mood === mood)) list = [...list.filter((x) => x.mood === mood), ...list.filter((x) => x.mood !== mood)];
  for (const s of list) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', s.name ? `Add ${s.name}` : 'Add sticker'); if (s.name) b.title = s.name;
    const img = document.createElement('img');
    img.loading = 'lazy'; img.alt = ''; img.src = `assets/sticker/${s.id}.webp`;
    b.append(img);
    b.addEventListener('click', () => {
      // drop new stickers in the half of the picture the words aren't in
      const y = state.ty < 0.45 ? 0.72 : 0.22;
      state.stickers.push({ id: s.id, x: 0.5 + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.12, scale: 1, rot: Math.round((Math.random() - 0.5) * 16) });
      selected = state.stickers.length - 1; syncSelTools(); redraw();
    });
    grid.append(b);
  }
}

// ---------- share ----------
const toBlob = (type, q) => new Promise((res) => canvas.toBlob(res, type, q));
async function finalImage() { const s = selected; selected = null; await draw(); const b = await toBlob('image/jpeg', 0.92); selected = s; redraw(); return b; }
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function share(blob, name, type) {
  const file = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: '#leyzays · made at overleyz.art' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  download(blob, name);
}
$('#share-image').addEventListener('click', async () => share(await finalImage(), 'overleyz.jpg', 'image/jpeg'));
$('#save-image').addEventListener('click', async () => download(await finalImage(), 'overleyz.jpg'));

let reelBlob = null, reelType = 'video/mp4';
function pickMime() {
  for (const m of ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}
$('#make-reel').addEventListener('click', async () => {
  const mime = pickMime();
  const status = $('#reel-status');
  if (!mime) { status.textContent = 'This browser can’t record video. Try Chrome or Safari.'; return; }
  const btn = $('#make-reel');
  btn.disabled = true; selected = null; syncSelTools();
  status.textContent = 'Making your reel… (8 seconds)';
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => { rec.onstop = res; });
  rec.start();
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = async () => {
      const t = (performance.now() - start) / 1000;
      await draw(Math.min(t, 8));
      if (t < 8) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await done;
  reelType = mime.split(';')[0];
  reelBlob = new Blob(chunks, { type: reelType });
  const v = $('#reel-preview');
  v.src = URL.createObjectURL(reelBlob);
  $('#reel-actions').hidden = false;
  status.textContent = reelType === 'video/mp4' ? 'Ready.' : 'Ready. (This browser saves WebM — Instagram prefers MP4, so Safari or Chrome on a phone works best.)';
  btn.disabled = false;
  redraw();
});
$('#share-reel').addEventListener('click', () => reelBlob && share(reelBlob, `overleyz.${reelType === 'video/mp4' ? 'mp4' : 'webm'}`, reelType));
$('#save-reel').addEventListener('click', () => reelBlob && download(reelBlob, `overleyz.${reelType === 'video/mp4' ? 'mp4' : 'webm'}`));

// ---------- remember the last design (this browser only; the visitor's own photo is never kept) ----------
function save() {
  try { localStorage.setItem('overleyz', JSON.stringify({ ...state, bg: state.bg.kind === 'upload' ? defaults().bg : state.bg, stickers: state.stickers.map(({ _w, _h, ...s }) => s) })); } catch { /* private mode */ }
}
function restore() {
  try { const s = JSON.parse(localStorage.getItem('overleyz') || 'null'); if (s && FORMATS[s.format]) state = { ...defaults(), ...s }; } catch { /* ignore */ }
}
$('#reset').addEventListener('click', () => { state = defaults(); state.bg.id = catalog.backgrounds[0]?.id || ''; selected = null; uploaded = null; syncSelTools(); bindWords(); renderBgGrid(); redraw(); });

// ---------- start ----------
(async () => {
  restore();
  catalog = await (await fetch('assets/catalog.json')).json();
  if (!state.bg.id && state.bg.kind === 'backgrounds') state.bg.id = catalog.backgrounds.find((b) => b.id.includes('life'))?.id || catalog.backgrounds[0]?.id || '';
  document.querySelector(`input[name=format][value=${state.format}]`).checked = true;
  await Promise.all(Object.values(FONTS).map((f) => document.fonts.load(f.css.replace('{s}', 40)).catch(() => {})));
  bindWords(); renderMoods(); renderBgGrid(); renderStickers(); renderQuotes('');
  redraw();
})();
