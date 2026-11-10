#!/usr/bin/env python3
"""
Ma Selfie Box — génération de la bande-son ORIGINALE (musique + effets sonores).

Tout est synthétisé ici à partir d'oscillateurs et de bruit : aucune banque de
sons, aucun échantillon tiers, aucune musique protégée. Les fichiers produits
sont donc libres de droits pour Ma Selfie Box.

  Musique : électro instrumentale, 120 BPM, La mineur (Am - F - C - G),
            50,000 s exactement. 1 temps = 0,5 s = 30 images à 60 fps.
  Effets  : public/audio/sfx/*.wav (whooshes, clics, pops, obturateur,
            impression papier, impacts, montée...)

Usage : python3 audio-src/generate_audio.py   (depuis maselfiebox-video/)
"""
import os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BPM = 120
BEAT = 60 / BPM          # 0,5 s
BAR = BEAT * 4           # 2 s
DUR = 50.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(os.path.join(OUT, 'sfx'), exist_ok=True)


# ----------------------------------------------------------------- utilitaires
def t_arr(dur):
    return np.arange(int(SR * dur)) / SR


def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.1):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(na, 1)
    e[:na] = np.linspace(0, 1, na)
    if nd > 0:
        e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr > 0 and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    fc = np.clip(fc, 20, SR / 2 - 100)
    b, a = signal.butter(order, fc / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep_lp(x, f_start, f_end, steps=64):
    """Filtre passe-bas dont la coupure évolue (exponentielle) — par blocs."""
    out = np.zeros_like(x)
    idx = np.linspace(0, len(x), steps + 1).astype(int)
    zi = None
    for k in range(steps):
        f = f_start * (f_end / f_start) ** (k / max(steps - 1, 1))
        b, a = signal.butter(2, min(f, SR / 2 - 200) / (SR / 2), 'low')
        if zi is None:
            zi = signal.lfilter_zi(b, a) * 0
        seg, zi = signal.lfilter(b, a, x[idx[k]:idx[k + 1]], zi=zi)
        out[idx[k]:idx[k + 1]] = seg
    return out


def sweep_bp(x, f_start, f_end, q=1.2, steps=64):
    out = np.zeros_like(x)
    idx = np.linspace(0, len(x), steps + 1).astype(int)
    for k in range(steps):
        f = f_start * (f_end / f_start) ** (k / max(steps - 1, 1))
        lo, hi = f / (1 + 1 / q), min(f * (1 + 1 / q), SR / 2 - 200)
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
        out[idx[k]:idx[k + 1]] = signal.lfilter(b, a, x[idx[k]:idx[k + 1]])
    return out


def saw(freq, t, partials=24):
    y = np.zeros_like(t)
    for k in range(1, partials + 1):
        if freq * k > SR / 2.2:
            break
        y += ((-1) ** (k + 1)) * np.sin(2 * np.pi * freq * k * t) / k
    return y * (2 / np.pi)


def reverb_ir(dur=2.2, decay=3.0, seed=1):
    r = np.random.default_rng(seed)
    n = int(SR * dur)
    tt = np.arange(n) / SR
    ir_l = r.standard_normal(n) * np.exp(-decay * tt)
    ir_r = r.standard_normal(n) * np.exp(-decay * tt)
    ir_l, ir_r = lp(ir_l, 7000), lp(ir_r, 6500)
    ir_l[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir_r[:int(0.017 * SR)] *= np.linspace(0, 1, int(0.017 * SR))
    return ir_l / np.abs(ir_l).sum() * 18, ir_r / np.abs(ir_r).sum() * 18


IR = reverb_ir()


def reverb(st, wet=0.25):
    l = signal.fftconvolve(st[0], IR[0])[:st.shape[1]]
    r = signal.fftconvolve(st[1], IR[1])[:st.shape[1]]
    return st * (1 - wet * 0.3) + np.vstack([l, r]) * wet


def stereo(x, pan=0.0):
    pan = np.clip(pan, -1, 1)
    return np.vstack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)]) * 1.414


def place(buf, clip, t0, gain=1.0):
    i0 = int(round(t0 * SR))
    if clip.ndim == 1:
        clip = stereo(clip)
    i1 = min(buf.shape[1], i0 + clip.shape[1])
    if i0 >= buf.shape[1] or i1 <= i0:
        return
    buf[:, i0:i1] += clip[:, :i1 - i0] * gain


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def norm(x, peak=0.89):
    m = np.abs(x).max()
    return x / m * peak if m > 0 else x


