import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/**
 * Flou de mouvement directionnel (SVG feGaussianBlur anisotrope) :
 * on lui passe la vitesse de l'élément, il étire l'image dans l'axe du
 * déplacement — l'équivalent du « motion blur » d'After Effects.
 */
export const DirBlur: React.FC<{
  id: string;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({id, x = 0, y = 0, style, children}) => {
  const bx = Math.min(Math.abs(x), 60);
  const by = Math.min(Math.abs(y), 60);
  const on = bx > 0.4 || by > 0.4;
  return (
    <>
      {on ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      <div style={{...style, filter: on ? `url(#${id})` : style?.filter}}>{children}</div>
    </>
  );
};

/** Grain argentique animé (bruit procédural renouvelé à chaque image). */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const f = useCurrentFrame();
  const seed = Math.floor(random(`g${f}`) * 1000);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width="100%" height="100%">
        <filter id={`grain${f}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${f})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/**
 * Fond noir profond : halo turquoise qui dérive lentement + grille de
 * précision en perspective. Persistant sur toute la partie « tutoriel ».
 */
export const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const gx = 50 + Math.sin(f / 240) * 18;
  const gy = 45 + Math.cos(f / 300) * 12;
  const drift = (f * 0.35) % 80;
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at ${gx}% ${gy}%, rgba(16,220,203,0.13) 0%, rgba(16,220,203,0.04) 40%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <AbsoluteFill style={{perspective: 900, perspectiveOrigin: '50% 20%'}}>
        <div
          style={{
            position: 'absolute',
            left: -1200,
            right: -1200,
            top: 640,
            height: 1400,
            transform: 'rotateX(78deg)',
            transformOrigin: '50% 0%',
            backgroundImage:
              'linear-gradient(rgba(16,220,203,0.18) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(16,220,203,0.18) 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px',
            backgroundPosition: `0 ${drift}px`,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 85%)',
            opacity: 0.55,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Lignes de vitesse (traits fins) pendant les mouvements rapides. */
export const SpeedLines: React.FC<{intensity: number; dir?: 1 | -1; seed?: string; color?: string}> = ({
  intensity,
  dir = -1,
  seed = 'sl',
  color = C.turq,
}) => {
  const f = useCurrentFrame();
  if (intensity < 0.02) return null;
  const lines = new Array(26).fill(0).map((_, i) => {
    const y = random(`${seed}y${i}`) * 1080;
    const len = 200 + random(`${seed}l${i}`) * 700;
    const speed = 60 + random(`${seed}s${i}`) * 90;
    const x0 = random(`${seed}x${i}`) * 3000;
    const x = ((x0 + f * speed * -dir) % 3000 + 3000) % 3000 - 600;
    const th = random(`${seed}t${i}`) > 0.8 ? 3 : 1.5;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: len,
          height: th,
          background: `linear-gradient(90deg, rgba(0,0,0,0), ${i % 4 === 0 ? '#fff' : color})`,
          opacity: intensity * (0.35 + random(`${seed}o${i}`) * 0.5),
          transform: dir === 1 ? 'scaleX(-1)' : undefined,
        }}
      />
    );
  });
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{lines}</AbsoluteFill>;
};
