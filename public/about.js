// About page: the same scrapbook background as the studio.
import { scene } from './scene.js';
fetch('assets/catalog.json').then((r) => r.json()).then((c) => scene(c.photos)).catch(() => scene());
