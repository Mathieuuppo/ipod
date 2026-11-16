"""Mixe la piste des bruitages SEULS (sans musique) à partir de src/sfx.tsx et
src/theme.ts — mêmes positions et volumes que dans Remotion.
Usage : python3 tools/mix_sfx.py out/sfx-only.wav"""
import re, sys
import numpy as np
from scipy.io import wavfile

SR, FPS, DUR = 48000, 60, 65.0
theme = open('src/theme.ts').read()
T = {m[0]: int(m[1]) for m in re.findall(r"(\w+): \{from: (\d+), dur:", theme)}
cues = re.findall(r"\['(\w+)', (\d+), '([\w-]+)', ([\d.]+)\]", open('src/sfx.tsx').read())
buf = np.zeros((int(SR * DUR), 2))
for sc, at, name, vol in cues:
    sr, x = wavfile.read(f'public/audio/sfx/{name}.wav')
    x = x.astype(float) / 32768
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    i0 = round((T[sc] + int(at)) / FPS * SR)
    n = min(len(x), len(buf) - i0)
    buf[i0:i0 + n] += x[:n] * float(vol)
print(len(cues), 'sons, crête', np.abs(buf).max())
wavfile.write(sys.argv[1], SR, (np.clip(buf, -1, 1) * 32767).astype(np.int16))