def write(path, x, peak=0.89):
    x = norm(x, peak)
    if x.ndim == 2:
        x = x.T
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


# ----------------------------------------------------------------- instruments
def kick(dur=0.42, f0=150, f1=44, punch=1.0):
    t = t_arr(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.25 * punch
    y = np.tanh((body + click) * 1.6)
    return y


def clap(dur=0.35):
    t = t_arr(dur)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for k, off in enumerate([0, 0.009, 0.018, 0.027]):
        i = int(off * SR)
        e[i:] += np.exp(-(t[:len(t) - i]) * (180 if k < 3 else 22))
    y = bp(n, 900, 5200) * e
    return y * 0.8


def hat(dur=0.06, open_=False):
    d = 0.32 if open_ else dur
    t = t_arr(d)
    n = rng.standard_normal(len(t))
    y = hp(n, 8000, 4) * np.exp(-t * (14 if open_ else 75))
    return y * (0.5 if open_ else 0.42)


def pluck(freq, dur=0.32, bright=1.0):
    t = t_arr(dur)
    y = saw(freq, t, 18) * 0.6 + np.sin(2 * np.pi * freq * 2 * t) * 0.15
    e = np.exp(-t * 11)
    y = lp(y * e, 900 + 4200 * bright)
    return y * env_adsr(len(t), 0.002, 0.0, 1, 0.02)


def bass_note(freq, dur, cutoff=900):
    t = t_arr(dur)
    y = saw(freq, t, 30) * 0.7 + np.sin(2 * np.pi * freq * t) * 0.6
    y = lp(y, cutoff, 2)
    return np.tanh(y * 1.4) * env_adsr(len(t), 0.004, 0.08, 0.75, 0.04)


def pad_chord(freqs, dur, cutoff=2400, attack=0.25):
    t = t_arr(dur)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for f in freqs:
        for det, pan in ((-0.11, -1), (0.0, 0), (0.12, 1)):
            ff = f * 2 ** (det / 12)
            v = saw(ff, t + rng.uniform(0, 0.01), 10)
            if pan <= 0:
                L += v
            if pan >= 0:
                R += v
    e = env_adsr(len(t), attack, 0.3, 0.85, min(0.4, dur * 0.4))
    return np.vstack([lp(L, cutoff) * e, lp(R, cutoff) * e]) / (len(freqs) * 2.2)


def keys_note(freq, dur=1.6):
    t = t_arr(dur)
    y = (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 3)
         + 0.12 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 6))
    return y * np.exp(-t * 2.2) * env_adsr(len(t), 0.003, 0, 1, 0.1) * 0.5


def noise_riser(dur, f0=300, f1=9000, curve=2.0):
    t = t_arr(dur)
    n = rng.standard_normal(len(t))
    y = sweep_bp(n, f0, f1, q=1.6, steps=96)
    e = (t / dur) ** curve
    return y * e


def sub_boom(dur=1.6, f0=90, f1=32):
    t = t_arr(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 2.4)


def crash(dur=2.4):
    t = t_arr(dur)
    n = rng.standard_normal(len(t))
    y = hp(n, 4500, 2) * np.exp(-t * 2.2) + bp(n, 2500, 7000) * np.exp(-t * 4) * 0.4
    return y * 0.35


# ----------------------------------------------------------------- MUSIQUE
CHORDS = [  # Am, F, C, G   (MIDI)
    [57, 60, 64, 69],
    [53, 57, 60, 65],
    [55, 60, 64, 67],
    [55, 59, 62, 67],
]
ROOTS = [33, 29, 36, 31]   # A1, F1, C2, G1


