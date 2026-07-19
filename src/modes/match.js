// ============================================================
// Mode Match : un match de 90 minutes accéléré, simulé comme une
// succession d'occasions. Le joueur joue ses occasions (coup
// franc, penalty ou mini-jeu de timing) ; l'IA marque entre-temps
// selon la difficulté. Le chrono est en pause pendant une occasion.
// ============================================================

import { CONFIG, DIFFICULTES, alea } from '../config.js';
import { SequenceTir } from '../shot.js';
import { sauvegarde } from '../storage.js';
import { sons } from '../audio.js';

export class ModeMatch {
  constructor(ctx) {
    this.ctx = ctx;
    this.nom = 'match';
  }

  demarrer() {
    this.tempsEcoule = 0;       // secondes réelles de chrono
    this.minute = 0;
    this.scoreJoueur = 0;
    this.scoreAdverse = 0;
    this.phase = 'temps';       // temps | occasion | timing | fini
    this.sequence = null;
    this.tempsPhase = 0;

    // Planification du match : minutes des occasions joueur et IA
    this.occasionsJoueur = this.tirerMinutes(5);   // 5 occasions pour le joueur
    this.occasionsIA = this.tirerMinutes(6);       // 6 occasions pour l'IA

    const { ui, monde } = this.ctx;
    ui.montrerBoutonsJeu(true);
    ui.montrerHudMatch(true);
    ui.majHudEquipes(this.ctx.matchConfig.equipeJoueur, this.ctx.matchConfig.equipeAdverse);
    ui.majMatch({ minute: 0, scoreJoueur: 0, scoreAdverse: 0 });
    monde.placerCoupFranc(18, 0, 4); // décor d'attente
    sons.sifflet();
    ui.montrerMessage('COUP D\'ENVOI !', 1600);
  }

  // Tire n minutes distinctes entre 3' et 88'
  tirerMinutes(n) {
    const minutes = new Set();
    while (minutes.size < n) minutes.add(3 + Math.floor(Math.random() * 85));
    return [...minutes].sort((a, b) => a - b);
  }

  maj(dt) {
    const { ui, difficulte } = this.ctx;

    if (this.phase === 'temps') {
      this.tempsEcoule += dt;
      const minute = Math.min(90, Math.floor(this.tempsEcoule / CONFIG.secondesParMinuteMatch));
      if (minute !== this.minute) {
        this.minute = minute;
        ui.majMatch({ minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });

        // Occasion adverse : résolue en probabilité pure
        if (this.occasionsIA[0] === minute) {
          this.occasionsIA.shift();
          if (Math.random() < DIFFICULTES[difficulte].iaChanceButMatch) {
            this.scoreAdverse++;
            sons.rate();
            ui.montrerMessage(`${minute}' — BUT ADVERSE… ${this.scoreJoueur}-${this.scoreAdverse}`, 1800);
            ui.majMatch({ minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });
          } else {
            ui.montrerMessage(`${minute}' — Occasion adverse manquée !`, 1500);
          }
        }

        // Occasion du joueur : le chrono se met en pause
        if (this.occasionsJoueur[0] === minute) {
          this.occasionsJoueur.shift();
          this.lancerOccasion();
          return;
        }

        if (minute >= 90) this.terminer();
      }
      return;
    }

    if (this.phase === 'occasion' && this.sequence) {
      const resultat = this.sequence.maj(dt);
      if (resultat) this.finOccasion(resultat === 'but');
      return;
    }

    if (this.phase === 'pause') {
      this.tempsPhase -= dt;
      if (this.tempsPhase <= 0) this.phase = 'temps';
    }
  }

  // ---------- Occasions du joueur ----------

  lancerOccasion() {
    const tirage = Math.random();
    if (tirage < 0.4) this.occasionTir(true);        // coup franc
    else if (tirage < 0.65) this.occasionTir(false); // penalty
    else this.occasionTiming();                      // tir en pleine course
  }

