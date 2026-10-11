import { scene } from './scene.js';
import { smiley } from './smileys.js';
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
  Anton: { css: '{s}px Anton', shout: true },              // loud: tall poster capitals
  Heavy: { css: '900 {s}px Montserrat', shout: true },     // loud: wide, heavy capitals
};
const INKS = ['#3D2A33', '#2F2030', '#FFFFFF', '#7A3B4C', '#2E4A3F', '#2D3E5C', '#8A5A2B'];
// the leyzays "simple" pastels (simple_style.py) + the cream of the illustrated posts
const PAPERS = { blush: '#F6E4E1', sage: '#E6ECDD', lilac: '#ECE6F2', butter: '#F8F0D8', peach: '#F8E6DA', powder: '#E3ECF3', cream: '#F5EFE6' };
// the loud side: strong, dark and electric colours for big shouting words
const BOLDS = { night: '#0E0B14', violet: '#2D0358', cobalt: '#1D2BFF', red: '#E3262E', pink: '#FF2E88', tangerine: '#FF6A1A', acid: '#D7FF3A', forest: '#0B3D2E' };
const LOUD_INKS = ['#FFFFFF', '#0E0B14', '#D7FF3A', '#FF2E88', '#FFE14D', '#FF6A1A', '#1D2BFF', '#6FF2FF'];
const isBold = (c) => Object.values(BOLDS).includes(c);
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const bestInk = (bg, not = '') => LOUD_INKS.filter((c) => c !== not).sort((a, b) => contrast(b, bg) - contrast(a, bg))[0];
let vibe = 'soft';
try { vibe = localStorage.getItem('overleyz-vibe') === 'loud' ? 'loud' : 'soft'; } catch { /* private mode */ }
const isPaper = (bg) => bg.kind === 'colors' || bg.kind === 'simple';
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
    bg: { kind: 'colors', id: '', color: PAPERS.blush },
    text: 'Slow is still / moving forward.', underline: 'moving forward',
    font: 'Kalam', size: 72, ink: INKS[0], paper: false, paperOp: 0.9, tx: 0.5, ty: 0.14,
    stickers: [], credit: '', creditOn: true, music: '',
  };
}
let mood = '';
// each mood has its own smiley (smileys.js) and soft colour (same colours as the mood calendar)
const MOOD_FACE = {
  hopeful: ['su-tutti-frutti-hopeful', '#F6E2BE'], heartbroken: ['su-chippie-the-cookie-worried', '#DDE2EE'],
  grateful: ['su-cocoa-the-brownie-warm', '#F5DCD6'], 'in-love': ['su-butterscotch-belle-warm', '#F5D6E0'],
  tired: ['su-melty-the-ice-cream-sandwich-calm', '#E4E1EE'], brave: ['su-crumbles-the-biscotti-resolute', '#F2D9CC'],
  wanderlust: ['su-glazy-the-doughnut-spinning', '#D6EBEC'], 'letting-go': ['su-crepe-suzette-red-relieved', '#E1ECDA'],
  growing: ['su-fudgy-mcsquares-eureka', '#DCEAD3'], friends: ['su-senor-churro-handshake', '#EEDDF0'],
};
function moodButton(key, label, big) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = big ? 'mood-card' : 'mood-chip'; b.dataset.mood = key;
  if (MOOD_FACE[key]) { b.classList.add(`mc-${key}`); b.append(smiley(key, big ? 76 : 28)); }
  const span = document.createElement('span'); span.textContent = label;
  b.append(span);
  return b;
}                  // filter for quotes, paintings and photos
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
  boxes.art = null;
  ctx.fillStyle = state.bg.color || PAPER_TINT;
  ctx.fillRect(0, 0, W, H);
  const src = isPaper(state.bg) || state.bg.kind === 'upload' ? null : bgSrc(state.bg);
  try {
    if (state.bg.kind === 'upload' && uploaded) cover(uploaded, W, H, zoom);
    else if (src && state.bg.id) cover(await load(src), W, H, zoom);
    if (isPaper(state.bg) && !isBold(state.bg.color)) await paperTexture(W, H);
    if (state.bg.kind === 'simple' && state.bg.id) {
      // same layout as the leyzays simple posts: 56% wide at most, bottom edge at 80% of the height
      const art = await load(`assets/sticker/${state.bg.id}.webp`);
      const k = Math.min(W * 0.56 / art.width, H * 0.36 / art.height) * zoom * (state.bg.as ?? 1);
      const w = art.width * k, h = art.height * k;
      const ax = (state.bg.ax ?? 0.5) * W, ay = (state.bg.ay ?? 0.80) * H;   // centre-x, bottom edge
      ctx.drawImage(art, ax - w / 2, ay - h, w, h);
      boxes.art = { x: ax - w / 2, y: ay - h, w, h };
      if (selected === 'art' && t === null) { ctx.setLineDash([10, 8]); ctx.strokeStyle = '#A43C82'; ctx.lineWidth = 3; ctx.strokeRect(ax - w / 2 - 6, ay - h - 6, w + 12, h + 12); ctx.setLineDash([]); }
    }
  } catch { /* keep the paper colour */ }

  // words
  const f = FONTS[state.font];
  if (f.shout) shout(W, H, t, f);
  else {
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
  }

  // stickers
  for (const [i, s] of state.stickers.entries()) {
    let pop = 1;
    if (t !== null) { const u = (t - 2.6 - i * 0.35) / 0.45; if (u <= 0) continue; pop = u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) * Math.cos(u * 6); }
    try {
      const img = await load(`assets/sticker/${s.id}.webp`);
      const base = W * 0.26 / Math.max(img.width, img.height);
      const w = img.width * base * s.scale * pop, h = img.height * base * s.scale * pop;
      let bob = 0, sway = 0;
      if (t !== null && s.id.startsWith('su-')) { bob = Math.sin(t * 3.2 + i) * H * 0.008; sway = Math.sin(t * 2.1 + i) * 3; }   // Sugar Valley friends bounce a little
      ctx.save(); ctx.translate(s.x * W, s.y * H + bob); ctx.rotate((s.rot + sway) * Math.PI / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      if (selected === i && t === null) { ctx.setLineDash([10, 8]); ctx.strokeStyle = '#A43C82'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12); }
      ctx.restore();
      s._w = w; s._h = h;
    } catch { /* skip a missing sticker */ }
  }
  if (selected === 'text' && t === null) {
    const b = boxes.text;
    ctx.setLineDash([10, 8]); ctx.strokeStyle = '#A43C82'; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.setLineDash([]);
  }
  ctx.setLineDash([]);

  // the small mark (kept on every picture)
  ctx.font = `600 ${Math.round(W * 0.026)}px Poppins`;
  ctx.textAlign = 'left';
  if (isPaper(state.bg) && isBold(state.bg.color)) { ctx.fillStyle = lum(state.bg.color) < 0.3 ? 'rgba(255,255,255,.85)' : 'rgba(14,11,20,.8)'; }
  else if (isPaper(state.bg)) { ctx.fillStyle = 'rgba(110,92,110,.9)'; }   // quiet plum on pastel, like the simple posts
  else { ctx.shadowColor = 'rgba(30,18,24,.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; ctx.fillStyle = 'rgba(255,250,242,.95)'; }
  ctx.fillText('#leyzays', W * 0.04, H - W * 0.04);
  ctx.textAlign = 'right';
  ctx.fillText('overleyz.art', W * 0.96, H - W * 0.04);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

// LOUD words: capitals stacked in short lines, each stretched to the same width — as big as the picture allows.
// The line holding the underlined phrase shouts in a second colour. In reels each line punches in.
function shout(W, H, t, f) {
  const lines = (() => { ctx.font = f.css.replace('{s}', 100); return wrap(state.text.toUpperCase(), 520); })().filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {   // a tiny word alone on a line would be stretched huge: join it to a neighbour
    if (lines.length > 1 && lines[i].replace(/[^A-Z0-9]/gi, '').length <= 3) {
      const j = i < lines.length - 1 ? i + 1 : i - 1;
      lines.splice(Math.min(i, j), 2, i < j ? `${lines[i]} ${lines[j]}` : `${lines[j]} ${lines[i]}`);
    }
  }
  if (!lines.length) { boxes.text = { x: W * 0.3, y: state.ty * H, w: W * 0.4, h: 80 }; return; }
  const cap = ctx.measureText('H').actualBoundingBoxAscent / 100 || 0.72;
  const width = W * 0.9 * Math.min(1, Math.max(0.4, state.size / 110));
  let sizes = lines.map((l) => Math.min(width / Math.max(1, ctx.measureText(l).width) * 100, (H * 0.2) / cap));
  const gap = () => width * 0.03;
  const total = () => sizes.reduce((a, s) => a + s * cap, 0) + gap() * (lines.length - 1);
  const room = H * 0.8 - (state.credit && state.creditOn ? W * 0.07 : 0);
  if (total() > room) { const k = room / total(); sizes = sizes.map((s) => s * k); }
  const blockH = total();
  const cx = state.tx * W;
  const top = Math.max(W * 0.06, Math.min(H - blockH - W * 0.1, state.ty * H));
  const ul = state.underline.trim().toLowerCase();
  const behind = isPaper(state.bg) ? state.bg.color : '#0E0B14';
  const second = bestInk(behind, state.ink), accent = contrast(second, behind) >= 2 ? second : state.ink;
  if (state.paper && !isPaper(state.bg)) { ctx.fillStyle = `rgba(10,6,16,${state.paperOp * 0.62})`; ctx.fillRect(0, 0, W, H); }   // darken the picture
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  let y = top, widest = 0;
  lines.forEach((line, i) => {
    const s = sizes[i];
    ctx.font = f.css.replace('{s}', Math.round(s));
    widest = Math.max(widest, ctx.measureText(line).width);
    y += s * cap;
    let a = 1, k = 1;
    if (t !== null) { const u = (t - 0.6 - i * 0.45) / 0.3; if (u <= 0) { y += gap(); return; } a = Math.min(1, u); k = u >= 1 ? 1 : 1 + 0.35 * (1 - u) ** 2; }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, y - s * cap / 2); ctx.scale(k, k);
    ctx.fillStyle = ul && line.toLowerCase().includes(ul) ? accent : state.ink;
    ctx.fillText(line, 0, s * cap / 2);
    ctx.restore();
    y += gap();
  });
  boxes.text = { x: cx - widest / 2 - 30, y: top - 30, w: widest + 60, h: blockH + 60 };
  if (state.credit && state.creditOn) {
    const cs = Math.round(W * 0.026);
    ctx.font = `600 ${cs}px Poppins`;
    ctx.globalAlpha = t === null ? 0.9 : Math.max(0, Math.min(0.9, (t - 0.8 - lines.length * 0.45) / 0.5));
    ctx.fillStyle = state.ink;
    ctx.fillText(`— ${state.credit.toUpperCase()}`, cx, top + blockH + cs * 2.4);
    ctx.globalAlpha = 1;
    boxes.text.h += cs * 2.4;
  }
}

