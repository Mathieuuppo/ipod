// ============================================================
// Données des clubs fictifs : identités, couleurs, blasons
// générés (canvas) et effectifs générés de façon déterministe
// (même graine → mêmes joueurs à chaque lancement).
// Aucune vraie marque / licence : tout est inventé.
// ============================================================

// Générateur pseudo-aléatoire seedé (mulberry32)
function rngSeede(graine) {
  let a = graine >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Les 12 clubs du jeu. note = niveau global (2.5 à 5 étoiles).
// blason = recette de dessin (forme + motif) pour le canvas.
export const EQUIPES = [
  { id: 'royal', nom: 'Royal Lucarne', court: 'RLU', ville: 'Lucarne-sur-Or', note: 4.5,
    couleur1: '#14243f', couleur2: '#f5c542', motif: 'chevron' },
  { id: 'azur', nom: 'Racing Azur', court: 'AZU', ville: 'Baie d\'Azur', note: 4.0,
    couleur1: '#4aa8e0', couleur2: '#ffffff', motif: 'rayures' },
  { id: 'valbourg', nom: 'Étoile de Valbourg', court: 'VAL', ville: 'Valbourg', note: 4.5,
    couleur1: '#c62f2f', couleur2: '#ffffff', motif: 'etoile' },
  { id: 'ferval', nom: 'Loups de Ferval', court: 'FER', ville: 'Ferval', note: 3.5,
    couleur1: '#23252b', couleur2: '#f0c93c', motif: 'chevron' },
  { id: 'sol', nom: 'Atlético Sol', court: 'SOL', ville: 'Puerto Sol', note: 4.0,
    couleur1: '#f2c132', couleur2: '#d43c2a', motif: 'rayures' },
  { id: 'nordique', nom: 'Nordique SK', court: 'NOR', ville: 'Vikhavn', note: 3.5,
    couleur1: '#9fd4e8', couleur2: '#1d3557', motif: 'bande' },
  { id: 'vulcania', nom: 'Vulcania CF', court: 'VUL', ville: 'Monte Fuoco', note: 3.0,
    couleur1: '#e8641f', couleur2: '#26211f', motif: 'diagonale' },
  { id: 'prince', nom: 'Prince Vert', court: 'PVE', ville: 'Bois-le-Prince', note: 3.0,
    couleur1: '#1f8a3d', couleur2: '#ffffff', motif: 'bande' },
  { id: 'corsaires', nom: 'Corsaires FC', court: 'COR', ville: 'Port-Brume', note: 3.5,
    couleur1: '#1b1b1f', couleur2: '#c62f2f', motif: 'diagonale' },
  { id: 'belgrave', nom: 'Dynamo Belgrave', court: 'BEL', ville: 'Belgrave', note: 3.0,
    couleur1: '#6a3fb5', couleur2: '#ffffff', motif: 'rayures' },
  { id: 'olympia', nom: 'Olympia 1900', court: 'OLY', ville: 'Cité Olympe', note: 5.0,
    couleur1: '#f4f1e8', couleur2: '#c9a227', motif: 'etoile' },
  { id: 'torrente', nom: 'Torrente CF', court: 'TOR', ville: 'Torrente', note: 4.0,
    couleur1: '#7a1f33', couleur2: '#274b8f', motif: 'bande' },
];

export function equipeParId(id) {
  return EQUIPES.find((e) => e.id === id) || EQUIPES[0];
}

// ---------- Génération des effectifs ----------

const PRENOMS = ['Léo', 'Mateo', 'Aksel', 'Diego', 'Nolan', 'Sacha', 'Iban', 'Marco', 'Timo',
  'Rayan', 'Elio', 'Jonas', 'Pablo', 'Milan', 'Andrei', 'Kofi', 'Yanis', 'Bruno', 'Erik', 'Luca',
  'Amine', 'Viktor', 'Enzo', 'Dario', 'Noa', 'Simon', 'Ilias', 'Owen', 'Petar', 'Hugo'];
const NOMS = ['Ferrand', 'Okafor', 'Bjornsen', 'Da Costa', 'Weiss', 'Moreau', 'Kovac', 'Silva',
  'Lindqvist', 'Marchetti', 'Diallo', 'Petit', 'Navarro', 'Halvorsen', 'Rossi', 'Dubreuil',
  'Ivanov', 'Mendes', 'Falk', 'Girard', 'Santoro', 'Keita', 'Blomberg', 'Vidal', 'Aubert',
  'Zielinski', 'Costa', 'Nyberg', 'Lambert', 'Duval'];

// Postes de l'effectif : 1 gardien titulaire + 4-4-2 + 5 remplaçants
const POSTES_TITULAIRES = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'M', 'A', 'A'];
const POSTES_REMPLACANTS = ['G', 'D', 'M', 'M', 'A'];

