// ============================================================
// Gestion tactile : analyse du swipe de tir.
// Le geste est échantillonné en continu ; au relâchement on en
// déduit direction, puissance et effet (courbure du tracé).
// Fonctionne aussi à la souris pour tester sur ordinateur.
// ============================================================

import { CONFIG, clamp } from './config.js';

export class GestionnaireSwipe {
  constructor(element) {
    this.element = element;
    this.actif = false;        // un swipe autorisé est-il attendu ?
    this.enCours = false;      // le doigt est-il posé ?
    this.points = [];          // échantillons {x, y, t}
    this.surTir = null;        // callback(parametresTir)
    this.surProgression = null;// callback(apercu) pendant le geste (flèche de visée)
    this.surTap = null;        // callback() sur un tap court (mini-jeu de timing)

    // Souris + tactile via Pointer Events
    element.addEventListener('pointerdown', (e) => this.debut(e));
    element.addEventListener('pointermove', (e) => this.mouvement(e));
    element.addEventListener('pointerup', (e) => this.fin(e));
    element.addEventListener('pointercancel', () => this.annuler());
  }

  debut(e) {
    if (!this.actif) return;
    this.enCours = true;
    this.points = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
  }

  mouvement(e) {
    if (!this.enCours) return;
    this.points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (this.surProgression) {
      const apercu = this.analyser();
      if (apercu) this.surProgression(apercu);
    }
  }

  fin() {
    if (!this.enCours) return;
    this.enCours = false;
    const geste = this.analyser();
    if (!geste) {
      // Geste trop court → tap simple
      if (this.surTap) this.surTap();
      return;
    }
    if (this.surTir) this.surTir(geste);
  }

  annuler() {
    this.enCours = false;
    this.points = [];
  }

  // Convertit le tracé du doigt en paramètres de tir.
  // Retourne null si le geste est trop petit pour être un tir.
  analyser() {
    const pts = this.points;
    if (pts.length < 3) return null;
    const p0 = pts[0];
    const p1 = pts[pts.length - 1];
    const dx = p1.x - p0.x;
    const dy = p0.y - p1.y; // vers le haut = positif
    const longueur = Math.hypot(dx, dy);
    const duree = Math.max(0.03, (p1.t - p0.t) / 1000);

    // Seuils : il faut un vrai geste ascendant
    const echelle = Math.min(window.innerWidth, window.innerHeight);
    if (longueur < echelle * 0.08 || dy <= 0) return null;

    // --- Puissance : vitesse du swipe (px/s normalisés par la taille d'écran)
    const vitesseNorm = clamp((longueur / duree) / (echelle * 4.5), 0, 1);
    const puissance = CONFIG.vitesseMin + vitesseNorm * (CONFIG.vitesseMax - CONFIG.vitesseMin);

    // --- Direction latérale : angle du geste par rapport à la verticale
    const angleLateral = clamp(
      Math.atan2(dx, dy) / (Math.PI / 3),   // ±60° de geste → pleine amplitude
      -1, 1
    ) * (CONFIG.angleLateralMaxDeg * Math.PI / 180);

    // --- Élévation : plus le swipe est long (verticalement), plus le ballon monte
    const partVerticale = clamp(dy / (echelle * 0.55), 0, 1);
    const elevation = (CONFIG.elevationMinDeg +
      partVerticale * (CONFIG.elevationMaxDeg - CONFIG.elevationMinDeg)) * Math.PI / 180;

    // --- Effet (spin) : écart latéral maximal du tracé par rapport à la corde.
    // On mesure la déviation signée du point médian → courbe gauche/droite.
    let deviationMax = 0;
    const nx = -(p1.y - p0.y) / (longueur || 1); // normale à la corde
    const ny = (p1.x - p0.x) / (longueur || 1);
    for (const p of pts) {
      const d = (p.x - p0.x) * nx + (p.y - p0.y) * ny;
      if (Math.abs(d) > Math.abs(deviationMax)) deviationMax = d;
    }
    const spin = clamp(deviationMax / (echelle * 0.14), -1, 1) * CONFIG.spinMax;

    return { puissance, angleLateral, elevation, spin, vitesseNorm };
  }
}
