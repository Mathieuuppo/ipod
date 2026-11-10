import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, DATA, FONT, SHADOW} from '../theme';
import {E, clamp, lerp, seg} from '../lib/anim';
import {KineticText} from './KineticText';

/* ------------------------------------------------------------------ */
/* Fond studio clair : blanc cassé, halos turquoise qui dérivent,      */
/* trame de points de précision.                                       */
/* ------------------------------------------------------------------ */
export const StudioBg: React.FC<{glow?: number}> = ({glow = 1}) => {
  const f = useCurrentFrame();
  const a = {x: 25 + Math.sin(f / 210) * 12, y: 30 + Math.cos(f / 260) * 8};
  const b = {x: 78 + Math.cos(f / 240) * 10, y: 74 + Math.sin(f / 190) * 8};
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 620px at ${a.x}% ${a.y}%, rgba(16,220,203,${0.16 * glow}) 0%, rgba(16,220,203,0) 70%),
            radial-gradient(circle 700px at ${b.x}% ${b.y}%, rgba(16,220,203,${0.12 * glow}) 0%, rgba(16,220,203,0) 70%),
            radial-gradient(ellipse 80% 60% at 50% 45%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(23,22,22,0.10) 1.6px, transparent 1.8px)',
          backgroundSize: '44px 44px',
          backgroundPosition: `0 ${(f * 0.25) % 44}px`,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.55) 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Titre d'étape : « 01 — VOUS RÉSERVEZ »                              */
