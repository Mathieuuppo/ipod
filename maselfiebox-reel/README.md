# Ma Selfie Box — Reel « Comment ça marche ? » (65 s, 9:16)

Nouvelle vidéo verticale qui présente **tout le service**, de la réservation en ligne jusqu'à l'envoi des photos numériques.

Le projet est réalisé avec Remotion (React, TypeScript, CSS 3D, Three.js / React Three Fiber).

- **Format** : 1080 × 1920, 60 i/s, **65,000 s (3900 images)**, MP4 H.264 + AAC.
- **Fichier final** : `out/maselfiebox-reel-65s-1080x1920.mp4`.
- **Direction artistique** : claire. Fond blanc cassé, textes anthracite, turquoise `#10DCCB` de la marque, Poppins.
- **Bande-son** : musique et bruitages **originaux**, synthétisés par `audio-src/generate_audio.py` (libres de droits). Aucune voix off.

## Commandes

```bash
npm install
```

```bash
npm run studio
```

```bash
npm run audio
```

```bash
npm run render
```

Ensuite, appliquer le limiteur audio de sécurité :

```bash
ffmpeg -y -i out/maselfiebox-reel-raw.mp4 -c:v copy -af "volume=-1dB,alimiter=limit=0.79:level=disabled,atrim=0:65" -c:a aac -b:a 320k -movflags +faststart out/maselfiebox-reel-65s-1080x1920.mp4
```

Pour contrôler des images (planche-contact) :

```bash
tools/sheet.sh planche.jpg 300 780 1140
```

## Structure et minutage

Les durées se règlent dans `src/theme.ts` (`T`).

| Scène | Fichier | Images | Temps |
|---|---|---|---|
| Comment ça marche ? | `S1Intro.tsx` | 0–299 | 0:00–0:05 |
| 01 Vous réservez | `S2Reservation.tsx` | 300–779 | 0:05–0:13 |
| 02 Acompte 30 % | `S3Acompte.tsx` | 780–1139 | 0:13–0:19 |
| 03 Un cadre à votre image | `S4Cadre.tsx` | 1140–1619 | 0:19–0:27 |
| 04 On prépare tout | `S5Prepa.tsx` | 1620–1979 | 0:27–0:33 |
| 05 On vous livre | `S6Livraison.tsx` | 1980–2429 | 0:33–0:40,5 |
| 06 À vous de jouer ! | `S7Souvenirs.tsx` | 2430–2999 | 0:40,5–0:50 |
| 07 On s'occupe de la suite | `S8Reprise.tsx` | 3000–3359 | 0:50–0:56 |
| Et vos photos ? | `S9Numerique.tsx` | 3360–3659 | 0:56–1:01 |
| Outro | `S10Outro.tsx` | 3660–3899 | 1:01–1:05 |

- **Textes** : directement dans chaque scène (`StepTitle`, `Headline`, `KineticText`).
- **Bruitages** : `src/sfx.tsx`, avec une ligne par son (scène, image locale, fichier, volume).
- **Médias** : rangés dans `public/` (`screens/`, `products/`, `options/`, `photos/`, `frames/`, `gallery/`, `brand/`). On remplace un fichier en gardant son nom.
- **Zones de sécurité Instagram** : constante `SAFE` dans `theme.ts`. Le texte essentiel reste entre y = 250 et y = 1480.

## Ce qui provient des sites (vérifié le 10/11/2026)

- **Captures mobiles** de reservation.maselfiebox.fr : accueil, page « Votre date ». Aucune coordonnée saisie, aucun paiement.
- **Logo officiel** vectorisé depuis le PNG du site.
- **Visuels** :
  - la tête de borne avec LED latérale turquoise (`brand/borne-tete-led.webp`) ;
  - les visuels des formules 100 / 200 / 300 / 400 et les prix « dès » ;
  - les options Livre d'or audio et Coffre de déguisement ;
  - les gabarits de cadres (dont la bandelette 5 × 15, 3 photos) ;
  - de vrais cadres et tirages publiés sur maselfiebox.fr.
- **Faits du parcours** :
  - acompte de **30 % du montant TTC**, débité à la réservation en ligne (CGL, art. 4) ;
  - cadre **préparé par Ma Selfie Box** à partir de vos éléments, puis validé par vous depuis l'espace client (CGL, art. 9) ;
  - borne **livrée montée et testée**, bobine chargée et cadre en place ;
  - installation d'**environ 15 minutes**, avec test et explication sur place (FAQ du site, CGL, art. 6) ;
  - **reprise** après l'événement, dans la fenêtre convenue (CGL, art. 6) ;
  - **photos numériques illimitées**, remises après l'événement dans une **galerie en ligne privée** (CGL, art. 9) ;
  - impressions selon la formule choisie.
- **Communes** sur la carte de livraison : Beaucaire (siège), Nîmes, Uzès, Saint-Gilles, Arles. Elles sont placées selon leurs vraies coordonnées.

## Choix faits pour rester exact

- **Reprise** : le storyboard proposait « LE LENDEMAIN ». Le site dit seulement que la borne est reprise **après la fête**, et les CGL indiquent que la fenêtre de reprise est fixée avec le client. La vidéo affiche donc « APRÈS LA FÊTE » et « Selon la fenêtre de reprise convenue avec vous ».
- **Livraison** : elle n'est offerte que sur les communes de la CC Beaucaire Terre d'Argence. La vidéo dit donc « Livrée et installée par notre équipe », et non « livraison incluse ».
- **Solde** : rien n'est affirmé sur le paiement des 70 % restants.

## Éléments présentés comme illustration ou exemple

- **Date** : la date choisie porte la mention « Date d'exemple ».
- **Bouton « ENVOYER MA DEMANDE »** : c'est une illustration, ce libellé n'existe pas sur le site. La carte « Votre demande » porte la mention « ILLUSTRATION ».
- **Carte bancaire et anneau 30 %** : illustration sobre, sans marque ni numéro.
- **Formulaire du cadre** : données fictives (« Léa & Hugo », 12.06.2027), étiquetées « Exemple ». La bandelette obtenue est un exemple construit sur le vrai gabarit 5 × 15.
- **Compteur de tirages** : « ex. 200 impressions ».
- **Smartphone et notification** : illustration de la remise de la galerie, sans délai annoncé.

## À valider par Ma Selfie Box

- **Photos de la borne** :
  - `photos/borne-terrasse-mer.jpg` (scène 06) ;
  - `photos/borne-terrasse-mariage.jpg` (scène 05).

  Confirmez qu'il s'agit de vraies prises de vue. Certains fichiers du site portent des noms de retouche IA.
- **Droit à l'image** : les tirages et bandelettes montrent de vrais invités (images déjà publiées sur maselfiebox.fr). Vérifiez l'accord pour une diffusion publicitaire, ou remplacez-les.
- **Logo** : un SVG officiel améliorerait encore la netteté (`tools/trace_logo.py`).