def chord_at(t):
    return int(t // BAR) % 4


def build_music():
    drums = np.zeros((2, N))
    bass = np.zeros((2, N))
    pads = np.zeros((2, N))
    arps = np.zeros((2, N))
    fx = np.zeros((2, N))
    keys = np.zeros((2, N))

    K = kick()
    C = clap()

    # -------- section helpers
    def in_(t, a, b):
        return a <= t < b

    n_beats = int(DUR / BEAT)
    for bi in range(n_beats):
        t = bi * BEAT
        bar_pos = bi % 4
        # KICK : 4-temps de 4 à 40 s, puis 46 à 48 s
        if in_(t, 4, 40) or in_(t, 46, 48):
            place(drums, K, t, 0.62 if t < 8 else 0.9)
        # kick isolé sur les accents de l'intro
        if t in (0.0,):
            pass
        # CLAP : temps 2 et 4 dès 6 s
        if (in_(t, 6, 40) or in_(t, 46, 48)) and bar_pos in (1, 3):
            place(drums, stereo(C, 0.0), t, 0.55)
        # HATS : croches à contretemps dès 4 s, doubles croches dès 8 s
        if in_(t, 4, 40) or in_(t, 46, 48):
            place(drums, stereo(hat(open_=True), 0.15), t + BEAT / 2, 0.30)
        if in_(t, 8, 40) or in_(t, 46, 48):
            for s in range(4):
                if s == 2:
                    continue
                v = (0.55, 0.0, 0.0, 0.38)[s] if s != 0 else 0.5
                place(drums, stereo(hat(), -0.25), t + s * BEAT / 4, v * 0.5)
        # tic d'horloge discret pendant l'intro (montée de tension)
        if in_(t, 2.0, 4.0):
            place(drums, stereo(hat(0.03), 0.3), t, 0.25)
            place(drums, stereo(hat(0.03), -0.3), t + BEAT / 2, 0.18)

    # roulement de clap avant le drop de 8 s et de 46 s
    for start, end in ((7.0, 8.0), (45.0, 46.0)):
        steps = 16
        for k in range(steps):
            tt = start + k * (end - start) / steps
            place(drums, stereo(C, rng.uniform(-0.3, 0.3)), tt, 0.12 + 0.35 * k / steps)

    # -------- BASSE : croches décalées (pompe) façon house
    for bi in range(int(DUR / (BEAT / 2))):
        t = bi * BEAT / 2
        if not (in_(t, 4, 40) or in_(t, 46, 48.0)):
            continue
        if bi % 2 == 0:   # sur le temps : silence (place au kick)
            continue
        c = chord_at(t)
        f = midi(ROOTS[c] + 12)
        if in_(t, 4, 8):
            cutoff = 250 + 900 * (t - 4) / 4
        else:
            cutoff = 1300
        oct_ = 2 if (bi % 8 == 7 and in_(t, 16, 40)) else 1
        place(bass, stereo(bass_note(f * oct_, BEAT / 2 * 0.92, cutoff)), t, 0.55)

    # sub tenu en breakdown 40–46 (doux)
    for b in range(3):
        t = 40 + b * BAR
        c = chord_at(t)
        tt = t_arr(BAR)
        y = np.sin(2 * np.pi * midi(ROOTS[c]) * tt) * env_adsr(len(tt), 0.3, 0.2, 0.8, 0.4)
        place(bass, stereo(y), t, 0.22)

    # -------- PADS
    for b in range(int(DUR / BAR)):
        t = b * BAR
        c = chord_at(t)
        fr = [midi(m) for m in CHORDS[c]]
        if t < 4:
            # intro : nappe filtrée qui s'ouvre
            cut = 500 + 1600 * (t / 4)
            place(pads, pad_chord(fr, BAR + 0.3, cut, 0.6), t, 0.55)
        elif t < 8:
            place(pads, pad_chord(fr, BAR + 0.2, 1200 + 600 * (t - 4) / 4, 0.3), t, 0.42)
        elif t < 40:
            place(pads, pad_chord(fr, BAR + 0.1, 2600, 0.15), t, 0.36)
        elif t < 46:
            place(pads, pad_chord(fr, BAR + 0.4, 1800 + 1400 * (t - 40) / 6, 0.5), t, 0.6)
        elif t < 48:
            place(pads, pad_chord(fr, BAR + 0.1, 3200, 0.05), t, 0.45)
    # accord final tenu (La mineur add9) de 48 à 50 s, qui s'éteint proprement
    fin = pad_chord([midi(m) for m in (57, 60, 64, 71, 76)], 2.0, 3000, 0.02)
    fin *= np.linspace(1, 0, fin.shape[1]) ** 1.6
    place(pads, fin, 48.0, 0.7)

    # -------- STABS d'accord sur les temps forts (drop)
    for b in range(int(DUR / BAR)):
        t = b * BAR
        if in_(t, 8, 24) or in_(t, 32, 40) or in_(t, 46, 48):
            c = chord_at(t)
            for off in (0, 1.5 * BEAT, 3 * BEAT):
                st = np.zeros(int(0.22 * SR))
                for m in CHORDS[c]:
                    st = st + pluck(midi(m + 12), 0.22, 0.8)
                place(arps, stereo(st / 4, 0.0), t + off, 0.35)

    # -------- ARPÈGES (doubles croches) 24–40 s, avec écho stéréo
    arp_dry = np.zeros((2, N))
    for k in range(int(DUR / (BEAT / 4))):
        t = k * BEAT / 4
        if not in_(t, 24, 40):
            continue
        c = chord_at(t)
        notes = CHORDS[c] + [CHORDS[c][1] + 12]
        m = notes[(k * 3) % len(notes)] + 12
        bright = 0.3 + 0.7 * min(1, (t - 24) / 8)
        place(arp_dry, stereo(pluck(midi(m), 0.18, bright), 0.35 if k % 2 else -0.35), t, 0.26)
    # écho 3/16
    d = int(SR * BEAT * 0.75)
    echo = np.zeros_like(arp_dry)
    echo[0, d:] = arp_dry[1, :-d] * 0.38
    echo[1, d:] = arp_dry[0, :-d] * 0.38
    arps += arp_dry + echo

    # -------- PIANO / KEYS en breakdown (émotion) 40–46 s
    mel = [(40.0, 76), (40.75, 74), (41.0, 72), (42.0, 72), (42.75, 71), (43.0, 69),
           (44.0, 71), (44.5, 72), (45.0, 74), (45.5, 76)]
    for t, m in mel:
        place(keys, stereo(keys_note(midi(m), 1.8), 0.1), t, 0.55)
    for b in range(3):
        t = 40 + b * BAR
        c = chord_at(t)
        for i, m in enumerate(CHORDS[c][:3]):
            place(keys, stereo(keys_note(midi(m), 2.0), -0.2), t + i * 0.03, 0.22)

    # -------- FX musicaux : impacts / montées
    place(fx, stereo(sub_boom(1.8, 110, 30)), 0.233, 0.75)          # ligne turquoise
    place(fx, crash(2.6), 0.233, 0.0)
    r = noise_riser(2.0, 400, 9000, 2.2)
    place(fx, stereo(r, 0.0), 2.0, 0.22)                              # montée vers 4 s
    place(fx, stereo(sub_boom(1.2, 80, 34)), 4.0, 0.45)
    r = noise_riser(2.0, 300, 10000, 2.5)
    place(fx, stereo(r, 0.0), 6.0, 0.28)                              # montée vers le drop 8 s
    place(fx, stereo(sub_boom(1.6, 95, 30)), 8.0, 0.7)
    place(fx, stereo(crash(2.4), 0.2), 8.0, 0.55)
    for t in (16.0, 24.0, 32.0):
        place(fx, stereo(crash(1.8), -0.2), t, 0.35)
    r = noise_riser(2.0, 300, 9000, 2.5)
    place(fx, stereo(r, 0.0), 38.0, 0.30)                             # vers la promesse
    place(fx, stereo(sub_boom(2.0, 70, 28)), 40.0, 0.55)
    r = noise_riser(2.0, 400, 10000, 2.2)
    place(fx, stereo(r, 0.0), 44.0, 0.26)                             # vers l'outro
    place(fx, stereo(sub_boom(1.4, 100, 30)), 46.0, 0.7)
    place(fx, stereo(crash(2.2), 0.0), 46.0, 0.5)
    place(fx, stereo(sub_boom(2.0, 110, 28)), 48.0, 0.85)            # impact final
    place(fx, stereo(crash(2.0), 0.0), 48.0, 0.55)

    # -------- SIDECHAIN (pompe) sur basse, pads, arps
    duck = np.ones(N)
    for bi in range(n_beats):
        t = bi * BEAT
        if in_(t, 4, 40) or in_(t, 46, 48):
            i0 = int(t * SR)
            L = int(0.32 * SR)
            curve = 1 - 0.65 * np.exp(-np.arange(L) / SR * 12)
            duck[i0:i0 + L] = np.minimum(duck[i0:i0 + L], curve[:len(duck[i0:i0 + L])])
    bass *= duck
    pads *= (0.35 + 0.65 * duck)
    arps *= (0.5 + 0.5 * duck)

    mix = (drums * 0.9 + bass * 1.0 + reverb(pads, 0.35) * 0.9 + reverb(arps, 0.25) * 0.8
           + reverb(keys, 0.45) * 0.9 + reverb(fx, 0.2) * 0.9)
    mix = hp(mix, 25)
    # douce saturation de bus + limiteur
    mix = mix / np.percentile(np.abs(mix), 99.95) * 0.85
    mix = np.tanh(mix * 0.9) / np.tanh(0.9)
    # fondu de sécurité : 3 premières ms et toute fin propre
    mix[:, :int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))
    tail = int(0.35 * SR)
    mix[:, -tail:] *= np.linspace(1, 0, tail) ** 2
    return mix


