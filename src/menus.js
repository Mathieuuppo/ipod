// ============================================================
// Menus : navigation entre les écrans hors-match et rendu des
// contenus dynamiques (grille des clubs, effectif, tactique,
// bracket de la Coupe Lucarne, statistiques, réglages).
// Aucune logique de match ici — uniquement l'app "autour" du jeu.
// ============================================================

import { EQUIPES, equipeParId, genererEffectif, statsEquipe, dessinerBlason, etoilesNote } from './data/equipes.js';
import { sauvegarde } from './storage.js';
import { sons, musique } from './audio.js';

const $ = (id) => document.getElementById(id);

export class Menus {
  // demarrerJeu(mode, difficulte, options) est fourni par main.js
  constructor({ ui, demarrerJeu }) {
    this.ui = ui;
    this.demarrerJeu = demarrerJeu;
    this.selectionEquipe = 'moi';   // onglet de l'écran équipe
    this.modeChoisi = 'arcade';
    this.apresResultat = 'menu';    // où retourne "Menu principal" après un match
    this.brancherBoutons();
  }

  // ---------- Navigation ----------

  naviguer(nom) {
    this.ui.montrerEcran(nom);
    // Rendus dynamiques à l'affichage
    if (nom === 'titre') this.ui.rafraichirStatsTitre();
    if (nom === 'menu') this.rendreEnteteMenu();
    if (nom === 'modes') this.ui.rafraichirEtoilesModes();
    if (nom === 'equipe') this.rendreGrilleEquipes();
    if (nom === 'compo') this.rendreCompo();
    if (nom === 'competition') this.rendreCompetition();
    if (nom === 'stats') this.rendreStats();
    if (nom === 'reglages') this.rendreReglages();
    // Musique d'ambiance uniquement dans les menus
    if (['titre', 'menu', 'modes', 'equipe', 'compo', 'competition', 'stats', 'reglages'].includes(nom)) {
      musique.souhaitee = true;
      musique.demarrer();
    }
  }

