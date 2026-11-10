import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

/**
 * Feuille de bruitages, calée à l'image (60 i/s, images GLOBALES).
 * Tous les fichiers sont générés par audio-src/generate_audio.py (originaux).
 * Pour décaler un son : modifier `at`. Pour le baisser : modifier `vol`.
 */
type Cue = {at: number; sfx: string; vol: number; note?: string};

export const CUES: Cue[] = [
  // 01 Intro
  {at: 5, sfx: 'whoosh-fast', vol: 0.45, note: 'trait turquoise'},
  {at: 14, sfx: 'impact-soft', vol: 0.55, note: 'impact du trait'},
  {at: 18, sfx: 'texture-digital', vol: 0.22, note: 'formes qui se rejoignent'},
  {at: 96, sfx: 'whoosh-camera', vol: 0.7, note: 'coup de fouet caméra'},
  {at: 162, sfx: 'swish', vol: 0.4, note: 'compression du texte'},
  {at: 176, sfx: 'whoosh-fast', vol: 0.35},
  {at: 182, sfx: 'pop-high', vol: 0.18},
  {at: 188, sfx: 'pop-high', vol: 0.16},
  {at: 194, sfx: 'pop', vol: 0.2},
  {at: 210, sfx: 'impact-soft', vol: 0.6, note: 'verrouillage du logo'},
  // 02 Plateforme
  {at: 248, sfx: 'swish', vol: 0.4, note: 'logo -> navigateur'},
  {at: 256, sfx: 'whoosh-long', vol: 0.4},
  {at: 280, sfx: 'texture-digital', vol: 0.2, note: 'affichage de la capture'},
  {at: 310, sfx: 'pop', vol: 0.22},
  {at: 319, sfx: 'pop', vol: 0.18},
  {at: 328, sfx: 'pop-high', vol: 0.16},
  {at: 337, sfx: 'pop', vol: 0.16},
  {at: 404, sfx: 'whoosh-fast', vol: 0.3, note: 'sortie du texte'},
  {at: 450, sfx: 'click', vol: 0.85, note: 'clic « Vérifier ma date »'},
  {at: 446, sfx: 'whoosh-camera', vol: 0.65, note: 'plongée'},
  {at: 470, sfx: 'low-transition', vol: 0.45},
  // 03 Date
  {at: 482, sfx: 'swish', vol: 0.35, note: 'ouverture iris'},
  {at: 504, sfx: 'whoosh-long', vol: 0.45, note: 'le calendrier se détache'},
  {at: 544, sfx: 'swish', vol: 0.4, note: 'retournement'},
  {at: 596, sfx: 'ticks', vol: 0.3, note: 'cascade des jours'},
  {at: 626, sfx: 'ticks', vol: 0.22},
  {at: 698, sfx: 'tick', vol: 0.3, note: 'survol'},
  {at: 720, sfx: 'click', vol: 0.85, note: 'clic date'},
  {at: 722, sfx: 'select', vol: 0.55},
  {at: 742, sfx: 'pop', vol: 0.25, note: 'étiquette Date d’exemple'},
  {at: 742, sfx: 'swish', vol: 0.22},
  {at: 832, sfx: 'whoosh-fast', vol: 0.35, note: 'repli'},
  {at: 866, sfx: 'low-transition', vol: 0.35},
  // 04 Formule
  {at: 900, sfx: 'swish', vol: 0.38, note: 'retournement carte'},
  {at: 930, sfx: 'whoosh-fast', vol: 0.5, note: 'carte 100'},
  {at: 958, sfx: 'whoosh-fast', vol: 0.3, note: 'carte 300'},
  {at: 966, sfx: 'impact-soft', vol: 0.3, note: 'rebond carte 300'},
  {at: 976, sfx: 'whoosh-long', vol: 0.4, note: 'carte 400 (profondeur)'},
  {at: 1058, sfx: 'whoosh-camera', vol: 0.4, note: 'repositionnement'},
  {at: 1182, sfx: 'tick', vol: 0.28, note: 'survol 400'},
  {at: 1228, sfx: 'tick', vol: 0.28, note: 'survol 200'},
  {at: 1260, sfx: 'click', vol: 0.85, note: 'clic formule'},
  {at: 1262, sfx: 'select', vol: 0.55},
  {at: 1284, sfx: 'whoosh-long', vol: 0.45, note: 'mise au premier plan'},
  // 05 Options
  {at: 1440, sfx: 'whoosh-camera', vol: 0.45, note: 'carte -> panneau'},
  {at: 1494, sfx: 'pop', vol: 0.25},
  {at: 1504, sfx: 'pop', vol: 0.22},
  {at: 1514, sfx: 'pop-high', vol: 0.2},
  {at: 1572, sfx: 'tick', vol: 0.28},
  {at: 1590, sfx: 'click', vol: 0.85, note: 'case Livre d’or audio'},
  {at: 1592, sfx: 'select', vol: 0.55},
  {at: 1594, sfx: 'ticks', vol: 0.3, note: 'compteur de prix'},
  {at: 1630, sfx: 'tick', vol: 0.25, note: 'survol coffre'},
  {at: 1692, sfx: 'whoosh-camera', vol: 0.45, note: 'le panneau recule'},
  {at: 1704, sfx: 'whoosh-long', vol: 0.45, note: 'arrivée du cadre'},
  {at: 1738, sfx: 'impact-soft', vol: 0.3},
  {at: 1846, sfx: 'whoosh-fast', vol: 0.45, note: 'sortie du cadre'},
  // 06 Réservation
  {at: 1920, sfx: 'whoosh-camera', vol: 0.45, note: 'panneau -> récapitulatif'},
  {at: 1966, sfx: 'tick', vol: 0.3},
  {at: 1978, sfx: 'tick', vol: 0.28},
  {at: 1990, sfx: 'tick', vol: 0.28},
  {at: 2002, sfx: 'tick', vol: 0.28},
  {at: 2016, sfx: 'ticks', vol: 0.25, note: 'total'},
  {at: 2030, sfx: 'whoosh-long', vol: 0.35, note: 'étape coordonnées'},
  {at: 2116, sfx: 'pop', vol: 0.3, note: 'étape 3 validée'},
  {at: 2116, sfx: 'whoosh-camera', vol: 0.5, note: 'zoom vers le paiement'},
  {at: 2146, sfx: 'ticks', vol: 0.25, note: 'montant'},
  {at: 2250, sfx: 'click', vol: 0.9, note: 'clic acompte'},
  {at: 2254, sfx: 'texture-digital', vol: 0.2, note: 'traitement'},
  {at: 2280, sfx: 'success', vol: 0.6, note: 'validation'},
  // 07 Promesse
  {at: 2400, sfx: 'low-transition', vol: 0.5, note: 'désassemblage'},
  {at: 2400, sfx: 'whoosh-long', vol: 0.55},
  {at: 2546, sfx: 'whoosh-fast', vol: 0.25},
  {at: 2550, sfx: 'shutter', vol: 0.85, note: 'obturateur'},
  {at: 2582, sfx: 'printer', vol: 0.5, note: 'impression du tirage'},
  {at: 2688, sfx: 'whoosh-long', vol: 0.6, note: 'volet turquoise'},
  // 08 Outro
  {at: 2790, sfx: 'whoosh-fast', vol: 0.3, note: 'assemblage logo'},
  {at: 2800, sfx: 'pop-high', vol: 0.15},
  {at: 2808, sfx: 'pop', vol: 0.18},
  {at: 2818, sfx: 'pop', vol: 0.18},
  {at: 2820, sfx: 'swish', vol: 0.3, note: 'URL'},
  {at: 2880, sfx: 'impact-big', vol: 0.55, note: 'impact final (48,0 s)'},
];

export const SfxTrack: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={i} from={c.at} durationInFrames={200} name={`sfx ${c.sfx}`}>
        <Audio src={staticFile(`audio/sfx/${c.sfx}.wav`)} volume={c.vol} />
      </Sequence>
    ))}
  </>
);