async function paperTexture(W, H) {
  try {
    const grain = await load('assets/paper-grain.webp');
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = ctx.createPattern(grain, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } catch { /* plain is fine */ }
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(70,50,60,0.06)');   // soft paper fall-off at the edges
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
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
  if (b && state.text.trim() && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return 'text';
  const a = boxes.art;
  if (a && p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h) return 'art';
  return null;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = toCanvas(e);
  selected = hit(p);
  syncSelTools();
  if (selected !== null) {
    const [W, H] = FORMATS[state.format];
    const o = selected === 'text' ? { x: state.tx * W, y: state.ty * H }
      : selected === 'art' ? { x: (state.bg.ax ?? 0.5) * W, y: (state.bg.ay ?? 0.80) * H }
        : { x: state.stickers[selected].x * W, y: state.stickers[selected].y * H };
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
  if (selected === 'text') { state.tx = x; state.ty = y; } else if (selected === 'art') { state.bg.ax = x; state.bg.ay = Math.max(0.15, y); } else { state.stickers[selected].x = x; state.stickers[selected].y = y; }
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function syncSelTools() {
  const kind = typeof selected === 'number' ? 'sticker' : selected;   // 'sticker' | 'text' | 'art' | null
  const box = $('#sel-tools');
  box.hidden = !kind;
  if (!kind) return;
  const size = $('#sel-size'), rot = $('#sel-rot');
  rot.closest('label').hidden = kind !== 'sticker';
  $('#sel-front').hidden = kind !== 'sticker';
  const label = kind === 'text' ? 'Remove the words' : kind === 'art' ? 'Remove the watercolour' : 'Remove sticker';
  $('#sel-del').title = label; $('#sel-del').setAttribute('aria-label', label);
  if (kind === 'sticker') { size.min = 0.2; size.max = 3; size.step = 0.01; size.value = state.stickers[selected].scale; rot.value = state.stickers[selected].rot; }
  if (kind === 'text') { size.min = 40; size.max = 140; size.step = 1; size.value = state.size; }
  if (kind === 'art') { size.min = 0.4; size.max = 1.8; size.step = 0.01; size.value = state.bg.as ?? 1; }
}
$('#sel-size').addEventListener('input', (e) => {
  const v = +e.target.value;
  if (selected === 'text') { state.size = v; $('#size').value = v; } else if (selected === 'art') state.bg.as = v; else state.stickers[selected].scale = v;
  redraw();
});
$('#sel-rot').addEventListener('input', (e) => { state.stickers[selected].rot = +e.target.value; redraw(); });
function removeSelected() {
  if (selected === null) return;
  if (selected === 'text') { state.text = ''; state.underline = ''; state.credit = ''; bindWords(); }
  else if (selected === 'art') setBg({ kind: 'colors', id: '', color: state.bg.color });
  else state.stickers.splice(selected, 1);
  selected = null; syncSelTools(); redraw();
}
$('#sel-del').addEventListener('click', removeSelected);
$('#sel-front').addEventListener('click', () => { const [s] = state.stickers.splice(selected, 1); state.stickers.push(s); selected = state.stickers.length - 1; redraw(); });
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected !== null && !e.target.closest('input, textarea, select')) { e.preventDefault(); removeSelected(); }
  if (e.key === 'Escape' && selected !== null) { selected = null; syncSelTools(); redraw(); }
});

// ---------- panels ----------
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== `tab-${b.dataset.tab}`; });
}));

