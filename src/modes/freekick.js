// ============================================================
// Mode Coup Franc : session de N tirs depuis des positions
// variées, avec mur et gardien. Étoiles selon le nombre de buts.
// ============================================================

import { CONFIG, alea } from '../config.js';
import { SequenceTir } from '../shot.js';
import { sauvegarde } from '../storage.js';
import { sons } from '../audio.js';

const MESSAGES = {
  but: 'BUT ! ⚽',
  arret: 'ARRÊT DU GARDIEN !',
  poteau: 'POTEAU !',
  dehors: 'À CÔTÉ !',
  contre: 'CONTRÉ PAR LE MUR !',
};

export class ModeCoupFranc {
  constructor(ctx) {
    this.ctx = ctx;             // { monde, gardien, ui, swipe, difficulte, surFin }
    this.nom = 'freekick';
  }

  demarrer() {
    this.tirActuel = 0;
    this.buts = 0;
    this.historique = [];       // '⚽' ou '✖' par tir
    this.sequence = null;
    this.tempsAvantSuite = 0;
    this.ctx.ui.montrerBoutonsJeu(true);
    this.preparerTir();
  }

  preparerTir() {
    const { monde, gardien, ui, swipe } = this.ctx;
    this.tirActuel++;

    // Position de coup franc aléatoire : distance et angle varient
    const distance = alea(16, 22);
    const decalageX = alea(-4.5, 4.5);
    const nbMur = 3 + Math.floor(Math.random() * 3); // 3 à 5 joueurs
    monde.placerCoupFranc(distance, decalageX, nbMur);
    gardien.reinitialiser();

    this.sequence = null;
    ui.montrerHudTirs(`Tir ${this.tirActuel}/${CONFIG.tirsParSession}   ${this.historique.join('')}`);
    ui.montrerInstruction('Trace la trajectoire de ton tir !');

    swipe.actif = true;
    // Pendant le tracé : ligne à l'écran + flèche au sol vers la cible visée
    swipe.surProgression = (points) => {
      ui.dessinerTrace(points);
      const dernier = points[points.length - 1];
      monde.majFleche(monde.cibleDepuisEcran(dernier.x, dernier.y));
    };
    swipe.surTir = (geste) => this.tirer(geste);
  }

  tirer(geste) {
    const { monde, gardien, ui, swipe, difficulte } = this.ctx;
    swipe.actif = false;
    ui.montrerInstruction(null);
    ui.effacerTrace();
    monde.majFleche(null);
    monde.animerFrappe();
    sons.frappe();

    // Le point d'arrivée du tracé devient la cible dans le plan de la cage
    const cible = monde.cibleDepuisEcran(geste.finX, geste.finY);
    this.sequence = new SequenceTir(monde, gardien, difficulte, true);
    this.sequence.surEvenement = (type) => this.jouerSon(type);
    this.sequence.lancer({ cible, puissance: geste.puissance, spin: geste.spin });
  }

  jouerSon(type) {
    if (type === 'but') { sons.but(); this.ctx.ui.lancerConfettis(); }
    else if (type === 'poteau') sons.poteau();
    else if (type === 'arret') sons.arret();
    else sons.rate();
  }

  maj(dt) {
    const { ui } = this.ctx;
    if (this.sequence) {
      // (le gardien est animé par la boucle principale)
      const resultat = this.sequence.maj(dt);
      if (resultat) {
        const but = resultat === 'but';
        if (but) this.buts++;
        this.historique.push(but ? '⚽' : '✖');
        sauvegarde.enregistrerTir(but);
        ui.montrerMessage(MESSAGES[resultat]);
        this.sequence = null;
        this.tempsAvantSuite = 1.7;
      }
    } else if (this.tempsAvantSuite > 0) {
      this.tempsAvantSuite -= dt;
      if (this.tempsAvantSuite <= 0) {
        if (this.tirActuel >= CONFIG.tirsParSession) this.terminer();
        else this.preparerTir();
      }
    }
  }

  terminer() {
    const { ui, difficulte, surFin } = this.ctx;
    // Étoiles : 1 dès le premier but, 2 à 3 buts, 3 pour un sans-faute
    const etoiles = this.buts >= CONFIG.tirsParSession ? 3 : this.buts >= 3 ? 2 : this.buts >= 1 ? 1 : 0;
    sauvegarde.enregistrerEtoiles(this.nom, difficulte, etoiles);
    ui.montrerHudTirs(null);
    ui.montrerResultat({
      titre: this.buts >= 3 ? 'Bien joué !' : 'Terminé !',
      detail: `${this.buts} but${this.buts > 1 ? 's' : ''} sur ${CONFIG.tirsParSession}\n${this.historique.join(' ')}`,
      etoiles,
    });
    surFin();
  }

  quitter() {
    const { ui, swipe, monde } = this.ctx;
    swipe.actif = false;
    swipe.surTir = null;
    swipe.surProgression = null;
    ui.montrerHudTirs(null);
    ui.montrerInstruction(null);
    ui.effacerTrace();
    monde.majFleche(null);
  }
}
