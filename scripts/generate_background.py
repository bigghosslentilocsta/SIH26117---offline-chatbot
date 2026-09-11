"""
Generates a daytime MRPL refinery placeholder background image.
Replace frontend/public/mrpl-refinery.jpg with a real photograph for production use.
"""

from PIL import Image, ImageDraw
import math
import random

W, H = 1920, 1080

# --- Sky gradient (daytime) ---
img = Image.new("RGB", (W, H))
draw = ImageDraw.Draw(img)

top = (135, 183, 220)    # soft blue
horizon = (222, 235, 244)  # pale haze
for y in range(H):
    t = y / H
    r = int(top[0] + (horizon[0] - top[0]) * t)
    g = int(top[1] + (horizon[1] - top[1]) * t)
    b = int(top[2] + (horizon[2] - top[2]) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# --- Sun glow ---
sun_x, sun_y, sun_r = 1550, 180, 110
for i in range(sun_r, 0, -1):
    alpha = i / sun_r
    col = (255 - int(60 * alpha), 244 - int(40 * alpha), 214 - int(30 * alpha))
    draw.ellipse([sun_x - i, sun_y - i, sun_x + i, sun_y + i], fill=col)

# --- Distant hills/ground haze ---
draw.rectangle([0, 700, W, H], fill=(198, 208, 214))

# --- Helper for perspective ground lines ---
def ground_band(y1, y2, color):
    draw.rectangle([0, y1, W, y2], fill=color)

ground_colors = [
    (176, 191, 196),
    (164, 180, 186),
    (150, 168, 174),
    (138, 156, 163),
    (126, 146, 152),
]
gy = 700
step = (H - 700) / len(ground_colors)
for c in ground_colors:
    ground_band(int(gy), int(gy + step), c)
    gy += step

# --- Pipes & racks (horizontal runs) ---
def draw_pipe(x1, y, x2, y2, color, r=5):
    draw.rectangle([x1, y - r // 2, x2, y + r // 2], fill=color)

pipe_color = (150, 155, 160)
rack_y = 830
for i in range(7):
    draw_pipe(0, rack_y - i * 8, W, 0, pipe_color, r=7)

# --- Storage tanks ---
def tank(cx, base_y, w, h, color=(168, 176, 182), roof=(145, 152, 158)):
    x1, y1 = cx - w // 2, base_y - h
    draw.rounded_rectangle([x1, y1, x1 + w, base_y], radius=8, fill=color)
    draw.ellipse([x1, y1 - 8, x1 + w, y1 + 18], fill=roof)
    draw.rectangle([cx - 4, y1 - 20, cx + 4, y1 - 2], fill=(120, 126, 132))
    # vertical seam lines
    for k in range(1, 4):
        sx = x1 + k * w // 4
        draw.line([(sx, y1 + 4), (sx, base_y)], fill=(140, 148, 154))

tank(260, 760, 240, 210)
tank(60, 780, 180, 170)
tank(470, 730, 200, 230)
tank(640, 760, 220, 195)

# --- Distillation columns ---
def column(cx, base_y, w, h, top_y, body=(176, 182, 187)):
    x1 = cx - w // 2
    y1 = base_y - h
    draw.rounded_rectangle([x1, y1, x1 + w, base_y], radius=6, fill=body)
    # bands
    band_h = max(6, h // 16)
    for k in range(1, 12):
        by = y1 + k * (h // 12)
        if by < base_y - band_h:
            draw.rectangle([x1, by, x1 + w, by + band_h], fill=(160, 167, 172))
    # pipe stubs
    draw.rectangle([x1 + w, y1 + 60, x1 + w + 70, y1 + 84], fill=pipe_color)
    draw.rectangle([x1 - 50, y1 + 130, x1, y1 + 150], fill=pipe_color)
    draw.rectangle([x1 + w, y1 + 190, x1 + w + 80, y1 + 210], fill=pipe_color)
    # top dome
    draw.ellipse([cx - w // 2, top_y - 16, cx + w // 2, top_y + 26], fill=(165, 172, 177))
    # vent stack
    draw.rectangle([cx - 8, top_y - 46, cx + 2, top_y - 12], fill=(130, 137, 143))
    draw.rectangle([cx - 14, top_y - 52, cx + 8, top_y - 44], fill=(130, 137, 143))

col_colors = [(182, 188, 193), (170, 176, 181), (162, 168, 173)]
column(1050, 830, 150, 430, 400, col_colors[0])
column(1280, 830, 120, 520, 310, col_colors[1])
column(930, 860, 90, 300, 560, col_colors[2])

# --- Flare stack ---
def flare(cx, base_y):
    h = 640
    # tower
    for i in range(6):
        yy = base_y - (i * 20) - 20
        width = 16 - i * 2
        draw.line([(cx - width, yy), (cx + width, yy)], fill=(140, 145, 150))
    # truss diagonal hatch
    for i in range(1, 12):
        y_top = base_y - i * 50
        y_bot = y_top - 50
        draw.line([(cx, y_top), (cx, y_bot)], fill=(140, 145, 150))
    # tip
    draw.rectangle([cx - 12, base_y - h, cx + 12, base_y - h + 14], fill=(90, 95, 100))
    # flame
    flame_h = 42
    for i in range(3):
        fh = flame_h - i * 8
        fw = max(6, 16 - i * 5)
        col = [(250, 180, 40), (245, 120, 30), (235, 80, 20)][i]
        draw.ellipse([cx - fw, base_y - h - fh, cx + fw, base_y - h], fill=col)
    # light halo
    for i in range(40, 0, -1):
        col = (255, int(230 - i * 2), int(140 - i * 2))
        if col[1] < 0:
            col = (255, 0, 0)
        draw.ellipse([cx - i, base_y - h - 10 - i, cx + i, base_y - h + 12], outline=col)

flare(1580, 840)

# --- Small equipment / heat exchanger silhouettes ---
def small_vessel(cx, y, w, h):
    draw.rounded_rectangle([cx - w // 2, y - h, cx + w // 2, y], radius=10, fill=(156, 163, 168))
    draw.ellipse([cx - w // 2, y - h - 10, cx + w // 2, y - h + 10], fill=(140, 147, 152))

small_vessel(760, 890, 160, 70)
small_vessel(1430, 900, 130, 55)

# --- Distant buildings ---
for (bx, bw, bh) in [(1660, 90, 120), (1748, 70, 150), (1820, 100, 90)]:
    draw.rectangle([bx, 760 - bh, bx + bw, 760], fill=(150, 158, 164))
    for wy in range(760 - bh + 12, 760, 18):
        for wx in range(bx + 6, bx + bw - 6, 14):
            draw.rectangle([wx, wy, wx + 6, wy + 8], fill=(168, 175, 180))

# --- Faint smoke wisps from stacks ---
random.seed(42)
for (sx, sy) in [(1340, 300), (1100, 380), (900, 440)]:
    for i in range(6):
        dw = random.randint(4, 12)
        dh = random.randint(6, 16)
        alpha = 200 - i * 30
        col = (int(200 - i * 20), int(208 - i * 20), int(212 - i * 20))
        draw.ellipse([sx + i * 6 - dw // 2, sy + i * 8 - dh // 2,
                      sx + i * 6 + dw // 2, sy + i * 8 + dh // 2], fill=col)

# --- Clouds (wispy daytime) ---
random.seed(7)
for i in range(8):
    cx = random.randint(50, 1700)
    cy = random.randint(30, 280)
    cw = random.randint(90, 220)
    ch = random.randint(24, 42)
    col = (int(235 + random.randint(0, 15)), int(242 + random.randint(0, 8)), 248)
    draw.ellipse([cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2], fill=col)
    draw.ellipse([cx - cw // 3, cy - ch // 2 - 10, cx + cw * 2 // 5, cy + ch // 3], fill=col)

# Save
import os
out = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "mrpl-refinery.jpg")
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, "JPEG", quality=90)
print(f"Saved placeholder background: {os.path.abspath(out)}")