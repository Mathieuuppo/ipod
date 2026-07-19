// ============================================================
// UI DOM : écrans (titre, modes, difficulté, résultat), HUD de
// match, messages cartoon, confettis et mini-jeu de timing.
// Aucune logique de jeu ici : uniquement de l'affichage et des
// callbacks branchés par main.js.
// ============================================================

import { sauvegarde } from './storage.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.ecrans = {
      titre: $('ecran-titre'),
      modes: $('ecran-modes'),
      difficulte: $('ecran-difficulte'),
      resultat: $('ecran-resultat'),
    };
    this.hudMatch = $('hud-match');
    this.hudTirs = $('hud-tirs');
    this.instruction = $('instruction');
    this.messageResultat = $('message-resultat');
    this.btnQuitter = $('btn-quitter');
    this.btnPhoto = $('btn-photo');
    this.minuteurTexte = null;

    this.dessinerDrapeaux();
    this.initTrace();
  }

  // ---------- Ligne de trajectoire (tir façon Score Hero) ----------

  initTrace() {
    this.canvasTrace = $('canvas-trace');
    this.ctxTrace = this.canvasTrace.getContext('2d');
    const redimensionner = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvasTrace.width = window.innerWidth * dpr;
      this.canvasTrace.height = window.innerHeight * dpr;
      this.ctxTrace.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    redimensionner();
    window.addEventListener('resize', redimensionner);
  }

  // Dessine le tracé du doigt : ligne jaune lissée + pointillés blancs,
  // avec une pointe de flèche au bout (la cible du tir).
  dessinerTrace(points) {
    const ctx = this.ctxTrace;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (!points || points.length < 2) return;

    // Ligne continue légèrement transparente
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(255, 224, 0, 0.45)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Pointillés blancs régulièrement espacés le long du tracé
    ctx.fillStyle = '#ffffff';
    let distDepuisPoint = 0;
    for (let i = 1; i < points.length; i++) {
      const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      distDepuisPoint += seg;
      if (distDepuisPoint >= 16) {
        distDepuisPoint = 0;
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Pointe de flèche orientée selon la fin du tracé
    const fin = points[points.length - 1];
    const avant = points[Math.max(0, points.length - 4)];
    const angle = Math.atan2(fin.y - avant.y, fin.x - avant.x);
    ctx.save();
    ctx.translate(fin.x, fin.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-6, 9);
    ctx.closePath();
    ctx.fillStyle = '#ffe000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  effacerTrace() {
    this.ctxTrace.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  // ---------- Navigation entre écrans ----------

  montrerEcran(nom) {
    for (const [n, el] of Object.entries(this.ecrans)) {
      el.classList.toggle('cache', n !== nom);
    }
    if (nom === 'titre') this.rafraichirStatsTitre();
    if (nom === 'modes') this.rafraichirEtoilesModes();
  }

  cacherEcrans() {
    for (const el of Object.values(this.ecrans)) el.classList.add('cache');
  }

  rafraichirStatsTitre() {
    $('stat-buts').textContent = sauvegarde.donnees.totalButs;
    $('stat-serie').textContent = sauvegarde.donnees.meilleureSerie;
  }

  rafraichirEtoilesModes() {
    for (const mode of ['freekick', 'penalty', 'match']) {
      $(`etoiles-${mode}`).textContent = sauvegarde.resumeEtoiles(mode);
    }
  }

  // ---------- Éléments en jeu ----------

  montrerBoutonsJeu(visible) {
    this.btnQuitter.classList.toggle('cache', !visible);
    this.btnPhoto.classList.toggle('cache', !visible);
  }

  // Texte cartoon persistant ("Glisse vers le haut pour tirer !")
  montrerInstruction(texte) {
    if (!texte) { this.instruction.classList.add('cache'); return; }
    this.instruction.textContent = texte;
    this.instruction.classList.remove('cache');
  }

  // Gros message temporaire (BUT ! / ARRÊT ! ...)
  montrerMessage(texte, duree = 1400) {
    this.messageResultat.textContent = texte;
    this.messageResultat.classList.remove('cache');
    clearTimeout(this.timerMessage);
    this.timerMessage = setTimeout(
      () => this.messageResultat.classList.add('cache'), duree);
  }

  // Compteur de tirs : ex. "Tir 3/5   ⚽⚽✖" ou tableau de penalty
  montrerHudTirs(texte) {
    if (!texte) { this.hudTirs.classList.add('cache'); return; }
    this.hudTirs.textContent = texte;
    this.hudTirs.classList.remove('cache');
  }

  // ---------- HUD de match ----------

  montrerHudMatch(visible) {
    this.hudMatch.classList.toggle('cache', !visible);
  }

  majMatch({ minute, scoreJoueur, scoreAdverse }) {
    $('minuteur').textContent = `${minute}'`;
    $('score-match').textContent = `${scoreJoueur} - ${scoreAdverse}`;
  }

  dessinerDrapeaux() {
    // Drapeaux tricolores générés au canvas (équipe bleue vs équipe rouge)
    const peindre = (id, couleurs) => {
      const c = $(id).getContext('2d');
      couleurs.forEach((coul, i) => {
        c.fillStyle = coul;
        c.fillRect(i * 14, 0, 14, 28);
      });
    };
    peindre('drapeau-joueur', ['#2255cc', '#ffffff', '#2255cc']);
    peindre('drapeau-adverse', ['#cc3333', '#ffffff', '#cc3333']);
  }

  // ---------- Écran de résultat de session ----------

  montrerResultat({ titre, detail, etoiles }) {
    $('resultat-titre').textContent = titre;
    $('resultat-detail').textContent = detail;
    $('resultat-etoiles').textContent =
      etoiles == null ? '' : '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles);
    this.montrerEcran('resultat');
  }

  // ---------- Confettis (but marqué) ----------

  lancerConfettis() {
    const conteneur = $('confettis');
    const couleurs = ['#ffe000', '#2255cc', '#e33030', '#37c837', '#ffffff', '#ff8c00'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = couleurs[Math.floor(Math.random() * couleurs.length)];
      c.style.animationDuration = 1.2 + Math.random() * 1.4 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      conteneur.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  // ---------- Mini-jeu de timing (mode match) ----------
  // La zone verte est placée aléatoirement ; le curseur oscille.
  // resolveur(succes) est appelé au tap (géré par le mode match).

  demarrerTiming(largeurZone) {
    const boite = $('minijeu-timing');
    const zone = $('timing-zone');
    const curseur = $('timing-curseur');
    boite.classList.remove('cache');

    const centreZone = 0.25 + Math.random() * 0.5; // fraction de la barre
    zone.style.left = (centreZone - largeurZone / 2) * 100 + '%';
    zone.style.width = largeurZone * 100 + '%';

    this.timing = { actif: true, position: 0, vitesse: 1.7, sens: 1, centreZone, largeurZone };

    const animer = () => {
      if (!this.timing || !this.timing.actif) return;
      const t = this.timing;
      t.position += t.vitesse * t.sens / 60;
      if (t.position > 1) { t.position = 1; t.sens = -1; }
      if (t.position < 0) { t.position = 0; t.sens = 1; }
      curseur.style.left = `calc(${t.position * 100}% - 4px)`;
      requestAnimationFrame(animer);
    };
    animer();
  }

  // Retourne true si le tap est tombé dans la zone verte, puis ferme le mini-jeu
  resoudreTiming() {
    if (!this.timing || !this.timing.actif) return false;
    const t = this.timing;
    t.actif = false;
    $('minijeu-timing').classList.add('cache');
    return Math.abs(t.position - t.centreZone) <= t.largeurZone / 2;
  }

  annulerTiming() {
    if (this.timing) this.timing.actif = false;
    $('minijeu-timing').classList.add('cache');
  }
}
