"""Vectorise le VRAI logo Ma Selfie Box (PNG 351x101 du site maselfiebox.fr)
avec potrace, composante par composante, pour l'animer lettre par lettre.
Aucun dessin inventé : chaque tracé provient des pixels du fichier original."""
import sys, os, json, subprocess, re, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage

src, out_json = sys.argv[1], sys.argv[2]
S = 10  # facteur de sur-échantillonnage
im = Image.open(src).convert('RGBA')
W, H = im.size
big = im.resize((W * S, H * S), Image.LANCZOS)
a = np.asarray(big).astype(np.float32)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
al = ndimage.gaussian_filter(al, sigma=S * 0.45)  # lisse le crénelage du PNG basse définition
r = ndimage.gaussian_filter(r, sigma=S * 0.45); g = ndimage.gaussian_filter(g, sigma=S * 0.45)
ink = al > 120
turq = ink & (g > r + 40)
black = ink & ~turq
# léger lissage morphologique pour ne pas fragmenter
turq = ndimage.binary_closing(turq, iterations=2)

def trace(mask):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'm.pbm')
        Image.fromarray((~mask).astype(np.uint8) * 255).convert('1').save(p)
        svg = subprocess.run(['potrace', p, '-s', '-o', '-', '--turdsize', '40', '--alphamax', '1.1', '--opttolerance', '0.3', '--flat'], capture_output=True, text=True).stdout
    tm = re.search(r'transform="([^"]+)"', svg).group(1)
    ds = re.findall(r'\sd="([^"]+)"', svg)
    return tm, ' '.join(ds)

parts = []
for color, mask in (('black', black), ('turq', turq)):
    lab, n = ndimage.label(mask)
    for i in range(1, n + 1):
        m = lab == i
        if m.sum() < 200:
            continue
        filled = ndimage.binary_fill_holes(m)
        ys, xs = np.where(m)
        tm, d = trace(m)
        parts.append({'color': color, 'x0': int(xs.min()), 'x1': int(xs.max()), 'y0': int(ys.min()), 'y1': int(ys.max()), 'transform': tm, 'd': d})

# regrouper les accents / points avec la lettre en dessous (même colonne)
parts.sort(key=lambda p: (p['x0']))
H_big = H * S
for p in parts:
    cy = (p['y0'] + p['y1']) / 2
    p['group'] = 'camera' if p['color'] == 'turq' else ('tagline' if p['y0'] > H_big * 0.62 else 'word')
json.dump({'width': W * S, 'height': H * S, 'parts': parts}, open(out_json, 'w'))
print(len(parts), 'parties', {g: sum(1 for p in parts if p['group'] == g) for g in ('word', 'tagline', 'camera')})
