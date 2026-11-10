import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {C, FONT, T} from './theme';
import {Grain} from './components/Fx';
import {StudioBg} from './components/Ui';
import {SfxTrack} from './sfx';
import {S1Intro} from './scenes/S1Intro';
import {S2Reservation} from './scenes/S2Reservation';
import {S3Acompte} from './scenes/S3Acompte';
import {S4Cadre} from './scenes/S4Cadre';
import {S5Prepa} from './scenes/S5Prepa';
import {S6Livraison} from './scenes/S6Livraison';
import {S7Souvenirs} from './scenes/S7Souvenirs';
import {S8Reprise} from './scenes/S8Reprise';
import {S9Numerique} from './scenes/S9Numerique';
import {S10Outro} from './scenes/S10Outro';

const SCENES: [keyof typeof T, React.FC, string][] = [
  ['intro', S1Intro, '00 Comment ça marche'],
  ['resa', S2Reservation, '01 Vous réservez'],
  ['acompte', S3Acompte, '02 Acompte 30 %'],
  ['cadre', S4Cadre, '03 Votre cadre'],
  ['prepa', S5Prepa, '04 On prépare tout'],
  ['livraison', S6Livraison, '05 On vous livre'],
  ['souvenirs', S7Souvenirs, '06 À vous de jouer'],
  ['reprise', S8Reprise, '07 On s’occupe de la suite'],
  ['numerique', S9Numerique, 'Vos photos numériques'],
  ['outro', S10Outro, 'Outro'],
];

/**
 * Reel Ma Selfie Box « Comment ça marche ? » — 65 s, 1080x1920, 60 i/s.
 * Chaque scène est une <Sequence> ; les raccords sont construits dans les
 * scènes (l'élément final d'une scène est repris à l'identique ensuite).
 */
export const MaSelfieBoxReel: React.FC = () => (
  <AbsoluteFill style={{background: C.paper, fontFamily: FONT}}>
    <StudioBg />
    {SCENES.map(([k, S, name]) => (
      <Sequence key={k} from={T[k].from} durationInFrames={T[k].dur} name={name}>
        <S />
      </Sequence>
    ))}
    <Grain opacity={0.035} />
    <Audio src={staticFile('audio/music-maselfiebox-reel-120bpm.wav')} volume={0.55} />
    <SfxTrack />
  </AbsoluteFill>
);
