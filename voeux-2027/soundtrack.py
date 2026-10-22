"""Bande-son synthétisée (45 s) calée sur les impacts de voeux3d.html.
Usage : python3 soundtrack.py  -> soundtrack.wav
"""
import wave
import numpy as np

SR = 48000
DUR = 45.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(2027)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.005, decay=0.3):
    t = tt(d)
    return np.minimum(1, t / a) * np.exp(-t / decay)


def lowpass(x, k):
    # filtre passe-bas à un pôle (k entre 0 et 1, plus petit = plus sourd)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += (k[i] if np.ndim(k) else k) * (v - acc)
        y[i] = acc
    return y


def kick(gain=1.0):
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * gain


def snare(d=0.25):
    t = tt(d)
    n = rng.standard_normal(len(t))
    return (n * 0.7 + np.sin(2 * np.pi * 190 * t) * 0.5) * np.exp(-t * 18)


def hat(d=0.06):
    n = rng.standard_normal(int(d * SR))
    n = n - lowpass(n, 0.3)
    return n * np.exp(-tt(d) * 60)


def boom(d=2.5):
    t = tt(d)
    f = 30 + 70 * np.exp(-t * 6)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    crash = rng.standard_normal(len(t))
    crash = (crash - lowpass(crash, 0.15)) * np.exp(-t * 2.2) * 0.45
    return sub * 1.2 + crash


def riser(d, f0=200, f1=2400):
    t = tt(d)
    k = t / d
    n = rng.standard_normal(len(t))
    n = lowpass(n, 0.02 + 0.5 * k ** 2) * (k ** 2) * 2.5
    f = f0 * (f1 / f0) ** k
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * k ** 2 * 0.25
    return n + tone


def whoosh(d=0.5):
    t = tt(d)
    k = t / d
    n = rng.standard_normal(len(t))
    return lowpass(n, 0.05 + 0.3 * np.sin(np.pi * k)) * np.sin(np.pi * k) ** 2 * 1.4


def saw(freq, d, detune=(0.0,)):
    t = tt(d)
    s = np.zeros(len(t))
    for dt in detune:
        ph = (t * freq * (1 + dt)) % 1
        s += 2 * ph - 1
    return s / len(detune)


def note(name):
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    return 440 * 2 ** ((names[name[0]] + 12 * (int(name[-1]) - 4)) / 12)


def stab(notes, d=0.35, gain=0.18):
    s = sum(saw(note(n), d, (-0.008, 0, 0.007)) for n in notes)
    return lowpass(s, 0.25) * env(d, 0.004, 0.15) * gain


def pad(notes, d, gain=0.10):
    t = tt(d)
    s = sum(saw(note(n), d, (-0.004, 0.003)) for n in notes)
    s = lowpass(s, 0.04)
    a = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.3)
    return s * a * gain


def bell(freq, d=0.9, gain=0.12):
    t = tt(d)
    return (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t)) * np.exp(-t * 4) * gain


def bass(freq, d=0.22, gain=0.35):
    return lowpass(saw(freq, d), 0.08) * env(d, 0.003, 0.12) * gain


def crackle(d=0.8, gain=0.25):
    s = np.zeros(int(d * SR))
    for _ in range(60):
        i = rng.integers(0, len(s) - 400)
        s[i:i + 400] += rng.standard_normal(400) * np.exp(-np.arange(400) / 60)
    return s * np.exp(-tt(d) * 3) * gain


CH = {'Am': ['A3', 'C4', 'E4'], 'F': ['F3', 'A3', 'C4'], 'C': ['C4', 'E4', 'G4'], 'G': ['G3', 'B3', 'D4']}
ROOT = {'Am': 'A1', 'F': 'F1', 'C': 'C2', 'G': 'G1'}
PROG = ['Am', 'F', 'C', 'G']

# --- 0 → 7 s : la goutte ---
add(pad(['A2', 'E3', 'A3'], 5.4, 0.08), 0.0)
t = tt(0.83)
f = 2000 * (300 / 2000) ** (t / 0.83)
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12 * np.minimum(1, t / 0.05), 1.4)
for ti, g in [(2.232, 1.0), (3.031, .6), (3.414, .35), (3.598, .2)]:
    add(kick(g), ti)
    add(bell(note('A5'), .8, .08 * g), ti)
add(riser(1.7, 150, 3500), 5.2, 0.7)
add(boom(3.0), 6.9, 1.2)

