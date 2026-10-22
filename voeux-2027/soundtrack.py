"""Bande-son synthétisée (15 s, 120 BPM) calée sur les impacts de voeux.html.
Usage : python3 soundtrack.py  -> soundtrack.wav
"""
import wave
import numpy as np

SR = 48000
DUR = 15.0
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


# --- 0 → 1 s : la goutte tombe ---
t = tt(0.7)
f = 1800 * (250 / 1800) ** (t / 0.7)
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18 * np.minimum(1, t / 0.05), 0.03)
add(kick(0.6), 0.72)
add(riser(0.28, 300, 3000), 0.72, 0.6)
add(boom(), 1.0, 1.0)

# --- 1 → 4.6 s : beat énergique ---
prog_bass = ['A1', 'A1', 'F1', 'F1', 'C2', 'C2', 'G1', 'G1']
for i in range(8):
    b = 1.0 + i * 0.5
    if b != 1.0:
        add(kick(), b)
    if i % 2:
        add(snare(), b, 0.35)
    add(hat(), b + 0.25, 0.25, 0.3)
    for j in range(2):
        add(bass(note(prog_bass[i])), b + j * 0.25)
add(riser(0.5, 400, 4000), 2.4, 0.5)
add(boom(2.0), 2.9, 0.9)
add(stab(['A3', 'C4', 'E4', 'A4']), 2.9)
for i, ft in enumerate([3.10, 3.30, 3.55, 3.75, 3.95]):
    add(kick(0.25), ft, 0.5, (-0.6, 0.6, 0.3, -0.3, 0)[i])
    add(crackle(), ft + 0.08, 1, (-0.6, 0.6, 0.3, -0.3, 0)[i])
for k in range(16):  # roulement de caisse claire accéléré
    add(snare(0.08), 4.0 + 0.6 * (1 - (1 - k / 16) ** 1.6), 0.15 + k * 0.02)
add(riser(0.6, 300, 5000), 4.0, 0.55)
add(whoosh(0.45), 4.25, 0.6)
add(boom(1.6), 4.62, 0.8)

# --- 4.6 → 6.85 s : BONNE ANNÉE ---
chords = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4']]
for i in range(5):
    b = 4.62 + i * 0.45
    add(kick(), b)
    add(hat(), b + 0.225, 0.3, -0.3)
    if i % 2:
        add(snare(), b, 0.35)
    add(stab(chords[i % 4], 0.3), b, 1.0)
    add(bass(note(prog_bass[(i * 2) % 8])), b)
for i in range(5):  # chaque lettre qui tombe
    add(hat(0.03), 4.98 + i * 0.06, 0.3, -0.5 + i * 0.25)
add(whoosh(0.55), 6.4, 0.9)

# --- 6.85 → 11.4 s : le mot de Sébastien, plus posé ---
pad_chords = [['A3', 'C4', 'E4', 'A4'], ['F3', 'A3', 'C4', 'F4'], ['C4', 'E4', 'G4', 'C5'], ['G3', 'B3', 'D4', 'G4']]
for i, ch in enumerate(pad_chords):
    add(pad(ch, 1.25), 6.85 + i * 1.15)
    add(bass(note(['A1', 'F1', 'C2', 'G1'][i]), 1.0, 0.25), 6.85 + i * 1.15)
for i in range(9):
    add(kick(0.5), 6.85 + i * 0.5)
    add(hat(), 7.1 + i * 0.5, 0.15, 0.4)
arp = ['A5', 'E5', 'C5', 'E5', 'F5', 'C5', 'A4', 'C5', 'G5', 'E5', 'C5', 'E5', 'G5', 'D5', 'B4', 'D5', 'A5', 'E5']
for i, n in enumerate(arp):
    add(bell(note(n)), 6.85 + i * 0.25, 0.8, (-0.4, 0.4)[i % 2])
add(bell(note('E6'), 1.4, 0.15), 10.25)  # signature

# --- 11.4 → 15 s : révélation du logo ---
for k in range(14):
    add(snare(0.08), 11.45 + 0.58 * (1 - (1 - k / 14) ** 1.6), 0.12 + k * 0.02)
add(riser(0.65, 300, 5000), 11.4, 0.6)
add(boom(2.8), 12.05, 1.1)
add(stab(['A3', 'C4', 'E4', 'A4'], 0.6, 0.2), 12.05)
add(pad(['F3', 'A3', 'C4', 'E4', 'A4'], 2.95, 0.12), 12.05)
for i, n in enumerate(['C6', 'E6', 'G6', 'C7', 'G6', 'E6', 'A6', 'C7']):
    add(bell(note(n), 1.2, 0.07), 12.3 + i * 0.18, 1, (-0.5, 0.5)[i % 2])
add(bell(note('A5'), 1.5, 0.12), 13.5)  # reflet sur le logo

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
