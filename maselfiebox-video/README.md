# Ma Selfie Box — publicité motion design (50 s)

Projet **Remotion** (React + TypeScript + Three.js / React Three Fiber).
Format **1920 × 1080, 16:9, 60 i/s, 50,000 s exactement (3000 images)**, export **MP4 H.264 + AAC**.

- Vidéo finale : `out/maselfiebox-pub-50s-1080p60.mp4`
- Musique et bruitages : **originaux**, synthétisés par `audio-src/generate_audio.py`, donc libres de droits.
- Aucune voix off : la narration passe uniquement par les textes, la musique, les animations et les bruitages.

## Lancer le projet

```bash
npm install
```

```bash
npm run studio
```

Le Studio permet de prévisualiser la vidéo et de naviguer image par image.

```bash
npm run audio
```

Cette commande régénère la musique et les effets sonores dans `public/audio/`.

```bash
npm run render
```

Cette commande produit `out/maselfiebox-pub-50s-raw.mp4`. On applique ensuite un limiteur audio de sécurité :

```bash
ffmpeg -y -i out/maselfiebox-pub-50s-raw.mp4 -c:v copy -af "alimiter=limit=0.89:level=disabled" -c:a aac -b:a 320k out/maselfiebox-pub-50s-1080p60.mp4
```

Pour contrôler une image précise :

```bash
node tools/stills.mjs 720 1260 2880
```

Les images sont écrites dans `out/stills/`.

## Structure

| Fichier | Rôle |
|---|---|
| `src/theme.ts` | Couleurs de marque, polices, **minutage des scènes**, données réelles (prix, options, étapes) |
| `src/MaSelfieBoxAd.tsx` | Composition principale : scènes, musique, bruitages, grain, vignettage |
| `src/scenes/S1Intro.tsx` … `S8Outro.tsx` | Les 8 séquences du storyboard |
| `src/components/` | Typographie cinétique, titres d'étape, curseur, navigateur, logo, cartes, calendrier, effets 3D |
| `src/sfx.tsx` | **Feuille de bruitages** calée à l'image (image globale, volume) |
| `src/lib/anim.ts` | Courbes d'animation, ressorts, interpolations |
| `src/logoPaths.json` | Logo officiel vectorisé lettre par lettre (généré par `tools/trace_logo.py`) |
| `public/` | Médias : captures, visuels produits, photos, audio |

Minutage (60 i/s, 1 temps musical = 30 images) :

| Séquence | Images | Temps |
|---|---|---|
| 01 Intro cinématique | 0–239 | 00:00–00:04 |
| 02 Plateforme de réservation | 240–479 | 00:04–00:08 |
| 03 Étape 1 : la date | 480–899 | 00:08–00:15 |
| 04 Étape 2 : la formule | 900–1439 | 00:15–00:24 |
| 05 Étape 3 : les options | 1440–1919 | 00:24–00:32 |
| 06 Étape 4 : la réservation | 1920–2399 | 00:32–00:40 |
| 07 La promesse | 2400–2759 | 00:40–00:46 |
| 08 Outro / appel à l'action | 2760–2999 | 00:46–00:50 |

## Modifier…

**Les textes.** Les titres sont écrits directement dans chaque scène (`<StepTitle num="01" lines={[…]} />`, `<KineticText text="…" />`). Les prix, options et étapes du parcours sont dans `DATA` (`src/theme.ts`). Si un texte s'allonge, vérifier qu'il reste dans la zone de sécurité (marge de 120 px) avec `tools/stills.mjs`.

**Les captures d'écran.** Elles se trouvent dans `public/screens/`. Elles ont été faites en 1440 × 900 (CSS) à 2× :

- `site-accueil.png` : page d'accueil de la réservation ;
- `site-accueil-long.jpg` : la même page, plus longue, pour les éléments flottants ;
- `tunnel-1-date.png` : étape 1 « Votre date » ;
- `tunnel-2-formule.png` : étape 2 « Votre formule » ;
- `tunnel-3-coordonnees.png` : étape 3 « Vos coordonnées », formulaire vide.

Pour une nouvelle capture, garder le même nom et la même taille. Si la mise en page du site change, mettre à jour les coordonnées des découpes : `CTA` dans `S2Platform.tsx`, `CROP` dans `S3Date.tsx`.

**Les visuels et photos.** Ils sont rangés dans `public/products/`, `public/options/` et `public/photos/`. On peut remplacer un fichier en gardant son nom.