# ----------------------------------------------------------------- EFFETS
def sfx_whoosh(dur=0.7, f0=250, f1=5000, peak_at=0.6):
    t = t_arr(dur)
    n = rng.standard_normal(len(t))
    y = sweep_bp(n, f0, f1, q=1.1, steps=80)
    p = peak_at
    e = np.where(t / dur < p, (t / dur / p) ** 2, ((1 - t / dur) / (1 - p)) ** 1.5)
    st = np.vstack([y * e * np.linspace(1.2, 0.6, len(t)), y * e * np.linspace(0.6, 1.2, len(t))])
    return st


def sfx_swish(dur=0.28):
    t = t_arr(dur)
    n = rng.standard_normal(len(t))
    y = sweep_bp(n, 2500, 9000, q=2, steps=40)
    return y * np.sin(np.pi * t / dur) ** 2


def sfx_click():
    t = t_arr(0.08)
    a = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 900)
    b = np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 300) * 0.4
    y = a + b
    i = int(0.045 * SR)
    y2 = np.zeros_like(y)
    y2[i:] = (a[:len(t) - i] * 0.5 + b[:len(t) - i] * 0.3)
    return (y + y2) * 0.9


def sfx_pop(f0=1400, f1=600, dur=0.12):
    t = t_arr(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 32) * env_adsr(len(t), 0.001, 0, 1, 0.01)


