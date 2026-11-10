import React from 'react';
import {C, FONT} from '../theme';
import {E, clamp, lerp} from '../lib/anim';

type Mode = 'rise' | 'drop' | 'blur' | 'scale';

export type KineticTextProps = {
  text: string;
  f: number; // image locale
  start: number;
  stagger?: number; // images entre deux caractères
  dur?: number; // durée d'un caractère
  size: number;
  weight?: number;
  color?: string;
  accentColor?: string; // couleur de la ponctuation finale
  mode?: Mode;
  exitStart?: number;
  exitDur?: number;
  exitStagger?: number;
  tracking?: number; // em
  lineHeight?: number;
  style?: React.CSSProperties;
  uppercase?: boolean;
  reverse?: boolean;
};

const PUNCT = new Set(['.', '?', '!', '—']);

/**
 * Révélation typographique caractère par caractère à travers un masque
 * (chaque mot est un masque) : montée + rotation + flou de mouvement
 * proportionnel à la vitesse, sortie inverse en cascade.
 */
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  f,
  start,
  stagger = 1.6,
  dur = 26,
  size,
  weight = 800,
  color = C.text,
  accentColor = C.turq,
  mode = 'rise',
  exitStart,
  exitDur = 18,
  exitStagger = 0.8,
  tracking = -0.02,
  lineHeight = 1,
  style,
  uppercase = false,
  reverse = false,
}) => {
  const words = text.split(' ');
  let ci = 0;
  const total = text.replace(/ /g, '').length;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing: `${tracking}em`,
        color,
        whiteSpace: 'nowrap',
        textTransform: uppercase ? 'uppercase' : undefined,
        ...style,
      }}
    >
      {words.map((w, wi) => (
        <span
          key={wi}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            padding: '0.2em 0.03em 0.14em',
            margin: '-0.2em -0.03em -0.14em',
            verticalAlign: 'top',
          }}
        >
          {w.split('').map((ch, k) => {
            const idx = reverse ? total - 1 - ci : ci;
            ci++;
            const s = start + idx * stagger;
            const p = clamp((f - s) / dur);
            const e = E.outExpo(p);
            const pPrev = clamp((f - 1 - s) / dur);
            const speed = Math.abs(E.outExpo(p) - E.outExpo(pPrev));
            let ex = 0;
            if (exitStart !== undefined) {
              ex = E.inExpo(clamp((f - exitStart - idx * exitStagger) / exitDur));
            }
            let transform = '';
            let opacity = 1;
            let blur = 0;
            if (mode === 'rise') {
              transform = `translateY(${lerp(135, 0, e) - ex * 140}%) rotate(${lerp(9, 0, e)}deg) skewX(${lerp(-12, 0, e)}deg)`;
              blur = speed * 60;
            } else if (mode === 'drop') {
              transform = `translateY(${lerp(-135, 0, e) + ex * 140}%) rotate(${lerp(-8, 0, e)}deg)`;
              blur = speed * 60;
            } else if (mode === 'blur') {
              transform = `translateX(${lerp(0.4, 0, e)}em) scale(${lerp(1.25, 1, e)})`;
              opacity = e * (1 - ex);
              blur = (1 - e) * 14 + ex * 10;
            } else {
              transform = `scale(${lerp(0, 1, E.outBack(p))}) translateY(${-ex * 140}%)`;
              opacity = clamp(p * 3);
            }
            return (
              <span
                key={k}
                style={{
                  display: 'inline-block',
                  transform,
                  opacity,
                  filter: blur > 0.3 ? `blur(${Math.min(blur, 16)}px)` : undefined,
                  color: PUNCT.has(ch) ? accentColor : undefined,
                  transformOrigin: '50% 100%',
                }}
              >
                {ch}
              </span>
            );
          })}
          {wi < words.length - 1 ? <span style={{display: 'inline-block', width: '0.28em'}} /> : null}
        </span>
      ))}
    </div>
  );
};
