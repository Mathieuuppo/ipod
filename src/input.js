// ============================================================
// Gestion tactile : tir "à la Score Hero".
// Le joueur TRACE la trajectoire souhaitée avec le doigt : le
// point d'arrivée du tracé donne la cible, la longueur donne la
// puissance et la courbure du tracé donne l'effet (le ballon
// suit la courbe dessinée). Fonctionne aussi à la souris.
// ============================================================

import { CONFIG, clamp } from './config.js';

export class GestionnaireSwipe {
  constructor(element) {
    this.element = element;
    this.actif = false;        // un swipe autorisé est-il attendu ?
    this.enCours = false;      // le doigt est-il posé ?
    this.points = [];          // échantillons {x, y, t}
    this.surTir = null;        // callback(geste) au relâchement
    this.surProgression = null;// callback(points) pendant le tracé (ligne à l'écran)
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
    if (this.surProgression) this.surProgression(this.points);
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

  // Convertit le tracé du doigt en geste de tir (façon Score Hero) :
  //  - finX/finY : point d'arrivée du tracé à l'écran → la cible visée
  //  - puissance : longueur du tracé (+ bonus de vitesse du geste)
  //  - spin      : courbure signée du tracé (bombé à droite = effet à droite)
  // Retourne null si le geste est trop petit pour être un tir.
  analyser() {
    const pts = this.points;
    if (pts.length < 3) return null;
    const p0 = pts[0];
    const p1 = pts[pts.length - 1];
    const dx = p1.x - p0.x;
    const dy = p0.y - p1.y; // vers le haut = positif
    const corde = Math.hypot(dx, dy);
    const duree = Math.max(0.03, (p1.t - p0.t) / 1000);

    // Seuils : il faut un vrai tracé ascendant
    const echelle = Math.min(window.innerWidth, window.innerHeight);
    if (corde < echelle * 0.08 || dy <= 0) return null;

    // --- Puissance : longueur réelle du tracé, avec un bonus si le geste est vif
    let longueurTrace = 0;
    for (let i = 1; i < pts.length; i++) {
      longueurTrace += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    const partLongueur = clamp(longueurTrace / (echelle * 0.85), 0, 1);
    const partVitesse = clamp((corde / duree) / (echelle * 5), 0, 1);
    const vitesseNorm = clamp(0.15 + partLongueur * 0.65 + partVitesse * 0.3, 0, 1);
    const puissance = CONFIG.vitesseMin + vitesseNorm * (CONFIG.vitesseMax - CONFIG.vitesseMin);

    // --- Effet : déviation latérale maximale du tracé par rapport à la corde.
    // Normale orientée vers la droite de l'écran → tracé bombé à droite = spin > 0
    // (le ballon suivra une courbe bombée du même côté que la ligne dessinée).
    let deviationMax = 0;
    const nx = -(p1.y - p0.y) / (corde || 1);
    const ny = (p1.x - p0.x) / (corde || 1);
    for (const p of pts) {
      const d = (p.x - p0.x) * nx + (p.y - p0.y) * ny;
      if (Math.abs(d) > Math.abs(deviationMax)) deviationMax = d;
    }
    const spin = clamp(deviationMax / (echelle * 0.16), -1, 1) * CONFIG.spinMax;

    return { finX: p1.x, finY: p1.y, puissance, spin, vitesseNorm };
  }
}