def sfx_tick():
    t = t_arr(0.04)
    return (np.sin(2 * np.pi * 3200 * t) * 0.5 + hp(rng.standard_normal(len(t)), 5000) * 0.4) * np.exp(-t * 260)


def sfx_select():
    a = sfx_pop(1100, 900, 0.1)
    b = sfx_pop(1650, 1400, 0.16)
    y = np.zeros(int(0.26 * SR))
    y[:len(a)] += a
    i = int(0.07 * SR)
    y[i:i + len(b)] += b
    return y


def sfx_success():
    y = np.zeros(int(1.3 * SR))
    for i, m in enumerate((76, 79, 84, 88)):
        n = keys_note(midi(m), 1.0)
        n += np.sin(2 * np.pi * midi(m) * 4 * t_arr(1.0)) * np.exp(-t_arr(1.0) * 12) * 0.08
        o = int(i * 0.075 * SR)
        y[o:o + len(n)] += n * (0.8 + 0.1 * i)
    return reverb(stereo(y), 0.4)


def sfx_impact_soft():
    t = t_arr(0.9)
    return stereo(sub_boom(0.9, 120, 40) * 0.9 + lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 25) * 0.3)


def sfx_impact_big():
    t = t_arr(2.2)
    body = sub_boom(2.2, 130, 30)
    nz = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 12) * 0.45
    return reverb(stereo(body + nz) + crash(2.2) * 0.5, 0.25)


def sfx_low_transition():
    t = t_arr(1.2)
    f = 140 * np.exp(-t * 1.8) + 30
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) ** 0.7
    nz = sweep_lp(rng.standard_normal(len(t)), 3000, 150) * np.exp(-t * 2) * 0.25
    return stereo(y + nz)


def sfx_texture():
    """Texture électronique / glitch numérique."""
    dur = 0.6
    t = t_arr(dur)
    y = np.zeros_like(t)
    seg = int(0.025 * SR)
    for i in range(0, len(t), seg):
        f = rng.choice([880, 1320, 1760, 2640, 440])
        on = rng.random() > 0.35
        if on:
            tt = t[:min(seg, len(t) - i)]
            y[i:i + len(tt)] = np.sign(np.sin(2 * np.pi * f * tt)) * 0.3 * np.exp(-tt * 60)
    y = bp(y, 600, 8000) * np.sin(np.pi * t / dur)
    return stereo(y, 0.2)


