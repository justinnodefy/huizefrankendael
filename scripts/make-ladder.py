#!/usr/bin/env python3
"""Build the responsive image ladder from assets/masters into assets/ladder,
and write content/media.json — filename, width, height, bytes per variant —
so the build can emit correct srcset/width/height without guessing."""
import glob, json, os, re, sys
from PIL import Image, ImageOps

WIDTHS = [480, 800, 1200, 1600, 2400]
QUALITY = {480: 82, 800: 80, 1200: 74, 1600: 70, 2400: 62}

SRC = 'assets/masters'
OUT = 'assets/ladder'
os.makedirs(OUT, exist_ok=True)

def slugify(name):
    base = re.sub(r'\.(jpe?g|png|gif|webp)$', '', name, flags=re.I)
    base = re.sub(r'[^A-Za-z0-9]+', '-', base).strip('-').lower()
    return re.sub(r'-{2,}', '-', base)

manifest = {}
files = sorted(glob.glob(f'{SRC}/*'))
for f in files:
    name = os.path.basename(f)
    slug = slugify(name)
    try:
        im = Image.open(f)
        im = ImageOps.exif_transpose(im)
        if im.mode in ('P', 'RGBA'):
            im = im.convert('RGB')
        elif im.mode != 'RGB':
            im = im.convert('RGB')
    except Exception as e:
        print(f'SKIP {name}: {e}', file=sys.stderr)
        continue
    W, H = im.size
    widths = [w for w in WIDTHS if w <= W] or [W]
    variants = []
    for w in widths:
        h = round(H * w / W)
        out = f'{OUT}/{slug}-{w}.webp'
        if not os.path.exists(out):
            r = im.resize((w, h), Image.LANCZOS)
            q = QUALITY.get(w, 78 if w < 480 else 62)
            r.save(out, 'WEBP', quality=q, method=6)
        variants.append({'w': w, 'h': h, 'file': os.path.basename(out),
                         'kb': round(os.path.getsize(out) / 1024, 1)})
    manifest[slug] = {'master': name, 'width': W, 'height': H,
                      'variants': variants}

os.makedirs('content', exist_ok=True)
with open('content/media.json', 'w') as fh:
    json.dump(manifest, fh, indent=1, sort_keys=True)
total = sum(v['kb'] for m in manifest.values() for v in m['variants'])
print(f'{len(manifest)} images, {sum(len(m["variants"]) for m in manifest.values())} variants, {total/1024:.1f} MB total')
