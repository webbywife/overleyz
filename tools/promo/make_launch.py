"""TikTok launch video for overleyz (1080×1920, ~15 s): the real app (check-in → soft post → LOUD flip),
quick cuts of finished posts, and an end card. Music: one of Ley's own leyzays songs. All local, no credits.
Run after record.mjs and posts.mjs:  python make_launch.py <work dir> <out.mp4>"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import brand  # noqa: E402  (the logo cut-out)

W, H = 1080, 1920
ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = Path.home() / "Library/Fonts"
BOLD = str(FONTS / "Poppins-Bold.ttf")
ANTON = str(ROOT / "tools/brand/fonts/Anton-Regular.ttf")
INK, BERRY, NIGHT, ACID = (45, 3, 88), (168, 63, 132), (11, 7, 16), (215, 255, 58)
MUSIC = ROOT / "public/assets/music/it-didnt-work-you-still-grew.m4a"


def font(path, size):
    return ImageFont.truetype(path, size)


def planes(bg, tones):
    """The logo's slanted watercolour planes."""
    img = Image.new("RGB", (W, H), bg)
    layer = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(layer)
    for (x, y, w, h), c in zip([(420, 120, 760, 520), (-160, 760, 760, 380), (520, 1280, 700, 360)], tones):
        sk = h * 0.55
        d.polygon([(x + sk, y), (x + w + sk, y - 90), (x + w, y + h - 90), (x, y + h)], fill=c)
    return Image.alpha_composite(img.convert("RGBA"), layer.filter(ImageFilter.GaussianBlur(2))).convert("RGB")


def caption(text, path, loud=False):
    """A lower-third pill, kept clear of TikTok's buttons (right) and caption area (bottom)."""
    f = font(ANTON if loud else BOLD, 74 if loud else 52)
    tw = ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)
    pad = 38
    img = Image.new("RGBA", (int(tw + pad * 2), 120 if loud else 104))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=img.height // 2, fill=ACID + (255,) if loud else INK + (238,))
    d.text((img.width / 2, img.height / 2 + 2), text, font=f, anchor="mm", fill=NIGHT if loud else (255, 255, 255))
    img.save(path)


def post_frame(post, loud, label, path):
    bg = planes(NIGHT, [(255, 46, 136, 50), (29, 43, 255, 46), (215, 255, 58, 22)]) if loud \
        else planes((250, 251, 254), [(220, 233, 251, 255), (234, 241, 252, 255), (236, 230, 248, 255)])
    im = Image.open(post).convert("RGB")
    w = 900; im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    x, y = (W - w) // 2, 330
    shadow = Image.new("RGBA", (W, H)); ImageDraw.Draw(shadow).rounded_rectangle((x + 10, y + 30, x + w + 10, y + im.height + 40), 30, fill=(0, 0, 0, 120 if loud else 55))
    bg = Image.alpha_composite(bg.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(28))).convert("RGB")
    mask = Image.new("L", im.size); ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), 26, fill=255)
    bg.paste(im, (x, y), mask)
    d = ImageDraw.Draw(bg)
    if loud: d.text((W / 2, 220), label, font=font(ANTON, 120), anchor="mm", fill=ACID)
    else: d.text((W / 2, 220), label, font=font(BOLD, 70), anchor="mm", fill=INK)
    bg.save(path, quality=95)


