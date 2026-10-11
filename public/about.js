import { scene } from './scene.js';
import { visit } from './count.js';
// About page: the same floating planes as the studio, in the visitor's Soft or Loud style.
try { if (localStorage.getItem('overleyz-vibe') === 'loud') document.documentElement.dataset.vibe = 'loud'; } catch { /* private mode */ }
scene();
visit('about');
