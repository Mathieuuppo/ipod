import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {MaSelfieBoxAd} from './MaSelfieBoxAd';
import {MaSelfieBoxAdVertical} from './vertical/VerticalAd';
import {DURATION, FPS, H, W} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    {/* Version principale 16:9 — 1920x1080, 60 i/s, 50 s */}
    <Composition id="MaSelfieBoxAd" component={MaSelfieBoxAd} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    {/* Déclinaison verticale 9:16 — 1080x1920, mêmes animations recadrées */}
    <Composition id="MaSelfieBoxAd-Vertical" component={MaSelfieBoxAdVertical} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  </>
);