  brancherBoutons() {
    const lier = (id, action) => $(id).addEventListener('click', () => { sons.clic(); action(); });

    lier('btn-entrer', () => this.naviguer('menu'));
    lier('btn-nav-jouer', () => this.naviguer('modes'));
    lier('btn-nav-equipe', () => this.naviguer('equipe'));
    lier('btn-nav-competition', () => this.naviguer('competition'));
    lier('btn-nav-stats', () => this.naviguer('stats'));
    lier('btn-nav-reglages', () => this.naviguer('reglages'));
    for (const id of ['btn-retour-menu-1', 'btn-retour-menu-2', 'btn-retour-menu-3', 'btn-retour-menu-4', 'btn-retour-menu-5', 'btn-compo-menu']) {
      lier(id, () => this.naviguer('menu'));
    }
    lier('btn-retour-modes', () => this.naviguer('modes'));
    lier('btn-vers-compo', () => this.naviguer('compo'));
    lier('btn-retour-equipe', () => this.naviguer('equipe'));

    // Choix du mode → difficulté → match
    for (const btn of document.querySelectorAll('#ecran-modes .btn-mode')) {
      btn.addEventListener('click', () => {
        sons.clic();
        this.modeChoisi = btn.dataset.mode;
        this.naviguer('difficulte');
      });
    }
    for (const btn of document.querySelectorAll('#ecran-difficulte .btn-mode')) {
      btn.addEventListener('click', () => {
        sons.clic();
        this.apresResultat = 'menu';
        this.demarrerJeu(this.modeChoisi, btn.dataset.difficulte, {});
      });
    }

    // Onglets Mon club / Adversaire
    for (const seg of document.querySelectorAll('#segments-equipe .segment')) {
      seg.addEventListener('click', () => {
        sons.clic();
        this.selectionEquipe = seg.dataset.cible;
        for (const s of document.querySelectorAll('#segments-equipe .segment')) {
          s.classList.toggle('actif', s === seg);
        }
        this.rendreGrilleEquipes();
      });
    }

    // Personnalisation du capitaine
    $('perso-nom').addEventListener('change', (e) => {
      sauvegarde.donnees.perso.nom = e.target.value.trim() || 'Capitaine';
      sauvegarde.ecrire();
    });
    $('perso-numero').addEventListener('change', (e) => {
      const n = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 10));
      sauvegarde.donnees.perso.numero = n;
      e.target.value = n;
      sauvegarde.ecrire();
    });

    // Formations
    for (const seg of document.querySelectorAll('#segments-formation .segment')) {
      seg.addEventListener('click', () => {
        sons.clic();
        sauvegarde.donnees.tactique.formation = seg.dataset.formation;
        sauvegarde.ecrire();
        this.rendreCompo();
      });
    }
    // Réglages tactiques (bloc / pressing / style)
    for (const groupe of document.querySelectorAll('#tactique-bloc .segments')) {
      for (const seg of groupe.querySelectorAll('.segment')) {
        seg.addEventListener('click', () => {
          sons.clic();
          sauvegarde.donnees.tactique[groupe.dataset.reglage] = seg.dataset.valeur;
          sauvegarde.ecrire();
          this.rendreCompo();
        });
      }
    }

    // Réglages généraux (oui/non + vitesse)
    for (const groupe of document.querySelectorAll('#liste-reglages .segments')) {
      for (const seg of groupe.querySelectorAll('.segment')) {
        seg.addEventListener('click', () => {
          sons.clic();
          const cle = groupe.dataset.reglage;
          sauvegarde.donnees.reglages[cle] = cle === 'vitesse'
            ? seg.dataset.valeur : seg.dataset.valeur === 'oui';
          sauvegarde.ecrire();
          this.rendreReglages();
          if (cle === 'musique') sauvegarde.donnees.reglages.musique ? musique.demarrer() : musique.arreter();
        });
      }
    }
    lier('btn-reinitialiser', () => {
      sauvegarde.reinitialiser();
      this.naviguer('menu');
      this.ui.montrerMessage('Progression réinitialisée', 1400);
    });

    // Compétition
    lier('btn-competition-action', () => this.actionCompetition());
  }

  // ---------- Rendus ----------

  rendreEnteteMenu() {
    const eq = equipeParId(sauvegarde.donnees.equipeId);
    $('menu-nom-equipe').textContent = eq.nom.toUpperCase();
    $('menu-note-equipe').textContent = `${etoilesNote(eq.note)} — ${eq.ville}`;
    dessinerBlason($('blason-menu'), eq);
  }

  rendreGrilleEquipes() {
    const grille = $('grille-equipes');
    grille.innerHTML = '';
    const cible = this.selectionEquipe; // 'moi' | 'adversaire'
    const choisiId = cible === 'moi' ? sauvegarde.donnees.equipeId : sauvegarde.donnees.adversaireId;

    for (const eq of EQUIPES) {
      const carte = document.createElement('button');
      carte.className = 'carte-equipe' + (eq.id === choisiId ? ' choisie' : '');
      const canvas = document.createElement('canvas');
      canvas.width = 44; canvas.height = 49;
      dessinerBlason(canvas, eq);
      const nom = document.createElement('div');
      nom.className = 'nom';
      nom.textContent = eq.nom;
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = etoilesNote(eq.note);
      carte.append(canvas, nom, note);
      carte.addEventListener('click', () => {
        sons.clic();
        if (cible === 'moi') sauvegarde.donnees.equipeId = eq.id;
        else sauvegarde.donnees.adversaireId = eq.id;
        sauvegarde.ecrire();
        this.rendreGrilleEquipes();
      });
      grille.appendChild(carte);
    }

    $('perso-nom').value = sauvegarde.donnees.perso.nom;
    $('perso-numero').value = sauvegarde.donnees.perso.numero;
  }

  rendreCompo() {
    const t = sauvegarde.donnees.tactique;
    for (const seg of document.querySelectorAll('#segments-formation .segment')) {
      seg.classList.toggle('actif', seg.dataset.formation === t.formation);
    }
    for (const groupe of document.querySelectorAll('#tactique-bloc .segments')) {
      for (const seg of groupe.querySelectorAll('.segment')) {
        seg.classList.toggle('actif', t[groupe.dataset.reglage] === seg.dataset.valeur);
      }
    }

    const eq = equipeParId(sauvegarde.donnees.equipeId);
    const liste = $('liste-effectif');
    liste.innerHTML = '';
    const POSTES = { G: 'Gardien', D: 'Défenseur', M: 'Milieu', A: 'Attaquant' };
    for (const j of genererEffectif(eq)) {
      const ligne = document.createElement('div');
      ligne.className = 'ligne-joueur' + (j.titulaire ? '' : ' remplacant');
      const barre = (valeur, or) =>
        `<div class="barre-stat${or ? ' or' : ''}"><div style="width:${valeur}%"></div></div>`;
      ligne.innerHTML = `
        <div class="numero">${j.numero}</div>
        <div class="infos">
          <div class="nom">${j.nom}</div>
          <div class="poste">${POSTES[j.poste]}${j.titulaire ? '' : ' · remplaçant'}</div>
        </div>
        <div class="barres" title="Vitesse / Tir / Passe / Défense">
          ${barre(j.vitesse, true)}${barre(j.tir)}${barre(j.passe)}${barre(j.defense)}
        </div>`;
      liste.appendChild(ligne);
    }
  }

  rendreStats() {
    const s = sauvegarde.donnees.statsGlobales;
    const d = sauvegarde.donnees;
    const tauxPen = s.penaltysTires ? Math.round(100 * s.penaltysMarques / s.penaltysTires) : 0;
    const lignes = [
      ['Buts marqués (total)', d.totalButs],
      ['Meilleure série', d.meilleureSerie],
      ['Matchs joués', s.matchsJoues],
      ['Matchs gagnés', s.matchsGagnes],
      ['Matchs nuls', s.matchsNuls],
      ['Buts en match', `${s.butsMarques} / ${s.butsEncaisses} encaissés`],
      ['Réussite penalty', `${tauxPen} %`],
      ['Coupes Lucarne gagnées', s.coupesGagnees],
    ];
    $('liste-stats').innerHTML = lignes
      .map(([libelle, valeur]) => `<div class="ligne-stat"><span>${libelle}</span><b>${valeur}</b></div>`)
      .join('');
  }

  rendreReglages() {
    const r = sauvegarde.donnees.reglages;
    for (const groupe of document.querySelectorAll('#liste-reglages .segments')) {
      const cle = groupe.dataset.reglage;
      const valeur = cle === 'vitesse' ? r.vitesse : (r[cle] ? 'oui' : 'non');
      for (const seg of groupe.querySelectorAll('.segment')) {
        seg.classList.toggle('actif', seg.dataset.valeur === valeur);
      }
    }
  }

  // ---------- Coupe Lucarne (élimination directe à 8) ----------

  creerCompetition() {
    const moi = sauvegarde.donnees.equipeId;
    const autres = EQUIPES.filter((e) => e.id !== moi).map((e) => e.id);
    // 7 adversaires mélangés, triés du plus faible au plus fort par tour
    for (let i = autres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [autres[i], autres[j]] = [autres[j], autres[i]];
    }
    const participants = [moi, ...autres.slice(0, 7)];
    sauvegarde.donnees.competition = {
      tour: 0, // 0 = quarts, 1 = demies, 2 = finale
      termine: false,
      vainqueur: null,
      tours: [
        // Quatre duels de quarts : le joueur est dans le premier
        [[participants[0], participants[1], null], [participants[2], participants[3], null],
         [participants[4], participants[5], null], [participants[6], participants[7], null]],
      ],
    };
    sauvegarde.ecrire();
  }

  competitionEnCours() {
    const c = sauvegarde.donnees.competition;
    return c && !c.termine ? c : null;
  }

  // Le duel du joueur dans le tour courant (ou null)
  duelDuJoueur() {
    const c = this.competitionEnCours();
    if (!c) return null;
    const moi = sauvegarde.donnees.equipeId;
    return c.tours[c.tour].find((duel) => !duel[2] && (duel[0] === moi || duel[1] === moi)) || null;
  }

  actionCompetition() {
    const c = this.competitionEnCours();
    if (!c) {
      this.creerCompetition();
      this.rendreCompetition();
      return;
    }
    const duel = this.duelDuJoueur();
    if (!duel) { this.rendreCompetition(); return; }
    const moi = sauvegarde.donnees.equipeId;
    const adversaireId = duel[0] === moi ? duel[1] : duel[0];
    // La difficulté monte avec les tours : quarts moyen, puis difficile
    const difficulte = c.tour === 0 ? 'moyen' : 'difficile';
    this.apresResultat = 'competition';
    this.demarrerJeu('arcade', difficulte, { adversaireId, competition: true });
  }

  // Appelé par main.js quand un match de compétition se termine
  enregistrerResultatCompetition(scoreJoueur, scoreAdverse) {
    const c = this.competitionEnCours();
    if (!c) return;
    const moi = sauvegarde.donnees.equipeId;
    const duel = this.duelDuJoueur();
    if (!duel) return;

    // Un match de coupe ne peut pas être nul : nul → mort subite simulée
    let sJ = scoreJoueur, sA = scoreAdverse;
    if (sJ === sA) (Math.random() < 0.5 ? sJ++ : sA++);
    duel[2] = duel[0] === moi ? [sJ, sA] : [sA, sJ];

    // Résultats simulés des autres duels du tour (pondérés par la note)
    for (const d of c.tours[c.tour]) {
      if (d[2]) continue;
      const nA = equipeParId(d[0]).note, nB = equipeParId(d[1]).note;
      const pA = nA / (nA + nB);
      let bA = Math.floor(Math.random() * 3) + (Math.random() < pA ? 1 : 0);
      let bB = Math.floor(Math.random() * 3) + (Math.random() < 1 - pA ? 1 : 0);
      if (bA === bB) (Math.random() < pA ? bA++ : bB++); // pas de nul en coupe
      d[2] = [bA, bB];
    }

    const perdu = sJ < sA;
    if (perdu) {
      c.termine = true;
      c.vainqueur = null;
    } else if (c.tour === 2) {
      // Finale gagnée !
      c.termine = true;
      c.vainqueur = moi;
      sauvegarde.donnees.statsGlobales.coupesGagnees++;
    } else {
      // Tour suivant : les vainqueurs s'affrontent
      const vainqueurs = c.tours[c.tour].map((d) => (d[2][0] > d[2][1] ? d[0] : d[1]));
      const suivant = [];
      for (let i = 0; i < vainqueurs.length; i += 2) {
        suivant.push([vainqueurs[i], vainqueurs[i + 1], null]);
      }
      c.tours.push(suivant);
      c.tour++;
    }
    sauvegarde.ecrire();
  }

  rendreCompetition() {
    const c = sauvegarde.donnees.competition;
    const bracket = $('bracket');
    const bouton = $('btn-competition-action');
    const moi = sauvegarde.donnees.equipeId;

    if (!c) {
      bracket.innerHTML = `<div class="sous-texte" style="padding:30px 10px">
        Une coupe à élimination directe contre 7 clubs.<br>Quarts, demi-finale, finale — sans filet !</div>`;
      bouton.textContent = 'NOUVELLE COUPE';
      return;
    }

    const NOMS_TOURS = ['Quarts de finale', 'Demi-finales', 'Finale'];
    bracket.innerHTML = '';
    c.tours.forEach((duels, t) => {
      const titre = document.createElement('div');
      titre.className = 'tour-titre';
      titre.textContent = NOMS_TOURS[t];
      bracket.appendChild(titre);
      for (const [idA, idB, score] of duels) {
        const eqA = equipeParId(idA), eqB = equipeParId(idB);
        const duel = document.createElement('div');
        duel.className = 'duel' + (idA === moi || idB === moi ? ' mien' : '');
        const camp = (eq, gagne) => {
          const div = document.createElement('div');
          div.className = 'camp' + (gagne ? ' gagnant' : '');
          const cv = document.createElement('canvas');
          cv.width = 26; cv.height = 29;
          dessinerBlason(cv, eq);
          const span = document.createElement('span');
          span.textContent = eq.court;
          div.append(cv, span);
          return div;
        };
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-duel';
        scoreDiv.textContent = score ? `${score[0]} - ${score[1]}` : 'à jouer';
        duel.append(camp(eqA, score && score[0] > score[1]), scoreDiv, camp(eqB, score && score[1] > score[0]));
        bracket.appendChild(duel);
      }
    });

    if (c.termine) {
      const fin = document.createElement('div');
      fin.className = 'tour-titre';
      fin.style.color = c.vainqueur === moi ? 'var(--pelouse)' : 'var(--danger)';
      fin.textContent = c.vainqueur === moi ? '🏆 COUPE GAGNÉE !' : 'Éliminé…';
      bracket.appendChild(fin);
      bouton.textContent = 'NOUVELLE COUPE';
      // La prochaine action repart de zéro
      sauvegarde.donnees.competition = null;
      sauvegarde.ecrire();
      sauvegarde.donnees.competition = c; // gardé à l'écran jusqu'au départ
    } else {
      bouton.textContent = this.duelDuJoueur() ? 'JOUER LE MATCH' : 'CONTINUER';
    }
  }
}
