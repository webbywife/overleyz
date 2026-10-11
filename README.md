# overleyz

**Notes on pictures** — make an Instagram post or an 8-second reel by putting a quote on a leyzays painting, a travel photo or your own picture, add stickers, and share it. Live at **overleyz.art**.

- 100% in the browser: photos people use never leave their device, nothing is stored on a server, no accounts.
- Pick a mood (hopeful, heartbroken, grateful, in love, tired, brave, wanderlust, letting go, growing, friends) → matching quotes, paintings and photos. **Surprise me** picks a quote and a picture for that mood.
- Quotes: 454 leyzays notes + public-domain classics (Shakespeare, Austen, the Brontës, Dickinson, Thoreau, Emerson, Gibran, Montgomery, Alcott, King James Bible…) with the credit printed under the words. No movie lines or quotes from living people (copyright, and too many are misattributed).
- Stickers: Sugar Valley dessert characters (from the Sweetest Lovers story, sorted by the chosen mood), journal cut-outs, seasonal stickers and watercolour still-lifes.
- Formats: post 4:5, square, story/reel 9:16. Reels are recorded from the canvas (MP4 on Safari and current Chrome; WebM fallback).
- Share uses the phone's share sheet (Web Share API) → Instagram, Facebook, Messenger, Viber; otherwise download.

Pages: `index.html` (the studio) and `about.html` (how it works, sources, privacy, FAQ). Link previews use `assets/og.jpg`.

## Layout
- `public/` — the whole site (static): `index.html`, `app.css`, `app.js`, `assets/` (built).
- `tools/build_assets.py` — builds `public/assets/` from the leyzays projects (`~/ig-quotes`, `~/leyzays`, `~/leyzays-brand`): text-free paintings, clean travel photos, sticker cut-outs, quotes, fonts. Re-run after new art: `~/ig-quotes/.venv-clip/bin/python tools/build_assets.py` (needs scipy for the simple-style cut-outs).
- `tools/classics.py` — the public-domain quote bank and mood mapping. Add quotes only with exact wording and a real source.
- `tools/test/smoke.mjs` — Playwright check (both layouts, stickers, drag, save, reel). `cd tools/test && npm i && node smoke.mjs /tmp` with `python3 -m http.server 8799` running in `public/`.

## Hosting
Static files: point the web root at `public/`. No PHP, database or build step.

## Rights
Code © webbywife. **The paintings, photographs, Sugar Valley characters and leyzays notes in `public/assets/` are © Ley Z (leyzays / @traveleyz) and are not licensed for reuse** outside overleyz. Fonts: Kalam, Caveat, Nanum Pen Script, Newsreader, Poppins — SIL Open Font License.
