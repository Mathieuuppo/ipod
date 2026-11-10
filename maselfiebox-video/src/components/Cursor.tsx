import React from 'react';
import {interpolate} from 'remotion';
import {C} from '../theme';
import {E, clamp, lerp} from '../lib/anim';

export type CursorKey = {f: number; x: number; y: number};

/**
 * Trajectoire de curseur : interpolation entre images clés avec
 * accélération/décélération naturelles et légère courbure (un geste de main
 * n'est jamais parfaitement rectiligne).
 */
export const cursorPos = (f: number, ks: CursorKey[], bend = 0.12) => {
  if (f <= ks[0].f) return {x: ks[0].x, y: ks[0].y};
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (f <= b.f) {
      const t = E.inOutCubic(clamp((f - a.f) / (b.f - a.f)));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const arc = Math.sin(Math.PI * t) * bend;
      return {x: lerp(a.x, b.x, t) - dy * arc, y: lerp(a.y, b.y, t) + dx * arc};
    }
  }
  const l = ks[ks.length - 1];
  return {x: l.x, y: l.y};
};

/**
 * Pointeur graphique + onde de clic. `clickAt` : image du clic.
 */
export const Cursor: React.FC<{
  f: number;
  x: number;
  y: number;
  clickAt?: number[];
  opacity?: number;
  scale?: number;
  dark?: boolean;
}> = ({f, x, y, clickAt = [], opacity = 1, scale = 1, dark = false}) => {
  let press = 0;
  let ripple = -1;
  for (const c of clickAt) {
    // anticipation (enfoncement) puis relâchement avec rebond
    press = Math.max(
      press,
      interpolate(f, [c - 5, c, c + 4, c + 12], [0, 1, -0.25, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    );
    if (f >= c && f < c + 30) ripple = (f - c) / 30;
  }
  const s = scale * (1 - press * 0.18);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity, pointerEvents: 'none'}}>
      {ripple >= 0 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: x - 60,
              top: y - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: `${lerp(6, 0.5, ripple)}px solid ${C.turq}`,
              transform: `scale(${lerp(0.15, 1.3, E.outExpo(ripple))})`,
              opacity: 1 - ripple,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: x - 30,
              top: y - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: C.turq,
              transform: `scale(${lerp(0.2, 1, E.outExpo(ripple))})`,
              opacity: (1 - ripple) * 0.35,
            }}
          />
        </>
      ) : null}
      <svg
        width={46}
        height={46}
        viewBox="0 0 46 46"
        style={{
          position: 'absolute',
          left: x - 6,
          top: y - 4,
          transform: `scale(${s}) rotate(${press * -6}deg)`,
          transformOrigin: '6px 4px',
          filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.45))',
          overflow: 'visible',
        }}
      >
        <path
          d="M6 4 L6 36 L14.5 28.2 L20.4 41.6 L26.6 38.9 L20.9 25.8 L32.6 25.4 Z"
          fill={dark ? C.text : C.white}
          stroke={dark ? C.white : C.text}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