// Génère l'effectif complet d'une équipe (déterministe par id d'équipe).
// Chaque joueur : nom, poste, numéro et stats 40..95 orientées par le
// poste et le niveau du club.
export function genererEffectif(equipe) {
  const graine = [...equipe.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rng = rngSeede(graine);
  const bonusClub = (equipe.note - 3) * 8; // un grand club a de meilleurs joueurs

  const stat = (base) => Math.round(Math.min(95, Math.max(40, base + bonusClub + (rng() - 0.5) * 24)));
  const creer = (poste, numero, titulaire) => {
    const profil = {
      G: { vitesse: 52, tir: 45, passe: 58, defense: 80 },
      D: { vitesse: 62, tir: 50, passe: 62, defense: 78 },
      M: { vitesse: 68, tir: 64, passe: 78, defense: 62 },
      A: { vitesse: 76, tir: 80, passe: 64, defense: 45 },
    }[poste];
    return {
      nom: `${PRENOMS[Math.floor(rng() * PRENOMS.length)]} ${NOMS[Math.floor(rng() * NOMS.length)]}`,
      poste, numero, titulaire,
      vitesse: stat(profil.vitesse),
      tir: stat(profil.tir),
      passe: stat(profil.passe),
      defense: stat(profil.defense),
    };
  };

  const effectif = [];
  const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 10, 9, 11];
  POSTES_TITULAIRES.forEach((p, i) => effectif.push(creer(p, numeros[i], true)));
  POSTES_REMPLACANTS.forEach((p, i) => effectif.push(creer(p, 12 + i, false)));
  return effectif;
}

// Moyennes d'équipe (utilisées par le moteur d'IA du mode arcade)
export function statsEquipe(equipe) {
  const effectif = genererEffectif(equipe);
  const champ = effectif.filter((j) => j.titulaire && j.poste !== 'G');
  const moy = (cle) => champ.reduce((a, j) => a + j[cle], 0) / champ.length;
  return { vitesse: moy('vitesse'), tir: moy('tir'), passe: moy('passe'), defense: moy('defense') };
}

// ---------- Blasons ----------

// Dessine le blason d'une équipe dans un canvas (formes géométriques :
// écu + motif + initiale — aucun asset externe).
export function dessinerBlason(canvas, equipe) {
  const g = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  g.clearRect(0, 0, w, h);

  // Écu
  const ecu = () => {
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.96);
    g.bezierCurveTo(w * 0.06, h * 0.72, w * 0.1, h * 0.28, w * 0.1, h * 0.08);
    g.lineTo(w * 0.9, h * 0.08);
    g.bezierCurveTo(w * 0.9, h * 0.28, w * 0.94, h * 0.72, w * 0.5, h * 0.96);
    g.closePath();
  };
  ecu();
  g.fillStyle = equipe.couleur1;
  g.fill();

  // Motif dans l'écu
  g.save();
  ecu();
  g.clip();
  g.fillStyle = equipe.couleur2;
  if (equipe.motif === 'rayures') {
    for (let i = 0; i < 3; i++) g.fillRect(w * (0.16 + i * 0.28), 0, w * 0.13, h);
  } else if (equipe.motif === 'bande') {
    g.fillRect(0, h * 0.42, w, h * 0.2);
  } else if (equipe.motif === 'diagonale') {
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-0.6);
    g.fillRect(-w, -h * 0.1, w * 2, h * 0.2);
    g.restore();
  } else if (equipe.motif === 'chevron') {
    g.beginPath();
    g.moveTo(0, h * 0.3); g.lineTo(w * 0.5, h * 0.55); g.lineTo(w, h * 0.3);
    g.lineTo(w, h * 0.48); g.lineTo(w * 0.5, h * 0.73); g.lineTo(0, h * 0.48);
    g.closePath();
    g.fill();
  } else if (equipe.motif === 'etoile') {
    g.translate(w / 2, h * 0.46);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? w * 0.3 : w * 0.13;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  g.restore();

  // Contour + initiale
  ecu();
  g.lineWidth = Math.max(2, w * 0.04);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.stroke();
  g.font = `900 ${h * 0.3}px Arial`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = h * 0.045;
  g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.strokeText(equipe.court[0], w * 0.5, h * 0.45);
  g.fillStyle = '#ffffff';
  g.fillText(equipe.court[0], w * 0.5, h * 0.45);
}

// Note du club en étoiles pleines/demies : "★★★★½"
export function etoilesNote(note) {
  return '★'.repeat(Math.floor(note)) + (note % 1 >= 0.5 ? '½' : '');
}
