// ============================================================
// Configuration globale du jeu : dimensions du terrain,
// physique du ballon et réglages de difficulté.
// Unités : mètres (monde 3D), secondes.
// ============================================================

export const CONFIG = {
  // Cage (dimensions réelles FIFA, légèrement arrondies)
  butDemiLargeur: 3.66,   // distance centre → poteau
  butHauteur: 2.44,       // hauteur de la barre
  rayonPoteau: 0.07,

  // Ballon (rayon un peu grossi pour la lisibilité mobile)
  rayonBallon: 0.16,

  // Physique
  gravite: 9.81,
  coeffMagnus: 0.045,     // intensité de l'effet (courbe) par unité de spin
  rebondSol: 0.45,        // restitution verticale au sol
  frottementSol: 0.8,     // perte horizontale à chaque rebond

  // Tir tracé (façon Score Hero) : bornes de conversion du geste
  vitesseMin: 14,         // m/s pour un tracé court
  vitesseMax: 27,         // m/s pour un tracé long et vif
  spinMax: 9,             // effet max (courbure du tracé au maximum)
  cibleXMax: 7,           // la cible visée est bornée autour de la cage
  cibleYMax: 4.5,

  // Mur
  murHauteurJoueur: 1.82,
  murDemiLargeurJoueur: 0.34,
  murHauteurSaut: 0.55,
  murDureeSaut: 0.75,

  // Gardien
  gardienPortee: 1.05,    // rayon de la zone d'arrêt autour des mains
  gardienDureePlongeon: 0.42,

  // Sessions
  tirsParSession: 5,      // coup franc : nombre de tirs par partie
  tirsSeance: 5,          // penalty : tirs par équipe avant mort subite

  // Mode match : 1 minute de jeu = ce nombre de secondes réelles
  secondesParMinuteMatch: 1.4,

  // Mode arcade (vue FIFA) : rythme et équipes
  arcadeJoueursParEquipe: 10,     // joueurs de champ par équipe (+ 1 gardien = 11)
  arcadeSecondesParMinute: 2.0,   // 90' ≈ 3 minutes réelles
  arcadeVitesseJoueur: 7.8,       // m/s du joueur contrôlé
  arcadeVitessePasseMin: 17,      // vitesse plancher d'une passe (m/s)
  arcadeVitessePasseParMetre: 1.5,// la passe accélère avec la distance
  arcadeVitesseTir: 22,
};

// Réglages par difficulté : plus c'est dur, plus le gardien lit le tir
// et plus le mur réagit vite.
export const DIFFICULTES = {
  facile: {
    label: 'Facile',
    gardienErreur: 1.6,        // écart-type (m) de l'erreur d'anticipation
    gardienReaction: 0.34,     // délai (s) avant le plongeon
    murDelaiSaut: [0.10, 0.20],// le mur saute tôt → passe en dessous plus facile
    iaChanceButPenalty: 0.55,  // proba que l'IA marque son penalty
    iaChanceButMatch: 0.30,    // proba de but IA par occasion adverse (match)
    timingZone: 0.30,          // largeur relative de la zone verte du mini-jeu
    arcadeVitesseIA: 5.2,      // vitesse de course des adversaires (m/s)
    arcadePrecisionIA: 0.30,   // précision des tirs adverses (0..1)
    arcadeReactionIA: 0.9,     // agressivité défensive de l'IA (0..1)
  },
  moyen: {
    label: 'Moyen',
    gardienErreur: 0.95,
    gardienReaction: 0.26,
    murDelaiSaut: [0.16, 0.32],
    iaChanceButPenalty: 0.70,
    iaChanceButMatch: 0.45,
    timingZone: 0.20,
    arcadeVitesseIA: 6.2,
    arcadePrecisionIA: 0.45,
    arcadeReactionIA: 0.6,
  },
  difficile: {
    label: 'Difficile',
    gardienErreur: 0.45,
    gardienReaction: 0.18,
    murDelaiSaut: [0.22, 0.45],
    iaChanceButPenalty: 0.82,
    iaChanceButMatch: 0.60,
    timingZone: 0.13,
    arcadeVitesseIA: 7.2,
    arcadePrecisionIA: 0.62,
    arcadeReactionIA: 0.35,
  },
};

// Petits utilitaires partagés
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function alea(min, max) { return min + Math.random() * (max - min); }
// Tirage approximativement gaussien (somme de 3 uniformes, centré sur 0)
export function gauss(sigma) {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * 2 * sigma;
}
