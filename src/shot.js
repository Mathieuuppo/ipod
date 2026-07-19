// ============================================================
// Séquence de tir : physique du ballon (gravité + effet Magnus)
// et résolution complète d'un tir — contré par le mur, arrêt du
// gardien, poteau, but ou tir non cadré.
//
// Une SequenceTir est jetable : on en crée une par tir.
// Elle pilote aussi le saut du mur et l'anticipation du gardien.
// ============================================================

import * as THREE from 'three';
import { CONFIG, DIFFICULTES, alea } from './config.js';

export class SequenceTir {
  constructor(monde, gardien, difficulte, avecMur) {
    this.monde = monde;
    this.gardien = gardien;
    this.difficulte = difficulte;
    this.avecMur = avecMur;

    this.pos = monde.ballon.position.clone();
    this.vel = new THREE.Vector3();
    this.spin = 0;
    this.enVol = false;
    this.murPasse = !avecMur;
    this.lignePassee = false;
    this.resultat = null;      // 'but' | 'arret' | 'poteau' | 'dehors' | 'contre'
    this.tempsRestant = 0;     // prolongation visuelle après résolution
    this.tempsVol = 0;
    this.delaiSautMur = 0;
    this.murASaute = false;
    this.surEvenement = null;  // callback(type) pour les sons immédiats
  }

  // Convertit les paramètres du swipe en vitesse initiale puis lance le vol.
  // cibleGardien (optionnel) force le point que le gardien croit devoir
  // couvrir — utilisé par le mini-jeu de timing du mode match.
  lancer({ puissance, angleLateral, elevation, spin }, cibleGardien = null) {
    const cosE = Math.cos(elevation);
    this.vel.set(
      puissance * Math.sin(angleLateral) * cosE,
      puissance * Math.sin(elevation),
      -puissance * Math.cos(angleLateral) * cosE
    );
    this.spin = spin;
    this.enVol = true;
    this.tempsVol = 0;

    // Le mur saute après un court délai (dépend de la difficulté)
    const [dMin, dMax] = DIFFUSAUT(this.difficulte);
    this.delaiSautMur = alea(dMin, dMax);

    // Le gardien anticipe le point d'impact réel (pré-simulation silencieuse),
    // sauf si une cible lui est imposée par le mode de jeu
    const impact = cibleGardien || this.predireImpact();
    this.gardien.anticiper(impact.x, impact.y, this.difficulte);
  }

  // Pré-simulation rapide (mêmes équations, sans collisions) pour savoir
  // où le ballon croisera le plan de la cage — c'est ce que "lit" le gardien.
  predireImpact() {
    const p = this.pos.clone(), v = this.vel.clone();
    const dt = 1 / 120;
    for (let i = 0; i < 600 && p.z > 0; i++) {
      const prevZ = p.z;
      this.appliquerForces(v, dt);
      p.addScaledVector(v, dt);
      if (p.z <= 0 && prevZ > 0) {
        return { x: p.x, y: Math.max(p.y, 0) };
      }
    }
    return { x: p.x, y: Math.max(p.y, 0.5) };
  }

  // Gravité + effet Magnus (spin autour de l'axe vertical → courbe latérale).
  // Composante x de ω × v avec ω = (0, spin, 0) : ax ∝ spin · vz.
  appliquerForces(v, dt) {
    v.y -= CONFIG.gravite * dt;
    v.x += CONFIG.coeffMagnus * this.spin * v.z * dt;
  }

  emettre(type) { if (this.surEvenement) this.surEvenement(type); }

  // Avance la simulation. Retourne null tant que le tir n'est pas terminé,
  // puis une seule fois le résultat final.
  maj(dt) {
    if (!this.enVol) return null;
    this.tempsVol += dt;

    // Déclenchement du saut du mur
    if (this.avecMur && !this.murASaute && this.tempsVol >= this.delaiSautMur) {
      this.murASaute = true;
      this.monde.sauterMur();
    }

    // Intégration en sous-pas pour des collisions fiables à haute vitesse
    const sousPas = 3;
    const h = dt / sousPas;
    for (let s = 0; s < sousPas; s++) {
      const prev = this.pos.clone();
      this.appliquerForces(this.vel, h);
      // Léger amortissement du spin en vol
      this.spin *= 1 - 0.25 * h;
      this.pos.addScaledVector(this.vel, h);

      this.collisionSol();
      if (!this.murPasse) this.collisionMur(prev);
      if (!this.lignePassee) this.collisionLigneDeBut(prev);
      this.collisionFiletEtSol();
    }

    this.monde.ballon.position.copy(this.pos);
    // Roulis visuel du ballon proportionnel à la vitesse
    this.monde.ballon.rotation.x -= this.vel.z * dt * 4;
    this.monde.ballon.rotation.z -= this.vel.x * dt * 4;

    // Fin du tir : résultat connu + petite prolongation visuelle écoulée
    if (this.resultat) {
      this.tempsRestant -= dt;
      if (this.tempsRestant <= 0) {
        this.enVol = false;
        return this.resultat;
      }
    } else if (this.tempsVol > 5) {
      // Filet de sécurité : tir perdu dans la nature
      this.terminer('dehors', 0.2);
      this.emettre('dehors');
    }
    return null;
  }

