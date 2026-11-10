import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {E, clamp, keys, lerp, seg} from '../lib/anim';
import {KineticText} from '../components/KineticText';
import {DirBlur, SpeedLines} from '../components/Fx';
import {Logo} from '../components/Logo';
import {StreakField} from '../components/Three';

// Vitesse du tunnel 3D : rampe sur le coup de fouet (100–124) et l'assemblage
export const introSpeed = (f: number) => {
  if (f < 14) return 0;
  const base = 0.035;
  const whip = Math.exp(-Math.pow((f - 112) / 8, 2)) * 1.25;
  const logo = Math.exp(-Math.pow((f - 182) / 9, 2)) * 0.45;
  return base + whip + logo;
};

const WHIP = (f: number) => E.whip(seg(f, 100, 24));
export const LOGO_W_INTRO = 1180;

export const S1Intro: React.FC = () => {
  const f = useCurrentFrame();

  // 1. Trait turquoise ultra-rapide (6–15) puis flash plein écran à l'impact (14)
  const headX = lerp(-400, 2300, E.inCubic(seg(f, 6, 9)));
  const streakOn = f >= 6 && f < 17;
  const flash = keys(f, [13, 15, 22, 34], [0, 1, 0.55, 0], E.outCubic);
  // la ligne pleine largeur se scinde en deux barres qui ouvrent le masque
  const split = seg(f, 16, 22, E.outExpo);
  const barsW = lerp(1920, 1500, split);
  const barsOp = 1 - seg(f, 46, 24, E.inCubic);
  const gap = lerp(0, 118, split);

  // 2. Formes géométriques qui se rejoignent aux angles du texte
  const corner = (i: number) => {
    const s = seg(f, 18 + i * 2, 26, E.outExpo);
    const out = seg(f, 92, 14, E.inExpo);
    const tx = [-760, 760, -760, 760][i];
    const ty = [-118, -118, 118, 118][i];
    const fx = [-1400, 1400, -1100, 1300][i];
    const fy = [-700, -600, 700, 650][i];
    return {
      x: 960 + lerp(fx, tx, s) * (1 + out * 0.4),
      y: 540 + lerp(fy, ty, s),
      r: lerp(225, 0, s),
      o: clamp(s * 3) * (1 - out),
    };
  };

  // 3. Coup de fouet de caméra : « VOTRE ÉVÉNEMENT. » -> « VOS SOUVENIRS. »
  const groupX = -2600 * WHIP(f);
  const v = -2600 * (WHIP(f) - WHIP(f - 1));
  const push = 1 + 0.035 * seg(f, 20, 90, E.outCubic) + 0.03 * seg(f, 124, 50, E.outCubic);
  const skew = clamp(v / 140, -1, 1) * 10;

  // 4. « VOS SOUVENIRS. » se compresse en une ligne turquoise (164–184)
  const squash = seg(f, 164, 16, E.inExpo);
  const lineCollapse = seg(f, 178, 12, E.inExpo);

  const streakOpacity = clamp(seg(f, 14, 30) * 0.55 + Math.exp(-Math.pow((f - 112) / 10, 2)) * 0.45) * (1 - seg(f, 200, 36) * 0.7);

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <StreakField speedAt={introSpeed} opacity={streakOpacity} />
      <SpeedLines intensity={Math.exp(-Math.pow((f - 112) / 7, 2))} seed="s1" />

      {/* trait turquoise */}
      {streakOn ? (
        <div
          style={{
            position: 'absolute',
            left: headX - 1100,
            top: 538,
            width: 1100,
            height: 4,
            background: `linear-gradient(90deg, rgba(16,220,203,0) 0%, ${C.turq} 85%, #ffffff 100%)`,
            boxShadow: `0 0 24px ${C.turq}, 0 0 60px ${C.turq}`,
          }}
        />
      ) : null}
      {/* ligne pleine largeur puis deux barres-masque */}
      {f >= 14 && barsOp > 0
        ? [-1, 1].map((d) => (
            <div
              key={d}
              style={{
                position: 'absolute',
                left: 960 - barsW / 2,
                top: 538 + d * gap,
                width: barsW,
                height: lerp(4, 3, split),
                background: C.turq,
                opacity: barsOp,
                boxShadow: `0 0 ${lerp(60, 12, split)}px ${C.turq}`,
              }}
            />
          ))
        : null}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 60% 22% at 50% 50%, rgba(220,255,252,0.55) 0%, rgba(16,220,203,0.18) 45%, rgba(0,0,0,0) 75%)',
          opacity: flash,
        }}
      />

      {/* angles géométriques */}
      {[0, 1, 2, 3].map((i) => {
        const c = corner(i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: c.x - 11,
              top: c.y - 11,
              width: 22,
              height: 22,
              border: `3px solid ${i % 2 ? C.white : C.turq}`,
              background: i === 0 ? C.turq : 'transparent',
              transform: `rotate(${c.r}deg)`,
              opacity: c.o,
            }}
          />
        );
      })}

      {/* textes XXL en plan-séquence horizontal */}
      <DirBlur id="s1whip" x={Math.abs(v) * 0.35} style={{position: 'absolute', inset: 0}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${groupX}px) scale(${push}) skewX(${-skew}deg)`,
            transformOrigin: '960px 540px',
          }}
        >
          <div style={{position: 'absolute', left: 0, width: 1920, top: 540 - 84, display: 'flex', justifyContent: 'center'}}>
            <KineticText text="VOTRE ÉVÉNEMENT." f={f} start={20} stagger={1.5} dur={28} size={150} tracking={-0.035} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 2600,
              width: 1920,
              top: 540 - 84,
              display: 'flex',
              justifyContent: 'center',
              transform: `scaleY(${lerp(1, 0.02, squash)}) scaleX(${lerp(1, 0.6, lineCollapse)})`,
              opacity: 1 - lineCollapse,
              transformOrigin: '50% 60%',
            }}
          >
            <KineticText
              text="VOS SOUVENIRS."
              f={f}
              start={108}
              stagger={1.2}
              dur={22}
              size={150}
              tracking={-0.035}
              color={squash > 0.4 ? C.turq : C.white}
            />
          </div>
        </div>
      </DirBlur>

      {/* révélation du VRAI logo par assemblage */}
      {f >= 176 ? (
        <div style={{position: 'absolute', left: 960 - LOGO_W_INTRO / 2, top: 540 - (LOGO_W_INTRO * 0.204) / 2 + 6}}>
          <Logo f={f} start={178} width={LOGO_W_INTRO} assemble wordColor={C.white} cameraColor={C.logoTurq} sweepStart={212} sweepColor="rgba(16,220,203,0.9)" id="logoIntro" />
        </div>
      ) : null}
      {/* onde de choc au verrouillage du logo (210) */}
      {f >= 206 && f < 236 ? (
        <div
          style={{
            position: 'absolute',
            left: 960 - 700,
            top: 540 - 700,
            width: 1400,
            height: 1400,
            borderRadius: '50%',
            border: `2px solid ${C.turq}`,
            transform: `scale(${lerp(0.3, 1.1, E.outExpo(seg(f, 206, 30)))})`,
            opacity: 0.6 * (1 - seg(f, 206, 30)),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