// add grid tiles a screenful at a time: the next batch is built only when the end of the list scrolls into view
function fill(grid, items, make, batch = 24) {
  let i = 0;
  const more = document.createElement('div'); more.className = 'more';
  const step = () => {
    const frag = document.createDocumentFragment();
    for (const end = Math.min(items.length, i + batch); i < end; i++) frag.append(make(items[i]));
    more.before(frag);
    if (i >= items.length) { io.disconnect(); more.remove(); }
  };
  const io = new IntersectionObserver((e) => e[0].isIntersecting && step(), { root: grid, rootMargin: '200px' });
  grid.append(more);
  step();
  io.observe(more);
}

let bgSource = 'colors';
function setBg(bg) {
  const wasPaper = isPaper(state.bg);
  state.bg = bg;
  if (isPaper(bg) !== wasPaper) { state.paper = !isPaper(bg); bindWords(); }   // soft paper band only over pictures
  if (fitInk()) bindWords();
  renderBgGrid(); redraw();
}
// loud words always stay readable: pick the strongest ink for the colour behind them
function fitInk() {
  if (!FONTS[state.font].shout) return false;
  const behind = isPaper(state.bg) ? state.bg.color : '#0E0B14';
  if (contrast(state.ink, behind) >= 3 && LOUD_INKS.includes(state.ink)) return false;
  state.ink = bestInk(behind); return true;
}
const palette = () => (vibe === 'loud' ? BOLDS : PAPERS);
function pastelRow(grid, kind) {
  for (const [name, c] of Object.entries(palette())) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = kind === 'simple' ? 'pastel mini' : 'pastel';
    b.setAttribute('aria-label', `${name} ${vibe === 'loud' ? 'colour' : 'paper'}`); b.title = name;
    b.setAttribute('aria-pressed', isPaper(state.bg) && state.bg.color === c);
    const sw = document.createElement('span'); sw.className = 'swatch-tile'; sw.style.background = c;
    b.append(sw);
    b.addEventListener('click', () => setBg(kind === 'simple' && state.bg.kind === 'simple' ? { ...state.bg, color: c } : { kind: 'colors', id: '', color: c }));
    grid.append(b);
  }
}
function renderBgGrid() {
  const grid = $('#bg-grid');
  grid.replaceChildren();
  if (bgSource === 'colors') { pastelRow(grid, 'colors'); return; }
  if (bgSource === 'simple') {
    const row = document.createElement('div'); row.className = 'pastel-row'; row.setAttribute('aria-label', 'Paper colour');
    pastelRow(row, 'simple'); grid.append(row);
    const paper = isPaper(state.bg) ? state.bg.color : Object.values(palette())[0];
    const items = catalog.simple.filter((x) => !mood || x.mood === mood);
    fill(grid, items.length ? items : catalog.simple, (item) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'vignette'; b.title = item.theme;
      b.setAttribute('aria-pressed', state.bg.kind === 'simple' && state.bg.id === item.id);
      const sw = document.createElement('span'); sw.className = 'swatch-tile'; sw.style.background = paper;
      const img = document.createElement('img'); img.loading = 'lazy'; img.decoding = 'async'; img.alt = item.theme || 'watercolour'; img.src = `assets/sticker/t/${item.id}.webp`;
      b.append(sw, img);
      b.addEventListener('click', () => setBg({ kind: 'simple', id: item.id, color: paper }));   // fresh position and size
      return b;
    });
    return;
  }
  const items = catalog[bgSource].filter((x) => !mood || x.mood === mood);
  fill(grid, items.length ? items : catalog[bgSource], (item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', state.bg.kind === bgSource && state.bg.id === item.id);
    b.title = item.place ? `${item.place}${item.scene ? ' — ' + item.scene : ''}` : item.theme;
    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async'; img.alt = b.title || 'painting';
    img.src = `assets/${bgSource === 'backgrounds' ? 'bg' : 'photo'}/t/${item.id}.webp`;
    b.append(img);
    b.addEventListener('click', () => setBg({ kind: bgSource, id: item.id, color: PAPER_TINT }));
    return b;
  });
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
  setBg({ kind: 'upload', id: '', color: PAPER_TINT });
});

