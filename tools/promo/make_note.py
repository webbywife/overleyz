"""Second TikTok/Reel for overleyz (1080×1920, ~21 s): "send a note, not just a text". The real app: Ley makes a note
and gets a link, then Mia opens it like a letter as the words appear. End card. Music: the leyzays song the note uses.
Run after record_note.mjs:  python make_note.py <work dir> <out.mp4>"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

from make_launch import W, H, BOLD, INK, BERRY, FONTS, ROOT, brand, caption, font, planes, run

MUSIC = ROOT / "public/assets/music/some-friendships-dont-age-they-just-get.m4a"


def end_card(path):
    bg = planes((250, 251, 254), [(220, 233, 251, 255), (234, 241, 252, 255), (236, 230, 248, 255)]).convert("RGBA")
    logo = brand.cutout()
    lw = 700; logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    bg.alpha_composite(logo, ((W - lw) // 2, 540))
    d = ImageDraw.Draw(bg)
    d.text((W / 2, 880), "Send a note,", font=font(BOLD, 70), anchor="mm", fill=INK)
    d.text((W / 2, 970), "not just a text.", font=font(BOLD, 70), anchor="mm", fill=BERRY)
    pill = (W / 2 - 300, 1090, W / 2 + 300, 1210)
    grad = Image.new("RGBA", (int(pill[2] - pill[0]), 120))
    for i in range(grad.width):
        u = i / grad.width
        ImageDraw.Draw(grad).line([(i, 0), (i, 120)], fill=tuple(int(a + (b - a) * u) for a, b in zip(INK, (168, 64, 127))) + (255,))
    m = Image.new("L", grad.size); ImageDraw.Draw(m).rounded_rectangle((0, 0, grad.width - 1, 119), 60, fill=255)
    bg.paste(grad, (int(pill[0]), int(pill[1])), m)
    d.text((W / 2, 1150), "overleyz.art", font=font(BOLD, 60), anchor="mm", fill=(255, 255, 255))
    d.text((W / 2, 1280), "free  ·  no sign-up  ·  the note lives in the link", font=font(str(FONTS / "Poppins-Regular.ttf"), 34), anchor="mm", fill=(98, 85, 121))
    bg.convert("RGB").save(path, quality=95)


def take(work, name, caps, y, lead=0.0):
    """One recorded take with its captions; caps = [(text, from mark, to mark or None)]."""
    m = json.loads((work / name / "marks.json").read_text())
    start = m["start"] + lead
    inputs, chain, last = [], "[0:v]setpts=PTS-STARTPTS[v0]", "v0"
    for k, (text, a, b) in enumerate(caps, 1):
        png = work / f"cap-{name}{k}.png"; caption(text, png); inputs += ["-i", str(png)]
        t0 = max(m[a] - start, 0) + (0.25 if k > 1 else 0)
        t1 = m[b] - start if b else 999
        chain += f";[{last}][{k}:v]overlay=(W-w)/2:{y}:enable='between(t,{t0:.2f},{t1:.2f})'[v{k}]"
        last = f"v{k}"
    run("-ss", f"{start:.2f}", "-to", f"{m['end']:.2f}", "-i", str(work / f"{name}.mp4"), *inputs,
        "-filter_complex", chain + f";[{last}]fps=30,format=yuv420p[out]", "-map", "[out]", "-c:v", "libx264", "-crf", "18", str(work / f"part-{name}.mp4"))


def main():
    work, out = Path(sys.argv[1]), Path(sys.argv[2])
    take(work, "a", [("don’t just text “miss you”", "start", "envelope"), ("send it as a little note", "envelope", None)], 1640, lead=0.6)
    take(work, "b", [("they get an envelope", "start", "open"), ("and open it like a letter", "open", None)], 1050)
    end_card(work / "end.jpg")
    run("-loop", "1", "-t", "3.4", "-i", str(work / "end.jpg"), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", str(work / "part-end.mp4"))
    (work / "parts.txt").write_text("file 'part-a.mp4'\nfile 'part-b.mp4'\nfile 'part-end.mp4'\n")
    run("-f", "concat", "-safe", "0", "-i", str(work / "parts.txt"), "-c", "copy", str(work / "silent.mp4"))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(work / "silent.mp4")]))
    run("-i", str(work / "silent.mp4"), "-i", str(MUSIC), "-i", str(MUSIC), "-i", str(MUSIC),
        "-filter_complex", f"[1:a][2:a]acrossfade=d=1.5[m1];[m1][3:a]acrossfade=d=1.5[m];[m]atrim=0:{dur:.2f},afade=t=in:d=0.4,afade=t=out:st={dur - 1.8:.2f}:d=1.8[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out))
    run("-i", str(work / "silent.mp4"), "-c", "copy", "-movflags", "+faststart", str(out.with_name(out.stem + "-no-music.mp4")))
    run("-sseof", "-0.5", "-i", str(work / "part-b.mp4"), "-frames:v", "1", "-q:v", "2", str(out.with_name(out.stem + "-cover.jpg")))
    print(out, f"{dur:.1f}s")


if __name__ == "__main__":
    main()