/* ------------------------------------------------------------------ */
export const StepTitle: React.FC<{
  num: string;
  lines: string[];
  f: number;
  start: number;
  exitStart?: number;
  x?: number;
  y?: number;
  size?: number;
  numSize?: number;
}> = ({num, lines, f, start, exitStart, x = 80, y = 262, size = 92, numSize = 150}) => {
  const p = seg(f, start, 30, E.outExpo);
  const ex = exitStart !== undefined ? seg(f, exitStart, 20, E.inExpo) : 0;
  const dash = seg(f, start + 8, 24, E.outExpo);
  const pill = seg(f, start + 4, 26, E.outBack);
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 26}}>
      <div style={{position: 'relative', overflow: 'hidden', padding: '0.06em 0.04em', lineHeight: 0.9}}>
        <div
          style={{
            position: 'absolute',
            inset: '8% -6% 8% -6%',
            background: C.turq,
            borderRadius: 18,
            transform: `scaleX(${pill * (1 - ex)})`,
            transformOrigin: '0% 50%',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: numSize,
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
            color: C.text,
            transform: `translateY(${lerp(110, 0, p) - ex * 120}%)`,
            padding: '0 0.06em',
          }}
        >
          {num}
        </div>
      </div>
      <div style={{width: 54 * dash * (1 - ex), height: 7, borderRadius: 4, background: C.text}} />
      <div style={{display: 'flex', flexDirection: 'column'}}>
        {lines.map((l, i) => (
          <KineticText
            key={i}
            text={l}
            f={f}
            start={start + 8 + i * 6}
            size={size}
            stagger={1.2}
            lineHeight={1.0}
            exitStart={exitStart !== undefined ? exitStart + i * 3 : undefined}
          />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Doigt tactile (écran de téléphone) + onde de tap                     */
/* ------------------------------------------------------------------ */
export type TapKey = {f: number; x: number; y: number};
export const tapPos = (f: number, ks: TapKey[]) => {
  if (f <= ks[0].f) return {x: ks[0].x, y: ks[0].y};
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (f <= b.f) {
      const t = E.inOutCubic(clamp((f - a.f) / (b.f - a.f)));
      const arc = Math.sin(Math.PI * t) * 0.14;
      return {x: lerp(a.x, b.x, t) - (b.y - a.y) * arc, y: lerp(a.y, b.y, t) + (b.x - a.x) * arc};
    }
  }
  const l = ks[ks.length - 1];
  return {x: l.x, y: l.y};
};

export const Tap: React.FC<{f: number; x: number; y: number; taps?: number[]; opacity?: number}> = ({f, x, y, taps = [], opacity = 1}) => {
  let press = 0;
  let ripple = -1;
  for (const t of taps) {
    press = Math.max(press, interpolate(f, [t - 6, t, t + 5, t + 12], [0, 1, -0.2, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    if (f >= t && f < t + 32) ripple = (f - t) / 32;
  }
  if (opacity <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity, pointerEvents: 'none'}}>
      {ripple >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: x - 80,
            top: y - 80,
            width: 160,
            height: 160,
            borderRadius: 80,
            border: `${lerp(8, 1, ripple)}px solid ${C.turq}`,
            transform: `scale(${lerp(0.2, 1.25, E.outExpo(ripple))})`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x - 38,
          top: y - 38,
          width: 76,
          height: 76,
          borderRadius: 38,
          background: 'rgba(23,22,22,0.22)',
          border: '4px solid rgba(255,255,255,0.95)',
          boxShadow: '0 12px 26px rgba(20,60,60,0.25)',
          transform: `scale(${1 - press * 0.22})`,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Navigateur mobile : barre d'adresse + VRAIE capture du site          */
/* ------------------------------------------------------------------ */
export const MobileBrowser: React.FC<{
  w: number;
  h: number;
  src: string;
  scroll?: number; // px (échelle de la fenêtre)
  imgH: number; // hauteur de l'image source en px pour une largeur de 1170
  children?: React.ReactNode;
}> = ({w, h, src, scroll = 0, imgH, children}) => {
  const bar = 92;
  return (
    <div style={{width: w, height: h, borderRadius: 46, background: C.white, overflow: 'hidden', boxShadow: SHADOW, border: `10px solid ${C.text}`, boxSizing: 'border-box'}}>
      <div style={{height: bar, background: '#F1F3F3', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            height: 52,
            borderRadius: 26,
            background: C.white,
            padding: '0 26px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 500,
            color: C.text,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <svg width={16} height={20} viewBox="0 0 13 15">
            <rect x={1} y={6} width={11} height={8} rx={2} fill={C.text} />
            <path d="M3.5 6V4.2a3 3 0 0 1 6 0V6" stroke={C.text} strokeWidth={1.6} fill="none" />
          </svg>
          {DATA.url}
        </div>
      </div>
      <div style={{position: 'relative', height: h - bar - 20, overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: -scroll, width: w - 20, height: ((w - 20) * imgH) / 1170, maxWidth: 'none'}} />
        {children}
      </div>
    </div>
  );
};

/** Étiquette « Exemple » / « Illustration » */
export const Tag: React.FC<{text: string; p: number; dark?: boolean; style?: React.CSSProperties}> = ({text, p, dark = true, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 20px',
      borderRadius: 30,
      background: dark ? C.text : C.white,
      color: dark ? C.white : C.text,
      fontFamily: FONT,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '0.02em',
      transform: `scale(${lerp(0.6, 1, E.outBack(clamp(p)))})`,
      opacity: clamp(p * 2),
      whiteSpace: 'nowrap',
      boxShadow: '0 10px 24px rgba(20,60,60,0.15)',
      ...style,
    }}
  >
    <div style={{width: 10, height: 10, borderRadius: 5, background: C.turq}} />
    {text}
  </div>
);

/** Grand texte d'appui (lignes cinétiques centrées ou alignées à gauche) */
export const Headline: React.FC<{
  lines: string[];
  f: number;
  start: number;
  exitStart?: number;
  size?: number;
  x?: number;
  y: number;
  align?: 'left' | 'center';
  mode?: 'rise' | 'drop' | 'blur' | 'scale';
  color?: string;
  stagger?: number;
}> = ({lines, f, start, exitStart, size = 76, x = 80, y, align = 'left', mode = 'rise', color, stagger = 1.3}) => (
  <div
    style={{
      position: 'absolute',
      left: align === 'center' ? 0 : x,
      width: align === 'center' ? 1080 : undefined,
      top: y,
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
    }}
  >
    {lines.map((l, i) => (
      <KineticText
        key={i}
        text={l}
        f={f}
        start={start + i * 7}
        size={size}
        mode={mode}
        stagger={stagger}
        color={color}
        lineHeight={1.04}
        exitStart={exitStart !== undefined ? exitStart + i * 3 : undefined}
      />
    ))}
  </div>
);
