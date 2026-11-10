import React from 'react';
import {C, FONT} from '../theme';
import {E, clamp, lerp, seg} from '../lib/anim';
import {KineticText} from './KineticText';

/**
 * Titre d'étape : « 01 — CHOISISSEZ VOTRE DATE »
 * Numéro XXL en contour turquoise révélé par masque, tiret qui se dessine,
 * puis les lignes du titre en cascade de caractères.
 */
export const StepTitle: React.FC<{
  num: string;
  lines: string[];
  f: number;
  start: number;
  x: number;
  y: number;
  size?: number;
  numSize?: number;
  exitStart?: number;
  layout?: 'stack' | 'row';
}> = ({num, lines, f, start, x, y, size = 104, numSize = 190, exitStart, layout = 'stack'}) => {
  const pNum = seg(f, start, 34, E.outExpo);
  const pDash = seg(f, start + 8, 26, E.outExpo);
  const fill = seg(f, start + 20, 40, E.inOutCubic);
  const ex = exitStart !== undefined ? seg(f, exitStart, 22, E.inExpo) : 0;
  const numBlock = (
    <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
      <div style={{overflow: 'hidden', padding: '0 0.04em', lineHeight: 0.86}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: numSize,
            lineHeight: 0.86,
            letterSpacing: '-0.04em',
            color: 'transparent',
            WebkitTextStroke: `3px ${C.turq}`,
            transform: `translateY(${lerp(105, 0, pNum) - ex * 110}%)`,
            backgroundImage: `linear-gradient(90deg, ${C.turq} 0%, ${C.turq} ${fill * 100}%, transparent ${fill * 100}%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            opacity: fill > 0.99 ? 1 : 1,
          }}
        >
          {num}
        </div>
      </div>
      <div
        style={{
          width: 90 * pDash * (1 - ex),
          height: 6,
          background: C.white,
          borderRadius: 3,
          transform: `translateX(${ex * -40}px)`,
        }}
      />
    </div>
  );
  const text = (
    <div style={{display: 'flex', flexDirection: 'column', gap: size * 0.02}}>
      {lines.map((l, i) => (
        <KineticText
          key={i}
          text={l}
          f={f}
          start={start + 12 + i * 7}
          stagger={1.3}
          size={size}
          weight={800}
          lineHeight={1.02}
          exitStart={exitStart !== undefined ? exitStart + i * 3 : undefined}
        />
      ))}
    </div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        display: 'flex',
        flexDirection: layout === 'stack' ? 'column' : 'row',
        alignItems: layout === 'stack' ? 'flex-start' : 'center',
        gap: layout === 'stack' ? 26 : 40,
      }}
    >
      {numBlock}
      {text}
    </div>
  );
};

/** Sous-titre / phrase d'appui avec trait turquoise qui se dessine. */
export const Underlined: React.FC<{
  text: string;
  f: number;
  start: number;
  size?: number;
  x: number;
  y: number;
  exitStart?: number;
  weight?: number;
}> = ({text, f, start, size = 38, x, y, exitStart, weight = 500}) => {
  const pl = seg(f, start + 10, 30, E.outExpo);
  const ex = exitStart !== undefined ? seg(f, exitStart, 18, E.inExpo) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y}}>
      <KineticText text={text} f={f} start={start} size={size} weight={weight} mode="blur" stagger={0.8} dur={22} exitStart={exitStart} tracking={0} />
      <div
        style={{
          marginTop: 14,
          height: 4,
          width: `${clamp(pl - ex) * 100}%`,
          marginLeft: `${ex * 100}%`,
          background: C.turq,
          borderRadius: 2,
          boxShadow: `0 0 18px ${C.turq}`,
        }}
      />
    </div>
  );
};