function bindWords() {
  const t = $('#text'), u = $('#underline'), f = $('#font'), sz = $('#size'), p = $('#paper'), po = $('#paper-op');
  t.value = state.text.replace(/\s\/\s/g, '\n'); u.value = state.underline; f.value = state.font; sz.value = state.size; p.checked = state.paper; po.value = state.paperOp;
  t.oninput = () => { state.text = t.value; state.credit = ''; redraw(); };
  const cr = $('#credit-on'); cr.checked = state.creditOn; cr.onchange = () => { state.creditOn = cr.checked; redraw(); };
  u.oninput = () => { state.underline = u.value; redraw(); };
  f.onchange = async () => {
    const was = FONTS[state.font].shout;
    state.font = f.value;
    if (FONTS[f.value].shout && !was) { state.size = 110; fitInk(); }
    if (!FONTS[f.value].shout && was) { state.size = 72; if (!INKS.includes(state.ink)) state.ink = INKS[0]; }
    await document.fonts.load(FONTS[f.value].css.replace('{s}', 40)); bindWords(); redraw();
  };
  $('#paper-label').textContent = FONTS[state.font].shout ? 'Darken the picture behind the words' : 'Soft paper behind the words';
  sz.oninput = () => { state.size = +sz.value; redraw(); };
  p.onchange = () => { state.paper = p.checked; redraw(); };
  po.oninput = () => { state.paperOp = +po.value; redraw(); };
  const inks = $('#inks');
  inks.replaceChildren();
  for (const c of FONTS[state.font].shout ? LOUD_INKS : INKS) {
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
    const b = moodButton(key, label, false);
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', mood === key);
    b.addEventListener('click', () => { mood = key; renderMoods(); renderQuotes(); renderBgGrid(); renderStickers(); renderMusic(); });
    el.append(b);
  }
}
function surprise() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const tunes = catalog.music.filter((m) => m.mood === mood);
  if (tunes.length) { state.music = pick(tunes).id; renderMusic(); }
  const qs = quoteMatches('');
  if (qs.length) useQuote(pick(qs));
  const pool = ['simple', 'backgrounds', 'photos'].flatMap((k) => catalog[k].filter((x) => !mood || x.mood === mood).map((x) => [k, x]));
  if (vibe === 'loud' && Math.random() < 0.6) setBg({ kind: 'colors', id: '', color: pick(Object.values(BOLDS)) });
  else if (pool.length) { const [k, x] = pick(pool); setBg({ kind: k, id: x.id, color: k === 'simple' ? pick(Object.values(palette())) : PAPER_TINT }); }
  else redraw();
}
$('#surprise').addEventListener('click', surprise);

