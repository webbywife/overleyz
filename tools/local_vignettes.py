#!/usr/bin/env python3
"""New overleyz still-life watercolours made LOCALLY with Draw Things (FLUX.1 schnell) — no credits.

Needs the Draw Things app open with  Settings → Advanced → API Server  switched on (HTTP, port 7860).
Uses the same prompt as ~/ig-quotes/simple_style.py so the new ones sit beside the existing 30.

    python3 tools/local_vignettes.py            # first 2 only (a sample to look at)
    python3 tools/local_vignettes.py all        # every idea, skips ones already made
Raw images → tools/local-art/<id>.png (white background; build_assets cuts them out later).
"""
import base64, json, subprocess, sys, urllib.request
from pathlib import Path

OUT = Path(__file__).parent / "local-art"
API = "http://127.0.0.1:7860/sdapi/v1/txt2img"

# id: (objects, mood, note the picture stands for)
IDEAS = {
    "sprout": ("a small terracotta pot with one young green seedling with two leaves growing from the soil", "growing", "Small beginnings / still count."),
    "teacup": ("a delicate pink-and-cream porcelain teacup on a pale blue saucer, with two thin curls of steam rising", "tired", "Rest is part / of the work."),
    "candle": ("a single cream candle with a small glowing flame in a short grey stone holder", "hopeful", "One small light / is enough to begin."),
    "umbrella": ("an open plum-and-rose umbrella with a wooden handle and three small raindrops falling beside it", "anxious", "You don't have to / outrun the rain. / Just keep a little cover."),
    "paper-boat": ("a small folded white paper boat with a blush-pink sail, floating on a few soft blue brushstrokes of water", "wanderlust", "Fold the map. / Set out anyway."),
    "feather": ("a single soft lavender-blue feather drifting, with a dark central spine", "letting-go", "Hold it lightly. / It was never / yours to carry."),
    "mended-heart": ("a small blush-pink heart with a crack down the middle neatly stitched closed with a thin rose-pink thread", "heartbroken", "Mended is not the same / as unbroken. / It's stronger / in the stitched places."),
    "daisy": ("a single white daisy with blush-tinged petals, a soft peach centre, a green stem and two leaves", "proud", "Look how far / this quiet bloom has come."),
    "mountains": ("two small soft green mountains with snowy tips, a pale winding path, and a small peach sun above", "brave", "You don't need the whole path. / Just the next step."),
    "balloon": ("a single round coral balloon with a thin string floating upward", "excited", "Something good / is already on its way up."),
    "rain-cloud": ("a soft blue-grey rain cloud with a few small rain streaks falling beneath it", "calm", "Even rain / is only passing through."),
    "butterfly": ("a butterfly with lavender, blue and pink wings and a slender dark body, wings spread", "growing", "You were never behind. / You were becoming."),
    "autumn-leaf": ("a single peach-and-coral autumn leaf with fine veins and a thin brown stem", "letting-go", "Letting go / is how the tree / makes room."),
    "seed": ("a small brown seed in a patch of dark soil with a tiny green sprout of two leaves rising from it", "hopeful", "Not yet is not never. / Keep the soil kind."),
    "suitcase": ("a small brown leather suitcase with a handle, a buckle strap and a round blue travel sticker with a tiny heart", "wanderlust", "Pack light. / Bring home / the people you meet."),
    "stones": ("a small balanced stack of five smooth stones in grey, blush and lilac", "calm", "Balance isn't standing still. / It's small adjustments, / kindly made."),
    "two-cups": ("two small mugs side by side, one blush-pink with a curl of steam, one dusty blue", "friends", "Home is wherever / someone sets out / a second cup."),
    "moon": ("a soft lilac-and-indigo crescent moon with two or three tiny stars", "lonely", "Even the moon / keeps company / with the stars."),
    "open-book": ("a small open book with cream pages and fine handwritten lines, a brown cover, and one tiny pressed flower", "nostalgic", "Some days / are still / my favourite page."),
    "house": ("a tiny cream cottage with a terracotta roof, a brown door, two softly lit yellow windows and a little chimney", "grateful", "A lit window, / a warm door. / Enough is a feast."),
    "tulips": ("a small bunch of three tulips in rose, plum and peach with green stems and leaves", "in-love", "Love is just / paying attention / on purpose."),
    "heart-dish": ("a small rose-pink heart resting gently on a shallow blush-and-cream dish", "in-love", "Hold it gently. / It's made of / everyone who held you."),
}

