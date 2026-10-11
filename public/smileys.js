// Hand-drawn style smileys for the moods (mood cards, mood chips and the month calendar). Plain SVG built in
// code, so they look the same on every phone and cost nothing to download.
const NS = 'http://www.w3.org/2000/svg';
export const FACE_COLOR = {
  hopeful: '#FFD45C', heartbroken: '#9DB4E8', grateful: '#FFB38A', 'in-love': '#FF8FB8', tired: '#C7BCEB',
  brave: '#FF8A5C', wanderlust: '#6FD3C8', 'letting-go': '#A9DD8E', growing: '#8FD16E', friends: '#E3A6F0',
  calm: '#9ED9E6', anxious: '#DCE36F', lonely: '#B7C3D6', proud: '#B69CF2', excited: '#FF7F6B', nostalgic: '#E8C3A0',
};
const INK = '#2D0358';
// each face: eyes, mouth and extras as SVG path data on a 64×64 face (centre 32,32, radius 27)
const FACES = {
  hopeful: { d: ['M20 27c2-4 7-4 9 0', 'M35 27c2-4 7-4 9 0', 'M21 39c5 7 17 7 22 0'], fill: ['M49 10l1.5 3.5L54 15l-3.5 1.5L49 20l-1.5-3.5L44 15l3.5-1.5z'] },
  heartbroken: { d: ['M22 31h7', 'M35 31h7', 'M22 46c4-6 16-6 20 0', 'M21 25l7-3', 'M43 25l-7-3'], fill: ['M44 36c0 3-2 5-3.5 5S37 39 37 36c0-2 3.5-6 3.5-6s3.5 4 3.5 6z'], tear: true },
  grateful: { d: ['M19 30c3 3 7 3 10 0', 'M35 30c3 3 7 3 10 0', 'M23 40c4 5 14 5 18 0'], blush: true },
  'in-love': { d: ['M22 40c4 6 16 6 20 0'], fill: ['M25 31l-5.5-5.2a3.4 3.4 0 0 1 5.5-4 3.4 3.4 0 0 1 5.5 4z', 'M39 31l-5.5-5.2a3.4 3.4 0 0 1 5.5-4 3.4 3.4 0 0 1 5.5 4z'], red: true },
  tired: { d: ['M20 30c3 2 7 2 9 0', 'M35 30c3 2 7 2 9 0', 'M26 43h12', 'M46 12h6l-6 6h6'] },
  brave: { d: ['M19 23l9 3', 'M45 23l-9 3', 'M22 39h20c-2 7-18 7-20 0z'], dots: [[25, 31], [39, 31]] },
  wanderlust: { d: ['M16 27h32', 'M22 41c4 5 16 5 20 0'], fill: ['M17 27h12a1 1 0 0 1 1 1c0 4-3 7-7 7s-7-3-7-7a1 1 0 0 1 1-1z', 'M35 27h12a1 1 0 0 1 1 1c0 4-3 7-7 7s-7-3-7-7a1 1 0 0 1 1-1z'] },
  'letting-go': { d: ['M20 30c3 2 7 2 9 0', 'M35 30c3 2 7 2 9 0', 'M27 42c3 2 7 2 10 0', 'M49 38c3 0 5-2 5-4'] },
  growing: { d: ['M21 39c5 7 17 7 22 0', 'M32 5v8'], dots: [[25, 30], [39, 30]], fill: ['M32 9c-6-1-9-5-8-8 5 0 8 3 8 8z', 'M32 9c5-2 9-1 10 2-4 2-8 1-10-2z'], leaf: true },
  friends: { d: ['M35 30c3-3 7-3 10 0', 'M20 37h24c-2 9-22 9-24 0z'], dots: [[25, 29]], blush: true },
  calm: { d: ['M20 29c3 3 6 3 9 0', 'M35 29c3 3 6 3 9 0', 'M25 41c4 4 10 4 14 0', 'M45 12c2-2 4-2 6 0', 'M48 17c2-2 4-2 6 0'] },
  anxious: { d: ['M21 24l7 2', 'M43 24l-7 2', 'M21 43c2-3 4-3 5.5 0s3.5 3 5.5 0 3.5-3 5.5 0 3.5 3 5.5 0'], dots: [[25, 31], [39, 31]], fill: ['M50 19c0 3-2 5-3.5 5S43 22 43 19c0-2 3.5-6 3.5-6s3.5 4 3.5 6z'], tear: true },
  lonely: { d: ['M28 44h8', 'M21 27c2-1 5-1 7 0', 'M36 27c2-1 5-1 7 0'], dots: [[24, 34], [38, 34]], fill: ['M52 6a7 7 0 1 0 5 11 5.5 5.5 0 1 1-5-11z'] },
  proud: { d: ['M20 31l4.5-4.5 4.5 4.5', 'M35 31l4.5-4.5 4.5 4.5', 'M21 38c5 8 17 8 22 0', 'M24 15l2-7 6 5 6-5 2 7z'], blush: true },
  excited: { d: ['M22 39h20c-2 9-18 9-20 0z'], fill: ['M25 22l1.8 3.8 4.2.5-3.1 2.9.8 4.1-3.7-2-3.7 2 .8-4.1-3.1-2.9 4.2-.5z', 'M39 22l1.8 3.8 4.2.5-3.1 2.9.8 4.1-3.7-2-3.7 2 .8-4.1-3.1-2.9 4.2-.5z'] },
  nostalgic: { d: ['M24 41c4 3 10 3 14 0', 'M50 19V9l6-2v10'], dots: [[27, 28], [41, 28]], fill: ['M50 19a3 2.4 0 1 1-6 0 3 2.4 0 1 1 6 0z', 'M56 17a3 2.4 0 1 1-6 0 3 2.4 0 1 1 6 0z'] },
};

export function smiley(key, size = 64) {
  const f = FACES[key];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64'); svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true'); svg.classList.add('smiley');
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); svg.append(n); return n; };
  el('circle', { cx: 32, cy: 34, r: 27, fill: FACE_COLOR[key] || '#FFD45C', stroke: INK, 'stroke-width': 2.5 });
  if (!f) return svg;
  if (f.blush) { el('ellipse', { cx: 18, cy: 39, rx: 4, ry: 2.5, fill: '#FF6F9A', opacity: 0.45 }); el('ellipse', { cx: 46, cy: 39, rx: 4, ry: 2.5, fill: '#FF6F9A', opacity: 0.45 }); }
  for (const [x, y] of f.dots || []) el('circle', { cx: x, cy: y, r: 3, fill: INK });
  for (const d of f.d) el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  (f.fill || []).forEach((d, i) => el('path', { d, fill: f.red ? '#E8295F' : f.tear ? '#5FA8FF' : f.leaf ? '#3E9B4F' : i === 0 && key === 'hopeful' ? '#FFFFFF' : INK, stroke: INK, 'stroke-width': key === 'hopeful' ? 1.5 : 0 }));
  return svg;
}
