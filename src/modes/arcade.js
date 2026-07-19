// ============================================================
// Mode Match Arcade : un vrai match jouable vu d'en haut (façon
// FIFA rétro). Joystick virtuel pour courir, boutons PASSE / TIR
// (qui deviennent JOUEUR / TACLE quand on défend).
//
// L'équipe BLEUE (le joueur) attaque la cage A (z = 0), l'équipe
// ROUGE attaque la cage B (z = 50). Chaque équipe : 5 joueurs de
// champ pilotés par une IA de position simple + 1 gardien.
// Le ballon est soit porté (dribble), soit libre (physique 2D+
// hauteur pour les tirs).
// ============================================================

import { CONFIG, DIFFICULTES, clamp, alea } from '../config.js';
import { TERRAIN } from '../world.js';
import { sauvegarde } from '../storage.js';
import { sons } from '../audio.js';

const L = TERRAIN.longueur;       // 50
const DEMI = TERRAIN.demiLargeur; // 20
const BUT_X = CONFIG.butDemiLargeur;
const BUT_Y = CONFIG.butHauteur;

// Ancrages de formation (x, décalage z par rapport au ballon, vers son
// propre but) : 2 défenseurs, 2 milieux, 1 attaquant.
const FORMATION = [
  { x: -7, zOff: 14 }, { x: 7, zOff: 14 },   // défenseurs
  { x: -9, zOff: 2 }, { x: 9, zOff: 2 },     // milieux
  { x: 0, zOff: -11 },                       // attaquant
];

// Un joueur de champ (mesh voxel + état de déplacement)
class Joueur {
  constructor(mesh, equipe, indice) {
    this.mesh = mesh;
    this.equipe = equipe;   // 'bleu' | 'rouge'
    this.indice = indice;
    this.x = 0; this.z = 0;
    this.vx = 0; this.vz = 0;
    this.phase = Math.random() * 6; // phase de l'animation de course
  }

  placer(x, z) { this.x = x; this.z = z; this.vx = 0; this.vz = 0; }

  // Avance vers une cible avec arrivée douce
  chercher(tx, tz, vitesse, dt) {
    const dx = tx - this.x, dz = tz - this.z;
    const d = Math.hypot(dx, dz);
    const v = d < 1.2 ? vitesse * d / 1.2 : vitesse;
    if (d > 0.05) {
      this.vx = dx / d * v;
      this.vz = dz / d * v;
    } else { this.vx = 0; this.vz = 0; }
    this.avancer(dt);
  }

  avancer(dt) {
    this.x = clamp(this.x + this.vx * dt, -DEMI + 0.4, DEMI - 0.4);
    this.z = clamp(this.z + this.vz * dt, 0.6, L - 0.6);
  }

  // Position du mesh + petite animation de course + orientation
  animer(dt) {
    this.mesh.position.set(this.x, 0, this.z);
    const vitesse = Math.hypot(this.vx, this.vz);
    if (vitesse > 0.4) {
      this.phase += vitesse * dt * 2.4;
      this.mesh.rotation.y = Math.atan2(this.vx, this.vz);
      this.mesh.userData.jambeG.rotation.x = Math.sin(this.phase) * 0.65;
      this.mesh.userData.jambeD.rotation.x = -Math.sin(this.phase) * 0.65;
    } else {
      this.mesh.userData.jambeG.rotation.x *= 0.85;
      this.mesh.userData.jambeD.rotation.x *= 0.85;
    }
  }

  dist(x, z) { return Math.hypot(this.x - x, this.z - z); }
}

export class ModeArcade {
  constructor(ctx) {
    this.ctx = ctx;
    this.nom = 'arcade';
  }

