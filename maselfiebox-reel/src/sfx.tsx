import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {T} from './theme';

/**
 * Feuille de bruitages calée à l'image. `at` = image LOCALE de la scène,
 * convertie en image globale. Pour décaler un son : modifier `at` ;
 * pour le baisser : `vol`.
 */
type Cue = [scene: keyof typeof T, at: number, sfx: string, vol: number];

export const CUES: Cue[] = [
  // Intro
  ['intro', 2, 'whoosh-fast', 0.5],
  ['intro', 14, 'impact-soft', 0.4],
  ['intro', 16, 'texture-digital', 0.18],
  ['intro', 30, 'whoosh-long', 0.35],
  ['intro', 126, 'swish', 0.35],
  ['intro', 140, 'card-flip', 0.3],
  ['intro', 150, 'card-flip', 0.25],
  ['intro', 186, 'whoosh-fast', 0.3],
  ['intro', 194, 'pop-high', 0.15],
  ['intro', 204, 'pop', 0.18],
  ['intro', 236, 'impact-soft', 0.55],
  ['intro', 252, 'whoosh-camera', 0.5],
  // 01 Réservation
  ['resa', 6, 'swish', 0.3],
  ['resa', 26, 'whoosh-fast', 0.35],
  ['resa', 64, 'whoosh-long', 0.4],
  ['resa', 84, 'card-flip', 0.45],
  ['resa', 112, 'ticks', 0.28],
  ['resa', 176, 'click', 0.8],
  ['resa', 178, 'select', 0.5],
  ['resa', 212, 'whoosh-fast', 0.45],
  ['resa', 222, 'card-flip', 0.35],
  ['resa', 236, 'impact-soft', 0.25],
  ['resa', 238, 'whoosh-long', 0.3],
  ['resa', 288, 'click', 0.8],
  ['resa', 290, 'select', 0.5],
  ['resa', 300, 'whoosh-fast', 0.35],
  ['resa', 322, 'pop', 0.25],
  ['resa', 330, 'pop', 0.2],
  ['resa', 356, 'click', 0.8],
  ['resa', 358, 'pop-high', 0.3],
  ['resa', 386, 'swish', 0.35],
  ['resa', 424, 'click', 0.9],
  ['resa', 430, 'texture-digital', 0.2],
  ['resa', 452, 'success', 0.45],
  ['resa', 450, 'whoosh-camera', 0.35],
  // 02 Acompte
  ['acompte', 2, 'low-transition', 0.4],
  ['acompte', 10, 'card-flip', 0.35],
  ['acompte', 18, 'card-flip', 0.3],
  ['acompte', 60, 'impact-big', 0.55],
  ['acompte', 86, 'whoosh-fast', 0.3],
  ['acompte', 130, 'whoosh-long', 0.35],
  ['acompte', 178, 'swish', 0.35],
  ['acompte', 200, 'ticks', 0.3],
  ['acompte', 226, 'ticks', 0.25],
  ['acompte', 256, 'success', 0.5],
  ['acompte', 304, 'whoosh-camera', 0.45],
  // 03 Cadre
  ['cadre', 4, 'swish', 0.3],
  ['cadre', 58, 'whoosh-fast', 0.3],
  ['cadre', 84, 'ticks', 0.3],
  ['cadre', 104, 'ticks', 0.3],
  ['cadre', 126, 'ticks', 0.3],
  ['cadre', 148, 'pop', 0.2],
  ['cadre', 153, 'pop', 0.2],
  ['cadre', 158, 'pop-high', 0.2],
  ['cadre', 168, 'pop', 0.2],
  ['cadre', 214, 'whoosh-fast', 0.3],
  ['cadre', 226, 'swish', 0.3],
  ['cadre', 238, 'swish', 0.28],
  ['cadre', 250, 'pop', 0.25],
  ['cadre', 262, 'whoosh-camera', 0.4],
  ['cadre', 300, 'impact-soft', 0.3],
  ['cadre', 336, 'card-flip', 0.3],
  ['cadre', 344, 'card-flip', 0.25],
  ['cadre', 352, 'card-flip', 0.22],
  ['cadre', 440, 'whoosh-fast', 0.4],
  // 04 Préparation
  ['prepa', 2, 'card-flip', 0.4],
  ['prepa', 6, 'whoosh-long', 0.35],
  ['prepa', 52, 'pop', 0.3],
  ['prepa', 82, 'pop', 0.3],
  ['prepa', 112, 'pop', 0.3],
  ['prepa', 130, 'ticks', 0.3],
  ['prepa', 160, 'ticks', 0.3],
  ['prepa', 200, 'powerup', 0.4],
  ['prepa', 222, 'select', 0.4],
  ['prepa', 234, 'select', 0.4],
  ['prepa', 246, 'select', 0.4],
  ['prepa', 270, 'success', 0.5],
  ['prepa', 316, 'whoosh-camera', 0.5],
  // 05 Livraison
  ['livraison', 6, 'swish', 0.3],
  ['livraison', 40, 'delivery', 0.55],
  ['livraison', 96, 'delivery', 0.45],
  ['livraison', 142, 'pop', 0.35],
  ['livraison', 150, 'whoosh-long', 0.4],
  ['livraison', 196, 'impact-soft', 0.3],
  ['livraison', 210, 'ticks', 0.25],
  ['livraison', 276, 'texture-digital', 0.25],
  ['livraison', 292, 'select', 0.35],
  ['livraison', 306, 'select', 0.35],
  ['livraison', 348, 'click', 0.8],
  ['livraison', 352, 'pop-high', 0.25],
  ['livraison', 404, 'success', 0.45],
  // 06 Souvenirs
  ['souvenirs', 0, 'shutter', 0.7],
  ['souvenirs', 30, 'beep', 0.5],
  ['souvenirs', 60, 'beep', 0.5],
  ['souvenirs', 90, 'beep', 0.5],
  ['souvenirs', 120, 'shutter', 0.85],
  ['souvenirs', 134, 'whoosh-fast', 0.35],
  ['souvenirs', 150, 'pop', 0.4],
  ['souvenirs', 180, 'pop', 0.4],
  ['souvenirs', 210, 'pop', 0.4],
  ['souvenirs', 228, 'printer', 0.5],
  ['souvenirs', 330, 'whoosh-long', 0.4],
  ['souvenirs', 448, 'swish', 0.35],
  ['souvenirs', 470, 'pop-high', 0.2],
  ['souvenirs', 532, 'whoosh-camera', 0.45],
  // 07 Reprise
  ['reprise', 4, 'swish', 0.35],
  ['reprise', 22, 'pop', 0.3],
  ['reprise', 92, 'card-flip', 0.55],
  ['reprise', 150, 'whoosh-fast', 0.3],
  ['reprise', 168, 'delivery', 0.4],
  ['reprise', 244, 'whoosh-camera', 0.55],
  ['reprise', 304, 'card-flip', 0.3],
  ['reprise', 316, 'card-flip', 0.25],
  // Photos numériques
  ['numerique', 0, 'card-flip', 0.35],
  ['numerique', 10, 'card-flip', 0.25],
  ['numerique', 62, 'whoosh-long', 0.4],
  ['numerique', 186, 'notification', 0.6],
  // Outro
  ['outro', 4, 'whoosh-camera', 0.45],
  ['outro', 30, 'pop', 0.25],
  ['outro', 40, 'whoosh-fast', 0.3],
  ['outro', 60, 'impact-big', 0.6],
  ['outro', 118, 'swish', 0.3],
];

export const SfxTrack: React.FC = () => (
  <>
    {CUES.map(([sc, at, sfx, vol], i) => (
      <Sequence key={i} from={T[sc].from + at} durationInFrames={200} name={`sfx ${sfx}`}>
        <Audio src={staticFile(`audio/sfx/${sfx}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
);