PROMPT = ("A small, simple hand-painted watercolor still life, centred on a plain pure white background: {o}. "
          "Loose, soft watercolor washes with delicate fine pencil outlines, muted natural tones, a gentle soft shadow "
          "under the objects, minimal and calm, only these objects and nothing else, lots of empty white space around them. "
          "No table, no scenery, no text, no letters, no border."
          " Style must be traditional hand-painted illustration: gouache and watercolor with visible brush strokes, "
          "dry-brush edges, soft paper grain and loose painterly shapes, like an original painting on paper. "
          "NOT anime, NOT Studio Ghibli, NOT cel-shaded, no 3D render.")


def stray_text(png):
    """FLUX likes to sign its paintings with fake letters/dates. Apple's on-device Vision finds them (tools/find_text.swift)."""
    exe = OUT / ".find_text"
    if not exe.exists():
        subprocess.run(["swiftc", "-O", str(Path(__file__).parent / "find_text.swift"), "-o", str(exe)], check=True)
    r = subprocess.run([str(exe), str(png)], capture_output=True, text=True)
    return [tuple(map(float, ln.split())) for ln in r.stdout.splitlines() if ln.strip()]


def make(name, objects, tries=5):
    for i in range(tries):
        make_once(name, objects)
        boxes = stray_text(OUT / f"{name}.png")
        if not boxes:
            return
        print(f"  {name}: found lettering {len(boxes)}x, repainting ({i + 1}/{tries})", flush=True)
    # still signed after every try: paint the paper over it
    from PIL import Image, ImageDraw
    im = Image.open(OUT / f"{name}.png").convert("RGB")
    d = ImageDraw.Draw(im)
    for x, y, w, h in boxes:
        W, H = im.size
        d.rectangle([(x - .02) * W, (y - .02) * H, (x + w + .02) * W, (y + h + .02) * H], fill=im.getpixel((5, 5)))
    im.save(OUT / f"{name}.png")


def make_once(name, objects):
    body = {"prompt": PROMPT.format(o=objects), "negative_prompt": "text, letters, frame, border, photo, 3d, anime",
            "width": 1024, "height": 1024, "steps": 4, "guidance_scale": 1, "seed": -1,
            "model": "flux_1_schnell_q8p.ckpt", "batch_size": 1}
    req = urllib.request.Request(API, json.dumps(body).encode(), {"Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=600))
    (OUT / f"{name}.png").write_bytes(base64.b64decode(r["images"][0].split(",")[-1]))


def main():
    OUT.mkdir(exist_ok=True)
    if "symbols" in sys.argv:
        sys.path.insert(0, str(Path(__file__).parent))
        from symbols import SYMBOLS
        IDEAS.update(SYMBOLS)
    if "symbols2" in sys.argv:
        sys.path.insert(0, str(Path(__file__).parent))
        from symbols2 import SYMBOLS as S2
        IDEAS.update(S2)
    todo = [(k, v[0]) for k, v in IDEAS.items() if not (OUT / f"{k}.png").exists()]
    if "all" not in sys.argv and "symbols" not in sys.argv and "symbols2" not in sys.argv:
        todo = todo[:2]
    for k, o in todo:
        print("painting", k, flush=True)
        make(k, o)
    print("done →", OUT)


if __name__ == "__main__":
    main()
