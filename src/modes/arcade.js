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
import { statsEquipe } from '../data/equipes.js';
import { SequenceTir } from '../shot.js';

const L = TERRAIN.longueur;
const DEMI = TERRAIN.demiLargeur;
const BUT_X = CONFIG.butDemiLargeur;
const BUT_Y = CONFIG.butHauteur;

// Formations tactiques : position x de chaque poste, et décalage z de sa
// ligne par rapport au centre du bloc (positif = vers son propre but).
// `attaquants` = indices des joueurs qui font les appels en profondeur.
const FORMATIONS = {
  442: {
    postes: [
      { x: -15, ligne: 15 }, { x: -5, ligne: 15 }, { x: 5, ligne: 15 }, { x: 15, ligne: 15 },
      { x: -16, ligne: 3 }, { x: -5.5, ligne: 3 }, { x: 5.5, ligne: 3 }, { x: 16, ligne: 3 },
      { x: -7, ligne: -11 }, { x: 7, ligne: -11 },
    ],
    attaquants: [8, 9],
  },
  433: {
    postes: [
      { x: -15, ligne: 15 }, { x: -5, ligne: 15 }, { x: 5, ligne: 15 }, { x: 15, ligne: 15 },
      { x: -10, ligne: 4 }, { x: 0, ligne: 5 }, { x: 10, ligne: 4 },
      { x: -14, ligne: -10 }, { x: 0, ligne: -12 }, { x: 14, ligne: -10 },
    ],
    attaquants: [7, 8, 9],
  },
  352: {
    postes: [
      { x: -10, ligne: 15 }, { x: 0, ligne: 16 }, { x: 10, ligne: 15 },
      { x: -17, ligne: 2 }, { x: -8, ligne: 4 }, { x: 0, ligne: 5 }, { x: 8, ligne: 4 }, { x: 17, ligne: 2 },
      { x: -6, ligne: -11 }, { x: 6, ligne: -11 },
    ],
    attaquants: [8, 9],
  },
};