  demarrer() {
    const { monde, ui, swipe, difficulte } = this.ctx;
    this.reglages = DIFFICULTES[difficulte];
    swipe.actif = false; // pas de tir tracé ici : joystick + boutons

    const acteurs = monde.creerActeursArcade(CONFIG.arcadeJoueursParEquipe);
    monde.modeArcade(true);

    // Équipes
    this.bleus = acteurs.bleu.map((m, i) => new Joueur(m, 'bleu', i));
    this.rouges = acteurs.rouge.map((m, i) => new Joueur(m, 'rouge', i));
    // Gardiens : le rouge défend la cage A (z=0), le bleu la cage B (z=50)
    this.gardienA = new Joueur(acteurs.gardienRouge, 'rouge', -1);
    this.gardienB = new Joueur(acteurs.gardienBleu, 'bleu', -1);

    // Ballon : position 3D + vitesse ; porteur = dribble en cours
    this.ballon = { x: 0, y: CONFIG.rayonBallon, z: L / 2, vx: 0, vy: 0, vz: 0 };
    this.porteur = null;
    this.ignoreReprise = { joueur: null, temps: 0 }; // anti double-touche après un coup de pied

    this.scoreJoueur = 0;
    this.scoreAdverse = 0;
    this.tempsEcoule = 0;
    this.minute = 0;
    this.etat = 'jeu';        // jeu | pause (célébration) | fini
    this.tempsPause = 0;
    this.decisionIA = 0;      // minuteur de décision du porteur adverse
    this.contactVol = 0;      // temps de contact défenseur IA ↔ porteur bleu
    this.cooldownTacle = 0;

    ui.montrerBoutonsJeu(true);
    ui.montrerHudMatch(true);
    ui.montrerControlesArcade(true);
    ui.majMatch({ minute: 0, scoreJoueur: 0, scoreAdverse: 0 });
    ui.surPasse = () => this.actionPasse();
    ui.surTirArcade = () => this.actionTir();

    this.engagement('bleu');
    sons.sifflet();
    ui.montrerMessage('COUP D\'ENVOI !', 1500);
  }

  // Replace tout le monde pour un engagement au centre
  engagement(equipe) {
    for (let i = 0; i < this.bleus.length; i++) {
      const f = FORMATION[i];
      this.bleus[i].placer(f.x, clamp(L / 2 + f.zOff * 0.9, 3, L - 3));
      this.rouges[i].placer(-f.x, clamp(L / 2 - f.zOff * 0.9, 3, L - 3));
    }
    this.gardienA.placer(0, 1.0);
    this.gardienB.placer(0, L - 1.0);
    Object.assign(this.ballon, { x: 0, y: CONFIG.rayonBallon, z: L / 2, vx: 0, vy: 0, vz: 0 });
    // L'équipe qui engage reçoit le ballon au centre
    const receveur = equipe === 'bleu' ? this.bleus[4] : this.rouges[4];
    receveur.placer(0, L / 2 + (equipe === 'bleu' ? 1.2 : -1.2));
    this.porteur = receveur;
    this.controle = equipe === 'bleu' ? receveur : this.plusProcheBleu();
  }

  // ---------- Actions du joueur ----------

  actionPasse() {
    if (this.etat !== 'jeu') return;
    const { ui } = this.ctx;
    if (this.porteur && this.porteur.equipe === 'bleu') {
      // PASSE : vers le coéquipier le mieux aligné avec le joystick
      const p = this.porteur;
      const j = ui.joystick;
      const dirX = j.actif ? j.x : Math.sin(p.mesh.rotation.y);
      const dirZ = j.actif ? j.y : Math.cos(p.mesh.rotation.y);
      let meilleur = null, meilleurScore = -1e9;
      for (const c of this.bleus) {
        if (c === p) continue;
        const dx = c.x - p.x, dz = c.z - p.z;
        const d = Math.hypot(dx, dz) || 1;
        const alignement = (dx * dirX + dz * dirZ) / d;
        const score = alignement * 10 - d * 0.18;
        if (score > meilleurScore) { meilleurScore = score; meilleur = c; }
      }
      if (!meilleur) return;
      // Passe avec un peu d'avance sur la course du receveur
      const cx = meilleur.x + meilleur.vx * 0.25;
      const cz = meilleur.z + meilleur.vz * 0.25;
      this.frapper(p, cx - p.x, cz - p.z, CONFIG.arcadeVitessePasse, 0.6);
      this.controle = meilleur; // on prend la main sur le receveur
      sons.clic();
    } else {
      // JOUEUR : changer de joueur contrôlé (le plus proche du ballon)
      this.controle = this.plusProcheBleu(this.controle);
    }
  }

  actionTir() {
    if (this.etat !== 'jeu') return;
    const { ui } = this.ctx;
    if (this.porteur && this.porteur.equipe === 'bleu') {
      // TIR vers la cage A (z = 0) ; le joystick décale la visée
      const p = this.porteur;
      const viseX = clamp(ui.joystick.actif ? ui.joystick.x * 4 : alea(-1.5, 1.5), -3.3, 3.3);
      const dist = Math.hypot(viseX - p.x, p.z);
      // Imprécision qui augmente avec la distance
      const erreur = alea(-1, 1) * dist * 0.045;
      const dx = viseX + erreur - p.x, dz = -p.z;
      this.frapper(p, dx, dz, CONFIG.arcadeVitesseTir, clamp(dist * 0.16, 1.2, 4.6));
      sons.frappe();
    } else if (this.cooldownTacle <= 0) {
      // TACLE : tenté si un adversaire porte le ballon tout près
      this.cooldownTacle = 0.8;
      const cible = this.porteur;
      if (cible && cible.equipe === 'rouge' && this.controle.dist(cible.x, cible.z) < 1.6) {
        if (Math.random() < 0.75) this.ballonLibre(cible, 2.5);
        sons.clic();
      }
    }
  }

