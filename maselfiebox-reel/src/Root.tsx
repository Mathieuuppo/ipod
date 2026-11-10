import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {MaSelfieBoxReel} from './MaSelfieBoxReel';
import {DURATION, FPS, H, W} from './theme';

export const RemotionRoot: React.FC = () => (
  // Reel vertical 9:16 — 1080x1920, 60 i/s, 65 s
  <Composition id="MaSelfieBoxReel" component={MaSelfieBoxReel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
