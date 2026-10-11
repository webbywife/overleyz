// Background from the logo: pale watercolour planes laid over each other, each drifting at its own speed as
// you scroll (parallax). Decorative only — hidden from screen readers, never clickable, and still for anyone
// who prefers reduced motion. Plain CSS shapes, so nothing extra to download.
const PLANES = [
  // [tone, left %, top in viewport-heights, width vw, height px, rotation, skew, speed (0 = fixed, 1 = scrolls with page)]
  ['a', 52, 0.02, 46, 380, -16, -24, 0.12],
  ['b', -8, 0.38, 50, 240, -18, -26, 0.22],
  ['c', 62, 0.62, 40, 200, -14, -22, 0.34],
  ['line', 4, 0.10, 22, 150, -16, -24, 0.3],
  ['a', -14, 1.05, 44, 320, -17, -25, 0.18],
  ['b', 58, 1.25, 52, 260, -15, -24, 0.28],
  ['line', 70, 1.62, 20, 130, -16, -24, 0.42],
  ['c', 6, 1.85, 38, 220, -18, -26, 0.36],
  ['a', 54, 2.2, 48, 340, -16, -24, 0.2],
  ['b', -10, 2.6, 46, 240, -15, -22, 0.3],
  ['c', 66, 2.95, 36, 200, -17, -25, 0.4],
];

export function scene() {
  if (document.getElementById('scene')) return;
  const el = document.createElement('div');
  el.id = 'scene'; el.className = 'scene'; el.setAttribute('aria-hidden', 'true');
  for (const [tone, left, top, w, h, rot, skew, speed] of PLANES) {
    const p = document.createElement('div');
    p.className = `plane ${tone}`;
    Object.assign(p.style, { left: `${left}%`, top: `${top * 100}vh`, width: `${w}vw`, height: `${h}px` });
    p.style.setProperty('--r', `${rot}deg`);
    p.style.setProperty('--k', `${skew}deg`);
    p.dataset.speed = speed;
    el.append(p);
  }
  document.body.prepend(el);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layers = [...el.children];
  let ticking = false;
  const move = () => {
    ticking = false;
    const y = scrollY;
    for (const n of layers) n.style.transform = `translate3d(0, ${-y * n.dataset.speed}px, 0) rotate(var(--r)) skewX(var(--k))`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  move();
}