  // Le porteur frappe le ballon dans une direction (passe ou tir)
  frapper(joueur, dx, dz, vitesse, vy) {
    const d = Math.hypot(dx, dz) || 1;
    this.ballon.vx = dx / d * vitesse;
    this.ballon.vz = dz / d * vitesse;
    this.ballon.vy = vy;
    this.porteur = null;
    this.ignoreReprise = { joueur, temps: 0.45 };
  }

  // Le ballon échappe au porteur (tacle réussi, interception)
  ballonLibre(ancienPorteur, force) {
    this.ballon.vx = alea(-force, force);
    this.ballon.vz = alea(-force, force);
    this.ballon.vy = 1.2;
    this.porteur = null;
    this.ignoreReprise = { joueur: ancienPorteur, temps: 0.5 };
  }

  plusProcheBleu(sauf = null) {
    let meilleur = this.bleus[0], dMin = 1e9;
    for (const b of this.bleus) {
      if (b === sauf) continue;
      const d = b.dist(this.ballon.x, this.ballon.z);
      if (d < dMin) { dMin = d; meilleur = b; }
    }
    return meilleur;
  }

  // ---------- Boucle principale ----------

  maj(dt) {
    if (this.etat === 'fini') return;
    const { ui, monde } = this.ctx;

    // Chrono du match (tourne aussi pendant les célébrations courtes)
    this.tempsEcoule += dt;
    const minute = Math.min(90, Math.floor(this.tempsEcoule / CONFIG.arcadeSecondesParMinute));
    if (minute !== this.minute) {
      this.minute = minute;
      ui.majMatch({ minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });
      if (minute >= 90) { this.terminer(); return; }
    }

    this.cooldownTacle = Math.max(0, this.cooldownTacle - dt);
    this.ignoreReprise.temps = Math.max(0, this.ignoreReprise.temps - dt);

    if (this.etat === 'pause') {
      this.tempsPause -= dt;
      if (this.tempsPause <= 0) {
        this.etat = 'jeu';
        this.engagement(this.prochainEngagement);
      }
    } else {
      this.majJoueurControle(dt);
      this.majIABleue(dt);
      this.majIARouge(dt);
      this.majGardiens(dt);
      this.majBallon(dt);
    }

    // Animations + marqueurs + caméra
    for (const j of [...this.bleus, ...this.rouges, this.gardienA, this.gardienB]) j.animer(dt);
    const arc = monde.arcade;
    arc.anneauControle.position.set(this.controle.x, 0.03, this.controle.z);
    if (this.porteur && this.porteur !== this.controle) {
      arc.anneauPorteur.visible = true;
      arc.anneauPorteur.position.set(this.porteur.x, 0.03, this.porteur.z);
    } else {
      arc.anneauPorteur.visible = false;
    }
    ui.libellesArcade(!!(this.porteur && this.porteur.equipe === 'bleu'));
    monde.suivreCameraArcade(this.ballon.x, this.ballon.z, dt);
  }

  // Le joueur contrôlé suit le joystick (écran haut = vers la cage adverse)
  majJoueurControle(dt) {
    const j = this.ctx.ui.joystick;
    const c = this.controle;
    if (j.actif && (Math.abs(j.x) > 0.12 || Math.abs(j.y) > 0.12)) {
      c.vx = j.x * CONFIG.arcadeVitesseJoueur;
      c.vz = j.y * CONFIG.arcadeVitesseJoueur;
    } else {
      c.vx *= 0.8; c.vz *= 0.8;
    }
    c.avancer(dt);
  }

  // Coéquipiers bleus : tenue de poste + le plus proche va au ballon libre
  majIABleue(dt) {
    const chasseur = this.porteur ? null : this.plusProcheBleu();
    for (const b of this.bleus) {
      if (b === this.controle) continue;
      if (b === chasseur) {
        b.chercher(this.ballon.x, this.ballon.z, CONFIG.arcadeVitesseJoueur * 0.9, dt);
        continue;
      }
      const f = FORMATION[b.indice];
      // Les bleus défendent la cage B (z = L) : les ancres suivent le ballon
      const tz = clamp(this.ballon.z + f.zOff * 0.75, 2.5, L - 2.5);
      const tx = clamp(f.x + this.ballon.x * 0.25, -DEMI + 1, DEMI - 1);
      b.chercher(tx, tz, CONFIG.arcadeVitesseJoueur * 0.75, dt);
    }
  }

