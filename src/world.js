// ============================================================
// Monde 3D (Three.js) : stade, pelouse, cage, foule, joueurs
// voxel, ballon et flèche de visée.
//
// Convention d'axes :
//   x = latéral (droite positive vue caméra), y = hauteur,
//   z = profondeur — la LIGNE DE BUT est à z = 0, le ballon à z > 0,
//   le tir part vers -z. La caméra est derrière le tireur.
//
// Les personnages sont des assemblages de cubes ("voxel figurines")
// construits par des fonctions dédiées : facile de les remplacer
// plus tard par de vrais modèles glTF sans toucher au reste du jeu.
// ============================================================

import * as THREE from 'three';
import { CONFIG, alea, clamp } from './config.js';

// ---------- Petites textures générées (aucun asset externe) ----------

function textureCiel() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#2f8fe0');
  grad.addColorStop(0.55, '#7dc2f2');
  grad.addColorStop(1, '#c8e8fb');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 512);
  // Nuages simples : paquets d'ellipses blanches semi-transparentes
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 7; i++) {
    const x = Math.random() * 256, y = 20 + Math.random() * 150, s = 14 + Math.random() * 22;
    for (let j = 0; j < 4; j++) {
      g.beginPath();
      g.ellipse(x + (j - 1.5) * s * 0.8, y + (j % 2) * s * 0.25, s, s * 0.55, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturePelouse() {
  // Bandes de tonte : deux tons de vert alternés
  const c = document.createElement('canvas');
  c.width = 64; c.height = 512;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 === 0 ? '#3f9e3f' : '#54b654';
    g.fillRect(0, i * 64, 64, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textureBallon() {
  // Ballon classique : fond blanc + "pentagones" noirs stylisés
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f4f4';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#1a1a1a';
  const pentagone = (cx, cy, r) => {
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
  };
  pentagone(24, 24, 13); pentagone(88, 30, 13); pentagone(50, 70, 14);
  pentagone(108, 84, 13); pentagone(20, 100, 13); pentagone(70, 114, 12);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textureFilet() {
  // Grille blanche semi-transparente pour le filet
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,0.75)';
  g.lineWidth = 2;
  for (let i = 0; i <= 64; i += 8) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- Construction des personnages voxel ----------

function bloc(l, h, p, couleur) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(l, h, p),
    new THREE.MeshLambertMaterial({ color: couleur })
  );
  m.castShadow = true;
  return m;
}

// Figurine cubique "grosse tête". Retourne un Group dont l'origine est
// au sol, plus des références vers les membres pour les animations.
export function creerFigurine({ maillot = 0x2255cc, short = 0xffffff, peau = 0xf0c090, cheveux = 0x222222 }) {
  const grp = new THREE.Group();

  const jambeG = bloc(0.16, 0.42, 0.18, 0x333333);
  jambeG.position.set(-0.11, 0.21, 0);
  const jambeD = jambeG.clone();
  jambeD.position.x = 0.11;
  // Pivot des jambes en haut pour l'animation de frappe
  jambeG.geometry = jambeG.geometry.clone();
  jambeG.geometry.translate(0, -0.21, 0); jambeG.position.y = 0.42;
  jambeD.geometry = jambeD.geometry.clone();
  jambeD.geometry.translate(0, -0.21, 0); jambeD.position.y = 0.42;

  const shortM = bloc(0.42, 0.2, 0.26, short);
  shortM.position.y = 0.52;
  const torse = bloc(0.44, 0.42, 0.26, maillot);
  torse.position.y = 0.83;

  const brasG = bloc(0.12, 0.42, 0.14, maillot);
  brasG.geometry.translate(0, -0.17, 0);
  brasG.position.set(-0.3, 1.0, 0);
  const brasD = brasG.clone();
  brasD.position.x = 0.3;

  const tete = bloc(0.4, 0.36, 0.36, peau);
  tete.position.y = 1.28;
  const cheveuxM = bloc(0.42, 0.14, 0.38, cheveux);
  cheveuxM.position.y = 1.46;

  grp.add(jambeG, jambeD, shortM, torse, brasG, brasD, tete, cheveuxM);
  grp.userData = { jambeG, jambeD, brasG, brasD, tete };
  return grp;
}

// ---------- Le monde ----------

export class Monde {
  constructor(conteneur) {
    this.scene = new THREE.Scene();
    this.scene.background = textureCiel();
    this.scene.fog = new THREE.Fog(0xa9cdec, 28, 85);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    conteneur.appendChild(this.renderer.domElement);

    this.tweens = [];        // petites animations temporisées
    this.tempsSecousse = 0;  // secousse d'écran restante (poteau)
    this.horloge = new THREE.Clock();

    this.construireEclairage();
    this.construireTerrain();
    this.construireCage();
    this.construireTribunes();
    this.construireActeurs();
    this.construireFleche();

    this.redimensionner();
    window.addEventListener('resize', () => this.redimensionner());
  }

  construireEclairage() {
    this.scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x3f7a3f, 0.9));
    const soleil = new THREE.DirectionalLight(0xffffff, 1.6);
    soleil.position.set(-8, 18, 10);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(1024, 1024);
    soleil.shadow.camera.left = -15; soleil.shadow.camera.right = 15;
    soleil.shadow.camera.top = 25; soleil.shadow.camera.bottom = -10;
    soleil.shadow.camera.far = 60;
    this.scene.add(soleil);
  }

  construireTerrain() {
    const sol = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshLambertMaterial({ map: texturePelouse() })
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.z = 5;
    sol.receiveShadow = true;
    this.scene.add(sol);

    // Lignes blanches : ligne de but + surface de réparation (simplifiées)
    const matLigne = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ligneBut = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.12), matLigne);
    ligneBut.rotation.x = -Math.PI / 2;
    ligneBut.position.set(0, 0.01, 0);
    this.scene.add(ligneBut);
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 16.5), matLigne);
    surface.rotation.x = -Math.PI / 2;
    for (const cote of [-1, 1]) {
      const l = surface.clone();
      l.position.set(cote * 10, 0.01, 8.25);
      this.scene.add(l);
    }
    const surfaceFace = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.12), matLigne);
    surfaceFace.rotation.x = -Math.PI / 2;
    surfaceFace.position.set(0, 0.01, 16.5);
    this.scene.add(surfaceFace);
  }

  construireCage() {
    const L = CONFIG.butDemiLargeur, H = CONFIG.butHauteur, prof = 1.6;
    const matPoteau = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const geoPoteau = new THREE.CylinderGeometry(CONFIG.rayonPoteau, CONFIG.rayonPoteau, H, 10);
    for (const cote of [-1, 1]) {
      const p = new THREE.Mesh(geoPoteau, matPoteau);
      p.position.set(cote * L, H / 2, 0);
      p.castShadow = true;
      this.scene.add(p);
    }
    const barre = new THREE.Mesh(
      new THREE.CylinderGeometry(CONFIG.rayonPoteau, CONFIG.rayonPoteau, L * 2 + 0.14, 10),
      matPoteau
    );
    barre.rotation.z = Math.PI / 2;
    barre.position.set(0, H, 0);
    barre.castShadow = true;
    this.scene.add(barre);

    // Filet : fond + côtés + toit en grille semi-transparente
    const matFilet = new THREE.MeshBasicMaterial({
      map: textureFilet(), transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    matFilet.map.repeat.set(8, 3);
    const fond = new THREE.Mesh(new THREE.PlaneGeometry(L * 2, H), matFilet);
    fond.position.set(0, H / 2, -prof);
    this.scene.add(fond);
    const matFiletCote = matFilet.clone();
    matFiletCote.map = matFilet.map.clone();
    matFiletCote.map.repeat.set(2, 3);
    for (const cote of [-1, 1]) {
      const flanc = new THREE.Mesh(new THREE.PlaneGeometry(prof, H), matFiletCote);
      flanc.rotation.y = Math.PI / 2;
      flanc.position.set(cote * L, H / 2, -prof / 2);
      this.scene.add(flanc);
    }
    const matFiletToit = matFilet.clone();
    matFiletToit.map = matFilet.map.clone();
    matFiletToit.map.repeat.set(8, 2);
    const toit = new THREE.Mesh(new THREE.PlaneGeometry(L * 2, prof), matFiletToit);
    toit.rotation.x = Math.PI / 2;
    toit.position.set(0, H, -prof / 2);
    this.scene.add(toit);
  }

  construireTribunes() {
    // Gradins : gros blocs gris derrière le but, adoucis par le brouillard
    const matGradin = new THREE.MeshLambertMaterial({ color: 0x8a8f99 });
    for (let etage = 0; etage < 3; etage++) {
      const g = new THREE.Mesh(new THREE.BoxGeometry(58, 3.2, 6), matGradin);
      g.position.set(0, 1.6 + etage * 3.2, -8 - etage * 6);
      this.scene.add(g);
    }
    // Foule : petits cubes colorés instanciés aux couleurs des deux équipes
    const couleurs = [0x2255cc, 0xcc3333, 0xffffff, 0xf0d040, 0x333366, 0x993333];
    const nb = 900;
    const geo = new THREE.BoxGeometry(0.42, 0.5, 0.3);
    const mat = new THREE.MeshLambertMaterial();
    this.foule = new THREE.InstancedMesh(geo, mat, nb);
    const m = new THREE.Matrix4();
    const coul = new THREE.Color();
    for (let i = 0; i < nb; i++) {
      const etage = Math.floor(Math.random() * 3);
      const x = alea(-27, 27);
      const y = 3.2 + etage * 3.2 + alea(-0.1, 0.1);
      const z = -8 - etage * 6 + alea(-2.5, 2.5);
      m.setPosition(x, y, z);
      this.foule.setMatrixAt(i, m);
      this.foule.setColorAt(i, coul.setHex(couleurs[Math.floor(Math.random() * couleurs.length)]));
    }
    this.foule.instanceMatrix.needsUpdate = true;
    this.scene.add(this.foule);

    // Panneaux publicitaires unis derrière la ligne de but
    const pub = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.9, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x2a6fd6 })
    );
    pub.position.set(0, 0.45, -4.5);
    this.scene.add(pub);
  }

  construireActeurs() {
    // Ballon
    this.ballon = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.rayonBallon, 20, 16),
      new THREE.MeshLambertMaterial({ map: textureBallon() })
    );
    this.ballon.castShadow = true;
    this.scene.add(this.ballon);

    // Tireur (maillot bleu, vu de dos)
    this.tireur = creerFigurine({ maillot: 0x2255cc, short: 0xffffff, cheveux: 0x1a1a1a });
    this.scene.add(this.tireur);

    // Gardien (tenue orange pour trancher)
    this.gardien = creerFigurine({ maillot: 0xf07820, short: 0x222222, cheveux: 0x553311 });
    // Bras écartés en position d'attente
    this.gardien.userData.brasG.rotation.z = 0.9;
    this.gardien.userData.brasD.rotation.z = -0.9;
    this.scene.add(this.gardien);

    // Mur : jusqu'à 5 figurines grises réutilisées d'un tir à l'autre
    this.mur = [];
    for (let i = 0; i < 5; i++) {
      const j = creerFigurine({ maillot: 0x7a7a85, short: 0x55555c, cheveux: 0x2b2118 });
      // Bras le long du corps, mains "protégées" (posture de mur)
      j.userData.brasG.rotation.x = -0.5;
      j.userData.brasD.rotation.x = -0.5;
      j.visible = false;
      this.scene.add(j);
      this.mur.push(j);
    }
  }

  construireFleche() {
    // Flèche jaune au sol indiquant la visée pendant le geste
    this.fleche = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe000, transparent: true, opacity: 0.9 });
    const tige = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.6), mat);
    tige.rotation.x = -Math.PI / 2;
    tige.position.set(0, 0.02, -0.8);
    const pointe = new THREE.Mesh(new THREE.CircleGeometry(0.3, 3), mat);
    pointe.rotation.x = -Math.PI / 2;
    pointe.rotation.z = Math.PI; // pointe vers -z
    pointe.position.set(0, 0.02, -1.75);
    this.fleche.add(tige, pointe);
    this.fleche.visible = false;
    this.scene.add(this.fleche);
  }

  // ---------- Mise en place des scénarios ----------

  // Positionne ballon/tireur/gardien/mur pour un coup franc.
  // distance = recul du ballon par rapport à la ligne de but.
  placerCoupFranc(distance = 18, decalageX = 0, nbMur = 4) {
    this.positionBallon = new THREE.Vector3(decalageX, CONFIG.rayonBallon, distance);
    this.ballon.position.copy(this.positionBallon);

    // Tireur légèrement derrière et à côté du ballon
    this.tireur.position.set(decalageX + 0.55, 0, distance + 1.1);
    this.tireur.rotation.y = Math.PI + 0.35; // dos à la caméra, orienté vers la cage
    this.reinitialiserJambes();

    // Gardien au centre, un pas devant sa ligne
    this.gardien.position.set(0, 0, 0.7);
    this.gardien.rotation.set(0, 0, 0);

    // Mur à ~9 m du ballon, centré sur la ligne ballon → centre de la cage
    const zMur = Math.max(distance - 9.15, 3);
    const t = (distance - zMur) / distance; // interpolation vers le but
    const xMur = decalageX * (1 - t);
    for (let i = 0; i < this.mur.length; i++) {
      const j = this.mur[i];
      j.visible = i < nbMur;
      j.position.set(xMur + (i - (nbMur - 1) / 2) * 0.72, 0, zMur);
      j.rotation.y = 0; // face au tireur
    }
    this.zMur = zMur;
    this.nbMur = nbMur;

    this.placerCamera();
  }

  // Penalty : pas de mur, ballon au point de penalty (11 m)
  placerPenalty() {
    this.placerCoupFranc(11, 0, 0);
  }

  placerCamera() {
    const b = this.positionBallon;
    this.camera.position.set(b.x * 0.75, 2.0, b.z + 4.4);
    this.cibleCamera = new THREE.Vector3(b.x * 0.3, 1.2, 0);
    this.camera.lookAt(this.cibleCamera);
    this.fleche.position.set(b.x, 0, b.z);
  }

  reinitialiserJambes() {
    const u = this.tireur.userData;
    u.jambeG.rotation.x = 0;
    u.jambeD.rotation.x = 0;
  }

  // Convertit un point de l'écran (pixels) en cible dans le plan de la
  // cage (z = 0) par lancer de rayon depuis la caméra. C'est le cœur du
  // tir "Score Hero" : le doigt désigne directement un point du but.
  cibleDepuisEcran(xEcran, yEcran) {
    const ndc = new THREE.Vector2(
      (xEcran / window.innerWidth) * 2 - 1,
      -(yEcran / window.innerHeight) * 2 + 1
    );
    const rayon = new THREE.Raycaster();
    rayon.setFromCamera(ndc, this.camera);
    const o = rayon.ray.origin, d = rayon.ray.direction;
    if (d.z >= -0.02) {
      // Le doigt pointe le ciel : tir haut, non cadré, dans la même direction
      return { x: clamp(o.x + d.x * 30, -CONFIG.cibleXMax, CONFIG.cibleXMax), y: CONFIG.cibleYMax + 1 };
    }
    const t = -o.z / d.z; // intersection avec le plan z = 0
    return {
      x: clamp(o.x + d.x * t, -CONFIG.cibleXMax, CONFIG.cibleXMax),
      y: clamp(o.y + d.y * t, 0.15, CONFIG.cibleYMax),
    };
  }

  // ---------- Animations ----------

  // Flèche de visée au sol : pointée du ballon vers la cible visée
  majFleche(cible) {
    if (!cible) { this.fleche.visible = false; return; }
    this.fleche.visible = true;
    const b = this.positionBallon;
    this.fleche.rotation.y = -Math.atan2(cible.x - b.x, b.z);
    this.fleche.scale.set(1, 1, 1.2);
  }

  // Animation de frappe du tireur : élan + balancé de jambe
  animerFrappe() {
    const u = this.tireur.userData;
    this.ajouterTween(0.22, (k) => {
      u.jambeD.rotation.x = -1.6 * Math.sin(k * Math.PI); // armé puis frappe
      u.jambeG.rotation.x = 0.4 * Math.sin(k * Math.PI);
      this.tireur.position.z = this.positionBallon.z + 1.1 - k * 0.55;
    });
  }

  // Saut du mur (déclenché par la séquence de tir)
  sauterMur() {
    for (const j of this.mur) {
      if (!j.visible) continue;
      this.ajouterTween(CONFIG.murDureeSaut, (k) => {
        j.position.y = CONFIG.murHauteurSaut * Math.sin(k * Math.PI);
      });
    }
  }

  // Hauteur actuelle des pieds du mur (pour laisser passer le ballon dessous)
  hauteurPiedsMur() {
    for (const j of this.mur) if (j.visible) return j.position.y;
    return 0;
  }

  secouer() { this.tempsSecousse = 0.35; }

  ajouterTween(duree, maj, fin = null) {
    this.tweens.push({ t: 0, duree, maj, fin });
  }

  // Boucle de rendu : avance les tweens, la secousse, puis dessine.
  // Retourne dt pour la logique de jeu.
  rendre() {
    const dt = Math.min(this.horloge.getDelta(), 0.05);

    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = Math.min(tw.t / tw.duree, 1);
      tw.maj(k);
      if (k >= 1) {
        if (tw.fin) tw.fin();
        this.tweens.splice(i, 1);
      }
    }

    // Secousse d'écran (poteau) : bruit décroissant sur la caméra
    if (this.tempsSecousse > 0) {
      this.tempsSecousse -= dt;
      const a = this.tempsSecousse * 0.25;
      this.camera.position.x += (Math.random() - 0.5) * a;
      this.camera.position.y += (Math.random() - 0.5) * a;
      this.camera.lookAt(this.cibleCamera);
    }

    this.renderer.render(this.scene, this.camera);
    return dt;
  }

  redimensionner() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    // Sur écran très étroit (portrait), on élargit le champ vertical
    this.camera.fov = h > w ? 62 : 50;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // Capture d'écran (bouton appareil photo)
  photo() {
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'free-kick-champions.png';
    a.click();
  }
}
