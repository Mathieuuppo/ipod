// ============================================================
// Mode Penalty : séance de tirs au but contre l'IA.
// 5 tirs chacun en alternance (le joueur commence), puis mort
// subite. Sur les tirs adverses, LE JOUEUR devient le gardien : il
// choisit un côté (tap gauche/centre/droite, flèches, ou A/D/S) avant
// que le tireur adverse frappe. Le tireur choisit sa cible en même
// temps et indépendamment — deviner le bon côté reste un pari, et la
// difficulté règle la précision/puissance du tir plutôt que le hasard.
// ============================================================

import { CONFIG, DIFFICULTES, alea } from '../config.js';
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
    ui.montrerInstruction('Penalty ! Trace ta trajectoire !');
    swipe.actif = true;
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

    const cible = monde.cibleDepuisEcran(geste.finX, geste.finY);
    this.sequence = new SequenceTir(monde, gardien, difficulte, false);
    this.sequence.surEvenement = (type) => {
      if (type === 'but') { sons.but(); ui.lancerConfettis(); }
      else if (type === 'poteau') sons.poteau();
      else if (type === 'arret') sons.arret();
      else sons.rate();
    };
    this.sequence.lancer({ cible, puissance: geste.puissance, spin: geste.spin });
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
      if (this.tempsPhase <= 0) this.demarrerChoixGardien();
      return;
    }

    if (this.phase === 'choix-gardien') {
      // Fenêtre de décision : si le joueur ne choisit pas, le gardien
      // reste au centre — le tireur adverse tire de toute façon.
      this.tempsPhase -= dt;
      if (this.tempsPhase <= 0) this.choisirPlongeon('centre');
      return;
    }

    if (this.phase === 'ia' && this.sequence) {
      const resultat = this.sequence.maj(dt);
      if (resultat) {
        const but = resultat === 'but';
        this.tirsIA.push(but);
        const messages = {
          but: "BUT de l'IA…", arret: 'ARRÊTÉ ! 🧤', poteau: 'SUR LE POTEAU !', dehors: 'IL RATE SON TIR !',
        };
        ui.montrerMessage(messages[resultat] || messages.dehors);
        ui.montrerHudTirs(this.tableau());
        this.sequence = null;
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

  // ---------- Tour adverse : le joueur devient le gardien ----------

  demarrerChoixGardien() {
    const { monde, gardien, ui, swipe } = this.ctx;
    this.phase = 'choix-gardien';
    monde.placerPenalty();
    gardien.reinitialiser();
    ui.montrerInstruction('Le tireur adverse arrive ! Choisis ton côté !');
    swipe.modeGardien = true;
    swipe.surChoixGardien = (direction) => this.choisirPlongeon(direction);
    this.tempsPhase = 1.3; // fenêtre de décision avant que le tir ne parte
    sons.clic();
  }

  choisirPlongeon(direction) {
    if (this.phase !== 'choix-gardien') return; // déjà tranché (double appui)
    const { gardien, ui, swipe, difficulte } = this.ctx;
    swipe.modeGardien = false;
    swipe.surChoixGardien = null;
    ui.montrerInstruction(null);
    gardien.plongerCommande(direction, difficulte);
    this.lancerTirAdverse(difficulte);
  }

  // Le tireur adverse choisit sa cible indépendamment du plongeon déjà
  // engagé — la difficulté règle sa précision et sa puissance, pas le
  // fait de "deviner" le gardien (qui n'existe plus, il est joué).
  lancerTirAdverse(difficulte) {
    const { monde, gardien, ui } = this.ctx;
    this.phase = 'ia';
    monde.animerFrappe();
    sons.frappe();

    const precision = DIFFICULTES[difficulte].iaChanceButPenalty; // 0.55 / 0.70 / 0.82
    const cote = Math.random() < 0.5 ? -1 : 1;
    const cadre = Math.random() < 0.65 + precision * 0.3;

    this.sequence = new SequenceTir(monde, gardien, difficulte, false);
    this.sequence.surEvenement = (type) => {
      if (type === 'but') sons.rate();          // mauvais pour nous
      else if (type === 'arret') sons.arret();   // le gardien claque le ballon
      else if (type === 'poteau') sons.poteau();
      else sons.arret();                          // à côté : bon pour nous aussi
    };
    if (cadre) {
      // Plus la difficulté est haute, plus le tir se colle au poteau
      const cible = { x: cote * alea(2.2 + precision * 1.1, 3.35), y: alea(0.3, 1.9) };
      this.sequence.lancer({ cible, puissance: 21 + precision * 4, spin: 0 }, null, false);
    } else {
      const cible = { x: cote * alea(3.8, 6.2), y: alea(0.3, 3.6) };
      this.sequence.lancer({ cible, puissance: 23, spin: 0 }, null, false);
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
    swipe.modeGardien = false;
    swipe.surChoixGardien = null;
    ui.montrerHudTirs(null);
    ui.montrerInstruction(null);
    ui.effacerTrace();
    monde.majFleche(null);
  }
}
