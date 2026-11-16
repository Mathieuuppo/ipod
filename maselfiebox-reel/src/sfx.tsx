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
  // Version allégée : seuls les sons qui racontent l'action, la musique domine.
  ['intro', 2, 'whoosh-fast', 0.25],
  ['intro', 236, 'impact-soft', 0.3],
  // 01 Réservation : les taps
  ['resa', 176, 'click', 0.45],
  ['resa', 288, 'click', 0.45],
  ['resa', 356, 'click', 0.45],
  ['resa', 424, 'click', 0.5],
  ['resa', 452, 'success', 0.25],
  // 02 Acompte
  ['acompte', 60, 'impact-soft', 0.4],
  ['acompte', 256, 'success', 0.22],
  // 04 Préparation
  ['prepa', 270, 'success', 0.22],
  // 05 Livraison
  ['livraison', 40, 'delivery', 0.25],
  ['livraison', 348, 'click', 0.4],
  // 06 Souvenirs : décompte, déclenchement, impression
  ['souvenirs', 0, 'shutter', 0.4],
  ['souvenirs', 30, 'beep', 0.22],
  ['souvenirs', 60, 'beep', 0.22],
  ['souvenirs', 90, 'beep', 0.22],
  ['souvenirs', 120, 'shutter', 0.5],
  ['souvenirs', 228, 'printer', 0.25],
  // 07 Reprise
  ['reprise', 92, 'card-flip', 0.25],
  // Photos numériques
  ['numerique', 186, 'notification', 0.4],
  // Outro
  ['outro', 60, 'impact-soft', 0.35],
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
