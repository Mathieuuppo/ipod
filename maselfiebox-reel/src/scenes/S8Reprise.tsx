import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Headline, StepTitle} from '../components/Ui';
import {DirBlur} from '../components/Fx';
import {BorneImg} from './S5Prepa';
import {PRINTS, PrintCard, pileOf} from './S7Souvenirs';

export const GAL = (i: number) => ({x: 85 + (i % 3) * 310, y: 520 + Math.floor(i / 3) * 310, s: 290});

const CALW = 520;
const CALH = 600;

const Page: React.FC<{small: string; big: string[]}> = ({small, big}) => (
  <div style={{position: 'absolute', inset: 0, background: C.white, borderRadius: '0 0 30px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: C.text}}>
    <div style={{fontSize: 34, fontWeight: 600, color: C.textSoft, letterSpacing: '0.2em'}}>{small}</div>
    {big.map((b) => (
      <div key={b} style={{fontSize: 108, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.03em'}}>
        {b}
      </div>
    ))}
  </div>
);

export const S8Reprise: React.FC = () => {
  const f = useCurrentFrame();

  // la pile de tirages devient un calendrier
  const collapse = E.inOutExpo(seg(f, 4, 34));
  const calIn = sp(f, 22, {damping: 12, stiffness: 130});
  const tear = E.inOutCubic(seg(f, 92, 26));
  const calMove = E.inOutExpo(seg(f, 150, 40));
  const calOut = E.inExpo(seg(f, 296, 20));

  const cal = {
    x: lerp(540 - CALW / 2, 80, calMove),
    y: lerp(600, 470, calMove),
    s: lerp(1, 0.45, calMove),
  };

  // la borne entre puis quitte le décor
  const bIn = sp(f, 168, {damping: 14, stiffness: 90});
  const bOut = E.inExpo(seg(f, 244, 40));
  const bOutPrev = E.inExpo(seg(f - 1, 244, 40));
  const bx = lerp(-560, 440, clamp(bIn)) + bOut * 1100 + Math.max(0, bIn - 1) * 200;

  return (
    <AbsoluteFill>
      <StepTitle num="07" lines={['ON S’OCCUPE', 'DE LA SUITE']} f={f} start={30} exitStart={300} />

      {/* pile de tirages qui se compresse */}
      {collapse < 1
        ? PRINTS.map((p, i) => {
            const pile = pileOf(i);
            return (
              <div
                key={p.src}
                style={{
                  position: 'absolute',
                  left: pile.x - (p.w + (p.strip ? 0 : 24)) / 2,
                  top: pile.y - (p.h + (p.strip ? 0 : 24)) / 2,
                  transform: `rotate(${lerp(pile.r, 0, collapse)}deg) scale(${lerp(1, 0.5, collapse)})`,
                  opacity: 1 - collapse,
                }}
              >
                <PrintCard p={p} />
              </div>
            );
          })
        : null}

      {/* calendrier détachable : « LE JOUR J » -> « APRÈS LA FÊTE » */}
      {f >= 18 ? (
        <div
          style={{
            position: 'absolute',
            left: cal.x,
            top: cal.y,
            width: CALW,
            height: CALH,
            transformOrigin: '0 0',
            transform: `scale(${cal.s * lerp(0.6, 1, clamp(calIn))}) translateY(${-calOut * 600}px)`,
            opacity: clamp(calIn * 2) * (1 - calOut),
            perspective: 1400,
          }}
        >
          <div style={{position: 'absolute', inset: 0, borderRadius: 30, background: C.white, boxShadow: SHADOW}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, borderRadius: '30px 30px 0 0', background: C.turq, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 120}}>
            {[0, 1].map((k) => (
              <div key={k} style={{width: 26, height: 26, borderRadius: 13, background: C.paper, boxShadow: 'inset 0 3px 4px rgba(0,0,0,0.2)'}} />
            ))}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 120, bottom: 0}}>
            <Page small="ET" big={['APRÈS', 'LA FÊTE']} />
            {tear < 1 ? (
              <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 0%', transform: `rotateX(${tear * 115}deg)`, opacity: 1 - seg(tear, 0.8, 0.2), backfaceVisibility: 'hidden'}}>
                <Page small="LE" big={['JOUR J']} />
                <div style={{position: 'absolute', inset: 0, background: `rgba(20,60,60,${tear * 0.25})`, borderRadius: '0 0 30px 30px'}} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* la borne repart */}
      {f >= 166 && bOut < 1 ? (
        <>
          <div style={{position: 'absolute', left: bx + 70, top: 1250, width: 340, height: 50, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(20,60,60,0.22) 0%, rgba(20,60,60,0) 70%)'}} />
          <DirBlur id="borneOut" x={(bOut - bOutPrev) * 1100 * 0.35} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
            <div style={{position: 'absolute', left: bx, top: 640, transform: `rotate(${(bOut - bOutPrev) * 60}deg)`}}>
              <BorneImg w={480} h={600} />
            </div>
          </DirBlur>
        </>
      ) : null}

      <Headline lines={['ON RÉCUPÈRE', 'LA BORNE']} f={f} start={160} y={1250} size={86} exitStart={292} />
      <div style={{position: 'absolute', left: 82, top: 1440, fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.textSoft, opacity: seg(f, 196, 14) * (1 - seg(f, 292, 12))}}>
        Selon la fenêtre de reprise convenue avec vous.
      </div>

      {/* tuiles turquoise -> future galerie */}
      {f >= 300 ? (
        <AbsoluteFill style={{perspective: 1600}}>
          {new Array(9).fill(0).map((_, i) => {
            const g = GAL(i);
            const p = sp(f, 304 + ((i % 3) + Math.floor(i / 3)) * 4, {damping: 13, stiffness: 140});
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: g.x,
                  top: g.y,
                  width: g.s,
                  height: g.s,
                  borderRadius: 22,
                  background: i % 2 ? C.turq : C.turqDark,
                  transform: `rotateY(${lerp(-90, 0, p)}deg) scale(${lerp(0.4, 1, clamp(p))})`,
                  opacity: clamp(p * 3),
                  boxShadow: SHADOW,
                }}
              />
            );
          })}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
