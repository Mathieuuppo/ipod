import React from 'react';
import {C} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import logo from '../logoPaths.json';

/**
 * LOGO OFFICIEL Ma Selfie Box — vectorisé depuis le fichier PNG du site
 * (public/brand/logo-maselfiebox-original.png) par tools/trace_logo.py.
 * Chaque lettre / pièce de l'appareil photo est un tracé indépendant, ce qui
 * permet un assemblage animé sans jamais redessiner le logo.
 */
type Part = {
  color: 'black' | 'turq';
  group: 'word' | 'tagline' | 'camera';
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  transform: string;
  d: string;
};

const PARTS = (logo as {parts: Part[]}).parts;
// cadrage serré autour du logo (unités = pixels source x10)
export const LOGO_VB = {x: 60, y: 175, w: 3430, h: 700};
export const LOGO_RATIO = LOGO_VB.h / LOGO_VB.w;

export const Logo: React.FC<{
  f: number;
  start?: number;
  width: number;
  assemble?: boolean;
  wordColor?: string;
  cameraColor?: string;
  taglineColor?: string;
  showTagline?: boolean;
  sweepStart?: number;
  sweepColor?: string;
  style?: React.CSSProperties;
  id?: string;
}> = ({
  f,
  start = 0,
  width,
  assemble = false,
  wordColor = C.white,
  cameraColor = C.logoTurq,
  taglineColor,
  showTagline = true,
  sweepStart,
  sweepColor = 'rgba(255,255,255,0.9)',
  style,
  id = 'logo',
}) => {
  const tagCol = taglineColor ?? wordColor;
  let wi = 0;
  let ci = 0;
  let ti = 0;
  const parts = PARTS.map((p, i) => {
    if (p.group === 'tagline' && !showTagline) return null;
    const cx = (p.x0 + p.x1) / 2;
    const cy = (p.y0 + p.y1) / 2;
    let tx = 0;
    let ty = 0;
    let rot = 0;
    let sc = 1;
    let sy = 1;
    let op = 1;
    if (assemble) {
      if (p.group === 'camera') {
        const k = ci++;
        const s = sp(f, start + k * 3, {damping: 11, stiffness: 150, mass: 0.7});
        const ang = ((-90 + k * 72) * Math.PI) / 180;
        tx = Math.cos(ang) * 1500 * (1 - s);
        ty = Math.sin(ang) * 1500 * (1 - s);
        rot = (k % 2 ? 140 : -140) * (1 - s);
        sc = lerp(0.3, 1, s);
        op = clamp(s * 4);
      } else if (p.group === 'word') {
        const k = wi++;
        const s = sp(f, start + 10 + k * 2.2, {damping: 10, stiffness: 160, mass: 0.75});
        ty = -900 * (1 - s);
        sy = 1 + (1 - clamp(s)) * 0.5;
        op = clamp(s * 5);
      } else {
        const k = ti++;
        const s = seg(f, start + 26 + k * 0.7, 22, E.outExpo);
        ty = 120 * (1 - s);
        op = s;
      }
    }
    if (op <= 0.001) return null;
    const fill = p.group === 'camera' ? cameraColor : p.group === 'tagline' ? tagCol : wordColor;
    return (
      <g
        key={i}
        opacity={op}
        transform={`translate(${tx} ${ty}) translate(${cx} ${cy}) rotate(${rot}) scale(${sc} ${sc * sy}) translate(${-cx} ${-cy})`}
      >
        <g transform={p.transform}>
          <path d={p.d} fill={fill} />
        </g>
      </g>
    );
  });

  // reflet lumineux qui balaie le logo
  let sweep: React.ReactNode = null;
  if (sweepStart !== undefined) {
    const t = seg(f, sweepStart, 46, E.inOutCubic);
    if (t > 0 && t < 1) {
      const gx = lerp(-800, LOGO_VB.x + LOGO_VB.w + 800, t);
      sweep = (
        <>
          <defs>
            <linearGradient id={`${id}-sw`} gradientUnits="userSpaceOnUse" x1={gx - 420} y1={0} x2={gx + 420} y2={300}>
              <stop offset="0" stopColor={sweepColor} stopOpacity={0} />
              <stop offset="0.5" stopColor={sweepColor} stopOpacity={1} />
              <stop offset="1" stopColor={sweepColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {PARTS.map((p, i) =>
            p.group === 'tagline' && !showTagline ? null : (
              <g key={`s${i}`} transform={p.transform}>
                <path d={p.d} fill={`url(#${id}-sw)`} />
              </g>
            ),
          )}
        </>
      );
    }
  }

  return (
    <svg
      width={width}
      height={width * LOGO_RATIO}
      viewBox={`${LOGO_VB.x} ${LOGO_VB.y} ${LOGO_VB.w} ${LOGO_VB.h}`}
      style={{overflow: 'visible', ...style}}
    >
      {parts}
      {sweep}
    </svg>
  );
};