def end_card(path):
    bg = planes((250, 251, 254), [(220, 233, 251, 255), (234, 241, 252, 255), (236, 230, 248, 255)]).convert("RGBA")
    logo = brand.cutout()
    lw = 760; logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    bg.alpha_composite(logo, ((W - lw) // 2, 560))
    d = ImageDraw.Draw(bg)
    d.text((W / 2, 900), "How are you today?", font=font(BOLD, 66), anchor="mm", fill=INK)
    soft = "Say it softly, or "; f1, f2 = font(BOLD, 56), font(ANTON, 86)
    tw = d.textlength(soft, font=f1) + d.textlength("LOUDLY.", font=f2)
    x = (W - tw) / 2
    d.text((x, 1010), soft, font=f1, anchor="lm", fill=INK)
    d.text((x + d.textlength(soft, font=f1), 1006), "LOUDLY.", font=f2, anchor="lm", fill=BERRY)
    pill = (W / 2 - 300, 1130, W / 2 + 300, 1250)
    grad = Image.new("RGBA", (int(pill[2] - pill[0]), 120))
    for i in range(grad.width):
        u = i / grad.width
        ImageDraw.Draw(grad).line([(i, 0), (i, 120)], fill=tuple(int(a + (b - a) * u) for a, b in zip(INK, (168, 64, 127))) + (255,))
    m = Image.new("L", grad.size); ImageDraw.Draw(m).rounded_rectangle((0, 0, grad.width - 1, 119), 60, fill=255)
    bg.paste(grad, (int(pill[0]), int(pill[1])), m)
    d.text((W / 2, 1190), "overleyz.art", font=font(BOLD, 60), anchor="mm", fill=(255, 255, 255))
    d.text((W / 2, 1320), "free  ·  no sign-up  ·  your photos stay on your phone", font=font(str(FONTS / "Poppins-Regular.ttf"), 34), anchor="mm", fill=(98, 85, 121))
    bg.convert("RGB").save(path, quality=95)


def run(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def main():
    WORK, OUT = Path(sys.argv[1]), Path(sys.argv[2])
    m = json.loads((WORK / "marks.json").read_text())
    start, end = m["welcome"] + 0.2, m["end"]
    caption("this app asks how you are first", WORK / "cap1.png")
    caption("then turns it into a post", WORK / "cap2.png")
    caption("OR MAKE IT LOUD", WORK / "cap3.png", loud=True)
    # 1) the app, with captions
    t_tap, t_loud = m["tap"] - start, m["loud"] - start
    run("-ss", f"{start:.2f}", "-to", f"{end:.2f}", "-i", str(WORK / "app.mp4"),
        "-i", str(WORK / "cap1.png"), "-i", str(WORK / "cap2.png"), "-i", str(WORK / "cap3.png"),
        "-filter_complex",
        f"[0:v]setpts=PTS-STARTPTS[v];"
        f"[v][1:v]overlay=(W-w)/2:1430:enable='lt(t,{t_tap:.2f})'[a];"
        f"[a][2:v]overlay=(W-w)/2:1430:enable='between(t,{t_tap + 0.3:.2f},{t_loud:.2f})'[b];"
        f"[b][3:v]overlay=(W-w)/2:1430:enable='gte(t,{t_loud + 0.2:.2f})',fps=30,format=yuv420p[out]",
        "-map", "[out]", "-c:v", "libx264", "-crf", "18", str(WORK / "part1.mp4"))
    # 2) quick cuts of finished posts
    cuts = [("soft-1", False, "soft"), ("loud-1", True, "LOUD"), ("soft-2", False, "soft"), ("loud-2", True, "LOUD"), ("loud-3", True, "LOUDER")]
    for name, loud, label in cuts:
        post_frame(WORK / f"{name}.png", loud, label, WORK / f"f-{name}.jpg")
    end_card(WORK / "end.jpg")
    lst = "".join(f"file 'f-{n}.jpg'\nduration 0.85\n" for n, _, _ in cuts) + "file 'end.jpg'\nduration 3.2\nfile 'end.jpg'\n"
    (WORK / "cuts.txt").write_text(lst)
    run("-f", "concat", "-safe", "0", "-i", str(WORK / "cuts.txt"), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", str(WORK / "part2.mp4"))
    # 3) join + music (song looped once with a crossfade, fades out at the end)
    (WORK / "parts.txt").write_text("file 'part1.mp4'\nfile 'part2.mp4'\n")
    run("-f", "concat", "-safe", "0", "-i", str(WORK / "parts.txt"), "-c", "copy", str(WORK / "silent.mp4"))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(WORK / "silent.mp4")]))
    run("-i", str(WORK / "silent.mp4"), "-i", str(MUSIC), "-i", str(MUSIC),
        "-filter_complex", f"[1:a][2:a]acrossfade=d=1.5[m];[m]atrim=0:{dur:.2f},afade=t=in:d=0.4,afade=t=out:st={dur - 1.6:.2f}:d=1.6[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUT))
    run("-i", str(WORK / "silent.mp4"), "-c", "copy", "-movflags", "+faststart", str(OUT.with_name(OUT.stem + "-no-music.mp4")))
    Image.open(WORK / "f-loud-1.jpg").save(OUT.with_name(OUT.stem + "-cover.jpg"), quality=92)
    print(OUT, f"{dur:.1f}s")


if __name__ == "__main__":
    main()