// ---------- "How are you today?" — a daily check-in and a mood calendar, kept only on this device ----------
const today = () => new Date().toLocaleDateString('en-CA');   // YYYY-MM-DD in local time
function moodLog() { try { return JSON.parse(localStorage.getItem('overleyz-moods') || '{}'); } catch { return {}; } }
let monthOffset = 0;   // 0 = this month, -1 = last month …
function renderMonth() {
  const log = moodLog(), now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const y = first.getFullYear(), m = first.getMonth();
  $('#month-name').textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  $('#month-next').disabled = monthOffset >= 0;
  const el = $('#month');
  el.replaceChildren();
  for (const d of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) { const h = document.createElement('b'); h.textContent = d; el.append(h); }
  for (let k = 0; k < first.getDay(); k++) el.append(document.createElement('i'));
  let count = 0;
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
    const key = new Date(y, m, d).toLocaleDateString('en-CA');
    const dot = document.createElement('span');
    const md = log[key];
    if (md && catalog.moods[md]) {
      count++;
      dot.className = `day m-${md}`; dot.dataset.mood = md; dot.title = `${d} — ${catalog.moods[md]}`;
      const face = smiley(md, 28); face.setAttribute('role', 'img'); face.setAttribute('aria-label', catalog.moods[md]); face.removeAttribute('aria-hidden');
      dot.append(face);
    } else {
      dot.className = 'day'; dot.textContent = d;
    }
    if (key === today()) dot.classList.add('today');
    el.append(dot);
  }
  $('#month-count').textContent = count ? `${count} ${count === 1 ? 'day' : 'days'} checked in` : 'No check-ins yet this month';
}
$('#month-prev').addEventListener('click', () => { monthOffset--; renderMonth(); });
$('#month-next').addEventListener('click', () => { if (monthOffset < 0) { monthOffset++; renderMonth(); } });
function showWelcome() {
  const h = new Date().getHours();
  $('#welcome-hi').textContent = h < 5 ? 'Still up?' : h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';
  document.body.classList.add('welcoming');
  $('#welcome').hidden = false;
  const el = $('#welcome-moods');
  el.replaceChildren();
  for (const [key, label] of Object.entries(catalog.moods)) {
    const b = moodButton(key, label, true);
    b.addEventListener('click', () => {
      const log = moodLog(); log[today()] = key;
      try { localStorage.setItem('overleyz-moods', JSON.stringify(log)); } catch { /* private mode */ }
      mood = key; renderMoods(); renderQuotes(); renderStickers(); renderMusic();
      surprise();
      closeWelcome();
    });
    el.append(b);
  }
  renderMonth();
}
function closeWelcome() {
  try { localStorage.setItem('overleyz-asked', today()); } catch { /* private mode */ }
  document.body.classList.remove('welcoming');
  $('#welcome').hidden = true;
  redraw();
}
$('#welcome-skip').addEventListener('click', closeWelcome);
$('#open-checkin').addEventListener('click', showWelcome);

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
  fill(grid, list, (s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', s.name ? `Add ${s.name}` : 'Add sticker'); if (s.name) b.title = s.name;
    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async'; img.alt = ''; img.src = `assets/sticker/t/${s.id}.webp`;
    b.append(img);
    b.addEventListener('click', () => {
      // drop new stickers in the half of the picture the words aren't in
      const y = state.ty < 0.45 ? 0.72 : 0.22;
      state.stickers.push({ id: s.id, x: 0.5 + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.12, scale: 1, rot: Math.round((Math.random() - 0.5) * 16) });
      selected = state.stickers.length - 1; syncSelTools(); redraw();
    });
    return b;
  });
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
function pickMime(withAudio) {
  const list = withAudio
    ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
    : ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || null;
}

