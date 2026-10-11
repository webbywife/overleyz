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
            if not p.exists():
                im = Image.open(f).convert("RGBA")
                bbox = im.getchannel("A").getbbox()
                if bbox:
                    im = im.crop(bbox)
                save(im, p, 600, quality=82)
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


def fonts():
    src = {"Kalam-Light.ttf": IGQ / "fonts/Kalam-Light.ttf", "Caveat-VF.ttf": IGQ / "fonts/Caveat-VF.ttf",
           "NanumPenScript-Regular.ttf": HOME / "leyzays-brand/fonts/NanumPenScript-Regular.ttf",
           "Newsreader-Italic.ttf": HOME / "leyzays-brand/fonts/Newsreader-Italic.ttf",
           "Poppins-SemiBold.ttf": HOME / "Library/Fonts/Poppins-SemiBold.ttf"}
    d = OUT / "fonts"
    d.mkdir(parents=True, exist_ok=True)
    for name, f in src.items():
        if f.exists() and not (d / name).exists():
            shutil.copy(f, d / name)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fonts()
    cat = {"moods": MOODS, "backgrounds": backgrounds(), "photos": photos(), "stickers": stickers(),
           "quotes": [{"q": q, "t": t, "m": mood_of(t), "by": "leyzays"} for q, t in quotes()]
           + [{"q": q, "m": m, "by": a, "work": w} for m, q, a, w in CLASSICS]}
    (OUT / "catalog.json").write_text(json.dumps(cat, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print({k: len(v) for k, v in cat.items()})


if __name__ == "__main__":
    main()