  // Coup franc ou penalty joué normalement au swipe
  occasionTir(avecMur) {
    const { monde, gardien, ui, swipe } = this.ctx;
    this.phase = 'occasion';
    this.sequence = null;

    if (avecMur) {
      monde.placerCoupFranc(alea(16, 21), alea(-4, 4), 3 + Math.floor(Math.random() * 3));
      ui.montrerMessage(`${this.minute}' — COUP FRANC !`, 1600);
    } else {
      monde.placerPenalty();
      ui.montrerMessage(`${this.minute}' — PENALTY !`, 1600);
    }
    gardien.reinitialiser();
    ui.montrerInstruction('Trace la trajectoire de ton tir !');

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
      this.sequence = new SequenceTir(monde, gardien, this.ctx.difficulte, avecMur);
      this.sequence.surEvenement = (type) => this.jouerSon(type);
      this.sequence.lancer({ cible, puissance: geste.puissance, spin: geste.spin });
    };
  }

  // Tir en pleine course : mini-jeu de timing → tir automatique réussi/raté
  occasionTiming() {
    const { monde, gardien, ui, swipe, difficulte } = this.ctx;
    this.phase = 'occasion';
    this.sequence = null;

    monde.placerCoupFranc(14, alea(-2, 2), 0); // face au but, sans mur
    gardien.reinitialiser();
    ui.montrerMessage(`${this.minute}' — TIR EN PLEINE COURSE !`, 1500);
    ui.demarrerTiming(DIFFICULTES[difficulte].timingZone);

    swipe.actif = true;
    swipe.surProgression = null; // pas de tracé ici : c'est un jeu de timing
    const declencher = () => {
      swipe.actif = false;
      swipe.surTap = null;
      swipe.surTir = null;
      const succes = ui.resoudreTiming();
      monde.animerFrappe();
      sons.frappe();

      const cote = Math.random() < 0.5 ? -1 : 1;
      this.sequence = new SequenceTir(monde, gardien, difficulte, false);
      this.sequence.surEvenement = (type) => this.jouerSon(type);
      if (succes) {
        // Frappe croisée près du poteau, gardien envoyé du mauvais côté
        this.sequence.lancer(
          { cible: { x: cote * 2.7, y: 1.7 }, puissance: 22, spin: 0 },
          { x: -cote * 2.4, y: 1 }
        );
      } else {
        // Frappe dévissée au-dessus de la barre
        this.sequence.lancer(
          { cible: { x: cote * 1.4, y: 4.2 }, puissance: 25, spin: 0 }
        );
      }
    };
    // Le tap comme le swipe déclenchent le tir (gros bouton = tout l'écran)
    swipe.surTap = declencher;
    swipe.surTir = declencher;
  }

  jouerSon(type) {
    const { ui } = this.ctx;
    if (type === 'but') { sons.but(); ui.lancerConfettis(); }
    else if (type === 'poteau') sons.poteau();
    else if (type === 'arret') sons.arret();
    else sons.rate();
  }

  finOccasion(but) {
    const { ui } = this.ctx;
    this.sequence = null;
    if (but) {
      this.scoreJoueur++;
      ui.montrerMessage(`BUT ! ⚽ ${this.scoreJoueur}-${this.scoreAdverse}`, 1800);
    }
    sauvegarde.enregistrerTir(but);
    ui.majMatch({ minute: this.minute, scoreJoueur: this.scoreJoueur, scoreAdverse: this.scoreAdverse });
    this.phase = 'pause';
    this.tempsPhase = 1.4;
    if (this.minute >= 90) this.terminer();
  }

  terminer() {
    const { ui, difficulte, surFin } = this.ctx;
    this.phase = 'fini';
    sons.sifflet();

    const diff = this.scoreJoueur - this.scoreAdverse;
    const victoire = diff > 0;
    const nul = diff === 0;
    const etoiles = victoire ? (diff >= 2 ? 3 : 2) : nul ? 1 : 0;
    sauvegarde.enregistrerEtoiles(this.nom, difficulte, etoiles);

    ui.annulerTiming();
    ui.montrerHudMatch(false);
    ui.montrerResultat({
      titre: victoire ? 'VICTOIRE ! 🏆' : nul ? 'Match nul' : 'Défaite…',
      detail: `Score final : ${this.scoreJoueur} - ${this.scoreAdverse}`,
      etoiles,
    });
    surFin();
  }

  quitter() {
    const { ui, swipe, monde } = this.ctx;
    swipe.actif = false;
    swipe.surTir = null;
    swipe.surProgression = null;
    swipe.surTap = null;
    ui.annulerTiming();
    ui.montrerHudMatch(false);
    ui.montrerInstruction(null);
    ui.effacerTrace();
    monde.majFleche(null);
  }
}
