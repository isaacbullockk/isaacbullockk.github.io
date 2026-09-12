#!/usr/bin/env python3
"""Generate synthetic chat screenshots (PIL) for the OCR multi-pass harness.

Each style writes:
  test-images/<style>.png   — reference image
  test-images/<style>.rgba  — raw RGBA bytes (what the app decodes in-browser)
  test-images/<style>.json  — {width, height, expected: [{sender, text}]}
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "test-images")
os.makedirs(OUT, exist_ok=True)

W, H = 1170, 2200
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
F_MSG = ImageFont.truetype(f"{FONT_DIR}/DejaVuSans.ttf", 40)
F_SMALL = ImageFont.truetype(f"{FONT_DIR}/DejaVuSans.ttf", 30)
F_HEADER = ImageFont.truetype(f"{FONT_DIR}/DejaVuSans-Bold.ttf", 36)

MARGIN = 36
BUBBLE_PAD_X = 28
BUBBLE_PAD_Y = 20
BUBBLE_GAP = 26
LINE_GAP = 10
RADIUS = 38
MAX_BUBBLE_W = int(W * 0.68)


def wrap(draw, text, font, max_w):
    words = text.split(" ")
    lines, cur = [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def text_size(draw, s, font):
    box = draw.textbbox((0, 0), s, font=font)
    return box[2] - box[0], box[3] - box[1] + 8


def draw_status_bar(draw, fg):
    draw.text((48, 28), "9:41", font=F_SMALL, fill=fg)
    # fake signal/wifi/battery glyphs
    draw.rectangle([W - 220, 40, W - 190, 66], outline=fg, width=3)
    draw.rectangle([W - 216, 44, W - 200, 62], fill=fg)
    draw.text((W - 330, 30), "5G", font=F_SMALL, fill=fg)


def draw_header(draw, name, fg, sub=None):
    tw = draw.textlength(name, font=F_HEADER)
    draw.text(((W - tw) / 2, 120), name, font=F_HEADER, fill=fg)
    if sub:
        sw = draw.textlength(sub, font=F_SMALL)
        draw.text(((W - sw) / 2, 175), sub, font=F_SMALL, fill=fg)


def layout_bubbles(draw, messages, her_fill, her_fg, you_fill, you_fg, start_y):
    y = start_y
    for sender, text in messages:
        font = F_MSG
        lines = wrap(draw, text, font, MAX_BUBBLE_W - 2 * BUBBLE_PAD_X)
        line_hs = [text_size(draw, l, font)[1] for l in lines]
        text_w = max(draw.textlength(l, font=font) for l in lines)
        bw = int(text_w + 2 * BUBBLE_PAD_X)
        bh = int(sum(line_hs) + LINE_GAP * (len(lines) - 1) + 2 * BUBBLE_PAD_Y)
        if sender == "her":
            x0 = MARGIN
            fill, fg = her_fill, her_fg
        else:
            x0 = W - MARGIN - bw
            fill, fg = you_fill, you_fg
        draw.rounded_rectangle([x0, y, x0 + bw, y + bh], radius=RADIUS, fill=fill)
        ty = y + BUBBLE_PAD_Y
        for l, lh in zip(lines, line_hs):
            draw.text((x0 + BUBBLE_PAD_X, ty), l, font=font, fill=fg)
            ty += lh + LINE_GAP
        y += bh + BUBBLE_GAP
    return y


def save(style, img, expected):
    img.save(f"{OUT}/{style}.png")
    with open(f"{OUT}/{style}.rgba", "wb") as f:
        f.write(img.convert("RGBA").tobytes())
    with open(f"{OUT}/{style}.json", "w") as f:
        json.dump(
            {"width": img.width, "height": img.height,
             "expected": [{"sender": s, "text": t} for s, t in expected]},
            f, indent=2,
        )
    print(f"wrote {style} ({img.width}x{img.height}, {len(expected)} messages)")


CONVO = [
    ("her", "okay be honest, did you actually make that pasta from scratch?"),
    ("you", "Hand cut, flour everywhere, kitchen looked like a crime scene. But yes."),
    ("her", "hahaha respect. I have been trying carbonara for months and it turns into scrambled eggs"),
    ("you", "The trick is taking the pan off the heat first. I could teach you, but it costs you wine"),
    ("her", "deal!! there is a natural wine place near me that changed my life"),
    ("you", "Strong opinions on pasta and a wine hookup. Thursday, my kitchen, 7pm?"),
]


def imessage(right_fill, style):
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    draw_status_bar(d, "#000000")
    draw_header(d, "Alex", "#000000")
    # centered day separator pill
    pill = "Today 6:32 PM"
    pw = d.textlength(pill, font=F_SMALL)
    d.text(((W - pw) / 2, 250), pill, font=F_SMALL, fill="#8E8E93")
    layout_bubbles(d, CONVO, "#E9E9EB", "#000000", right_fill, "#FFFFFF", start_y=330)
    save(style, img, CONVO)


def whatsapp_dark():
    img = Image.new("RGB", (W, H), "#0B141A")
    d = ImageDraw.Draw(img)
    draw_status_bar(d, "#E9EDEF")
    draw_header(d, "Alex", "#E9EDEF")
    layout_bubbles(d, CONVO, "#1F2C34", "#E9EDEF", "#005C4B", "#E9EDEF", start_y=300)
    save("whatsapp-dark", img, CONVO)


def instagram_dark():
    img = Image.new("RGB", (W, H), "#000000")
    d = ImageDraw.Draw(img)
    draw_status_bar(d, "#FFFFFF")
    draw_header(d, "alex.makes.pasta", "#FFFFFF", sub="Active now")
    layout_bubbles(d, CONVO, "#262626", "#FFFFFF", "#7C3AED", "#FFFFFF", start_y=330)
    save("instagram-dark", img, CONVO)


imessage("#007AFF", "imessage-light")
imessage("#34C759", "imessage-sms-green")
whatsapp_dark()
instagram_dark()
