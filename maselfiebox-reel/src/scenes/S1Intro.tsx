import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Logo, LOGO_RATIO} from '../components/Logo';
import {MobileBrowser} from '../components/Ui';

// Fenêtre de navigateur finale (reprise à l'identique au début de la scène 2)
export const B0 = {x: 170, y: 520, w: 740, h: 1180, ry: -10, rx: 6};

/** Lettres dispersées dans l'espace 3D qui tournent et s'assemblent. */
const Letters3D: React.FC<{
  text: string;
  f: number;
  start: number;
  size: number;
  seed: string;
  exitStart?: number;
  color?: string;
}> = ({text, f, start, size, seed, exitStart, color = C.text}) => {
  const chars = text.split('');
  const n = chars.length;
  return (
    <div style={{display: 'flex', justifyContent: 'center', transformStyle: 'preserve-3d', fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: '-0.03em'}}>
      {chars.map((ch, i) => {
        const order = Math.floor(random(`${seed}o${i}`) * n);
        const p = sp(f, start + order * 1.6, {damping: 13, stiffness: 95, mass: 0.9});
        const q = 1 - p;
        const dx = (random(`${seed}x${i}`) - 0.5) * 1400;
        const dy = (random(`${seed}y${i}`) - 0.5) * 1500;
        const dz = -1600 + random(`${seed}z${i}`) * 2200;
        const rx = (random(`${seed}rx${i}`) - 0.5) * 360;
        const ry = (random(`${seed}ry${i}`) - 0.5) * 420;
        let ex = 0;
        if (exitStart !== undefined) ex = E.inExpo(seg(f, exitStart + i * 0.9, 18));
        const op = clamp(p * 2.5) * (1 - ex);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              color: ch === '?' ? C.turq : color,
              opacity: op,
              transform: `translate3d(${dx * q}px, ${dy * q - ex * 80}px, ${dz * q + ex * 500}px) rotateX(${rx * q - ex * 90}deg) rotateY(${ry * q}deg)`,
              textShadow: '0 18px 30px rgba(20,60,60,0.12)',
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Retournement de cartes caractère par caractère. */
const FlipText: React.FC<{text: string; f: number; start: number; size: number; exitAt: number}> = ({text, f, start, size, exitAt}) => {
  const chars = text.split('');
  return (
    <div style={{display: 'flex', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: '-0.03em', perspective: 900}}>
      {chars.map((ch, i) => {
        const p = sp(f, start + i * 1.6, {damping: 11, stiffness: 150, mass: 0.7});
        const out = E.inExpo(seg(f, exitAt + Math.abs(i - chars.length / 2) * 0.8, 16));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              color: i >= 10 ? C.turqDark : C.text,
              transform: `rotateX(${lerp(-100, 0, p)}deg) scale(${1 - out * 0.7})`,
              transformOrigin: '50% 60%',
              opacity: clamp(p * 3) * (1 - out),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const S1Intro: React.FC = () => {
  const f = useCurrentFrame();

  // trait turquoise ultra-rapide
  const head = lerp(-300, 1500, E.inCubic(seg(f, 4, 11)));
  const flash = Math.max(0, 1 - Math.abs(f - 15) / 10);

  // ensemble 3D qui tangue doucement (caméra)
  const sway = Math.sin(f / 46) * 7 * (1 - seg(f, 120, 20));
  const tilt = Math.cos(f / 60) * 4;

  // logo -> petit, monte ; navigateur 3D qui arrive des profondeurs
  const lg = seg(f, 246, 40, E.inOutExpo);
  const logoW = lerp(900, 380, lg);
  const logoY = lerp(900, 330, lg);
  const logoOp = 1 - seg(f, 286, 14);
  const br = sp(f, 250, {damping: 15, stiffness: 80});
  const brOp = clamp((f - 250) / 10);

  return (
    <AbsoluteFill>
      {/* trait turquoise */}
      {f >= 4 && f < 18 ? (
        <div
          style={{
            position: 'absolute',
            left: head - 900,
            top: 958,
            width: 900,
            height: 5,
            borderRadius: 3,
            background: `linear-gradient(90deg, rgba(16,220,203,0) 0%, ${C.turq} 80%, ${C.turqDark} 100%)`,
            boxShadow: `0 0 26px ${C.turq}`,
          }}
        />
      ) : null}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 12% at 50% 50%, rgba(16,220,203,0.35) 0%, rgba(16,220,203,0) 70%)`, opacity: flash}} />

      {/* « COMMENT ÇA MARCHE ? » en 3D */}
      {f < 160 ? (
        <AbsoluteFill style={{perspective: 1300, perspectiveOrigin: '50% 48%'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 760,
              transformStyle: 'preserve-3d',
              transform: `rotateY(${sway}deg) rotateX(${tilt}deg)`,
            }}
          >
            <Letters3D text="COMMENT" f={f} start={14} size={150} seed="a" exitStart={114} />
            <div style={{height: 22}} />
            <Letters3D text="ÇA MARCHE ?" f={f} start={26} size={114} seed="b" exitStart={118} />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* « MA SELFIE BOX » */}
      {f >= 136 && f < 214 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 846}}>
          <FlipText text="MA SELFIE BOX" f={f} start={140} size={104} exitAt={192} />
        </div>
      ) : null}

      {/* vrai logo */}
      {f >= 186 && logoOp > 0 ? (
        <div style={{position: 'absolute', left: 540 - logoW / 2, top: logoY - (logoW * LOGO_RATIO) / 2, opacity: logoOp}}>
          <Logo f={f} start={188} width={logoW} assemble wordColor={C.text} cameraColor={C.logoTurq} sweepStart={232} sweepColor="rgba(16,220,203,0.95)" id="logoS1" />
        </div>
      ) : null}
      {/* onde de verrouillage */}
      {f >= 236 && f < 270 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - 560,
            top: 900 - 560,
            width: 1120,
            height: 1120,
            borderRadius: '50%',
            border: `3px solid ${C.turq}`,
            transform: `scale(${lerp(0.2, 1, E.outExpo(seg(f, 236, 34)))})`,
            opacity: 0.8 * (1 - seg(f, 236, 34)),
          }}
        />
      ) : null}

      {/* la typographie devient une fenêtre 3D du vrai site */}
      {f >= 250 ? (
        <AbsoluteFill style={{perspective: 1800}}>
          <div
            style={{
              position: 'absolute',
              left: B0.x,
              top: B0.y,
              opacity: brOp,
              transform: `translateZ(${lerp(-1400, 0, br)}px) rotateY(${lerp(70, B0.ry, br)}deg) rotateX(${lerp(24, B0.rx, br)}deg)`,
            }}
          >
            <MobileBrowser w={B0.w} h={B0.h} src="screens/m-accueil.jpg" imgH={1992} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
