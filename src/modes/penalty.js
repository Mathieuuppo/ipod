// ============================================================
// Mode Penalty : séance de tirs au but contre l'IA.
// 5 tirs chacun en alternance (le joueur commence), puis mort
// subite. Les tirs de l'IA sont résolus par probabilité (selon
// la difficulté) avec un petit temps de suspense.
// ============================================================

import { CONFIG, DIFFICULTES } from '../config.js';
import { SequenceTir } from '../shot.js';
import { sauvegarde } from '../storage.js';
import { sons } from '../audio.js';

export class ModePenalty {
  constructor(ctx) {
    this.ctx = ctx;
    this.nom = 'penalty';
  }

  demarrer() {
    this.tirsJoueur = [];       // true = but
    this.tirsIA = [];
    this.phase = 'joueur';      // joueur | ia | fini
    this.sequence = null;
    this.tempsPhase = 0;
    this.ctx.ui.montrerBoutonsJeu(true);
    sons.sifflet();
    this.preparerTirJoueur();
  }

  // Tableau de la séance : ronds pleins/creux pour chaque équipe
  tableau() {
    const ligne = (tirs, total) => {
      const marques = tirs.map((b) => (b ? '●' : '○'));
      while (marques.length < total) marques.push('·');
      return marques.join(' ');
    };
    const total = Math.max(CONFIG.tirsSeance, this.tirsJoueur.length, this.tirsIA.length);
    return `TOI  ${ligne(this.tirsJoueur, total)}\nIA   ${ligne(this.tirsIA, total)}`;
  }

  preparerTirJoueur() {
    const { monde, gardien, ui, swipe } = this.ctx;
    this.phase = 'joueur';
    monde.placerPenalty();
    gardien.reinitialiser();
    this.sequence = null;

    ui.montrerHudTirs(this.tableau());
    ui.montrerInstruction('Penalty ! Glisse pour tirer !');
    swipe.actif = true;
    swipe.surProgression = (apercu) => monde.majFleche(apercu);
    swipe.surTir = (params) => this.tirer(params);
  }

  tirer(params) {
    const { monde, gardien, ui, swipe, difficulte } = this.ctx;
    swipe.actif = false;
    ui.montrerInstruction(null);
    monde.majFleche(null);
    monde.animerFrappe();
    sons.frappe();

    this.sequence = new SequenceTir(monde, gardien, difficulte, false);
    this.sequence.surEvenement = (type) => {
      if (type === 'but') { sons.but(); ui.lancerConfettis(); }
      else if (type === 'poteau') sons.poteau();
      else if (type === 'arret') sons.arret();
      else sons.rate();
    };
    this.sequence.lancer(params);
  }

  maj(dt) {
    const { ui, difficulte } = this.ctx;

    if (this.phase === 'joueur' && this.sequence) {
      const resultat = this.sequence.maj(dt);
      if (resultat) {
        const but = resultat === 'but';
        this.tirsJoueur.push(but);
        sauvegarde.enregistrerTir(but);
        ui.montrerMessage(but ? 'BUT ! ⚽' : resultat === 'arret' ? 'ARRÊT !' : 'RATÉ !');
        ui.montrerHudTirs(this.tableau());
        this.sequence = null;
        if (this.verifierFin()) return;
        this.phase = 'attente-ia';
        this.tempsPhase = 1.6;
      }
      return;
    }

    if (this.phase === 'attente-ia') {
      this.tempsPhase -= dt;
      if (this.tempsPhase <= 0) {
        // Tir adverse : petit suspense avant le verdict
        this.phase = 'ia';
        this.tempsPhase = 1.4;
        ui.montrerMessage("L'IA s'élance…", 1300);
        sons.frappe();
      }
      return;
    }

    if (this.phase === 'ia') {
      this.tempsPhase -= dt;
      if (this.tempsPhase <= 0) {
        const but = Math.random() < DIFFICULTES[difficulte].iaChanceButPenalty;
        this.tirsIA.push(but);
        ui.montrerMessage(but ? "BUT de l'IA…" : "TON GARDIEN L'ARRÊTE ! 🧤");
        if (but) sons.rate(); else sons.but();
        ui.montrerHudTirs(this.tableau());
        if (this.verifierFin()) return;
        this.phase = 'attente-joueur';
        this.tempsPhase = 1.6;
      }
      return;
    }

    if (this.phase === 'attente-joueur') {
      this.tempsPhase -= dt;
      if (this.tempsPhase <= 0) this.preparerTirJoueur();
    }
  }

  // Règles de fin : victoire acquise pendant les 5 tirs, ou mort subite après
  verifierFin() {
    const bJ = this.tirsJoueur.filter(Boolean).length;
    const bIA = this.tirsIA.filter(Boolean).length;
    const nJ = this.tirsJoueur.length;
    const nIA = this.tirsIA.length;
    const N = CONFIG.tirsSeance;

    let fini = false;
    if (nJ <= N && nIA <= N) {
      // Phase régulière : fin anticipée si l'écart est irrattrapable
      const resteJ = N - nJ;
      const resteIA = N - nIA;
      if (bJ > bIA + resteIA || bIA > bJ + resteJ) fini = true;
      if (nJ === N && nIA === N && bJ !== bIA) fini = true;
    }
    if (nJ > N && nJ === nIA && bJ !== bIA) fini = true; // mort subite tranchée

    if (fini) this.terminer(bJ, bIA);
    return fini;
  }

  terminer(bJ, bIA) {
    const { ui, difficulte, surFin } = this.ctx;
    this.phase = 'fini';
    const victoire = bJ > bIA;
    // Étoiles : 3 = victoire sans échec, 2 = victoire, 1 = au moins 3 buts
    const sansEchec = this.tirsJoueur.every(Boolean);
    const etoiles = victoire ? (sansEchec ? 3 : 2) : bJ >= 3 ? 1 : 0;
    sauvegarde.enregistrerEtoiles(this.nom, difficulte, etoiles);
    sons.sifflet();
    ui.montrerHudTirs(null);
    ui.montrerResultat({
      titre: victoire ? 'VICTOIRE ! 🏆' : 'Défaite…',
      detail: `Séance de tirs au but : ${bJ} - ${bIA}\n\n${this.tableau()}`,
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
    monde.majFleche(null);
  }
}