  // Adversaires rouges : pressing, passes et tirs selon la difficulté
  majIARouge(dt) {
    const r = this.reglages;
    const porteurRouge = this.porteur && this.porteur.equipe === 'rouge' ? this.porteur : null;
    const porteurBleu = this.porteur && this.porteur.equipe === 'bleu' ? this.porteur : null;

    // Poursuite : le rouge le plus proche du ballon presse toujours
    let chasseur = null, dMin = 1e9;
    for (const rj of this.rouges) {
      const d = rj.dist(this.ballon.x, this.ballon.z);
      if (d < dMin) { dMin = d; chasseur = rj; }
    }

    for (const rj of this.rouges) {
      if (rj === porteurRouge) continue; // le porteur est géré plus bas
      if (rj === chasseur && !porteurRouge) {
        rj.chercher(this.ballon.x, this.ballon.z, r.arcadeVitesseIA, dt);
        continue;
      }
      // Tenue de poste (les rouges défendent la cage A : ancres inversées)
      const f = FORMATION[rj.indice];
      const tz = clamp(this.ballon.z - f.zOff * 0.75, 2.5, L - 2.5);
      const tx = clamp(-f.x + this.ballon.x * 0.25, -DEMI + 1, DEMI - 1);
      rj.chercher(tx, tz, r.arcadeVitesseIA * 0.8, dt);
    }

    // Vol de balle : contact prolongé avec le porteur bleu
    if (porteurBleu && chasseur && chasseur.dist(porteurBleu.x, porteurBleu.z) < 0.9) {
      this.contactVol += dt;
      if (this.contactVol > r.arcadeReactionIA) {
        this.contactVol = 0;
        this.ballonLibre(porteurBleu, 2.2);
      }
    } else {
      this.contactVol = Math.max(0, this.contactVol - dt);
    }

    // Décisions du porteur rouge (toutes les ~0.7 s)
    if (porteurRouge) {
      porteurRouge.chercher(porteurRouge.x * 0.7, L - 2, r.arcadeVitesseIA, dt);
      this.decisionIA -= dt;
      if (this.decisionIA <= 0) {
        this.decisionIA = 0.7;
        const distBut = L - porteurRouge.z;
        const pression = this.controle.dist(porteurRouge.x, porteurRouge.z) < 2.4;
        if (distBut < 15 && Math.random() < 0.7) {
          // Tir : cadré ou non selon la précision de la difficulté
          const cadre = Math.random() < this.reglages.arcadePrecisionIA;
          const viseX = cadre ? alea(-2.9, 2.9) : (Math.random() < 0.5 ? -1 : 1) * alea(4.2, 6);
          this.frapper(porteurRouge, viseX - porteurRouge.x, L - porteurRouge.z,
            CONFIG.arcadeVitesseTir * 0.95, clamp(distBut * 0.15, 1.2, 4));
          sons.frappe();
        } else if (pression && Math.random() < 0.8) {
          // Passe au rouge le plus avancé et pas trop loin
          let meilleur = null, score = -1e9;
          for (const c of this.rouges) {
            if (c === porteurRouge) continue;
            const s = c.z * 0.5 - c.dist(porteurRouge.x, porteurRouge.z) * 0.25;
            if (s > score) { score = s; meilleur = c; }
          }
          if (meilleur) {
            this.frapper(porteurRouge, meilleur.x - porteurRouge.x, meilleur.z - porteurRouge.z,
              CONFIG.arcadeVitessePasse, 0.6);
          }
        }
      }
    }
  }

  // Gardiens : suivent le ballon latéralement, captent les tirs proches
  majGardiens(dt) {
    const suivre = (g, zLigne) => {
      const cible = clamp(this.ballon.x, -3.1, 3.1);
      g.chercher(cible, zLigne, 5.5, dt);
      // Capte / détourne un ballon libre tout proche
      if (!this.porteur && this.ballon.y < 1.8 &&
          Math.hypot(this.ballon.x - g.x, this.ballon.z - g.z) < 1.25 &&
          this.ignoreReprise.temps <= 0) {
        // Dégagement vers le milieu de terrain
        const sens = zLigne < L / 2 ? 1 : -1;
        this.ballon.vx = alea(-6, 6);
        this.ballon.vz = sens * alea(12, 16);
        this.ballon.vy = 5;
        this.ignoreReprise = { joueur: g, temps: 0.5 };
        sons.arret();
      }
    };
    suivre(this.gardienA, 1.0);
    suivre(this.gardienB, L - 1.0);
  }

