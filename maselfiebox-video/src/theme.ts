// ---------------------------------------------------------------------------
// Ma Selfie Box — identité visuelle relevée sur reservation.maselfiebox.fr
// (feuille boutique.css : variables --msb-*) et sur le logo officiel.
// ---------------------------------------------------------------------------
export const C = {
  turq: '#10DCCB', // --msb-turquoise
  turqDark: '#1C9A8F', // --msb-turquoise-fonce
  logoTurq: '#51BDBA', // turquoise de l'appareil photo du logo officiel
  black: '#000000', // --msb-noir
  ink: '#050708', // noir profond de la vidéo
  text: '#171616', // --msb-texte
  textSoft: '#5E6363', // --msb-texte-doux
  line: '#D6DEDE', // --msb-bordure
  bg: '#EFF3F3', // --msb-fond
  soft: '#E8F7F5',
  white: '#FFFFFF',
};

export const FONT = "'Poppins', system-ui, sans-serif";

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const DURATION = 3000; // 50 s exactement

// Musique : 120 BPM -> 1 temps = 0,5 s = 30 images. 1 mesure = 120 images.
export const BEAT = 30;
export const BAR = 120;

// Découpage (image de départ, durée) — calé sur le storyboard
export const T = {
  intro: {from: 0, dur: 240}, // 00:00–00:04
  platform: {from: 240, dur: 240}, // 00:04–00:08
  date: {from: 480, dur: 420}, // 00:08–00:15
  formule: {from: 900, dur: 540}, // 00:15–00:24
  options: {from: 1440, dur: 480}, // 00:24–00:32
  resa: {from: 1920, dur: 480}, // 00:32–00:40
  promesse: {from: 2400, dur: 360}, // 00:40–00:46
  outro: {from: 2760, dur: 240}, // 00:46–00:50
};

export type Rect = {x: number; y: number; w: number; h: number};

// Rectangles partagés entre scènes : ils garantissent la continuité des
// morphings (l'élément qui sort d'une scène est exactement celui qui entre
// dans la suivante).
export const R = {
  calCard: {x: 980, y: 150, w: 820, h: 780} as Rect,
  cardCenter: {x: 780, y: 330, w: 360, h: 520} as Rect,
  selCard: {x: 758, y: 300, w: 404, h: 584} as Rect,
  panel: {x: 120, y: 300, w: 1680, h: 716} as Rect,
  recap: {x: 1000, y: 110, w: 800, h: 860} as Rect,
};

// Données RÉELLES relevées le 10/11/2026 sur reservation.maselfiebox.fr
export const DATA = {
  url: 'reservation.maselfiebox.fr',
  steps: ['Votre date', 'Votre formule', 'Vos coordonnées', 'Paiement'],
  formules: [
    {n: 100, img: 'products/pack-100.webp', from: '240', soiree: '300'},
    {n: 200, img: 'products/pack-200.webp', from: '280', soiree: '325'},
    {n: 300, img: 'products/pack-300.webp', from: '320', soiree: '345'},
    {n: 400, img: 'products/pack-400.webp', from: '360', soiree: '380'},
  ],
  options: [
    {name: 'Livre d’or audio', img: 'options/livre-dor-audio.webp', pos: '50% 62%', price: '89', desc: 'Le combiné téléphonique qui recueille les messages de vos invités.'},
    {name: 'Coffre de déguisement', img: 'options/coffre-deguisement.webp', pos: '50% 55%', price: '40', desc: 'De quoi faire oser les invités devant la borne.'},
    {name: 'Option brunch : borne jusqu’à 16 h le lendemain', img: 'options/option-brunch.webp', pos: '50% 12%', price: '50', desc: 'Prolonge une location en soirée jusqu’à 16 h le lendemain.'},
  ],
};
