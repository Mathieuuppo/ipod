# ⚽ Free Kick Champions

Jeu de football mobile en HTML5 / Three.js, style low-poly « voxel » :
coups francs, penaltys et matchs accélérés, jouables au doigt dans un
navigateur mobile (portrait).

## Lancer le jeu

Le jeu utilise des modules ES : il faut le servir en HTTP (pas en `file://`).

```bash
# au choix :
npx serve .
# ou
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` — idéalement sur un téléphone du même
réseau, ou dans les outils de développement du navigateur en mode mobile.

Aucune étape de build, aucune dépendance réseau : Three.js est embarqué
dans `assets/vendor/`.

## Modes de jeu

- **🎯 Coup Franc** — 5 tirs depuis des positions variées, avec mur qui
  saute et gardien qui plonge. Étoiles selon le nombre de buts.
- **🥅 Penalty** — séance de tirs au but contre l'IA : 5 tirs chacun,
  puis mort subite.
- **🏆 Match** — 90 minutes accélérées : une succession d'occasions
  (coup franc, penalty ou mini-jeu de timing) pendant que l'IA marque
  selon la difficulté.
- **🎮 Match Arcade** — un vrai match jouable vu d'en haut (façon FIFA
  rétro) : joystick virtuel pour courir et dribbler, boutons PASSE / TIR
  en attaque, JOUEUR / TACLE en défense. 5 joueurs + gardien par équipe,
  IA de position pour les coéquipiers et les adversaires.

Trois difficultés (facile / moyen / difficile) qui règlent la lecture du
tir par le gardien, sa vitesse de réaction et le timing du mur.

## Contrôles (tir façon Score Hero)

- **Trace la trajectoire du tir avec le doigt** : une ligne pointillée
  s'affiche pendant le geste.
  - Le **point d'arrivée** du tracé est la cible visée (le ballon y termine) ;
  - la **longueur** du tracé donne la puissance ;
  - la **courbure** de la ligne donne l'effet : une ligne bombée fait un tir
    enroulé qui contourne le mur avant de revenir sur la cible.
- Mini-jeu de timing (mode match) : taper quand le curseur est dans la
  zone verte.
- Mode arcade : joystick virtuel en bas à gauche (pousser vers le haut =
  attaquer), boutons d'action en bas à droite. En possession du ballon la
  direction du joystick oriente aussi les passes et la visée du tir.
- Bouton 📷 : capture d'écran. Bouton ✕ : retour au menu.

## Architecture

```
index.html            Point d'entrée, surcouche UI (DOM), importmap
style.css             Styles des menus / HUD / messages cartoon
assets/vendor/        three.module.js embarqué (r160)
src/
  main.js             Bootstrap, navigation, boucle de jeu
  config.js           Constantes physiques + réglages de difficulté
  world.js            Scène 3D : stade complet (tribunes, toit, projecteurs),
                      terrain entier à deux cages, figurines voxel, ballon
  shot.js             Physique du ballon (gravité + Magnus) et résolution d'un tir
  keeper.js           IA + animation du gardien
  input.js            Analyse du swipe tactile (direction / puissance / effet)
  ui.js               Écrans, HUD, confettis, mini-jeu de timing
  audio.js            Sons synthétisés (Web Audio, aucun fichier audio)
  storage.js          Sauvegarde localStorage (buts, série, étoiles)
  modes/
    freekick.js       Mode Coup Franc
    penalty.js        Mode Penalty (séance de tirs au but)
    match.js          Mode Match (90' accélérées)
    arcade.js         Mode Match Arcade (vue FIFA : joystick, passes, tacles)
```

Les personnages sont des assemblages de cubes construits par
`creerFigurine()` dans `src/world.js` : pour améliorer les graphismes plus
tard, il suffit de remplacer cette fonction (par un chargement glTF par
exemple) sans toucher à la logique de jeu.
