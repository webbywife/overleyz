// Scrapbook background: leyzays journal cut-outs scattered behind the page, each layer drifting at its own
// speed as you scroll (parallax). Decorative only — hidden from screen readers, never clickable, and still
// for anyone who prefers reduced motion. Loaded after the page is ready so it never slows the first paint.
const ITEMS = [
  // [sticker id, left %, top in viewport-heights, width px, rotation, speed (0 = fixed, 1 = scrolls with page)]
  ['jo-deco-07', 4, 0.10, 92, -6, 0.18],      // hot-air balloon
  ['jo-weather-01', 88, 0.04, 86, 8, 0.12],   // sun
  ['jo-deco-01', 90, 0.48, 96, 12, 0.35],     // wildflowers
  ['jo-travel-02', 2, 0.62, 120, -8, 0.28],   // little plane
  ['jo-weather-03', 70, 0.92, 120, 0, 0.16],  // cloud
  ['jo-travel-05', 6, 1.12, 120, -10, 0.42],  // train ticket
  ['jo-deco-03', 92, 1.18, 70, -14, 0.5],     // leaf sprig
  ['jo-travel-08', 84, 1.55, 104, 7, 0.32],   // mountain stamp
  ['jo-weather-13', 3, 1.70, 110, -4, 0.22],  // rainbow
  ['jo-deco-08', 90, 2.05, 88, 6, 0.46],      // tea cup
  ['jo-travel-03', 5, 2.25, 100, 9, 0.38],    // camera
  ['jo-weather-10', 46, 2.45, 46, 14, 0.26],  // star
  ['jo-deco-04', 88, 2.65, 100, -9, 0.3],     // bouquet
  ['jo-weather-05', 8, 2.95, 70, 18, 0.2],    // moon
  ['jo-travel-09', 86, 3.15, 80, -12, 0.44],  // shell
];
const SNAPS = 3;   // a few travel polaroids tucked in, picked from the catalog

export function scene(photos = []) {
  if (document.getElementById('scene')) return;
  const el = document.createElement('div');
  el.id = 'scene'; el.className = 'scene'; el.setAttribute('aria-hidden', 'true');
  const add = (node, left, top, rot, speed) => {
    node.style.left = `${left}%`;
    node.style.top = `${top * 100}vh`;
    node.style.setProperty('--r', `${rot}deg`);
    node.dataset.speed = speed;
    el.append(node);
  };
  for (const [id, left, top, w, rot, speed] of ITEMS) {
    const img = new Image();
    img.src = `assets/sticker/t/${id}.webp`; img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
    img.width = w; img.className = 'scrap';
    add(img, left, top, rot, speed);
  }
  const picks = photos.slice().sort(() => Math.random() - 0.5).slice(0, SNAPS);
  picks.forEach((p, k) => {
    const card = document.createElement('figure');
    card.className = 'snap';
    const img = new Image();
    img.src = `assets/photo/t/${p.id}.webp`; img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
    const cap = document.createElement('figcaption');
    cap.textContent = (p.place || '').split(',')[0];
    card.append(img, cap);
    add(card, k % 2 ? 84 : 3, 0.85 + k * 0.95, k % 2 ? 7 : -6, 0.24 + k * 0.06);
  });
  document.body.prepend(el);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layers = [...el.children];
  let ticking = false;
  const move = () => {
    ticking = false;
    const y = scrollY;
    for (const n of layers) n.style.transform = `translate3d(0, ${-y * n.dataset.speed}px, 0) rotate(var(--r))`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  move();
}
