# ⚽ LUCARNE — Free Kick Champions

Jeu de football mobile complet en HTML5 / Three.js, style low-poly
« voxel », identité « soirée de match » (bleu nuit / or champion) :
coups francs façon Score Hero, penaltys, matchs 11 contre 11 vus d'en
haut, coupe à élimination directe, 12 clubs fictifs avec effectifs et
tactiques — le tout jouable au doigt dans un navigateur mobile.

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
  rétro) en 11 contre 11 (4-4-2 + gardien) : joystick virtuel pour courir
  et dribbler, boutons PASSE / TIR en attaque, JOUEUR / TACLE en défense.
  Les passes sont téléguidées : le receveur est désigné, vient au-devant
  du ballon et le contrôle directement. Pressing à deux, relances des
  gardiens ciblées, changement automatique de joueur à la perte du ballon.

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

### Jouer au clavier

Tout le jeu est aussi jouable sans écran tactile :

- **Tir tracé** (coup franc, penalty, occasions, tirs au but) : flèches ou
  **WASD** pour déplacer le point de visée (Haut = puissance, Gauche/Droite
  = viser — inverser de sens en cours de charge courbe le tir), **Espace**
  ou **Entrée** pour tirer/valider.
- **Match Arcade** : flèches ou **WASD** pour courir, **Espace**/**Entrée**
  pour TIR (ou TACLE en défense), **Maj** ou **E** pour PASSE (ou changer
  de joueur en défense). Un déplacement au clavier suit exactement les
  mêmes règles qu'au joystick (passe en profondeur en poussant "Haut" fort
  avant d'appuyer sur PASSE, etc.).

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

## L'application autour du jeu

- **Sélection d'équipe** : 12 clubs fictifs (blasons générés, note en
  étoiles), choix séparé de son club et de l'adversaire, personnalisation
  du capitaine (nom + numéro floqué dans le dos du tireur).
- **Composition & tactique** : effectif de 16 joueurs générés avec stats
  (vitesse / tir / passe / défense), choix de formation (4-4-2, 4-3-3,
  3-5-2) et réglages bloc / pressing / style — tout est réellement branché
  sur le moteur d'IA du mode arcade.
- **Coupe Lucarne** : tournoi à élimination directe contre 7 clubs
  (quarts → finale) avec bracket visuel et résultats simulés.
- **Statistiques** : buts, séries, matchs, réussite penalty, coupes.
- **Réglages** : sons, musique de menu, vibrations, vitesse de jeu,
  réinitialisation de la progression.
- **Replay de but** : les dernières secondes avant chaque but du mode
  arcade sont rejouées au ralenti avec une caméra rapprochée.
- **Stats de match** : possession, tirs et tirs cadrés sur l'écran de
  fin de match.
