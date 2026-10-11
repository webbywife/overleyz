#!/usr/bin/env python3
"""Build overleyz web assets from the leyzays projects (no new art, no AI credits).

    python3 tools/build_assets.py        # → public/assets/** + public/assets/catalog.json (skips files already built)

Sources: ~/ig-quotes/blank-full (text-free paintings), travel photos (travel_plan + auto_plan), sticker cut-outs
(journal web/, planner stickers, simple-style vignettes), 454 quotes from the leyzays site, fonts.
"""
import json, shutil, sys
from pathlib import Path
from PIL import Image, ImageOps

HOME = Path.home()
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets"
IGQ = HOME / "ig-quotes"
sys.path.insert(0, str(IGQ))
import travel_posts as tp  # noqa: E402  (finds the clean, un-stamped photos)
sys.path.insert(0, str(ROOT / "tools"))
from classics import CLASSICS, MOODS, THEME_MOOD  # noqa: E402

EXTRA = {"gratefulness": "grateful", "moving on": "letting-go", "self-reflection": "growing", "past": "growing",
         "contentment": "grateful", "forgiveness": "letting-go"}


def mood_of(theme):
    t = theme.replace("-", " ").strip().lower()
    return THEME_MOOD.get(t) or EXTRA.get(t) or EXTRA.get(theme) or ""


def save(im, path, size, quality=78, fmt="WEBP"):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    im = im.copy()
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(path, fmt, quality=quality, method=6)


def backgrounds():
    out = []
    for f in sorted((IGQ / "blank-full").glob("*.png")):
        key = f.stem
        theme = key.split("-", 1)[1].replace("-", " ") if "-" in key else ""
        im = None
        for size, sub in ((1350, "bg"), (300, "bg/t")):
            p = OUT / sub / f"{key}.webp"
            if not p.exists():
                im = im or Image.open(f).convert("RGB")
                save(im, p, size)
        out.append({"id": key, "theme": theme, "mood": mood_of(theme)})
    return out


def photos():
    out, seen = [], set()
    plans = [json.loads((IGQ / n).read_text()) for n in ("travel_plan.json", "auto_plan.json") if (IGQ / n).exists()]
    names = {p["slug"]: p["name"] for p in json.loads((tp.PHOTOS / "photos.json").read_text())["places"]}
    for plan in plans:
        for p in plan:
            if p["photo"] in seen:
                continue
            seen.add(p["photo"])
            key = Path(p["photo"]).stem
            src = tp.source_for(p["place"], p["photo"])
            if not src.exists():
                continue
            im = None
            for size, sub in ((1600, "photo"), (300, "photo/t")):
                q = OUT / sub / f"{key}.webp"
                if not q.exists():
                    im = im or ImageOps.exif_transpose(Image.open(src)).convert("RGB")
                    save(im, q, size)
            out.append({"id": key, "place": names.get(p["place"], p["place"]), "scene": p.get("scene", ""), "mood": mood_of(p.get("theme", ""))})
    return out


SKIP = {"newcomer-cookie-laughing"}   # cut-out still has a patch of floor

# Sugar Valley character poses → overleyz moods (plain portraits get no mood and show for every mood)
POSE_MOOD = {
    "brave": "brave", "determined": "brave", "resolute": "brave", "cheering": "brave", "protective": "brave",
    "joyful": "grateful", "celebrating": "grateful", "laughing": "grateful", "grateful": "grateful", "excited": "grateful",
    "proud": "grateful", "eureka": "grateful", "impressed": "grateful", "handshake": "friends", "welcoming": "friends",
    "welcomed": "friends", "teaching": "friends", "listening": "friends", "comforting": "friends", "warm": "in-love",
    "soft": "in-love", "gentle": "in-love", "worried": "heartbroken", "vulnerable": "heartbroken", "nervous": "heartbroken",
    "concerned": "heartbroken", "panicked": "heartbroken", "sorry": "letting-go", "shy": "growing", "annoyed": "letting-go",
    "hopeful": "hopeful", "relieved": "letting-go", "calm": "tired", "settled": "tired", "thoughtful": "growing",
    "surprised": "wanderlust", "spinning": "wanderlust", "confused": "growing", "announcing": "hopeful",
}


def simple():
    """The leyzays 'simple' style: watercolour vignettes that sit on pastel paper (cut-outs reused from stickers)."""
    import generate as g   # ~/ig-quotes: post number → theme
    out = []
    for f in sorted((IGQ / "simple").glob("*-vignette.png")):
        num = int(f.stem.split("-")[0])
        theme = g.POSTS[num - 1][0] if 0 < num <= len(g.POSTS) else ""
        out.append({"id": f"st-{f.stem}", "theme": theme, "mood": mood_of(theme)})
    return out


def grain():
    """A tileable paper grain (transparent, multiplied over the pastel) — same feel as the simple-style paper."""
    p = OUT / "paper-grain.webp"
    if p.exists():
        return
    import numpy as np
    rng = np.random.default_rng(7)
    n = rng.normal(0, 1, (256, 256))
    from PIL import ImageFilter
    fine = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.7))
    a = np.array(fine).astype(float)
    alpha = (np.abs(a - a.mean()) / 128 * 34).clip(0, 34).astype("uint8")
    rgb = np.where(a[..., None] > a.mean(), 255, 60).astype("uint8").repeat(3, 2)
    Image.fromarray(np.dstack([rgb, alpha])).save(p, "WEBP", quality=70)


