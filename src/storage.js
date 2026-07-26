// ============================================================
// Sauvegarde locale (localStorage) : progression, étoiles,
// équipe choisie, tactique, réglages, statistiques globales
// et compétition en cours.
// ============================================================

const CLE = 'freekick-champions-v1';

const DEFAUT = {
  totalButs: 0,
  meilleureSerie: 0,
  serieEnCours: 0,
  // etoiles[mode][difficulte] = 0..3
  etoiles: {
    freekick: { facile: 0, moyen: 0, difficile: 0 },
    penalty: { facile: 0, moyen: 0, difficile: 0 },
    match: { facile: 0, moyen: 0, difficile: 0 },
    arcade: { facile: 0, moyen: 0, difficile: 0 },
  },

  // Identité du joueur : son club, son adversaire favori, son numéro 10
  equipeId: 'royal',
  adversaireId: 'valbourg',
  perso: { nom: 'Capitaine', numero: 10 },

  // Tactique appliquée au mode arcade
  tactique: { formation: '442', bloc: 'moyen', pressing: 'moyen', style: 'equilibre' },

  // Réglages
  reglages: { sons: true, musique: true, vibrations: true, vitesse: 'normal' },

  // Statistiques globales de carrière
  statsGlobales: {
    matchsJoues: 0, matchsGagnes: 0, matchsNuls: 0,
    butsMarques: 0, butsEncaisses: 0,
    penaltysTires: 0, penaltysMarques: 0,
    coupesGagnees: 0,
  },

  // Compétition en cours : null ou { tour, equipes: [ids], resultats }
  competition: null,
};

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return structuredClone(DEFAUT);
    // Fusion profonde simple avec les valeurs par défaut (tolère les
    // sauvegardes des anciennes versions du jeu)
    const donnees = JSON.parse(brut);
    const fusion = structuredClone(DEFAUT);
    const fusionner = (cible, source) => {
      for (const [k, v] of Object.entries(source || {})) {
        if (v && typeof v === 'object' && !Array.isArray(v) && cible[k] && typeof cible[k] === 'object') {
          fusionner(cible[k], v);
        } else if (v !== undefined) {
          cible[k] = v;
        }
      }
    };
    fusionner(fusion, donnees);
    return fusion;
  } catch {
    return structuredClone(DEFAUT);
  }
}

export const sauvegarde = {
  donnees: charger(),

  ecrire() {
    try { localStorage.setItem(CLE, JSON.stringify(this.donnees)); } catch { /* stockage indisponible */ }
  },

  reinitialiser() {
    this.donnees = structuredClone(DEFAUT);
    this.ecrire();
  },

  // À appeler après chaque tir du joueur pour tenir les compteurs
  enregistrerTir(estBut) {
    if (estBut) {
      this.donnees.totalButs++;
      this.donnees.serieEnCours++;
      if (this.donnees.serieEnCours > this.donnees.meilleureSerie) {
        this.donnees.meilleureSerie = this.donnees.serieEnCours;
      }
    } else {
      this.donnees.serieEnCours = 0;
    }
    this.ecrire();
  },

  enregistrerPenalty(estBut) {
    this.donnees.statsGlobales.penaltysTires++;
    if (estBut) this.donnees.statsGlobales.penaltysMarques++;
    this.enregistrerTir(estBut); // écrit aussi
  },

  // Fin d'un match arcade : résultat + buts
  enregistrerMatch(butsPour, butsContre) {
    const s = this.donnees.statsGlobales;
    s.matchsJoues++;
    if (butsPour > butsContre) s.matchsGagnes++;
    else if (butsPour === butsContre) s.matchsNuls++;
    s.butsMarques += butsPour;
    s.butsEncaisses += butsContre;
    this.ecrire();
  },

  // Conserve le meilleur nombre d'étoiles obtenu
  enregistrerEtoiles(mode, difficulte, etoiles) {
    const actuel = this.donnees.etoiles[mode]?.[difficulte] ?? 0;
    if (etoiles > actuel) {
      this.donnees.etoiles[mode][difficulte] = etoiles;
      this.ecrire();
    }
  },

  // Résumé "★★☆" par mode pour le menu (meilleure difficulté renseignée)
  resumeEtoiles(mode) {
    const e = this.donnees.etoiles[mode];
    const parties = [];
    for (const [diff, n] of Object.entries(e)) {
      if (n > 0) parties.push(`${diff}: ${'★'.repeat(n)}`);
    }
    return parties.join('  ');
  },
};