  majBallon(dt) {
    const b = this.ballon;
    const mesh = this.ctx.monde.ballon;

    if (this.porteur) {
      // Dribble : le ballon reste devant le porteur
      const p = this.porteur;
      b.x = p.x + Math.sin(p.mesh.rotation.y) * 0.5;
      b.z = p.z + Math.cos(p.mesh.rotation.y) * 0.5;
      b.y = CONFIG.rayonBallon;
      b.vx = p.vx; b.vz = p.vz; b.vy = 0;
    } else {
      // Ballon libre : gravité + frottement au sol + rebonds
      b.vy -= CONFIG.gravite * dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y += b.vy * dt;
      if (b.y < CONFIG.rayonBallon) {
        b.y = CONFIG.rayonBallon;
        b.vy = Math.abs(b.vy) > 1.5 ? -b.vy * 0.45 : 0;
        b.vx *= 1 - 1.4 * dt;
        b.vz *= 1 - 1.4 * dt;
      }

      // Buts et sorties : cage A (z=0, but du joueur), cage B (z=L, but IA)
      if (b.z < 0) {
        if (Math.abs(b.x) < BUT_X && b.y < BUT_Y) { this.but('bleu'); return; }
        b.z = 0.1; b.vz = Math.abs(b.vz) * 0.5;
      }
      if (b.z > L) {
        if (Math.abs(b.x) < BUT_X && b.y < BUT_Y) { this.but('rouge'); return; }
        b.z = L - 0.1; b.vz = -Math.abs(b.vz) * 0.5;
      }
      // Lignes de touche : rebond (style arcade, pas de touches)
      if (Math.abs(b.x) > DEMI) {
        b.x = Math.sign(b.x) * (DEMI - 0.05);
        b.vx = -b.vx * 0.5;
      }

      // Prise de balle : premier joueur assez proche d'un ballon au sol
      if (b.y < 0.6) {
        for (const j of [...this.bleus, ...this.rouges]) {
          if (this.ignoreReprise.temps > 0 && this.ignoreReprise.joueur === j) continue;
          if (j.dist(b.x, b.z) < 0.6) {
            this.porteur = j;
            if (j.equipe === 'bleu') this.controle = j; // on récupère la main
            break;
          }
        }
      }
    }

    mesh.position.set(b.x, b.y, b.z);
    mesh.rotation.x -= b.vz * dt * 4;
    mesh.rotation.z += b.vx * dt * 4;
  }

  but(equipe) {
    const { ui } = this.ctx;
    if (equipe === 'bleu') {
      this.scoreJoueur++;
      sons.but();
      ui.lancerConfettis();
      ui.montrerMessage(`BUT ! ⚽ ${this.scoreJoueur}-${this.scoreAdverse}`, 1800);
      this.prochainEngagement = 'rouge';
    } else {
      this.scoreAdverse++;
      sons.rate();
      ui.montrerMessage(`BUT ADVERSE… ${this.scoreJoueur}-${this.scoreAdverse}`, 1800);
      this.prochainEngagement = 'bleu';
    }
    ui.majMatch({ minute: this.minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });
    this.etat = 'pause';
    this.tempsPause = 1.8;
    this.porteur = null;
    this.ballon.vx = this.ballon.vz = this.ballon.vy = 0;
  }

  terminer() {
    const { ui, difficulte, surFin } = this.ctx;
    this.etat = 'fini';
    sons.sifflet();

    const diff = this.scoreJoueur - this.scoreAdverse;
    const victoire = diff > 0, nul = diff === 0;
    const etoiles = victoire ? (diff >= 2 ? 3 : 2) : nul ? 1 : 0;
    sauvegarde.enregistrerEtoiles(this.nom, difficulte, etoiles);

    this.nettoyer();
    ui.montrerResultat({
      titre: victoire ? 'VICTOIRE ! 🏆' : nul ? 'Match nul' : 'Défaite…',
      detail: `Score final : ${this.scoreJoueur} - ${this.scoreAdverse}`,
      etoiles,
    });
    surFin();
  }

  nettoyer() {
    const { ui, monde } = this.ctx;
    ui.montrerControlesArcade(false);
    ui.montrerHudMatch(false);
    ui.surPasse = null;
    ui.surTirArcade = null;
    monde.modeArcade(false);
    monde.placerCoupFranc(18, 0, 4); // restaure le décor et la caméra des menus
  }

  quitter() {
    this.etat = 'fini';
    this.nettoyer();
  }
}
