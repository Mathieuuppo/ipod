// ============================================================
// Mode Match Arcade : un vrai match jouable vu d'en haut (façon
// FIFA rétro), 11 contre 11 en 4-4-2.
//
// L'équipe BLEUE (le joueur) attaque la cage A (z = 0), l'équipe
// ROUGE attaque la cage B (z = L).
//
// L'IA est construite autour d'un BLOC-ÉQUIPE : les trois lignes
// (défense / milieu / attaque) coulissent ensemble en suivant le
// ballon, lentement — le jeu respire, tout le monde ne court pas
// sur le ballon. Un seul joueur par équipe presse ou chasse ; les
// autres tiennent leur poste, se démarquent (soutien court, appels
// en profondeur) et gardent leurs distances entre eux.
//
// Règles : touches sur les lignes de côté, corners et sorties de
// but sur les lignes de fond (plus aucun rebond arcade).
// Passe en profondeur : bouton PASSE avec le joystick poussé vers
// l'avant → ballon dans l'espace pour un attaquant lancé.
// ============================================================

import { CONFIG, DIFFICULTES, clamp, alea } from '../config.js';
import { TERRAIN } from '../world.js';
import { sauvegarde } from '../storage.js';
import { sons } from '../audio.js';

const L = TERRAIN.longueur;
const DEMI = TERRAIN.demiLargeur;
const BUT_X = CONFIG.butDemiLargeur;
const BUT_Y = CONFIG.butHauteur;

