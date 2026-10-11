"""Brand assets from Lea's logo (tools/brand/overleyz-logo.png): the wordmark cut out of its watercolour
planes (light + dark-mode versions) and the Z mark as the site icon. Run: python tools/brand.py"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools/brand/overleyz-logo.png"
OUT = ROOT / "public/assets"
BG = np.array([236, 242, 252], float)        # the pale blue the letters sit on


def cutout():
    im = np.asarray(Image.open(SRC).convert("RGB"), float)
    g = im[..., 1]
    a = np.clip((215 - g) / 95, 0, 1)        # letters are dark/saturated (G < 120), planes are pale (G > 230)
    rgb = (im - (1 - a[..., None]) * BG) / np.maximum(a[..., None], 1e-3)
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    img = Image.fromarray(out)
    return img.crop(img.getbbox())


def lighten(img):
    """Dark mode: the deep violet letters become soft lavender; the gradient Z keeps its colour, lifted a little."""
    arr = np.asarray(img).astype(float)
    rgb, a = arr[..., :3], arr[..., 3:]
    dark = (rgb.sum(-1, keepdims=True) < 200).astype(float)        # the violet "overley"
    lav = np.array([236, 226, 250], float)
    rgb = dark * lav + (1 - dark) * np.clip(rgb * 1.25 + 30, 0, 255)
    return Image.fromarray(np.dstack([rgb, a]).astype(np.uint8))


def icon(size=512):
    """The logo's idea in a square: a pale watercolour plane with the violet-to-berry Z laid over it."""
    from PIL import ImageDraw, ImageFont
    k = size / 512
    img = Image.new("RGBA", (size, size), (251, 252, 254, 255))
    plane = Image.new("RGBA", (size, size))
    ImageDraw.Draw(plane).polygon([(150 * k, 70 * k), (470 * k, 30 * k), (362 * k, 440 * k), (42 * k, 480 * k)],
                                  fill=(214, 230, 250, 255))
    img.alpha_composite(plane)
    font = ImageFont.truetype(str(Path.home() / "Library/Fonts/Poppins-Bold.ttf"), int(420 * k))
    mask = Image.new("L", (size, size))
    d = ImageDraw.Draw(mask)
    box = d.textbbox((0, 0), "Z", font=font)
    d.text(((size - box[2] - box[0]) / 2, (size - box[3] - box[1]) / 2), "Z", font=font, fill=255)
    mask = mask.transform(mask.size, Image.AFFINE, (1, 0.18, -0.09 * size, 0, 1, 0), Image.BICUBIC)   # lean like the logo
    x = np.linspace(0, 1, size)[None, :, None]
    grad = (1 - x) * np.array([45, 3, 88]) + x * np.array([168, 63, 132])
    grad = np.broadcast_to(grad, (size, size, 3)).astype(np.uint8)
    img.paste(Image.fromarray(grad), (0, 0), mask)
    return img.convert("RGB")


def main():
    word = cutout()
    h = 120
    w = round(word.width * h / word.height)
    small = word.resize((w, h), Image.LANCZOS)
    small.save(OUT / "logo.webp", quality=92, method=6)
    lighten(small).save(OUT / "logo-dark.webp", quality=92, method=6)
    icon().save(OUT / "icon.png", optimize=True)
    print("logo", small.size, "icon 512")


if __name__ == "__main__":
    main()
