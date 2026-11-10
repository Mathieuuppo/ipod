import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {random, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, H, W} from '../theme';
import {E, clamp, lerp} from '../lib/anim';

// Caméra commune : fov 50°, z = 10  ->  hauteur visible à z=0 : 9,326 unités
const CAM_Z = 10;
const FOV = 50;
const VIS_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
export const PX = VIS_H / H; // unités par pixel à z = 0
export const toWorld = (x: number, y: number) => [(x - W / 2) * PX, -(y - H / 2) * PX] as const;

/* ------------------------------------------------------------------------ */
/* Tunnel de traînées lumineuses (profondeur réelle) — intro                 */
/* ------------------------------------------------------------------------ */
const Streaks: React.FC<{speedAt: (f: number) => number; opacity: number}> = ({speedAt, opacity}) => {
  const f = useCurrentFrame();
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const matT = useMemo(
    () => new THREE.MeshBasicMaterial({color: C.turq, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false}),
    [],
  );
  const matW = useMemo(
    () => new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false}),
    [],
  );
  matT.opacity = 0.8 * opacity;
  matW.opacity = 0.55 * opacity;
  // distance parcourue = intégrale de la vitesse (speed ramp sans saccade)
  let dist = 0;
  for (let i = 0; i <= f; i++) dist += speedAt(i);
  const v = speedAt(f);
  const items = new Array(110).fill(0).map((_, i) => {
    const a = random(`sa${i}`) * Math.PI * 2;
    const r = 2.6 + random(`sr${i}`) * 7;
    const z0 = random(`sz${i}`) * 70;
    const z = ((z0 + dist) % 70) - 62;
    const len = 0.6 + random(`sl${i}`) * 2.2 + v * 9;
    const th = 0.012 + random(`st${i}`) * 0.02;
    return (
      <mesh
        key={i}
        geometry={geo}
        material={random(`sc${i}`) > 0.75 ? matW : matT}
        position={[Math.cos(a) * r, Math.sin(a) * r * 0.62, z]}
        scale={[th, th, len]}
      />
    );
  });
  return <>{items}</>;
};

export const StreakField: React.FC<{speedAt: (f: number) => number; opacity: number}> = ({speedAt, opacity}) => (
  <ThreeCanvas
    width={W}
    height={H}
    style={{position: 'absolute', inset: 0}}
    camera={{fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 200}}
    gl={{antialias: true, alpha: true}}
  >
    <Streaks speedAt={speedAt} opacity={opacity} />
  </ThreeCanvas>
);

/* ------------------------------------------------------------------------ */
/* Désassemblage : la carte se brise en tuiles turquoise / blanches          */
/* ------------------------------------------------------------------------ */
const Tiles: React.FC<{rect: {x: number; y: number; w: number; h: number}; start: number; origin: {x: number; y: number}}> = ({
  rect,
  start,
  origin,
}) => {
  const f = useCurrentFrame();
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mats = useMemo(
    () => ({
      white: new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, side: THREE.DoubleSide}),
      turq: new THREE.MeshBasicMaterial({color: C.turq, transparent: true, side: THREE.DoubleSide}),
      dark: new THREE.MeshBasicMaterial({color: C.turqDark, transparent: true, side: THREE.DoubleSide}),
    }),
    [],
  );
  const cols = 16;
  const rows = 17;
  const tw = rect.w / cols;
  const th = rect.h / rows;
  const out: React.ReactNode[] = [];
  const [ox, oy] = toWorld(origin.x, origin.y);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const px = rect.x + (c + 0.5) * tw;
      const py = rect.y + (r + 0.5) * th;
      const [wx, wy] = toWorld(px, py);
      const d = Math.hypot(wx - ox, wy - oy);
      const delay = d * 2.2 + random(`td${i}`) * 4;
      const t = Math.max(0, f - start - delay);
      const tt = clamp(t / 70);
      // impulsion radiale depuis le point d'impact + dérive vers la droite
      const dirx = (wx - ox) / (d + 0.001);
      const diry = (wy - oy) / (d + 0.001);
      const pow = 0.05 + random(`tp${i}`) * 0.06;
      const x = wx + dirx * pow * t + 0.0016 * t * t * (0.6 + random(`tx${i}`));
      const y = wy + diry * pow * t + 0.0009 * t * t * (random(`ty${i}`) - 0.3);
      const z = (random(`tz${i}`) - 0.3) * 0.12 * t;
      const rx = (random(`rx${i}`) - 0.5) * 0.12 * t;
      const ry = (random(`ry${i}`) - 0.5) * 0.16 * t;
      const rz = (random(`rz${i}`) - 0.5) * 0.08 * t;
      const s = lerp(1, 0.15, E.inCubic(tt)) * (t > 0 ? 0.86 : 1);
      if (tt >= 1) continue;
      // la tuile reste blanche (comme la carte) puis vire au turquoise en vol
      const k = random(`tk${i}`);
      const mat = t < 5 + random(`tc${i}`) * 10 ? mats.white : k > 0.45 ? mats.turq : k > 0.35 ? mats.dark : mats.white;
      out.push(
        <mesh key={i} geometry={geo} material={mat} position={[x, y, z]} rotation={[rx, ry, rz]} scale={[tw * PX * s, th * PX * s, 1]} />,
      );
    }
  }
  return <>{out}</>;
};

export const Shatter: React.FC<{rect: {x: number; y: number; w: number; h: number}; start: number; origin: {x: number; y: number}}> = (
  props,
) => (
  <ThreeCanvas
    width={W}
    height={H}
    style={{position: 'absolute', inset: 0}}
    camera={{fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 200}}
    gl={{antialias: true, alpha: true}}
  >
    <Tiles {...props} />
  </ThreeCanvas>
);
