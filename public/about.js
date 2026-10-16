import { scene } from './scene.js';
import { visit } from './count.js';
// About page: the same floating planes as the studio, in the visitor's Soft or Loud style.
try { const v = localStorage.getItem('overleyz-style'); if (v) document.documentElement.dataset.vibe = v; } catch { /* private mode */ }   // Loud unless they picked another style
scene();
visit('about');