// ---------- music (Ley's own leyzays songs, 10-second clips; loaded only when chosen) ----------
let audioCtx = null, previewSrc = null;
const songCache = new Map();
async function song(id) {
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (!songCache.has(id)) songCache.set(id, fetch(`assets/music/${id}.m4a`).then((r) => r.arrayBuffer()).then((b) => audioCtx.decodeAudioData(b)));
  return songCache.get(id);
}
function stopPreview() { try { previewSrc?.stop(); } catch { /* already stopped */ } previewSrc = null; $('#music-play').setAttribute('aria-pressed', 'false'); }
function renderMusic() {
  const sel = $('#music');
  const keep = state.music || '';
  sel.replaceChildren(new Option('No music', ''));
  const list = [...catalog.music].sort((a, b) => (b.mood === mood) - (a.mood === mood));
  for (const m of list) sel.append(new Option(`♪ ${catalog.moods[m.mood]} — ${m.title.slice(0, 38)}${m.title.length > 38 ? '…' : ''}`, m.id));
  sel.value = list.some((m) => m.id === keep) ? keep : '';
}
$('#music').addEventListener('change', (e) => { state.music = e.target.value; stopPreview(); save(); });
$('#music-play').addEventListener('click', async () => {
  if (previewSrc) { stopPreview(); return; }
  if (!state.music) return;
  const buf = await song(state.music);
  await audioCtx.resume();
  previewSrc = audioCtx.createBufferSource(); previewSrc.buffer = buf; previewSrc.connect(audioCtx.destination);
  previewSrc.onended = stopPreview; previewSrc.start();
  $('#music-play').setAttribute('aria-pressed', 'true');
});

$('#make-reel').addEventListener('click', async () => {
  stopPreview();
  const status = $('#reel-status');
  const withAudio = !!state.music;
  const mime = pickMime(withAudio);
  if (!mime) { status.textContent = 'This browser can’t record video. Try Chrome or Safari.'; return; }
  const btn = $('#make-reel');
  btn.disabled = true; selected = null; syncSelTools();
  status.textContent = withAudio ? 'Making your reel with music… (8 seconds)' : 'Making your reel… (8 seconds)';
  const stream = canvas.captureStream(30);
  let src = null;
  if (withAudio) {
    try {
      const buf = await song(state.music);
      await audioCtx.resume();
      const dest = audioCtx.createMediaStreamDestination();
      src = audioCtx.createBufferSource(); src.buffer = buf; src.connect(dest);
      dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    } catch { status.textContent = 'Music couldn’t load — making the reel without it.'; }
  }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => { rec.onstop = res; });
  rec.start();
  src?.start();
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
  try { src?.stop(); } catch { /* ended */ }
  await done;
  stream.getAudioTracks().forEach((tr) => tr.stop());
  reelType = mime.split(';')[0];
  reelBlob = new Blob(chunks, { type: reelType });
  const v = $('#reel-preview');
  v.muted = false;
  v.src = URL.createObjectURL(reelBlob);
  $('#reel-actions').hidden = false;
  status.textContent = reelType === 'video/mp4' ? 'Ready.' : 'Ready. (This browser saves WebM — Instagram prefers MP4, so Safari or Chrome on a phone works best.)';
  btn.disabled = false;
  redraw();
});
$('#share-reel').addEventListener('click', () => reelBlob && share(reelBlob, `overleyz.${reelType === 'video/mp4' ? 'mp4' : 'webm'}`, reelType));
$('#save-reel').addEventListener('click', () => reelBlob && download(reelBlob, `overleyz.${reelType === 'video/mp4' ? 'mp4' : 'webm'}`));