def sfx_shutter():
    """Obturateur reflex : déclenchement + miroir + réarmement."""
    y = np.zeros(int(0.32 * SR))

    def clack(gain, color):
        t = t_arr(0.05)
        n = rng.standard_normal(len(t))
        c = bp(n, color * 0.5, color * 1.6) * np.exp(-t * 220)
        body = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 120) * 0.4
        return (c + body) * gain

    for off, g, c in ((0.0, 1.0, 3500), (0.012, 0.6, 6000), (0.085, 0.8, 2500), (0.11, 0.45, 5000)):
        k = clack(g, c)
        i = int(off * SR)
        y[i:i + len(k)] += k
    # réarmement moteur
    t = t_arr(0.12)
    mot = bp(rng.standard_normal(len(t)), 800, 3000) * (0.15 + 0.1 * np.sin(2 * np.pi * 90 * t))
    mot *= np.sin(np.pi * t / 0.12)
    i = int(0.16 * SR)
    y[i:i + len(mot)] += mot * 0.6
    return reverb(stereo(y), 0.12)


def sfx_printer():
    """Impression thermo-sublimation : moteur pas-à-pas + avance papier + sortie."""
    dur = 2.2
    t = t_arr(dur)
    step = 220 + 30 * np.sin(2 * np.pi * 0.7 * t)
    ph = 2 * np.pi * np.cumsum(step) / SR
    motor = (signal.sawtooth(ph, 0.2) * 0.25 + np.sin(ph * 2) * 0.1)
    motor = bp(motor, 150, 2500)
    am = 0.6 + 0.4 * (np.sin(2 * np.pi * 7 * t) > 0)
    paper = hp(rng.standard_normal(len(t)), 3000) * 0.05
    e = np.clip(t / 0.08, 0, 1) * np.clip((dur - t) / 0.25, 0, 1)
    y = (motor * am + paper) * e
    # petits « clacs » de guide papier
    for off in (0.05, 1.05, 2.0):
        k = sfx_tick() * 0.8
        i = int(off * SR)
        y[i:i + len(k)] += k[:len(y[i:i + len(k)])]
    return stereo(y, -0.1)


def sfx_riser(dur=2.0):
    r = noise_riser(dur, 300, 9000, 2.4)
    t = t_arr(dur)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 600 * (t / dur) ** 2) / SR) * (t / dur) ** 3 * 0.25
    return reverb(stereo(r + tone), 0.25)


def sfx_keyboard_soft():
    """Saisie légère (non utilisée pour des données réelles) — micro-tics."""
    y = np.zeros(int(0.5 * SR))
    for k in range(6):
        c = sfx_tick() * rng.uniform(0.5, 0.9)
        i = int((k * 0.07 + rng.uniform(0, 0.02)) * SR)
        y[i:i + len(c)] += c
    return y


SFX = {
    'whoosh-fast': lambda: sfx_whoosh(0.5, 300, 6000, 0.65),
    'whoosh-long': lambda: sfx_whoosh(1.0, 150, 4500, 0.7),
    'whoosh-camera': lambda: sfx_whoosh(0.8, 120, 3000, 0.55),
    'swish': sfx_swish,
    'click': sfx_click,
    'pop': lambda: sfx_pop(),
    'pop-high': lambda: sfx_pop(2200, 1200, 0.09),
    'tick': sfx_tick,
    'select': sfx_select,
    'success': sfx_success,
    'impact-soft': sfx_impact_soft,
    'impact-big': sfx_impact_big,
    'low-transition': sfx_low_transition,
    'texture-digital': sfx_texture,
    'shutter': sfx_shutter,
    'printer': sfx_printer,
    'riser': sfx_riser,
    'ticks': sfx_keyboard_soft,
}

if __name__ == '__main__':
    music = build_music()
    write(os.path.join(OUT, 'music-maselfiebox-120bpm.wav'), music, peak=0.84)
    print('musique OK', music.shape[1] / SR, 's')
    for name, fn in SFX.items():
        y = fn()
        write(os.path.join(OUT, 'sfx', f'{name}.wav'), y, peak=0.89)
    print('effets OK :', ', '.join(SFX))