// Effets des réglages tactiques (écran Composition)
const BLOCS = { bas: -3.5, moyen: 0, haut: 3.5 };
const STYLES = { defensif: -2.5, equilibre: 0, offensif: 2.5 };

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
    const { monde, ui, swipe, difficulte, matchConfig } = this.ctx;
    this.reglages = DIFFICULTES[difficulte];
    swipe.actif = false; // pas de tir tracé ici : joystick + boutons

    // Clubs, tactique et stats d'équipe : tout vient des écrans de menu
    this.equipeJoueur = matchConfig.equipeJoueur;
    this.equipeAdverse = matchConfig.equipeAdverse;
    this.tactique = sauvegarde.donnees.tactique;
    this.formBleu = FORMATIONS[this.tactique.formation] || FORMATIONS['442'];
    this.formRouge = FORMATIONS['442'];

    // Les stats moyennes des effectifs modulent le moteur : un club
    // rapide court plus vite, un club adroit cadre plus ses tirs…
    const statsJ = statsEquipe(this.equipeJoueur);
    const statsA = statsEquipe(this.equipeAdverse);
    this.vJoueur = CONFIG.arcadeVitesseJoueur * (0.9 + (statsJ.vitesse - 60) / 160);
    this.vIA = this.reglages.arcadeVitesseIA * (0.9 + (statsA.vitesse - 60) / 160);
    this.precisionIA = clamp(this.reglages.arcadePrecisionIA * (0.75 + (statsA.tir - 60) / 100), 0.15, 0.85);
    this.reactionVol = this.reglages.arcadeReactionIA * (1 - (statsA.defense - 60) / 250);
    this.reussiteTacle = clamp(0.6 + (statsJ.defense - 60) / 120, 0.4, 0.92);
    this.facteurTemps = sauvegarde.donnees.reglages.vitesse === 'lent' ? 0.75 : 1;

    // Statistiques du match : [joueur, adverse]
    this.statsMatch = { possession: [0, 0], tirs: [0, 0], cadres: [0, 0] };
    this.dernierTir = null; // { equipe, temps } pour compter les tirs cadrés

    // Replay : mémoire des ~2,5 dernières secondes de jeu
    this.replayTampon = [];
    this.replayLecture = null;

    const acteurs = monde.creerActeursArcade(CONFIG.arcadeJoueursParEquipe);
    monde.modeArcade(true);
    monde.colorierEquipesArcade(this.equipeJoueur, this.equipeAdverse);
    ui.majHudEquipes(this.equipeJoueur, this.equipeAdverse);

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
    this.etat = 'jeu';        // jeu | pause (but) | remise (touche/corner/6m) | replay | fini
    this.phaseMatch = 'reglementaire'; // reglementaire | prolongation | tab
    this.resultatTAB = null;
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
      const fB = this.formBleu.postes[i];
      const fR = this.formRouge.postes[i];
      this.bleus[i].placer(fB.x, clamp(L / 2 + fB.ligne * 1.1, 3, L - 3));
      this.rouges[i].placer(-fR.x, clamp(L / 2 - fR.ligne * 1.1, 3, L - 3));
    }
    this.gardienA.placer(0, 1.0);
    this.gardienB.placer(0, L - 1.0);
    Object.assign(this.ballon, { x: 0, y: CONFIG.rayonBallon, z: L / 2, vx: 0, vy: 0, vz: 0 });
    this.receveur = null;
    this.remise = null;
    const receveur = equipe === 'bleu'
      ? this.bleus[this.formBleu.attaquants[0]]
      : this.rouges[this.formRouge.attaquants[0]];
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
      this.statsMatch.tirs[0]++;
      this.dernierTir = { equipe: 0, temps: this.tempsEcoule };
      this.frapper(p, dx, dz, CONFIG.arcadeVitesseTir, clamp(dist * 0.16, 1.2, 4.6));
      sons.frappe();
      ui.vibrer(25);
    } else if (this.cooldownTacle <= 0) {
      this.cooldownTacle = 0.8;
      const cible = this.porteur;
      if (cible && cible.equipe === 'rouge' && this.controle.dist(cible.x, cible.z) < 1.6) {
        // La réussite du tacle dépend de la défense moyenne de ton club
        if (Math.random() < this.reussiteTacle) this.ballonLibre(cible, 2.5);
        sons.clic();
        ui.vibrer(20);
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
    dt *= this.facteurTemps; // réglage "vitesse de jeu : lente"

    // Lecture d'un replay de but : on rejoue les images enregistrées
    // au ralenti avec une caméra rapprochée, puis on reprend le cours
    if (this.etat === 'replay') {
      this.majReplay(dt);
      return;
    }

    // Séance de tirs au but : boucle dédiée, indépendante du ballon/IA
    if (this.phaseMatch === 'tab') {
      this.majTAB(dt);
      return;
    }

    this.tempsEcoule += dt;
    const minute = this.phaseMatch === 'prolongation'
      ? Math.min(120, 90 + Math.floor((this.tempsEcoule - this.tempsEcouleBase) / CONFIG.arcadeSecondesParMinute))
      : Math.min(90, Math.floor(this.tempsEcoule / CONFIG.arcadeSecondesParMinute));
    if (minute !== this.minute) {
      this.minute = minute;
      ui.majMatch({ minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });
      if ((this.phaseMatch === 'reglementaire' && minute >= 90) ||
          (this.phaseMatch === 'prolongation' && minute >= 120)) {
        this.verifierFinDeTemps();
        return;
      }
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

      // Possession : au crédit de la dernière équipe qui a touché le ballon
      this.statsMatch.possession[this.dernierToucheur === 'bleu' ? 0 : 1] += dt;

      // Mémoire pour le replay (2,5 s glissantes)
      this.replayTampon.push(this.instantane());
      if (this.replayTampon.length > 150) this.replayTampon.shift();
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
    // Caméra dynamique : derrière l'équipe qui a touché le ballon en dernier
    const dirCam = this.dernierToucheur === 'bleu' ? -1 : 1;
    monde.suivreCameraArcade(this.ballon.x, this.ballon.z, dirCam, dt);
  }

  // ---------- Replay de but ----------

  // Photographie de l'instant : ballon + position/orientation de chacun
  instantane() {
    const acteurs = [...this.bleus, ...this.rouges, this.gardienA, this.gardienB];
    return {
      b: [this.ballon.x, this.ballon.y, this.ballon.z],
      js: acteurs.map((j) => [j.x, j.z, j.mesh.rotation.y]),
    };
  }

  majReplay(dt) {
    const { monde } = this.ctx;
    const lecture = this.replayLecture;
    lecture.i += dt * 30; // ~moitié de la cadence d'enregistrement : ralenti
    const frame = lecture.frames[Math.min(Math.floor(lecture.i), lecture.frames.length - 1)];

    // Applique l'image : ballon + joueurs (sans passer par l'IA)
    const acteurs = [...this.bleus, ...this.rouges, this.gardienA, this.gardienB];
    frame.js.forEach(([x, z, rot], i) => {
      acteurs[i].mesh.position.set(x, 0, z);
      acteurs[i].mesh.rotation.y = rot;
    });
    monde.ballon.position.set(frame.b[0], frame.b[1], frame.b[2]);

    // Caméra de replay : basse et rapprochée, côté terrain
    monde.camera.position.set(frame.b[0] * 0.4 + 8, 4.2, frame.b[2] + 9);
    monde.camera.lookAt(frame.b[0], 0.6, frame.b[2]);

    if (lecture.i >= lecture.frames.length) {
      // Fin du replay → petite pause puis engagement
      this.replayLecture = null;
      this.etat = 'pause';
      this.tempsPause = 1.0;
    }
  }

  // Le joueur contrôlé suit le joystick (écran haut = vers la cage adverse)
  majJoueurControle(dt) {
    const j = this.ctx.ui.joystick;
    const c = this.controle;
    if (this.receveur === c && !j.actif) {
      // Receveur d'une passe : il va au-devant du ballon tout seul
      c.chercher(this.ballon.x + this.ballon.vx * 0.15, this.ballon.z + this.ballon.vz * 0.15,
        this.vJoueur, dt);
      return;
    }
    if (j.actif && (Math.abs(j.x) > 0.12 || Math.abs(j.y) > 0.12)) {
      c.vx = j.x * this.vJoueur;
      c.vz = j.y * this.vJoueur;
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
    const forme = equipe === 'bleu' ? this.formBleu : this.formRouge;
    const vitesseBase = equipe === 'bleu' ? this.vJoueur * 0.92 : this.vIA;
    // Sens d'attaque en z : les bleus attaquent z=0, les rouges z=L
    const dirAtt = equipe === 'bleu' ? -1 : 1;
    const porteurAmi = this.porteur && this.porteur.equipe === equipe ? this.porteur : null;
    const porteurAdverse = this.porteur && this.porteur.equipe !== equipe ? this.porteur : null;
    const enRemise = this.etat === 'remise';

    // Réglages tactiques du joueur (l'IA adverse reste sur son plan)
    const hauteurTactique = equipe === 'bleu'
      ? BLOCS[this.tactique.bloc] + STYLES[this.tactique.style] : 0;

    // Centre du bloc : suit le ballon, monte un peu quand on a le ballon,
    // et applique la hauteur de bloc choisie dans l'écran tactique
    const base = clamp(
      this.ballon.z + (porteurAmi ? dirAtt * 4 : dirAtt * -2) + dirAtt * hauteurTactique,
      10, L - 10);

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

    // Marquage : quand le ballon est profond dans notre moitié, un
    // défenseur supplémentaire vient se placer entre l'attaquant adverse
    // le plus dangereux et notre but — il coupe la ligne de passe au lieu
    // de coller bêtement au corps à corps.
    const enDanger = !enRemise && (equipe === 'bleu' ? this.ballon.z < 22 : this.ballon.z > L - 22);
    let cibleMarquage = null, marqueur = null;
    if (enDanger) {
      const adversaires = equipe === 'bleu' ? this.rouges : this.bleus;
      let meilleurScoreCible = -1e9;
      for (const a of adversaires) {
        if (a === porteurAdverse) continue;
        const distBut = equipe === 'bleu' ? a.z : (L - a.z);
        if (-distBut > meilleurScoreCible) { meilleurScoreCible = -distBut; cibleMarquage = a; }
      }
      if (cibleMarquage) {
        marqueur = this.plusProche(
          joueurs.filter((j) => j !== presseur && j !== chasseur && j !== this.controle),
          cibleMarquage.x, cibleMarquage.z);
      }
    }

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
        // Zone de pressing : réglage tactique côté bleu (faible = seulement
        // près de son but, fort = presse partout), plan fixe côté rouge
        let limite = equipe === 'bleu' ? L / 2 - 4 : L / 2 + 4;
        if (equipe === 'bleu') {
          if (this.tactique.pressing === 'faible') limite = L * 0.68;
          if (this.tactique.pressing === 'fort') limite = -L; // partout
        }
        const presseIci = equipe === 'bleu' ? this.ballon.z > limite : this.ballon.z < limite;
        if (presseIci) {
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
      if (marqueur && j === marqueur) {
        // Se place côté but, entre l'attaquant adverse et sa cible
        const versBut = equipe === 'bleu' ? 1 : -1;
        const tx = clamp(cibleMarquage.x, -DEMI + 1, DEMI - 1);
        const tz = clamp(cibleMarquage.z + versBut * 1.5, 2.5, L - 2.5);
        j.chercher(tx, tz, vitesseBase * 0.88, dt);
        continue;
      }
      if (porteurAmi && forme.attaquants.includes(j.indice)) {
        // Appel en profondeur : les attaquants étirent le bloc adverse
        // et se tiennent prêts pour la passe en profondeur
        const cible = forme.postes[j.indice];
        const xAppel = equipe === 'bleu' ? cible.x : -cible.x;
        j.chercher(
          clamp(xAppel + this.ballon.x * 0.25, -DEMI + 1.5, DEMI - 1.5),
          clamp(porteurAmi.z + dirAtt * 12, 3, L - 3),
          vitesseBase * 0.9, dt);
        continue;
      }

      // Tenue de poste : sa ligne de la formation, qui coulisse avec le bloc
      const f = forme.postes[j.indice];
      const xPoste = equipe === 'bleu' ? f.x : -f.x;
      const tz = clamp(base - dirAtt * f.ligne, 2.5, L - 2.5);
      const tx = clamp(xPoste + this.ballon.x * 0.15, -DEMI + 1, DEMI - 1);
      j.chercher(tx, tz, vitesseBase * 0.55, dt); // lentement : le jeu respire
    }

    // Vol de balle : le presseur rouge use le porteur bleu au contact
    if (equipe === 'rouge' && porteurAdverse && porteurAdverse.equipe === 'bleu' && presseur &&
        presseur.dist(porteurAdverse.x, porteurAdverse.z) < 0.9) {
      this.contactVol += dt;
      if (this.contactVol > this.reactionVol) {
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
    const pression = this.controle.dist(p.x, p.z) < 3;
    // Rouge défend la cage A (z=0) : ses défenseurs (indices 0-3 du 4-4-2)
    // pressés près de leur propre surface dégagent au lieu de dribbler.
    const estDefenseur = p.indice <= 3;
    const zoneDangereuse = p.z < 16;

    // Il avance doucement s'il est seul, accélère sous pression
    p.chercher(p.x * 0.75, L - 3, this.vIA * (pression ? 0.95 : 0.6), dt);

    this.decisionIA -= dt;
    if (this.decisionIA > 0) return;
    this.decisionIA = 1.1;

    if (estDefenseur && zoneDangereuse && pression) {
      // Dégagement : long et large, loin du danger, plutôt qu'un pari
      const cote = p.x >= 0 ? 1 : -1;
      const cibleX = clamp(p.x + cote * alea(6, 11), -DEMI + 2, DEMI - 2);
      this.frapper(p, cibleX - p.x, alea(14, 20), CONFIG.arcadeVitesseTir * 0.85, alea(3.5, 5.5));
      sons.frappe();
      return;
    }

    const distBut = L - p.z;
    if (distBut < 13 && Math.random() < 0.55) {
      // Tir : cadré ou non selon la précision (difficulté × qualité du club)
      const cadre = Math.random() < this.precisionIA;
      const viseX = cadre ? alea(-2.9, 2.9) : (Math.random() < 0.5 ? -1 : 1) * alea(4.2, 6);
      this.statsMatch.tirs[1]++;
      this.dernierTir = { equipe: 1, temps: this.tempsEcoule };
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
      // Un tir récent capté par le gardien compte comme tir cadré
      if (this.dernierTir && this.tempsEcoule - this.dernierTir.temps < 1.6) {
        this.statsMatch.cadres[this.dernierTir.equipe]++;
        this.dernierTir = null;
        this.ctx.ui.vibrer(35);
      }
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
    const indice = equipe === 'bleu' ? 0 : 1;
    this.statsMatch.cadres[indice]++;
    if (equipe === 'bleu') {
      this.scoreJoueur++;
      sons.but();
      ui.lancerConfettis();
      ui.vibrer([70, 40, 100]);
      ui.montrerMessage(`BUT ! ⚽ ${this.scoreJoueur}-${this.scoreAdverse}`, 2600);
      this.prochainEngagement = 'rouge';
    } else {
      this.scoreAdverse++;
      sons.rate();
      ui.vibrer(60);
      ui.montrerMessage(`BUT ADVERSE… ${this.scoreJoueur}-${this.scoreAdverse}`, 2600);
      this.prochainEngagement = 'bleu';
    }
    ui.majMatch({ minute: this.minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });
    this.porteur = null;
    this.receveur = null;
    this.ballon.vx = this.ballon.vz = this.ballon.vy = 0;

    // Replay du but si on a assez d'images en mémoire, sinon simple pause
    if (this.replayTampon.length > 45) {
      this.replayLecture = { frames: this.replayTampon.slice(-140), i: 0 };
      this.replayTampon = [];
      this.etat = 'replay';
    } else {
      this.etat = 'pause';
      this.tempsPause = 1.8;
    }
  }

  // ---------- Prolongation ----------

  // Appelé à 90' puis à 120' : en cas d'égalité, le match se prolonge
  // au lieu de s'arrêter — même en match amical, comme dans un vrai match.
  verifierFinDeTemps() {
    const { ui } = this.ctx;
    if (this.scoreJoueur !== this.scoreAdverse) { this.terminer(); return; }
    if (this.phaseMatch === 'reglementaire') {
      this.phaseMatch = 'prolongation';
      this.tempsEcouleBase = this.tempsEcoule;
      sons.sifflet();
      ui.montrerMessage('MATCH NUL — PROLONGATION !', 2200);
      this.prochainEngagement = Math.random() < 0.5 ? 'bleu' : 'rouge';
      this.etat = 'pause';
      this.tempsPause = 2.2;
    } else {
      this.demarrerTirsAuBut();
    }
  }

  // ---------- Séance de tirs au but ----------

  demarrerTirsAuBut() {
    const { monde, gardien, ui } = this.ctx;
    this.phaseMatch = 'tab';
    this.tabJoueur = [];
    this.tabIA = [];
    this.tabSequence = null;
    this.tabTourJoueur = Math.random() < 0.5;
    this.tabPhase = 'attente';
    this.tempsPause = 2.2;

    ui.montrerControlesArcade(false);
    ui.montrerHudMatch(true);
    ui.montrerHudTirs(this.tableauTAB());
    monde.modeArcade(false); // bascule vers le décor de tir (tireur/gardien/cage)
    monde.personnaliserTireur(this.equipeJoueur, sauvegarde.donnees.perso.numero);
    monde.placerPenalty();
    gardien.reinitialiser();
    sons.sifflet();
    ui.montrerMessage('TOUJOURS À ÉGALITÉ — TIRS AU BUT !', 2400);
  }

  tableauTAB() {
    const ligne = (tirs) => tirs.map((b) => (b ? '●' : '○')).join(' ') || '·';
    return `TOI  ${ligne(this.tabJoueur)}\nIA   ${ligne(this.tabIA)}`;
  }

  majTAB(dt) {
    const { gardien, ui } = this.ctx;

    if (this.tabPhase === 'attente') {
      this.tempsPause -= dt;
      if (this.tempsPause <= 0) {
        if (this.tabTourJoueur) this.lancerTirJoueurTAB();
        else this.lancerTirIATAB();
      }
      return;
    }

    if (this.tabPhase === 'vol') {
      gardien.maj(dt);
      if (!this.tabSequence) return; // joueur : en attente du geste de tir
      const resultat = this.tabSequence.maj(dt);
      if (resultat) {
        const but = resultat === 'but';
        (this.tabTourJoueur ? this.tabJoueur : this.tabIA).push(but);
        if (this.tabTourJoueur) sauvegarde.enregistrerPenalty(but);
        this.jouerSonTAB(resultat);
        ui.montrerHudTirs(this.tableauTAB());
        this.tabSequence = null;
        if (this.verifierFinTAB()) return;
        this.tabTourJoueur = !this.tabTourJoueur;
        this.tabPhase = 'attente';
        this.tempsPause = 1.6;
      }
    }
  }

  lancerTirJoueurTAB() {
    const { monde, gardien, ui, swipe } = this.ctx;
    this.tabPhase = 'vol';
    monde.placerPenalty();
    gardien.reinitialiser();
    ui.montrerInstruction('Tir au but ! Trace ta trajectoire !');
    swipe.actif = true;
    swipe.surProgression = (points) => {
      ui.dessinerTrace(points);
      const dernier = points[points.length - 1];
      monde.majFleche(monde.cibleDepuisEcran(dernier.x, dernier.y));
    };
    swipe.surTir = (geste) => {
      swipe.actif = false;
      ui.montrerInstruction(null);
      ui.effacerTrace();
      monde.majFleche(null);
      monde.animerFrappe();
      sons.frappe();
      const cible = monde.cibleDepuisEcran(geste.finX, geste.finY);
      this.tabSequence = new SequenceTir(monde, gardien, this.ctx.difficulte, false);
      this.tabSequence.surEvenement = (type) => this.jouerSonTAB(type);
      this.tabSequence.lancer({ cible, puissance: geste.puissance, spin: geste.spin });
    };
  }

  lancerTirIATAB() {
    const { monde, gardien } = this.ctx;
    this.tabPhase = 'vol';
    monde.placerPenalty();
    gardien.reinitialiser();
    monde.animerFrappe();
    sons.frappe();
    const cote = Math.random() < 0.5 ? -1 : 1;
    this.tabSequence = new SequenceTir(monde, gardien, this.ctx.difficulte, false);
    this.tabSequence.surEvenement = (type) => this.jouerSonTAB(type);
    if (Math.random() < this.reglages.iaChanceButPenalty) {
      // Tir cadré : au ras du poteau, à l'opposé de la plongée du gardien
      this.tabSequence.lancer(
        { cible: { x: cote * 3.1, y: alea(0.4, 1.9) }, puissance: 23, spin: 0 },
        { x: -cote * 2.4, y: 1 });
    } else {
      // Raté : au-dessus ou nettement à côté
      this.tabSequence.lancer({ cible: { x: cote * alea(4, 6.4), y: alea(0.3, 3.6) }, puissance: 24, spin: 0 });
    }
  }

  jouerSonTAB(type) {
    const { ui } = this.ctx;
    if (type === 'but') { sons.but(); ui.lancerConfettis(); }
    else if (type === 'poteau') sons.poteau();
    else if (type === 'arret') sons.arret();
    else sons.rate();
  }

  // Règles de la séance : 5 tirs chacun, puis mort subite si égalité
  verifierFinTAB() {
    const bJ = this.tabJoueur.filter(Boolean).length;
    const bIA = this.tabIA.filter(Boolean).length;
    const nJ = this.tabJoueur.length, nIA = this.tabIA.length;
    const N = CONFIG.tirsSeance;
    let fini = false;
    if (nJ <= N && nIA <= N) {
      const resteJ = N - nJ, resteIA = N - nIA;
      if (bJ > bIA + resteIA || bIA > bJ + resteJ) fini = true;
      if (nJ === N && nIA === N && bJ !== bIA) fini = true;
    }
    if (nJ > N && nJ === nIA && bJ !== bIA) fini = true;
    if (fini) {
      this.resultatTAB = { bJ, bIA };
      this.ctx.ui.montrerHudTirs(null);
      this.terminer();
    }
    return fini;
  }

  terminer() {
    const { ui, difficulte, surFin } = this.ctx;
    this.etat = 'fini';
    sons.sifflet();

    const diff = this.scoreJoueur - this.scoreAdverse;
    const victoire = this.resultatTAB ? this.resultatTAB.bJ > this.resultatTAB.bIA : diff > 0;
    const nul = !this.resultatTAB && diff === 0;
    const etoiles = victoire ? (diff >= 2 && !this.resultatTAB ? 3 : 2) : nul ? 1 : 0;
    sauvegarde.enregistrerEtoiles(this.nom, difficulte, etoiles);
    sauvegarde.enregistrerMatch(this.scoreJoueur, this.scoreAdverse);

    // Statistiques du match pour l'écran de résultat
    const poss = this.statsMatch.possession;
    const total = poss[0] + poss[1] || 1;
    const statsMatch = [
      { libelle: 'Possession (%)', joueur: Math.round(100 * poss[0] / total), adverse: Math.round(100 * poss[1] / total) },
      { libelle: 'Tirs', joueur: this.statsMatch.tirs[0], adverse: this.statsMatch.tirs[1] },
      { libelle: 'Tirs cadrés', joueur: this.statsMatch.cadres[0], adverse: this.statsMatch.cadres[1] },
    ];

    // Le score est transmis à main.js (utile pour la Coupe Lucarne) : en
    // cas de tirs au but, on ajoute le but décisif pour donner un score final
    this.ctx.dernierScore = this.resultatTAB
      ? { joueur: this.scoreJoueur + (victoire ? 1 : 0), adverse: this.scoreAdverse + (victoire ? 0 : 1) }
      : { joueur: this.scoreJoueur, adverse: this.scoreAdverse };

    const suffixePhase = this.phaseMatch === 'prolongation' ? ' (a.p.)'
      : this.resultatTAB ? ` (tab ${this.resultatTAB.bJ}-${this.resultatTAB.bIA})` : '';

    this.nettoyer();
    ui.montrerResultat({
      titre: victoire ? 'VICTOIRE ! 🏆' : nul ? 'Match nul' : 'Défaite…',
      detail: `${this.equipeJoueur.court}  ${this.scoreJoueur} - ${this.scoreAdverse}  ${this.equipeAdverse.court}${suffixePhase}`,
      etoiles,
      statsMatch,
    });
    surFin();
  }

  nettoyer() {
    const { ui, monde, swipe } = this.ctx;
    ui.montrerControlesArcade(false);
    ui.montrerHudMatch(false);
    ui.montrerHudTirs(null);
    ui.montrerInstruction(null);
    ui.effacerTrace();
    ui.surPasse = null;
    ui.surTirArcade = null;
    swipe.actif = false;
    swipe.surTir = null;
    swipe.surProgression = null;
    monde.modeArcade(false);
    monde.placerCoupFranc(18, 0, 4); // restaure le décor et la caméra des menus
  }

  quitter() {
    this.etat = 'fini';
    this.nettoyer();
  }
}