// ---------- send a note: the design travels in the link's #fragment (never sent to any server) ----------
const b64 = {
  enc: (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (str) => new TextDecoder().decode(Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))),
};
const clamp = (n, lo, hi, d) => (Number.isFinite(+n) ? Math.min(hi, Math.max(lo, +n)) : d);
const r3 = (n) => Math.round(n * 1000) / 1000;
function encodeNote(to, from) {
  const st = state;
  return b64.enc(JSON.stringify({
    v: 1, f: st.format, b: [st.bg.kind, st.bg.id, st.bg.color], t: st.text, u: st.underline, fo: st.font, s: st.size, i: st.ink,
    p: st.paper ? 1 : 0, po: st.paperOp, x: r3(st.tx), y: r3(st.ty), c: st.credit, co: st.creditOn ? 1 : 0, m: st.music || '',
    st: st.stickers.slice(0, 20).map((k) => [k.id, r3(k.x), r3(k.y), r3(k.scale), Math.round(k.rot)]), to, fr: from,
  }));
}
// everything from a link is untrusted: keep only known pictures, stickers, fonts and colours; clamp numbers; cut text
function decodeNote(raw) {
  const n = JSON.parse(b64.dec(raw));
  if (n.v !== 1) throw new Error('unknown note');
  const ids = (k) => new Set(catalog[k].map((x) => x.id));
  const okBg = { backgrounds: ids('backgrounds'), photos: ids('photos'), simple: ids('simple') };
  const [kind, id, color] = Array.isArray(n.b) ? n.b : [];
  const colors = new Set([...Object.values(PAPERS), ...Object.values(BOLDS), PAPER_TINT]);
  const bg = kind === 'colors' ? { kind, id: '', color: colors.has(color) ? color : PAPERS.blush }
    : okBg[kind]?.has(id) ? { kind, id, color: colors.has(color) ? color : PAPER_TINT } : defaults().bg;
  const stickerIds = ids('stickers');
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  return {
    to: str(n.to, 30), from: str(n.fr, 30),
    state: {
      ...defaults(), format: FORMATS[n.f] ? n.f : 'post', bg, text: str(n.t, 220), underline: str(n.u, 80),
      font: FONTS[n.fo] ? n.fo : 'Kalam', size: clamp(n.s, 40, 140, 72), ink: [...INKS, ...LOUD_INKS].includes(n.i) ? n.i : INKS[0],
      paper: !!n.p, paperOp: clamp(n.po, 0.3, 1, 0.9), tx: clamp(n.x, 0, 1, 0.5), ty: clamp(n.y, 0, 1, 0.14),
      credit: str(n.c, 90), creditOn: !!n.co, music: catalog.music.some((m) => m.id === n.m) ? n.m : '',
      stickers: (Array.isArray(n.st) ? n.st : []).slice(0, 20).filter((k) => Array.isArray(k) && stickerIds.has(k[0]))
        .map(([sid, x, y, sc, rot]) => ({ id: sid, x: clamp(x, 0, 1, 0.5), y: clamp(y, 0, 1, 0.6), scale: clamp(sc, 0.2, 3, 1), rot: clamp(rot, -180, 180, 0) })),
    },
  };
}

const dlg = $('#send-dialog');
$('#send-note').addEventListener('click', () => {
  $('#send-warn').hidden = state.bg.kind !== 'upload';
  $('#send-link').hidden = true;
  dlg.showModal();
});
$('#send-close').addEventListener('click', () => dlg.close());
$('#send-go').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#n=${encodeNote($('#send-to').value.trim().slice(0, 30), $('#send-from').value.trim().slice(0, 30))}`;
  const to = $('#send-to').value.trim();
  const text = to ? `A little note for ${to} 💌` : 'A little note for you 💌';
  if (navigator.share) {
    try { await navigator.share({ title: 'overleyz', text, url }); dlg.close(); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const out = $('#send-link');
  out.hidden = false; out.value = url; out.select();
  try { await navigator.clipboard.writeText(url); $('#send-copied').hidden = false; } catch { /* the link is selected to copy by hand */ }
});