// Formation 4-4-2 : position x de chaque poste, et décalage z de sa
// ligne par rapport au centre du bloc (positif = vers son propre but).
// Indices 0-3 : défenseurs, 4-7 : milieux, 8-9 : attaquants.
const FORMATION = [
  { x: -15, ligne: 15 }, { x: -5, ligne: 15 }, { x: 5, ligne: 15 }, { x: 15, ligne: 15 },
  { x: -16, ligne: 3 }, { x: -5.5, ligne: 3 }, { x: 5.5, ligne: 3 }, { x: 16, ligne: 3 },
  { x: -7, ligne: -11 }, { x: 7, ligne: -11 },
];
const ATTAQUANTS = [8, 9];
const INDICE_ATTAQUANT = 8; // pour l'engagement

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

    this.bleus = acteurs.bleu.map((m, i) => new Joueur(m, 'bleu', i));
    this.rouges = acteurs.rouge.map((m, i) => new Joueur(m, 'rouge', i));
    // Gardiens : le rouge défend la cage A (z=0), le bleu la cage B (z=L)
    this.gardienA = new Joueur(acteurs.gardienRouge, 'rouge', -1);
    this.gardienB = new Joueur(acteurs.gardienBleu, 'bleu', -1);

    this.ballon = { x: 0, y: CONFIG.rayonBallon, z: L / 2, vx: 0, vy: 0, vz: 0 };
    this.porteur = null;
    this.receveur = null;          // destinataire désigné de la passe en cours
    this.dernierToucheur = 'bleu'; // pour attribuer touches / corners
    this.ignoreReprise = { joueur: null, temps: 0 };

    this.scoreJoueur = 0;
    this.scoreAdverse = 0;
    this.tempsEcoule = 0;
    this.minute = 0;
    this.etat = 'jeu';        // jeu | pause (but) | remise (touche/corner/6m) | fini
    this.tempsPause = 0;
    this.remise = null;       // { equipe, x, z, type }
    this.decisionIA = 1.0;    // minuteur de décision du porteur adverse
    this.contactVol = 0;
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
      this.bleus[i].placer(f.x, clamp(L / 2 + f.ligne * 1.1, 3, L - 3));
      this.rouges[i].placer(-f.x, clamp(L / 2 - f.ligne * 1.1, 3, L - 3));
    }
    this.gardienA.placer(0, 1.0);
    this.gardienB.placer(0, L - 1.0);
    Object.assign(this.ballon, { x: 0, y: CONFIG.rayonBallon, z: L / 2, vx: 0, vy: 0, vz: 0 });
    this.receveur = null;
    this.remise = null;
    const receveur = equipe === 'bleu' ? this.bleus[INDICE_ATTAQUANT] : this.rouges[INDICE_ATTAQUANT];
    receveur.placer(0, L / 2 + (equipe === 'bleu' ? 1.2 : -1.2));
    this.porteur = receveur;
    this.dernierToucheur = equipe;
    this.controle = equipe === 'bleu' ? receveur : this.plusProcheBleu();
  }

  // ---------- Passes téléguidées ----------

  // Passe tendue vers un coéquipier (ou un point) : vitesse selon la
  // distance, ras de terre, receveur désigné qui vient au-devant.
  passe(porteur, receveur, cibleX = null, cibleZ = null) {
    const cx = cibleX !== null ? cibleX : receveur.x + receveur.vx * 0.3;
    const cz = cibleZ !== null ? cibleZ : receveur.z + receveur.vz * 0.3;
    const dx = cx - porteur.x, dz = cz - porteur.z;
    const d = Math.hypot(dx, dz) || 1;
    const vitesse = CONFIG.arcadeVitessePasseMin + d * CONFIG.arcadeVitessePasseParMetre;
    this.ballon.vx = dx / d * vitesse;
    this.ballon.vz = dz / d * vitesse;
    this.ballon.vy = 0;
    this.porteur = null;
    this.receveur = receveur;
    this.dernierToucheur = porteur.equipe;
    this.ignoreReprise = { joueur: porteur, temps: 0.4 };
  }

  // ---------- Actions du joueur ----------

  actionPasse() {
    if (this.etat !== 'jeu') return;
    const { ui } = this.ctx;
    if (this.porteur && this.porteur.equipe === 'bleu') {
      const p = this.porteur;
      const j = ui.joystick;
      // Joystick poussé franchement vers l'avant → PASSE EN PROFONDEUR
      if (j.actif && j.y < -0.55) { this.passeEnProfondeur(p); return; }

      // Passe courte : vers le coéquipier le mieux aligné avec le joystick
      const dirX = j.actif ? j.x : Math.sin(p.mesh.rotation.y);
      const dirZ = j.actif ? j.y : Math.cos(p.mesh.rotation.y);
      let meilleur = null, meilleurScore = -1e9;
      for (const c of this.bleus) {
        if (c === p) continue;
        const dx = c.x - p.x, dz = c.z - p.z;
        const d = Math.hypot(dx, dz) || 1;
        const alignement = (dx * dirX + dz * dirZ) / d;
        const score = alignement * 10 - d * 0.15;
        if (score > meilleurScore) { meilleurScore = score; meilleur = c; }
      }
      if (!meilleur) return;
      this.passe(p, meilleur);
      this.controle = meilleur;
      sons.clic();
    } else {
      // JOUEUR : changer de joueur contrôlé (le plus proche du ballon)
      this.controle = this.plusProcheBleu(this.controle);
    }
  }

  // Passe en profondeur : ballon envoyé DANS L'ESPACE devant l'attaquant
  // le plus avancé (côté joystick), qui est lancé dessus.
  passeEnProfondeur(p) {
    const j = this.ctx.ui.joystick;
    let meilleur = null, meilleurScore = -1e9;
    for (const c of this.bleus) {
      if (c === p) continue;
      // On privilégie les joueurs déjà hauts (z petit) et côté joystick
      const score = -c.z * 0.8 - Math.abs(c.x - (p.x + j.x * 12)) * 0.4;
      if (score > meilleurScore) { meilleurScore = score; meilleur = c; }
    }
    if (!meilleur) return;
    // Point de chute : nettement devant le receveur, vers la cage
    const cx = clamp(meilleur.x + j.x * 4, -DEMI + 2, DEMI - 2);
    const cz = clamp(meilleur.z - 9, 2.5, L - 2.5);
    this.passe(p, meilleur, cx, cz);
    this.controle = meilleur;
    sons.clic();
  }

  actionTir() {
    if (this.etat !== 'jeu') return;
    const { ui } = this.ctx;
    if (this.porteur && this.porteur.equipe === 'bleu') {
      const p = this.porteur;
      const viseX = clamp(ui.joystick.actif ? ui.joystick.x * 4 : alea(-1.5, 1.5), -3.3, 3.3);
      const dist = Math.hypot(viseX - p.x, p.z);
      const erreur = alea(-1, 1) * dist * 0.045;
      const dx = viseX + erreur - p.x, dz = -p.z;
      this.frapper(p, dx, dz, CONFIG.arcadeVitesseTir, clamp(dist * 0.16, 1.2, 4.6));
      sons.frappe();
    } else if (this.cooldownTacle <= 0) {
      this.cooldownTacle = 0.8;
      const cible = this.porteur;
      if (cible && cible.equipe === 'rouge' && this.controle.dist(cible.x, cible.z) < 1.6) {
        if (Math.random() < 0.75) this.ballonLibre(cible, 2.5);
        sons.clic();
      }
    }
  }

  // Le porteur frappe le ballon dans une direction (tir, dégagement)
  frapper(joueur, dx, dz, vitesse, vy) {
    const d = Math.hypot(dx, dz) || 1;
    this.ballon.vx = dx / d * vitesse;
    this.ballon.vz = dz / d * vitesse;
    this.ballon.vy = vy;
    this.porteur = null;
    this.receveur = null;
    this.dernierToucheur = joueur.equipe;
    this.ignoreReprise = { joueur, temps: 0.45 };
  }

  // Le ballon échappe au porteur (tacle réussi, interception)
  ballonLibre(ancienPorteur, force) {
    this.ballon.vx = alea(-force, force);
    this.ballon.vz = alea(-force, force);
    this.ballon.vy = 1.2;
    this.porteur = null;
    this.receveur = null;
    this.dernierToucheur = ancienPorteur.equipe;
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

  plusProche(joueurs, x, z) {
    let meilleur = joueurs[0], dMin = 1e9;
    for (const j of joueurs) {
      const d = j.dist(x, z);
      if (d < dMin) { dMin = d; meilleur = j; }
    }
    return meilleur;
  }

  // ---------- Boucle principale ----------

  maj(dt) {
    if (this.etat === 'fini') return;
    const { ui, monde } = this.ctx;

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
    } else if (this.etat === 'remise') {
      // Touche / corner / sortie de but : le jeu se replace calmement
      this.tempsPause -= dt;
      this.majEquipe('bleu', dt);
      this.majEquipe('rouge', dt);
      this.separerCoequipiers(this.bleus, dt);
      this.separerCoequipiers(this.rouges, dt);
      if (this.tempsPause <= 0) this.executerRemise();
    } else {
      this.majJoueurControle(dt);
      this.majEquipe('bleu', dt);
      this.majEquipe('rouge', dt);
      this.majPorteurRouge(dt);
      this.separerCoequipiers(this.bleus, dt);
      this.separerCoequipiers(this.rouges, dt);
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
    if (this.receveur === c && !j.actif) {
      // Receveur d'une passe : il va au-devant du ballon tout seul
      c.chercher(this.ballon.x + this.ballon.vx * 0.15, this.ballon.z + this.ballon.vz * 0.15,
        CONFIG.arcadeVitesseJoueur, dt);
      return;
    }
    if (j.actif && (Math.abs(j.x) > 0.12 || Math.abs(j.y) > 0.12)) {
      c.vx = j.x * CONFIG.arcadeVitesseJoueur;
      c.vz = j.y * CONFIG.arcadeVitesseJoueur;
    } else {
      c.vx *= 0.8; c.vz *= 0.8;
    }
    c.avancer(dt);
  }

  // ---------- IA d'équipe : bloc 4-4-2 + rôles ----------
  //
  // Chaque frame, chaque joueur reçoit UN rôle, par priorité :
  //   receveur > chasseur (ballon libre) > presseur (porteur adverse)
  //   > soutien court / appel en profondeur (si son équipe a le ballon)
  //   > tenue de poste dans le bloc.
  majEquipe(equipe, dt) {
    const joueurs = equipe === 'bleu' ? this.bleus : this.rouges;
    const vitesseBase = equipe === 'bleu'
      ? CONFIG.arcadeVitesseJoueur * 0.92
      : this.reglages.arcadeVitesseIA;
    // Sens d'attaque en z : les bleus attaquent z=0, les rouges z=L
    const dirAtt = equipe === 'bleu' ? -1 : 1;
    const porteurAmi = this.porteur && this.porteur.equipe === equipe ? this.porteur : null;
    const porteurAdverse = this.porteur && this.porteur.equipe !== equipe ? this.porteur : null;
    const enRemise = this.etat === 'remise';

    // Centre du bloc : suit le ballon, monte un peu quand on a le ballon
    const base = clamp(this.ballon.z + (porteurAmi ? dirAtt * 4 : dirAtt * -2), 10, L - 10);

    // Chasseur : UN SEUL joueur va au ballon libre (pas pendant une remise)
    const chasseur = (!this.porteur && !enRemise)
      ? this.plusProche(joueurs, this.ballon.x, this.ballon.z) : null;
    // Presseur : UN SEUL joueur presse le porteur adverse
    const presseur = (porteurAdverse && !enRemise)
      ? this.plusProche(joueurs.filter((j) => j !== this.controle), porteurAdverse.x, porteurAdverse.z)
      : null;
    // Soutien court : un milieu propose une solution derrière le porteur
    const soutien = porteurAmi
      ? this.plusProche(joueurs.filter((j) => j !== porteurAmi && j !== this.controle), porteurAmi.x, porteurAmi.z)
      : null;

    for (const j of joueurs) {
      if (j === this.porteur) continue;
      if (equipe === 'bleu' && j === this.controle) continue; // piloté par le joystick

      if (j === this.receveur) {
        // Au-devant de la passe qui arrive
        j.chercher(this.ballon.x + this.ballon.vx * 0.15, this.ballon.z + this.ballon.vz * 0.15,
          vitesseBase, dt);
        continue;
      }
      if (j === chasseur) {
        j.chercher(this.ballon.x, this.ballon.z, vitesseBase * 0.95, dt);
        continue;
      }
      if (j === presseur) {
        // Presse franchement dans sa moitié de terrain, contient sinon
        const dansSaMoitie = equipe === 'bleu'
          ? this.ballon.z > L / 2 - 4 : this.ballon.z < L / 2 + 4;
        if (dansSaMoitie) {
          j.chercher(porteurAdverse.x, porteurAdverse.z, vitesseBase * 0.95, dt);
        } else {
          // Se place entre le porteur et son but, à distance : il "cadre"
          j.chercher(porteurAdverse.x * 0.8, porteurAdverse.z - dirAtt * 3, vitesseBase * 0.8, dt);
        }
        continue;
      }
      if (porteurAmi && j === soutien) {
        // Soutien court : à ~5 m du porteur, légèrement en retrait
        const cote = j.x > porteurAmi.x ? 1 : -1;
        j.chercher(
          clamp(porteurAmi.x + cote * 5, -DEMI + 1.5, DEMI - 1.5),
          clamp(porteurAmi.z - dirAtt * 3, 2, L - 2),
          vitesseBase * 0.85, dt);
        continue;
      }
      if (porteurAmi && ATTAQUANTS.includes(j.indice)) {
        // Appel en profondeur : les attaquants étirent le bloc adverse
        // et se tiennent prêts pour la passe en profondeur
        const cible = FORMATION[j.indice];
        const xAppel = equipe === 'bleu' ? cible.x : -cible.x;
        j.chercher(
          clamp(xAppel + this.ballon.x * 0.25, -DEMI + 1.5, DEMI - 1.5),
          clamp(porteurAmi.z + dirAtt * 12, 3, L - 3),
          vitesseBase * 0.9, dt);
        continue;
      }

      // Tenue de poste : sa ligne du 4-4-2, qui coulisse avec le bloc
      const f = FORMATION[j.indice];
      const xPoste = equipe === 'bleu' ? f.x : -f.x;
      const tz = clamp(base - dirAtt * f.ligne, 2.5, L - 2.5);
      const tx = clamp(xPoste + this.ballon.x * 0.15, -DEMI + 1, DEMI - 1);
      j.chercher(tx, tz, vitesseBase * 0.55, dt); // lentement : le jeu respire
    }

    // Vol de balle : le presseur rouge use le porteur bleu au contact
    if (equipe === 'rouge' && porteurAdverse && porteurAdverse.equipe === 'bleu' && presseur &&
        presseur.dist(porteurAdverse.x, porteurAdverse.z) < 0.9) {
      this.contactVol += dt;
      if (this.contactVol > this.reglages.arcadeReactionIA) {
        this.contactVol = 0;
        this.ballonLibre(porteurAdverse, 2.2);
      }
    } else if (equipe === 'rouge') {
      this.contactVol = Math.max(0, this.contactVol - dt);
    }
  }

  // Décisions du porteur rouge : dribble posé, passes fréquentes,
  // tir seulement proche du but — le rythme reste lisible.
  majPorteurRouge(dt) {
    const p = this.porteur && this.porteur.equipe === 'rouge' ? this.porteur : null;
    if (!p) return;
    const r = this.reglages;
    const pression = this.controle.dist(p.x, p.z) < 3;

    // Il avance doucement s'il est seul, accélère sous pression
    p.chercher(p.x * 0.75, L - 3, r.arcadeVitesseIA * (pression ? 0.95 : 0.6), dt);

    this.decisionIA -= dt;
    if (this.decisionIA > 0) return;
    this.decisionIA = 1.1;

    const distBut = L - p.z;
    if (distBut < 13 && Math.random() < 0.55) {
      // Tir : cadré ou non selon la précision de la difficulté
      const cadre = Math.random() < r.arcadePrecisionIA;
      const viseX = cadre ? alea(-2.9, 2.9) : (Math.random() < 0.5 ? -1 : 1) * alea(4.2, 6);
      this.frapper(p, viseX - p.x, L - p.z, CONFIG.arcadeVitesseTir * 0.95, clamp(distBut * 0.15, 1.2, 4));
      sons.frappe();
    } else if (pression || Math.random() < 0.45) {
      // Passe (souvent) : coéquipier avancé et pas trop loin
      let meilleur = null, score = -1e9;
      for (const c of this.rouges) {
        if (c === p) continue;
        const s = c.z * 0.5 - c.dist(p.x, p.z) * 0.25;
        if (s > score) { score = s; meilleur = c; }
      }
      if (meilleur) this.passe(p, meilleur);
    }
  }

  // Les coéquipiers gardent leurs distances : pas de grappes de joueurs
  separerCoequipiers(joueurs, dt) {
    const MIN = 2.6;
    for (let a = 0; a < joueurs.length; a++) {
      for (let b = a + 1; b < joueurs.length; b++) {
        const j1 = joueurs[a], j2 = joueurs[b];
        if (j1 === this.porteur || j2 === this.porteur) continue;
        if (j1 === this.controle || j2 === this.controle) continue;
        const dx = j2.x - j1.x, dz = j2.z - j1.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.01 && d < MIN) {
          const pousse = (MIN - d) / d * 1.6 * dt;
          j1.x = clamp(j1.x - dx * pousse, -DEMI + 0.4, DEMI - 0.4);
          j1.z = clamp(j1.z - dz * pousse, 0.6, L - 0.6);
          j2.x = clamp(j2.x + dx * pousse, -DEMI + 0.4, DEMI - 0.4);
          j2.z = clamp(j2.z + dz * pousse, 0.6, L - 0.6);
        }
      }
    }
  }

  // Gardiens : suivent le ballon latéralement, captent les tirs proches
  // puis relancent proprement sur un coéquipier
  majGardiens(dt) {
    const relancer = (g) => {
      const equipe = g === this.gardienA ? this.rouges : this.bleus;
      let meilleur = equipe[4], score = -1e9;
      for (const c of equipe) {
        const s = -Math.abs(c.z - L / 2) - Math.abs(c.x - this.ballon.x) * 0.3;
        if (s > score) { score = s; meilleur = c; }
      }
      this.passe(g, meilleur);
      this.ballon.vy = 3; // relance légèrement aérienne
      sons.arret();
    };
    const suivre = (g, zLigne) => {
      const cible = clamp(this.ballon.x, -3.1, 3.1);
      g.chercher(cible, zLigne, 5.5, dt);
      if (!this.porteur && this.ballon.y < 1.8 &&
          Math.hypot(this.ballon.x - g.x, this.ballon.z - g.z) < 1.35 &&
          this.ignoreReprise.temps <= 0) {
        relancer(g);
        this.ignoreReprise = { joueur: g, temps: 0.5 };
      }
    };
    suivre(this.gardienA, 1.0);
    suivre(this.gardienB, L - 1.0);
  }

  // ---------- Règles : touches, corners, sorties de but ----------

  declencherRemise(equipe, x, z, type, message) {
    this.etat = 'remise';
    this.tempsPause = 1.1;
    this.remise = { equipe, x, z, type };
    this.porteur = null;
    this.receveur = null;
    Object.assign(this.ballon, { x, y: CONFIG.rayonBallon, z, vx: 0, vy: 0, vz: 0 });
    this.ctx.ui.montrerMessage(message, 1000);
    sons.clic();
  }

  executerRemise() {
    const { equipe, x, z, type } = this.remise;
    this.etat = 'jeu';
    this.remise = null;
    const joueurs = equipe === 'bleu' ? this.bleus : this.rouges;

    // Sortie de but : c'est le gardien qui relance
    if (type === '6m') {
      const g = equipe === 'rouge' ? this.gardienA : this.gardienB;
      Object.assign(this.ballon, { x: g.x, y: CONFIG.rayonBallon, z: g.z, vx: 0, vy: 0, vz: 0 });
      const meilleur = this.plusProche(joueurs, g.x, g.z === 1 ? 14 : L - 14);
      this.passe(g, meilleur);
      this.ballon.vy = 3;
      if (equipe === 'bleu') this.controle = meilleur;
      return;
    }

    // Touche / corner : le joueur le plus proche vient remettre en jeu
    const tireur = this.plusProche(joueurs, x, z);
    tireur.placer(x, z);
    let receveur = null, dMin = 1e9;
    for (const c of joueurs) {
      if (c === tireur) continue;
      // Un receveur dans le terrain, pas collé à la ligne
      const d = c.dist(x, z) + (Math.abs(c.x) > DEMI - 3 ? 6 : 0);
      if (d < dMin) { dMin = d; receveur = c; }
    }
    if (!receveur) receveur = joueurs[4];
    this.passe(tireur, receveur);
    if (equipe === 'bleu') this.controle = receveur;
  }

  majBallon(dt) {
    const b = this.ballon;
    const mesh = this.ctx.monde.ballon;

    if (this.porteur) {
      const p = this.porteur;
      b.x = p.x + Math.sin(p.mesh.rotation.y) * 0.5;
      b.z = p.z + Math.cos(p.mesh.rotation.y) * 0.5;
      b.y = CONFIG.rayonBallon;
      b.vx = p.vx; b.vz = p.vz; b.vy = 0;
      this.dernierToucheur = p.equipe;
    } else {
      b.vy -= CONFIG.gravite * dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y += b.vy * dt;
      if (b.y < CONFIG.rayonBallon) {
        b.y = CONFIG.rayonBallon;
        b.vy = Math.abs(b.vy) > 1.5 ? -b.vy * 0.45 : 0;
        b.vx *= 1 - 0.9 * dt;
        b.vz *= 1 - 0.9 * dt;
      }

      // Lignes de fond : but, corner ou sortie de but (6 m)
      if (b.z < 0 || b.z > L) {
        const cageA = b.z < 0;                       // ligne de fond côté cage A
        if (Math.abs(b.x) < BUT_X && b.y < BUT_Y) {  // dans la cage → BUT
          this.but(cageA ? 'bleu' : 'rouge');
          return;
        }
        // L'équipe qui défend cette ligne : rouge pour la cage A, bleu pour la B
        const defenseur = cageA ? 'rouge' : 'bleu';
        if (this.dernierToucheur === defenseur) {
          // Corner pour l'attaquant
          const attaquant = defenseur === 'rouge' ? 'bleu' : 'rouge';
          this.declencherRemise(attaquant,
            Math.sign(b.x || 1) * (DEMI - 1), cageA ? 1 : L - 1,
            'corner', 'CORNER !');
        } else {
          // Sortie de but : relance du gardien défenseur
          this.declencherRemise(defenseur, 0, cageA ? 4 : L - 4, '6m', 'SORTIE DE BUT');
        }
        return;
      }
      // Lignes de touche : touche pour l'équipe qui n'a pas touché en dernier
      if (Math.abs(b.x) > DEMI) {
        const equipe = this.dernierToucheur === 'bleu' ? 'rouge' : 'bleu';
        this.declencherRemise(equipe,
          Math.sign(b.x) * (DEMI - 0.6), clamp(b.z, 2, L - 2),
          'touche', 'TOUCHE !');
        return;
      }

      // Prise de balle : le receveur désigné a une grande zone de contrôle
      if (b.y < 0.7) {
        for (const j of [...this.bleus, ...this.rouges]) {
          if (this.ignoreReprise.temps > 0 && this.ignoreReprise.joueur === j) continue;
          const rayon = j === this.receveur ? 1.1 : 0.6;
          if (j.dist(b.x, b.z) < rayon) {
            this.prisePossession(j);
            break;
          }
        }
      }
    }

    mesh.position.set(b.x, b.y, b.z);
    mesh.rotation.x -= b.vz * dt * 4;
    mesh.rotation.z += b.vx * dt * 4;
  }

  prisePossession(j) {
    this.porteur = j;
    this.receveur = null;
    this.dernierToucheur = j.equipe;
    this.decisionIA = 1.0; // l'IA prend son temps après la récupération
    if (j.equipe === 'bleu') {
      this.controle = j;
    } else {
      // Perte de balle : bascule automatique sur le défenseur le plus proche
      this.controle = this.plusProcheBleu();
    }
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
    this.receveur = null;
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
