"""Build brand assets for the KLM Online School of Ministry site.

The crest is supplied as a studio artwork on black. Leadership portraits are
supplied as standalone photographs. Deck media is used only for the cohort
flyer when that extraction cache is present.
"""

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(os.environ["TEMP"], "somppt", "ppt", "media")
SRC = os.path.join(ROOT, "assets", "src")
OUT = os.path.join(ROOT, "assets", "img")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SRC, exist_ok=True)

# Portraits supplied as standalone photographs rather than lifted from the deck.
# Boxes are cropped to 4:5 to match .person__portrait, head centred with headroom.
# Only the Chancellor's portrait is published; the other Senate and administration
# portraits exist in the deck solely as low-resolution crops of a slide graphic,
# so they are not extracted. Supply a studio photograph to publish one.
SUPPLIED = {
    "leader-igho.jpg": ("rev-fred-igho.jpg", (213, 30, 637, 560)),
}


def save(img, path, width=None, quality=88):
    if width and img.width > width:
        h = round(img.height * width / img.width)
        img = img.resize((width, h), Image.LANCZOS)
    if path.lower().endswith((".jpg", ".jpeg")):
        img.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    else:
        img.save(path, optimize=True)
    print(os.path.basename(path), img.size)


def knock_black_ground(img):
    """Flood-fill near-black from the corners so enclosed black of the letter
    and the shield border stay put; only the surrounding studio ground goes."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.width, img.height

    def is_bg(c):
        r, g, b, a = c
        return a > 0 and r < 18 and g < 18 and b < 18

    seen = set()
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        if not is_bg(px[x, y]):
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    cropped = img.crop(img.getbbox())
    px2 = cropped.load()
    for y in range(cropped.height):
        for x in range(cropped.width):
            r, g, b, a = px2[x, y]
            if a and a < 255 and r < 28 and g < 28 and b < 28:
                px2[x, y] = (0, 0, 0, 0)
    return cropped


for name, (source, box) in SUPPLIED.items():
    path = os.path.join(SRC, source)
    if not os.path.isfile(path):
        print("skip portrait: %s not present" % source)
        continue
    save(Image.open(path).crop(box), os.path.join(OUT, name), width=640)

# Preferred crest: studio artwork on black, kept under assets/src.
crest_src = os.path.join(SRC, "crest-source.png")
# Fall back to a previously published source copy if src/ is empty.
if not os.path.isfile(crest_src):
    alt = os.path.join(OUT, "crest-source.png")
    if os.path.isfile(alt):
        crest_src = alt

if os.path.isfile(crest_src):
    crest = knock_black_ground(Image.open(crest_src))
    save(crest, os.path.join(OUT, "crest.png"), width=720)
else:
    print("skip crest: no crest-source.png under assets/src or assets/img")

# The deck itself is not committed, so skip its derivatives once they are built.
if not os.path.isdir(MEDIA):
    print("skipping deck extraction: %s not present" % MEDIA)
    raise SystemExit(0)

save(Image.open(os.path.join(MEDIA, "image1.jpeg")), os.path.join(OUT, "cohort-flyer.jpg"), width=1280)