# --- 7 → 17 s : 2026 → 2027 (tempo calé sur la chute des chiffres, 0,45 s) ---
P = 0.45
for i in range(18):
    b = 8.507 + i * P
    if b > 16.6:
        break
    if 11.2 <= b < 13.55:  # tension : la musique se suspend
        add(hat(), b, 0.15)
        continue
    add(kick(), b)
    add(hat(), b + P / 2, 0.22, 0.3)
    if i % 2:
        add(snare(), b, 0.3)
    add(bass(note(ROOT[PROG[(i // 2) % 4]])), b)
for ti in [8.507, 8.957, 9.407, 9.857]:
    add(boom(0.6), ti, 0.35)
t = tt(1.0)
add(np.sin(2 * np.pi * 70 * t + 8 * np.sin(2 * np.pi * 9 * t)) * np.exp(-t * 1) * .08, 11.2)  # le 6 tremble
add(kick(0.7), 13.0)
add(riser(0.8, 300, 5000), 12.75, 0.6)
add(boom(2.6), 13.55, 1.1)
add(stab(['A3', 'C4', 'E4', 'A4'], 0.6, 0.2), 13.55)
for i, ft in enumerate([14.2, 14.6, 15.1, 15.6, 16.0]):
    pan = (-0.6, 0.6, 0, -0.3, 0.3)[i]
    add(kick(0.3), ft, 0.5, pan)
    add(crackle(1.0), ft + 0.08, 1, pan)
for i, n in enumerate(['A4', 'C5', 'E5', 'A5']):
    add(bell(note(n), .6, .1), 15.0 + i * .14)
add(whoosh(0.8), 16.4, 0.8)

# --- 17 → 25 s : BONNE ANNÉE ---
for i in range(16):
    b = 17.4 + i * P
    if b > 24.4:
        break
    add(kick(), b)
    add(hat(), b + P / 2, 0.25, -0.3)
    if i % 2:
        add(snare(), b, 0.32)
    c = PROG[(i // 2) % 4]
    add(bass(note(ROOT[c])), b)
    if i % 2 == 0:
        add(stab(CH[c], 0.35, 0.12), b)
for i in range(5):
    add(boom(0.5), 18.407 + i * .22, 0.3, -0.5 + i * .25)
    add(boom(0.5), 19.707 + i * .22, 0.3, -0.5 + i * .25)
for i in range(10):
    add(bell(note(['C5', 'E5', 'G5', 'C6', 'E6'][i % 5]), .5, .07), 22.0 + i * .1)
add(whoosh(0.9), 24.2, 0.8)

# --- 25 → 37 s : le mot de Sébastien, plus posé ---
pad_chords = [['A3', 'C4', 'E4', 'A4'], ['F3', 'A3', 'C4', 'F4'], ['C4', 'E4', 'G4', 'C5'], ['G3', 'B3', 'D4', 'G4']]
for i in range(5):
    add(pad(pad_chords[i % 4], 2.6, 0.09), 25.0 + i * 2.4)
    add(bass(note(['A1', 'F1', 'C2', 'G1'][i % 4]), 2.2, 0.2), 25.0 + i * 2.4)
for i in range(22):
    add(kick(0.35), 25.6 + i * 0.5)
    add(hat(), 25.85 + i * 0.5, 0.1, 0.4)
arp = ['A5', 'E5', 'C5', 'E5', 'F5', 'C5', 'A4', 'C5', 'G5', 'E5', 'C5', 'E5', 'G5', 'D5', 'B4', 'D5']
for i in range(44):
    add(bell(note(arp[i % 16]), .7, .05), 25.3 + i * 0.25, 1, (-0.4, 0.4)[i % 2])
for ti in [25.6, 26.2, 27.4, 28.3, 30.0, 30.7]:
    add(whoosh(0.3), ti, 0.35)
add(bell(note('E6'), 1.6, 0.14), 32.2)
add(bell(note('A6'), 1.6, 0.1), 32.7)
add(riser(1.2, 200, 4000), 36.2, 0.5)

# --- 37 → 45 s : le logo UPPO ---
add(whoosh(1.4), 37.4, 0.9)
for ti, g in [(39.075, 1.0), (39.695, .5), (39.94, .25)]:
    add(kick(g), ti)
add(boom(3.0), 39.075, 1.0)
add(stab(['A3', 'C4', 'E4', 'A4'], 0.8, 0.18), 39.075)
add(pad(['F3', 'A3', 'C4', 'E4', 'A4'], 5.9, 0.11), 39.1)
for i in range(6):
    add(whoosh(0.25), 39.2 + i * .12, 0.35, -0.5 + i * .2)
for i, n in enumerate(['C6', 'E6', 'G6', 'C7', 'G6', 'E6', 'A6', 'C7']):
    add(bell(note(n), 1.2, 0.06), 40.6 + i * 0.18, 1, (-0.5, 0.5)[i % 2])
for i, ft in enumerate([41.0, 41.4]):
    add(crackle(1.0, .2), ft + .08, 1, (-0.6, 0.6)[i])
add(bell(note('A5'), 2.0, 0.12), 42.8)
add(bell(note('E6'), 2.0, 0.08), 43.3)

# --- réverbération légère + mastering ---
def reverb(x):
    out = x.copy()
    for d, g in [(0.029, 0.35), (0.037, 0.3), (0.043, 0.27), (0.051, 0.22), (0.113, 0.15), (0.173, 0.1)]:
        k = int(d * SR)
        out[k:] += x[:-k] * g
    return out


L, R = reverb(L), reverb(np.roll(R, 37))
fade = np.ones(N)
fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR)) ** 2
mix = np.stack([L, R], axis=1) * fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) * 0.89
with wave.open('soundtrack.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('soundtrack.wav ok')
