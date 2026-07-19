// ============================================================
// Sons synthétisés via Web Audio API (aucun fichier externe,
// donc aucun problème de licence). Chaque son est un petit
// assemblage d'oscillateurs / bruit filtré.
// ============================================================

let ctx = null;

// Le contexte audio doit être créé après un geste utilisateur (règle mobile)
export function initAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function pret() { return ctx && ctx.state === 'running'; }

// Buffer de bruit blanc réutilisable (pour frappe / foule)
let bufferBruit = null;
function obtenirBruit() {
  if (!bufferBruit) {
    bufferBruit = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = bufferBruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return bufferBruit;
}

function jouerBruit({ duree, freq, q = 1, volume = 0.5, monteeFreq = null }) {
  const src = ctx.createBufferSource();
  src.buffer = obtenirBruit();
  const filtre = ctx.createBiquadFilter();
  filtre.type = 'bandpass';
  filtre.frequency.value = freq;
  filtre.Q.value = q;
  if (monteeFreq) filtre.frequency.linearRampToValueAtTime(monteeFreq, ctx.currentTime + duree);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duree);
  src.connect(filtre).connect(gain).connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duree);
}

function jouerTon({ freq, duree, type = 'square', volume = 0.25, glisse = null, depart = 0 }) {
  const t0 = ctx.currentTime + depart;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, t0 + duree);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duree);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duree);
}

export const sons = {
  // Frappe du ballon : coup sourd + petit claquement
  frappe() {
    if (!pret()) return;
    jouerTon({ freq: 90, duree: 0.12, type: 'sine', volume: 0.6, glisse: 40 });
    jouerBruit({ duree: 0.08, freq: 900, q: 0.8, volume: 0.35 });
  },

  // But : clameur de foule (bruit filtré qui enfle) + fanfare
  but() {
    if (!pret()) return;
    jouerBruit({ duree: 1.6, freq: 500, q: 0.4, volume: 0.5, monteeFreq: 1200 });
    jouerTon({ freq: 523, duree: 0.15, type: 'square', volume: 0.2 });
    jouerTon({ freq: 659, duree: 0.15, type: 'square', volume: 0.2, depart: 0.15 });
    jouerTon({ freq: 784, duree: 0.3, type: 'square', volume: 0.25, depart: 0.3 });
  },

  // Arrêt du gardien : impact mat + "oooh" descendant
  arret() {
    if (!pret()) return;
    jouerTon({ freq: 140, duree: 0.15, type: 'sine', volume: 0.5, glisse: 70 });
    jouerBruit({ duree: 0.8, freq: 400, q: 0.5, volume: 0.25, monteeFreq: 250 });
  },

  // Poteau : ping métallique
  poteau() {
    if (!pret()) return;
    jouerTon({ freq: 1450, duree: 0.35, type: 'triangle', volume: 0.4, glisse: 1200 });
    jouerTon({ freq: 2210, duree: 0.22, type: 'sine', volume: 0.2 });
  },

  // Tir raté / contré : soupir de foule
  rate() {
    if (!pret()) return;
    jouerBruit({ duree: 0.7, freq: 350, q: 0.6, volume: 0.22, monteeFreq: 200 });
  },

  // Coup de sifflet (début / fin de match)
  sifflet() {
    if (!pret()) return;
    jouerTon({ freq: 2400, duree: 0.35, type: 'square', volume: 0.15 });
    jouerTon({ freq: 2400, duree: 0.18, type: 'square', volume: 0.15, depart: 0.45 });
  },

  // Clic d'interface
  clic() {
    if (!pret()) return;
    jouerTon({ freq: 700, duree: 0.06, type: 'square', volume: 0.15, glisse: 900 });
  },
};
