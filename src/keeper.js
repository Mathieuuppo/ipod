// ============================================================
// IA et animation du gardien.
// Principe : au moment du tir, le gardien "lit" le point d'impact
// prévu dans le plan de la cage, avec une erreur gaussienne dont
// l'amplitude dépend de la difficulté. Après son temps de réaction,
// il plonge vers ce point deviné. L'arrêt est ensuite résolu
// géométriquement : le ballon est-il à portée de ses mains ?
// ============================================================

import { CONFIG, DIFFICULTES, clamp, gauss } from './config.js';

export class Gardien {
  constructor(monde) {
    this.monde = monde;         // accès au mesh this.monde.gardien
    this.reinitialiser();
  }

  reinitialiser() {
    this.etat = 'attente';      // attente | reaction | plongeon
    this.tempsAvantPlongeon = 0;
    this.tempsPlongeon = 0;
    this.cible = { x: 0, y: 1 };
    this.origineX = 0;
    this.balancement = Math.random() * Math.PI * 2;
    const g = this.monde.gardien;
    g.position.set(0, 0, 0.7);
    g.rotation.set(0, 0, 0);
  }

  // Appelé au moment du tir : le gardien anticipe le point d'impact réel
  // (xImpact, yImpact = où le ballon croisera la ligne) avec une erreur.
  anticiper(xImpact, yImpact, difficulte) {
    const d = DIFFICULTES[difficulte];
    this.cible.x = clamp(xImpact + gauss(d.gardienErreur), -CONFIG.butDemiLargeur, CONFIG.butDemiLargeur);
    this.cible.y = clamp(yImpact + gauss(d.gardienErreur * 0.5), 0.3, CONFIG.butHauteur);
    this.tempsAvantPlongeon = d.gardienReaction;
    this.origineX = this.monde.gardien.position.x;
    this.etat = 'reaction';
  }

  // Avance l'animation. À appeler chaque frame pendant un tir.
  maj(dt) {
    const g = this.monde.gardien;

    if (this.etat === 'attente') {
      // Petit balancement latéral en attendant le tir
      this.balancement += dt * 2.2;
      g.position.x = Math.sin(this.balancement) * 0.45;
      return;
    }

    if (this.etat === 'reaction') {
      this.tempsAvantPlongeon -= dt;
      if (this.tempsAvantPlongeon <= 0) {
        this.etat = 'plongeon';
        this.tempsPlongeon = 0;
        this.origineX = g.position.x;
      }
      return;
    }

    // Plongeon : translation vers la cible + bascule du corps
    this.tempsPlongeon += dt;
    const k = Math.min(this.tempsPlongeon / CONFIG.gardienDureePlongeon, 1);
    const lisse = 1 - (1 - k) * (1 - k); // ease-out
    g.position.x = this.origineX + (this.cible.x - this.origineX) * lisse;
    const versLeHaut = this.cible.y > 1.4;
    const sens = Math.sign(this.cible.x - this.origineX) || 1;
    g.rotation.z = -sens * lisse * (versLeHaut ? 0.9 : 1.35);
    g.position.y = lisse * (versLeHaut ? 0.55 : 0.1);
    // Bras tendus vers le ballon
    g.userData.brasG.rotation.z = 2.6;
    g.userData.brasD.rotation.z = -2.6;
  }

  // Le gardien touche-t-il un ballon qui croise la ligne en (x, y) ?
  // On compare au point atteint par ses mains au moment du passage.
  peutArreter(x, y) {
    const g = this.monde.gardien;
    // Position des "mains" : au-dessus de la tête, penchée par le plongeon
    const mainX = g.position.x + Math.sin(-g.rotation.z) * 1.5;
    const mainY = g.position.y + Math.cos(g.rotation.z) * 1.5;
    const dx = x - mainX;
    const dy = y - mainY;
    // Zone d'arrêt elliptique : large latéralement, moins en hauteur
    return (dx * dx) / (CONFIG.gardienPortee * CONFIG.gardienPortee) +
           (dy * dy) / (1.3 * 1.3) < 1;
  }
}
