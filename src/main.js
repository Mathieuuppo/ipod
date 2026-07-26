// ============================================================
// Point d'entrée : construit le monde 3D, l'UI, les menus et
// les modes, puis fait tourner la boucle de jeu.
// ============================================================

import { Monde } from './world.js';
import { Gardien } from './keeper.js';
import { UI } from './ui.js';
import { Menus } from './menus.js';
import { GestionnaireSwipe } from './input.js';
import { initAudio, sons, musique } from './audio.js';
import { sauvegarde } from './storage.js';
import { equipeParId } from './data/equipes.js';
import { ModeCoupFranc } from './modes/freekick.js';
import { ModePenalty } from './modes/penalty.js';
import { ModeMatch } from './modes/match.js';
import { ModeArcade } from './modes/arcade.js';

// ---------- Construction ----------

const conteneur = document.getElementById('conteneur-jeu');
const monde = new Monde(conteneur);
const gardien = new Gardien(monde);
const ui = new UI();
const swipe = new GestionnaireSwipe(monde.renderer.domElement);

// Décor d'attente derrière les menus
monde.placerCoupFranc(18, 0, 4);

let modeActif = null;
let dernierLancement = null; // { mode, difficulte, options } pour REJOUER

// Contexte partagé injecté dans chaque mode
const ctx = {
  monde, gardien, ui, swipe,
  difficulte: 'moyen',
  matchConfig: null,   // { equipeJoueur, equipeAdverse } rempli au lancement
  dernierScore: null,  // { joueur, adverse } déposé par le mode arcade
  surFin: () => finDeMode(),
};

const FABRIQUES = {
  freekick: () => new ModeCoupFranc(ctx),
  penalty: () => new ModePenalty(ctx),
  match: () => new ModeMatch(ctx),
  arcade: () => new ModeArcade(ctx),
};

// ---------- Lancement / fin des parties ----------

function demarrerJeu(mode, difficulte, options = {}) {
  dernierLancement = { mode, difficulte, options };
  ctx.difficulte = difficulte;

  // Clubs du match : le mien + l'adversaire (imposé en Coupe Lucarne)
  const equipeJoueur = equipeParId(sauvegarde.donnees.equipeId);
  const equipeAdverse = equipeParId(options.adversaireId || sauvegarde.donnees.adversaireId);
  ctx.matchConfig = { equipeJoueur, equipeAdverse };
  ctx.dernierScore = null;

  // Le tireur des modes de tir porte mes couleurs et mon numéro
  monde.personnaliserTireur(equipeJoueur, sauvegarde.donnees.perso.numero);

  musique.souhaitee = false; // silence d'avant-match, place aux bruits du stade
  musique.arreter();
  ui.cacherEcrans();
  gardien.reinitialiser();
  modeActif = FABRIQUES[mode]();
  modeActif.demarrer();
}

// Fin naturelle d'un mode (écran de résultat déjà affiché par le mode)
function finDeMode() {
  const enCompetition = dernierLancement?.options?.competition;
  modeActif = null;
  if (enCompetition && ctx.dernierScore) {
    menus.enregistrerResultatCompetition(ctx.dernierScore.joueur, ctx.dernierScore.adverse);
    // Après un match de coupe, "REJOUER" n'a pas de sens : on masque
    document.getElementById('btn-rejouer').classList.add('cache');
  } else {
    document.getElementById('btn-rejouer').classList.remove('cache');
  }
}

function quitterVersMenu(ecran = 'menu') {
  if (modeActif) {
    modeActif.quitter();
    modeActif = null;
  }
  ui.montrerBoutonsJeu(false);
  ui.montrerHudMatch(false);
  monde.placerCoupFranc(18, 0, 4);
  gardien.reinitialiser();
  menus.naviguer(ecran);
}

const menus = new Menus({ ui, demarrerJeu });

// Boutons transverses (en jeu + écran de résultat)
function brancher(id, action) {
  document.getElementById(id).addEventListener('click', () => { sons.clic(); action(); });
}
brancher('btn-quitter', () => quitterVersMenu(menus.apresResultat));
brancher('btn-photo', () => monde.photo());
brancher('btn-rejouer', () => {
  const { mode, difficulte, options } = dernierLancement;
  demarrerJeu(mode, difficulte, options);
});
brancher('btn-resultat-menu', () => quitterVersMenu(menus.apresResultat));

// ---------- Verrous mobile ----------

// L'audio ne peut démarrer qu'après un geste utilisateur (tactile ou clavier)
document.addEventListener('pointerdown', initAudio);
document.addEventListener('keydown', initAudio);
// Bloque le pull-to-refresh / scroll élastique restant (mais pas les
// champs de saisie des menus)
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName !== 'INPUT') e.preventDefault();
}, { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- Boucle de jeu ----------

menus.naviguer('titre');

function boucle() {
  requestAnimationFrame(boucle);
  const dt = monde.rendre();          // rendu + tweens, retourne le pas de temps
  gardien.maj(dt);                    // balancement / plongeon du gardien
  swipe.majClavier(dt);               // fait avancer le tracé clavier (flèches maintenues)
  ui.majJoystickClavier();            // relit le clavier arcade (WASD/flèches + espace/E)
  if (modeActif) modeActif.maj(dt);   // logique du mode en cours
}
boucle();
