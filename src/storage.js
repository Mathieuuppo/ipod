// ============================================================
// Sauvegarde locale (localStorage) : totaux, série et étoiles.
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
};

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return structuredClone(DEFAUT);
    // Fusion avec les valeurs par défaut pour tolérer les anciennes versions
    const donnees = JSON.parse(brut);
    const fusion = structuredClone(DEFAUT);
    Object.assign(fusion, donnees);
    for (const mode of Object.keys(DEFAUT.etoiles)) {
      fusion.etoiles[mode] = { ...DEFAUT.etoiles[mode], ...(donnees.etoiles?.[mode] || {}) };
    }
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