**Le logo.** Le fichier source est `public/brand/logo-maselfiebox-original.png`. Avec un logo vectoriel officiel (SVG ou PNG haute définition), relancer la vectorisation (potrace requis) :

```bash
python3 tools/trace_logo.py nouveau-logo.png src/logoPaths.json
```

**Les sons.** Les volumes et positions sont dans `src/sfx.tsx`, le volume de la musique dans `MaSelfieBoxAd.tsx` (`volume={0.6}`). Pour utiliser votre propre musique, remplacer `public/audio/music-maselfiebox-120bpm.wav` par un fichier de 50 s. Les animations sont calées sur 120 BPM.

**Déclinaison verticale.** Les scènes sont positionnées à partir des constantes de `src/theme.ts` (`W`, `H`, rectangles partagés `R`) et de quelques coordonnées locales. Pour une version 1080 × 1920, ajouter une `<Composition>` dans `src/Root.tsx`, puis adapter `R` et les positions des titres. Cette version n'est pas encore réalisée.

## Sources vérifiées (relevé du 10/11/2026)

Tout ce qui est affiché provient de **maselfiebox.fr** et **reservation.maselfiebox.fr** :

- **Couleurs** (`boutique.css`) : turquoise `#10DCCB`, turquoise foncé `#1C9A8F`, noir `#000`, texte `#171616`. La police du texte du site est Poppins.
- **Logo** : PNG officiel du site (351 × 101 px), vectorisé fidèlement, sans redessin. Les variantes couleur (blanc sur noir, noir sur turquoise) sont des déclinaisons monochromes du même tracé.
- **Parcours réel** en 4 étapes : *Votre date → Votre formule → Vos coordonnées → Paiement*. Les options se choisissent à l'étape 2.
- **Formules** : 100 / 200 / 300 / 400 impressions, « dès » 240 / 280 / 320 / 360 € TTC (journée).
- **Options montrées** :
  - Livre d'or audio, 89 € TTC ;
  - Coffre de déguisement, 40 € TTC ;
  - Option brunch, 50 € TTC (« Prolonge une location en soirée jusqu'à 16 h le lendemain »).
- **Exemple chiffré**, obtenu en sélectionnant réellement les éléments sur le site, sans valider de commande : 200 impressions en soirée (325 €) + Livre d'or audio (89 €), avec la remise affichée par le site « Livre d'or avec photobooth : −20 € déjà déduits », soit **394 € TTC (328,33 € HT), hors livraison**.
- **Acompte** : 30 % du montant TTC, débité à la commande en ligne (conditions générales de location, art. 4), soit 118,20 € sur l'exemple. Le solde est dû au plus tard 72 h avant la prestation.
- **Cadre photo personnalisé** : préparé avant l'événement et validé depuis l'espace client (texte du site). Le visuel montré est un vrai cadre publié sur maselfiebox.fr.

## Ce qui est une illustration (et affiché comme tel)

- **La date sélectionnée** est marquée « Date d'exemple » dans un mois non nommé. Elle n'est jamais présentée comme disponible.
- **L'étape « Paiement »** n'a pas été ouverte : il aurait fallu saisir des coordonnées réelles. Le panneau d'acompte est une illustration fondée sur les conditions générales, avec la mention « ILLUSTRATION ». L'écran final porte la mention « Illustration du parcours — aucune réservation réelle ».
- **Le calendrier, les cartes et le récapitulatif animés** sont des reconstitutions fidèles (mêmes libellés et mêmes styles) des écrans réels. Les vraies captures apparaissent dans les séquences 02, 03 et 06.
- **Aucune commande, aucun paiement et aucune saisie de données personnelles** n'ont été effectués.

## Ressources qui amélioreraient encore le rendu

- Le logo en **SVG officiel** : la version actuelle est vectorisée depuis un PNG de 351 px, propre mais moins nette qu'un fichier source.
- Une **capture de l'étape « Paiement »**, à faire par vos soins, pour remplacer l'illustration.
- Des **photos d'événements** dont vous confirmez qu'il s'agit de vraies prises de vue. Certains fichiers du site portent des noms qui suggèrent une retouche ou une génération par IA, je ne les ai pas utilisés comme « photos réelles ». La photo retenue (`borne-terrasse-mer.jpg`) est à valider de votre côté.
- **L'accord des clients** visibles sur le tirage « 60 ans Valérie », déjà publié sur maselfiebox.fr, pour une diffusion publicitaire.
