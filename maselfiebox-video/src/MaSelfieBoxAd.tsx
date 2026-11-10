import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, T} from './theme';
import {Backdrop, Grain, Vignette} from './components/Fx';
import {SfxTrack} from './sfx';
import {S1Intro} from './scenes/S1Intro';
import {S2Platform} from './scenes/S2Platform';
import {S3Date} from './scenes/S3Date';
import {S4Formule} from './scenes/S4Formule';
import {S5Options} from './scenes/S5Options';
import {S6Reservation} from './scenes/S6Reservation';
import {S7Promesse} from './scenes/S7Promesse';
import {S8Outro} from './scenes/S8Outro';

const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const outro = f >= T.outro.from;
  return (
    <>
      <Vignette strength={outro ? 0.22 : 0.55} />
      <Grain opacity={outro ? 0.05 : 0.07} />
    </>
  );
};

/**
 * Publicité Ma Selfie Box — 50 s.
 * Chaque scène est une <Sequence> (image locale = 0 au début de la scène).
 * Les transitions sont construites DANS les scènes : l'élément final d'une
 * scène est repris à l'identique au début de la suivante (voir theme.ts : R).
 */
export const MaSelfieBoxAd: React.FC = () => (
  <AbsoluteFill style={{background: C.ink, fontFamily: FONT}}>
    <Sequence from={T.intro.dur} durationInFrames={T.outro.from - T.intro.dur} name="Fond">
      <Backdrop />
    </Sequence>
    <Sequence from={T.intro.from} durationInFrames={T.intro.dur} name="01 Intro">
      <S1Intro />
    </Sequence>
    <Sequence from={T.platform.from} durationInFrames={T.platform.dur} name="02 Plateforme">
      <S2Platform />
    </Sequence>
    <Sequence from={T.date.from} durationInFrames={T.date.dur} name="03 Date">
      <S3Date />
    </Sequence>
    <Sequence from={T.formule.from} durationInFrames={T.formule.dur} name="04 Formule">
      <S4Formule />
    </Sequence>
    <Sequence from={T.options.from} durationInFrames={T.options.dur} name="05 Options">
      <S5Options />
    </Sequence>
    <Sequence from={T.resa.from} durationInFrames={T.resa.dur} name="06 Réservation">
      <S6Reservation />
    </Sequence>
    <Sequence from={T.promesse.from} durationInFrames={T.promesse.dur} name="07 Promesse">
      <S7Promesse />
    </Sequence>
    <Sequence from={T.outro.from} durationInFrames={T.outro.dur} name="08 Outro">
      <S8Outro />
    </Sequence>
    <Overlays />
    <Audio src={staticFile('audio/music-maselfiebox-120bpm.wav')} volume={0.6} />
    <SfxTrack />
  </AbsoluteFill>
);
