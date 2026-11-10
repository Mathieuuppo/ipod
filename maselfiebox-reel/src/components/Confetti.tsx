import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {random, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, H, W} from '../theme';
import {clamp} from '../lib/anim';

const Pieces: React.FC<{start: number; end: number}> = ({start, end}) => {
  const f = useCurrentFrame();
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 0.6), []);
  const mats = useMemo(
    () => [C.turq, C.turq, '#ffffff', C.turqDark, C.text].map((c) => new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide, transparent: true})),
    [],
  );
  const fade = clamp((end - f) / 30);
  mats.forEach((m) => (m.opacity = fade));
  const t = f - start;
  const items = [];
  for (let i = 0; i < 140; i++) {
    const delay = random(`cd${i}`) * 90;
    const tt = t - delay;
    if (tt < 0) continue;
    const x0 = (random(`cx${i}`) - 0.5) * 12;
    const z = (random(`cz${i}`) - 0.5) * 8;
    const vy = 0.05 + random(`cv${i}`) * 0.05;
    const y = 11 - tt * vy - 0.0002 * tt * tt;
    if (y < -12) continue;
    const sway = Math.sin(tt / (12 + random(`cs${i}`) * 10) + i) * 0.6;
    const s = 0.18 + random(`csz${i}`) * 0.2;
    items.push(
      <mesh
        key={i}
        geometry={geo}
        material={mats[Math.floor(random(`cm${i}`) * mats.length)]}
        position={[x0 + sway, y, z]}
        rotation={[tt * 0.09 * (random(`r1${i}`) - 0.5) * 2, tt * 0.12 * random(`r2${i}`), tt * 0.05]}
        scale={[s, s, s]}
      />,
    );
  }
  return <>{items}</>;
};

export const Confetti: React.FC<{start: number; end: number}> = (p) => (
  <ThreeCanvas width={W} height={H} style={{position: 'absolute', inset: 0}} camera={{fov: 50, position: [0, 0, 22]}} gl={{antialias: true, alpha: true}}>
    <Pieces {...p} />
  </ThreeCanvas>
);