async function reveal(note) {
  document.body.classList.add('revealing');
  state = note.state;
  $('#reveal-to').textContent = note.to ? `A note for ${note.to}` : 'A note for you';
  $('#reveal-from').textContent = note.from ? `from ${note.from}` : '';
  $('#reveal').hidden = false;
  await Promise.all([state.font, 'Poppins'].map((k) => document.fonts.load(FONTS[k].css.replace('{s}', 40)).catch(() => {})));
  const play = async () => {
    const start = performance.now();
    let src = null;
    if (state.music) {
      try { const buf = await song(state.music); await audioCtx.resume(); src = audioCtx.createBufferSource(); src.buffer = buf; src.connect(audioCtx.destination); src.start(); } catch { /* silent is fine */ }
    }
    await new Promise((resolve) => {
      const tick = async () => {
        const t = (performance.now() - start) / 1000;
        await draw(Math.min(t, 8));
        if (t < 8) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  };
  $('#reveal-open').onclick = async () => { $('#reveal-open').hidden = true; await play(); $('#reveal-again').hidden = false; };
  $('#reveal-again').onclick = play;
  $('#reveal-reply').onclick = () => { history.replaceState(null, '', location.pathname); location.reload(); };
  $('#reveal-keep').onclick = () => { document.body.classList.remove('revealing'); save(); history.replaceState(null, '', location.pathname); location.reload(); };
  await draw(0);   // the envelope: just the picture until it's opened
}

// ---------- remember the last design (this browser only; the visitor's own photo is never kept) ----------
function save() {
  if (document.body.classList.contains('revealing')) return;
  try { localStorage.setItem('overleyz-v2', JSON.stringify({ ...state, bg: state.bg.kind === 'upload' ? defaults().bg : state.bg, stickers: state.stickers.map(({ _w, _h, ...s }) => s) })); } catch { /* private mode */ }
}
function restore() {
  try { const s = JSON.parse(localStorage.getItem('overleyz-v2') || 'null'); if (s && FORMATS[s.format]) state = { ...defaults(), ...s }; } catch { /* ignore */ }
}
$('#reset').addEventListener('click', () => { state = defaults(); if (vibe === 'loud') loudPost(); selected = null; uploaded = null; syncSelTools(); bindWords(); renderBgGrid(); redraw(); });

// ---------- Soft / Loud: the pastel studio, or a dark one with strong colours and huge shouting words ----------
function loudPost() {
  state.font = 'Anton'; state.size = 110; state.ty = 0.18;
  if (isPaper(state.bg)) state.bg = { kind: 'colors', id: '', color: BOLDS.night };
  state.paper = !isPaper(state.bg);
  fitInk();
}
function softPost() {
  state.font = 'Kalam'; state.size = 72; state.ink = INKS[0]; state.ty = 0.14;
  if (isPaper(state.bg)) state.bg = { kind: 'colors', id: '', color: PAPERS.blush };
}
function setVibe(v, restyle = true) {
  vibe = v;
  document.documentElement.dataset.vibe = v;
  document.querySelector('meta[name=theme-color]').content = v === 'loud' ? '#0B0710' : '#FAFBFE';
  document.querySelectorAll('#vibe button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vibe === v)));
  $('#src-colors').textContent = v === 'loud' ? 'Bold colour' : 'Pastel paper';
  try { localStorage.setItem('overleyz-vibe', v); } catch { /* private mode */ }
  if (!restyle) return;
  if (v === 'loud') loudPost(); else softPost();
  document.fonts.load(FONTS[state.font].css.replace('{s}', 40)).catch(() => {}).then(() => { bindWords(); renderBgGrid(); redraw(); });
}
document.querySelectorAll('#vibe button').forEach((b) => b.addEventListener('click', () => b.dataset.vibe !== vibe && setVibe(b.dataset.vibe)));

// ---------- start ----------
(async () => {
  restore();
  setVibe(vibe, false);
  catalog = await (await fetch('assets/catalog.json')).json();
  const hash = new URLSearchParams(location.hash.slice(1)).get('n');
  if (hash) {
    try { await reveal(decodeNote(hash)); scene(); return; } catch { history.replaceState(null, '', location.pathname); }
  }
  if (!state.bg.id && state.bg.kind === 'backgrounds') state.bg.id = catalog.backgrounds.find((b) => b.id.includes('life'))?.id || catalog.backgrounds[0]?.id || '';
  document.querySelector(`input[name=format][value=${state.format}]`).checked = true;
  await Promise.all([state.font, 'Poppins'].map((k) => document.fonts.load(FONTS[k].css.replace('{s}', 40)).catch(() => {})));   // other letterings load when picked
  bindWords(); renderMoods(); renderBgGrid(); renderStickers(); renderQuotes(''); renderMusic();
  let asked = '';
  try { asked = localStorage.getItem('overleyz-asked') || ''; } catch { /* private mode */ }
  if (asked !== today()) showWelcome();   // once a day
  redraw();
  (window.requestIdleCallback || setTimeout)(() => scene());   // floating planes behind the page, after the studio is ready
})();