  terminer(resultat, prolongation) {
    if (!this.resultat) {
      this.resultat = resultat;
      this.tempsRestant = prolongation;
    }
  }

  collisionSol() {
    if (this.pos.y < CONFIG.rayonBallon && this.vel.y < 0) {
      this.pos.y = CONFIG.rayonBallon;
      this.vel.y = -this.vel.y * CONFIG.rebondSol;
      this.vel.x *= CONFIG.frottementSol;
      this.vel.z *= CONFIG.frottementSol;
    }
  }

  // Le ballon franchit le plan du mur : est-il stoppé par un joueur ?
  collisionMur(prev) {
    const zMur = this.monde.zMur;
    if (!(prev.z > zMur && this.pos.z <= zMur)) return;
    this.murPasse = true;

    // Interpolation de la position exacte au franchissement
    const k = (prev.z - zMur) / (prev.z - this.pos.z + 1e-9);
    const x = prev.x + (this.pos.x - prev.x) * k;
    const y = prev.y + (this.pos.y - prev.y) * k;

    const pieds = this.monde.hauteurPiedsMur(); // > 0 si le mur est en l'air
    for (const j of this.monde.mur) {
      if (!j.visible) continue;
      const dansLargeur = Math.abs(x - j.position.x) <
        CONFIG.murDemiLargeurJoueur + CONFIG.rayonBallon;
      const dansHauteur = y > pieds - CONFIG.rayonBallon &&
        y < pieds + CONFIG.murHauteurJoueur + CONFIG.rayonBallon;
      if (dansLargeur && dansHauteur) {
        // Contré : le ballon repart vers l'arrière
        this.vel.z = Math.abs(this.vel.z) * 0.3;
        this.vel.x = alea(-2, 2);
        this.vel.y = Math.abs(this.vel.y) * 0.3 + 2.5;
        this.terminer('contre', 1.1);
        this.emettre('contre');
        return;
      }
    }
  }

  // Franchissement de la ligne de but : but, arrêt, poteau ou à côté
  collisionLigneDeBut(prev) {
    if (!(prev.z > 0 && this.pos.z <= 0)) return;
    this.lignePassee = true;

    const k = (prev.z - 0) / (prev.z - this.pos.z + 1e-9);
    const x = prev.x + (this.pos.x - prev.x) * k;
    const y = prev.y + (this.pos.y - prev.y) * k;

    const L = CONFIG.butDemiLargeur, H = CONFIG.butHauteur;
    const r = CONFIG.rayonBallon, marge = 0.12;

    // Poteaux / barre : bande étroite autour du cadre
    const surPoteau = Math.abs(Math.abs(x) - L) < r + marge && y < H + marge;
    const surBarre = Math.abs(y - H) < r + marge && Math.abs(x) < L + marge;
    if (surPoteau || surBarre) {
      this.vel.z = Math.abs(this.vel.z) * 0.45;
      this.vel.x = surPoteau ? -Math.sign(x) * Math.abs(this.vel.x) * 0.6 + alea(-1, 1) : this.vel.x;
      if (surBarre) this.vel.y = -Math.abs(this.vel.y) * 0.5 - 1;
      this.monde.secouer();
      this.terminer('poteau', 1.2);
      this.emettre('poteau');
      return;
    }

    if (Math.abs(x) < L - r && y < H - r) {
      // Cadré : le gardien peut-il l'arrêter ?
      if (this.gardien.peutArreter(x, y)) {
        this.vel.z = Math.abs(this.vel.z) * 0.2;
        this.vel.x = Math.sign(x - this.monde.gardien.position.x || 1) * 3;
        this.vel.y = Math.max(this.vel.y * 0.2, 1.5);
        this.terminer('arret', 1.1);
        this.emettre('arret');
      } else {
        this.terminer('but', 1.2);
        this.emettre('but');
      }
    } else {
      // Au-dessus ou à côté
      this.terminer('dehors', 0.9);
      this.emettre('dehors');
    }
  }

  // Empêche le ballon de traverser le fond du filet après un but
  collisionFiletEtSol() {
    if (this.resultat === 'but' && this.pos.z < -1.45) {
      this.pos.z = -1.45;
      this.vel.multiplyScalar(0.2);
    }
  }
}

// Petit raccourci : bornes du délai de saut du mur pour la difficulté
function DIFFUSAUT(difficulte) {
  return DIFFICULTES[difficulte].murDelaiSaut;
}