def stickers():
    groups = {
        "Journal": sorted((HOME / "leyzays-brand/journal/web").glob("*.png")),
        "Seasons": sorted((HOME / "leyzays/resources/planner/stickers").glob("*/*.png")),
        "Still life": sorted((IGQ / "simple").glob("*-vignette.png")),
        "Sugar Valley": sorted(f for f in (HOME / "Desktop/0326/sweetestlovers/public/images/characters").glob("*.webp")
                               if f.stem not in SKIP),
    }
    out = []
    for group, files in groups.items():
        for f in files:
            key = f"{group[:2].lower()}-{f.parent.name}-{f.stem}" if group == "Seasons" else f"{group[:2].lower()}-{f.stem}"
            im = None
            p = OUT / "sticker" / f"{key}.webp"
            if not p.exists() and group == "Still life":
                import simple_style   # ~/ig-quotes: keys the watercolour off its paper, like the simple posts do
                save(simple_style.cut_out(f), p, 600, quality=82)
            if not p.exists():
                im = Image.open(f).convert("RGBA")
                bbox = im.getchannel("A").getbbox()
                if bbox:
                    im = im.crop(bbox)
                save(im, p, 600, quality=82)
            t = OUT / "sticker" / "t" / f"{key}.webp"      # small thumbnail for the picker grids
            if not t.exists():
                save(Image.open(p).convert("RGBA"), t, 200, quality=78)
            item = {"id": key, "group": group}
            if group == "Sugar Valley":
                pose = f.stem.rsplit("-", 1)[-1]
                item["mood"] = POSE_MOOD.get(pose, "")
                item["name"] = f.stem.replace("-", " ").title()
            out.append(item)
    return out


def quotes():
    posts = json.loads((HOME / "leyzays/database/data/posts.json").read_text())
    return sorted({(p["quote"], p["theme"].replace("-", " ")) for p in posts})


UNICODES = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+20B1,U+2122,U+2190-2193,U+2600-2606,U+2661,U+2665"


def webfont(src, dest):
    """Latin-only woff2 (letters, accents, curly quotes, dashes, ₱) — a few dozen KB instead of MBs."""
    from fontTools import subset
    subset.main([str(src), f"--unicodes={UNICODES}", "--flavor=woff2", "--layout-features=*", f"--output-file={dest}"])


def music(per_mood=3):
    """10-second clips of Ley's own leyzays songs (composed by ~/leyzays-brand/sound/compose.py), a few per mood."""
    import subprocess
    posts = json.loads((HOME / "leyzays/database/data/posts.json").read_text())
    media = HOME / "leyzays/storage/app/public/media"
    picked, out = {}, []
    for p in posts:
        m = mood_of(p["theme"])
        if m and (media / f"{p['slug']}.mp3").exists() and len(picked.setdefault(m, [])) < per_mood:
            picked[m].append(p)
    d = OUT / "music"
    d.mkdir(parents=True, exist_ok=True)
    for m, ps in picked.items():
        for p in ps:
            dest = d / f"{p['slug']}.m4a"
            if not dest.exists():
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(media / f"{p['slug']}.mp3"), "-t", "10",
                                "-af", "afade=t=in:d=0.4,afade=t=out:st=8.4:d=1.6", "-c:a", "aac", "-b:a", "96k",
                                "-map_metadata", "-1", str(dest)], check=True)
            out.append({"id": p["slug"], "mood": m, "title": p["quote"]})
    return out


def fonts():
    src = {"Kalam-Light.ttf": IGQ / "fonts/Kalam-Light.ttf", "Caveat-VF.ttf": IGQ / "fonts/Caveat-VF.ttf",
           "NanumPenScript-Regular.ttf": HOME / "leyzays-brand/fonts/NanumPenScript-Regular.ttf",
           "Newsreader-Italic.ttf": HOME / "leyzays-brand/fonts/Newsreader-Italic.ttf",
           "Poppins-SemiBold.ttf": HOME / "Library/Fonts/Poppins-SemiBold.ttf"}
    d = OUT / "fonts"
    d.mkdir(parents=True, exist_ok=True)
    for name, f in src.items():
        out = d / (Path(name).stem + ".woff2")
        if f.exists() and not out.exists():
            webfont(f, out)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fonts()
    grain()
    cat = {"moods": MOODS, "music": music(), "simple": simple(), "backgrounds": backgrounds(), "photos": photos(), "stickers": stickers(),
           "quotes": [{"q": q, "t": t, "m": mood_of(t), "by": "leyzays"} for q, t in quotes()]
           + [{"q": q, "m": m, "by": a, "work": w} for m, q, a, w in CLASSICS]}
    (OUT / "catalog.json").write_text(json.dumps(cat, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print({k: len(v) for k, v in cat.items()})


if __name__ == "__main__":
    main()
