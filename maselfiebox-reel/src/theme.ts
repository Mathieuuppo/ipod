// ---------------------------------------------------------------------------
// Ma Selfie Box — REEL vertical « Comment ça marche ? »
// Identité relevée sur reservation.maselfiebox.fr (boutique.css, --msb-*).
// Direction artistique CLAIRE : blanc cassé, anthracite, turquoise.
// ---------------------------------------------------------------------------
export const C = {
  turq: '#10DCCB', // --msb-turquoise
  turqDark: '#1C9A8F', // --msb-turquoise-fonce
  logoTurq: '#51BDBA', // turquoise de l'appareil photo du logo officiel
  text: '#171616', // --msb-texte (anthracite)
  textSoft: '#5E6363', // --msb-texte-doux
  line: '#D6DEDE', // --msb-bordure
  bg: '#EFF3F3', // --msb-fond
  soft: '#E8F7F5',
  paper: '#F5F6F3', // blanc cassé du fond
  white: '#FFFFFF',
  black: '#000000',
  ink: '#171616',
};

export const FONT = "'Poppins', system-ui, sans-serif";
export const FPS = 60;
export const W = 1080;
export const H = 1920;

// Musique 120 BPM : 1 temps = 30 images, 1 mesure = 120 images.
export const BEAT = 30;

// Zones de sécurité Instagram Reels / Stories / TikTok : le texte
// essentiel reste entre ces bornes (interface en haut, légende et boutons
// en bas, colonne d'icônes à droite).
export const SAFE = {top: 250, bottom: 1480, left: 80, right: 960};

// Découpage : 65 s = 3900 images
export const T = {
  intro: {from: 0, dur: 300}, // 00:00–00:05 Comment ça marche ?
  resa: {from: 300, dur: 480}, // 00:05–00:13 01 Vous réservez
  acompte: {from: 780, dur: 360}, // 00:13–00:19 02 Acompte 30 %
  cadre: {from: 1140, dur: 480}, // 00:19–00:27 03 Votre cadre
  prepa: {from: 1620, dur: 360}, // 00:27–00:33 04 On prépare tout
  livraison: {from: 1980, dur: 450}, // 00:33–00:40,5 05 On vous livre
  souvenirs: {from: 2430, dur: 570}, // 00:40,5–00:50 06 À vous de jouer
  reprise: {from: 3000, dur: 360}, // 00:50–00:56 07 On s'occupe de la suite
  numerique: {from: 3360, dur: 300}, // 00:56–01:01 Vos photos numériques
  outro: {from: 3660, dur: 240}, // 01:01–01:05 Outro
};
export const DURATION = 3900;

export const SHADOW = '0 50px 90px rgba(20,60,60,0.16), 0 10px 24px rgba(20,60,60,0.08)';
export const SHADOW_SOFT = '0 24px 50px rgba(20,60,60,0.12), 0 4px 12px rgba(20,60,60,0.06)';

// Données vérifiées sur le site (10/11/2026)
export const DATA = {
  url: 'reservation.maselfiebox.fr',
  formules: [
    {n: 100, img: 'products/pack-100.webp', from: '240'},
    {n: 200, img: 'products/pack-200.webp', from: '280'},
    {n: 300, img: 'products/pack-300.webp', from: '320'},
    {n: 400, img: 'products/pack-400.webp', from: '360'},
  ],
  options: [
    {name: 'Livre d’or audio', img: 'options/livre-dor-audio.webp', pos: '50% 62%', price: '89', desc: 'Le combiné téléphonique qui recueille les messages de vos invités.'},
    {name: 'Coffre de déguisement', img: 'options/coffre-deguisement.webp', pos: '50% 55%', price: '40', desc: 'De quoi faire oser les invités devant la borne.'},
  ],
  steps: ['Votre date', 'Votre formule', 'Vos coordonnées', 'Paiement'],
};

export type Rect = {x: number; y: number; w: number; h: number};
