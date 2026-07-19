// ============================================================
// Point d'entrée : construit le monde 3D, l'UI et les modes,
// gère la navigation entre écrans et fait tourner la boucle
// de jeu (requestAnimationFrame via Monde.rendre()).
// ============================================================

import { Monde } from './world.js';
import { Gardien } from './keeper.js';
import { UI } from './ui.js';
import { GestionnaireSwipe } from './input.js';
import { initAudio, sons } from './audio.js';
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
let dernierChoix = { mode: 'freekick', difficulte: 'moyen' };

// Contexte partagé injecté dans chaque mode
const ctx = {
  monde, gardien, ui, swipe,
  difficulte: 'moyen',
  surFin: () => { modeActif = null; }, // le mode a affiché son écran de résultat
};

const FABRIQUES = {
  freekick: () => new ModeCoupFranc(ctx),
  penalty: () => new ModePenalty(ctx),
  match: () => new ModeMatch(ctx),
  arcade: () => new ModeArcade(ctx),
};

// ---------- Navigation ----------

function demarrerJeu(mode, difficulte) {
  dernierChoix = { mode, difficulte };
  ctx.difficulte = difficulte;
  ui.cacherEcrans();
  gardien.reinitialiser();
  modeActif = FABRIQUES[mode]();
  modeActif.demarrer();
}

function quitterVersMenu() {
  if (modeActif) {
    modeActif.quitter();
    modeActif = null;
  }
  ui.montrerBoutonsJeu(false);
  ui.montrerHudMatch(false);
  monde.placerCoupFranc(18, 0, 4);
  gardien.reinitialiser();
  ui.montrerEcran('titre');
}

let modeChoisi = 'freekick';

function brancher(id, action) {
  document.getElementById(id).addEventListener('click', () => { sons.clic(); action(); });
}

brancher('btn-jouer', () => ui.montrerEcran('modes'));
brancher('btn-retour-titre', () => ui.montrerEcran('titre'));
brancher('btn-retour-modes', () => ui.montrerEcran('modes'));
brancher('btn-quitter', quitterVersMenu);
brancher('btn-photo', () => monde.photo());
brancher('btn-rejouer', () => demarrerJeu(dernierChoix.mode, dernierChoix.difficulte));
brancher('btn-resultat-menu', quitterVersMenu);

for (const btn of document.querySelectorAll('#ecran-modes .btn-mode')) {
  btn.addEventListener('click', () => {
    sons.clic();
    modeChoisi = btn.dataset.mode;
    ui.montrerEcran('difficulte');
  });
}
for (const btn of document.querySelectorAll('#ecran-difficulte .btn-mode')) {
  btn.addEventListener('click', () => {
    sons.clic();
    demarrerJeu(modeChoisi, btn.dataset.difficulte);
  });
}

// ---------- Verrous mobile ----------

// L'audio ne peut démarrer qu'après un geste utilisateur
document.addEventListener('pointerdown', initAudio, { once: false });
// Bloque le pull-to-refresh / scroll élastique restant
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- Boucle de jeu ----------

ui.montrerEcran('titre');

function boucle() {
  requestAnimationFrame(boucle);
  const dt = monde.rendre();          // rendu + tweens, retourne le pas de temps
  gardien.maj(dt);                    // balancement / plongeon du gardien
  if (modeActif) modeActif.maj(dt);   // logique du mode en cours
}
boucle();
