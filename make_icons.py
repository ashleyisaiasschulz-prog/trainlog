"""Generate TrainLog PWA app icons (belt motif on dark, red accent)."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "public")
os.makedirs(OUT, exist_ok=True)

BG    = (9, 9, 11)       # zinc-950
RED   = (239, 68, 68)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

def rounded(draw, xy, r, fill):
    draw.rounded_rectangle(xy, radius=r, fill=fill)

def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = int(size * (0.16 if maskable else 0.0))  # safe-area padding for maskable
    inner = size - pad * 2

    # Rounded background tile
    radius = int(inner * (0.5 if maskable else 0.22))
    rounded(d, [pad, pad, pad + inner, pad + inner], radius, RED if not maskable else RED)

    # Belt motif: a horizontal belt with black tip + white stripes
    belt_h = int(inner * 0.26)
    belt_y = pad + inner // 2 - belt_h // 2
    belt_x0 = pad + int(inner * 0.12)
    belt_x1 = pad + inner - int(inner * 0.12)
    belt_w = belt_x1 - belt_x0
    br = belt_h // 2

    # belt body (white)
    body_w = int(belt_w * 0.62)
    d.rounded_rectangle([belt_x0, belt_y, belt_x0 + body_w, belt_y + belt_h], radius=br, fill=WHITE)
    # black tip
    tip_x = belt_x0 + body_w
    tip_w = int(belt_w * 0.30)
    d.rectangle([tip_x, belt_y, tip_x + tip_w, belt_y + belt_h], fill=BLACK)
    # stripes on tip
    sw = max(3, int(tip_w * 0.10))
    gap = sw
    n = 3
    total = n * sw + (n - 1) * gap
    sx = tip_x + (tip_w - total) // 2
    sh = int(belt_h * 0.6)
    sy = belt_y + (belt_h - sh) // 2
    for i in range(n):
        d.rectangle([sx + i * (sw + gap), sy, sx + i * (sw + gap) + sw, sy + sh], fill=WHITE)
    # tail (white)
    tail_x = tip_x + tip_w
    d.rounded_rectangle([tail_x - br, belt_y, belt_x1, belt_y + belt_h], radius=br, fill=WHITE)

    return img

# Standard icons (transparent corners)
for s in (192, 512):
    make_icon(s).save(os.path.join(OUT, f"icon-{s}.png"))

# Maskable (full-bleed red, safe area) for Android adaptive icons
make_icon(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))

# Apple touch icon (no transparency; dark bg behind tile)
apple = Image.new("RGBA", (180, 180), BG + (255,))
tile = make_icon(180).convert("RGBA")
apple.alpha_composite(tile)
apple.convert("RGB").save(os.path.join(OUT, "apple-icon.png"))

# Favicon
make_icon(64).save(os.path.join(OUT, "icon.png"))

print("Icons generated in", OUT)
