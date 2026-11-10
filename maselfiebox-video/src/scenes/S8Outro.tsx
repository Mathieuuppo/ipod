import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DATA, FONT} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {KineticText} from '../components/KineticText';
import {Logo, LOGO_RATIO} from '../components/Logo';

export const FINAL_HIT = 120; // = 48,0 s : dernier impact musical

export const S8Outro: React.FC = () => {
  const f = useCurrentFrame();
  const LW = 1000;
  const hit = f >= FINAL_HIT ? sp(f, FINAL_HIT, {damping: 8, stiffness: 160}) : 0;
  const pulse = f >= FINAL_HIT ? Math.sin(Math.PI * clamp((f - FINAL_HIT) / 14)) : 0;
  const settle = lerp(1, 1.025, seg(f, 0, 240, E.linear));
  const urlIn = sp(f, 58, {damping: 12, stiffness: 140});

  const ring = (d: number, start: number, dash: number, rotSpeed: number, w = 2) => {
    const p = seg(f, start, 50, E.outExpo);
    const circ = Math.PI * d;
    return (
      <svg
        width={d + 10}
        height={d + 10}
        style={{
          position: 'absolute',
          left: 960 - (d + 10) / 2,
          top: 520 - (d + 10) / 2,
          transform: `rotate(${f * rotSpeed}deg) scale(${lerp(0.6, 1, p) * (1 + pulse * 0.03)})`,
          opacity: p * 0.9,
        }}
      >
        <circle
          cx={(d + 10) / 2}
          cy={(d + 10) / 2}
          r={d / 2}
          fill="none"
          stroke={C.text}
          strokeWidth={w}
          strokeDasharray={dash ? `${dash} ${dash * 0.6}` : `${circ}`}
          strokeDashoffset={circ * (1 - p)}
        />
      </svg>
    );
  };

  const bars = [-1, 1].map((d) => {
    const p = seg(f, 40, 34, E.outExpo);
    return (
      <div
        key={d}
        style={{
          position: 'absolute',
          top: 516,
          left: 960 + d * lerp(900, 640, p) - 60,
          width: 120 * p,
          height: 5,
          background: C.text,
          borderRadius: 3,
          opacity: p,
        }}
      />
    );
  });

  const squares = [0, 1, 2, 3].map((i) => {
    const s = sp(f, 24 + i * 6, {damping: 12, stiffness: 120});
    const tx = [-560, 560, -470, 470][i];
    const ty = [-220, -220, 250, 250][i];
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 960 + tx * s - 9,
          top: 520 + ty * s - 9,
          width: 18,
          height: 18,
          background: i % 2 ? C.white : C.text,
          transform: `rotate(${lerp(180, 45, s)}deg)`,
          opacity: clamp(s * 2),
        }}
      />
    );
  });

  return (
    <AbsoluteFill style={{background: C.turq, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 55% 55% at 50% 48%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)',
          opacity: seg(f, 0, 30),
        }}
      />
      <AbsoluteFill style={{transform: `scale(${settle})`}}>
        {ring(1180, 8, 0, 0.04, 1.5)}
        {ring(860, 16, 14, -0.12, 2)}
        {bars}
        {squares}

        <div style={{position: 'absolute', left: 0, right: 0, top: 196, display: 'flex', justifyContent: 'center'}}>
          <KineticText text="PRÊTS À CRÉER VOS SOUVENIRS ?" f={f} start={6} size={74} color={C.text} accentColor={C.white} stagger={1.1} dur={26} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 960 - LW / 2,
            top: 520 - (LW * LOGO_RATIO) / 2,
            transform: `scale(${1 + pulse * 0.035 - (1 - clamp(hit)) * 0})`,
          }}
        >
          <Logo f={f} start={30} width={LW} assemble wordColor={C.text} cameraColor={C.text} sweepStart={FINAL_HIT} sweepColor="rgba(255,255,255,0.95)" id="logoOutro" />
        </div>

        <div style={{position: 'absolute', left: 0, right: 0, top: 742, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              background: C.text,
              color: C.white,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 44,
              letterSpacing: '0.01em',
              padding: '18px 46px',
              borderRadius: 60,
              transform: `scale(${lerp(0.5, 1, urlIn)}) translateY(${lerp(30, 0, clamp(urlIn))}px)`,
              opacity: clamp(urlIn * 2),
              boxShadow: '0 24px 50px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <span>{DATA.url}</span>
            <svg width={30} height={30} viewBox="0 0 30 30" style={{opacity: seg(f, 80, 12)}}>
              <path d="M6 15 H23 M16 8 L23 15 L16 22" stroke={C.turq} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* onde de choc sur l'impact final */}
        {f >= FINAL_HIT && f < FINAL_HIT + 40 ? (
          <div
            style={{
              position: 'absolute',
              left: 960 - 800,
              top: 520 - 800,
              width: 1600,
              height: 1600,
              borderRadius: '50%',
              border: `3px solid ${C.white}`,
              transform: `scale(${lerp(0.25, 1.2, E.outExpo(seg(f, FINAL_HIT, 40)))})`,
              opacity: 0.8 * (1 - seg(f, FINAL_HIT, 40)),
            }}
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
