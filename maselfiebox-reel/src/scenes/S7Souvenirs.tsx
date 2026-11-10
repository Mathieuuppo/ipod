import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Headline, StepTitle} from '../components/Ui';
import {Confetti} from '../components/Confetti';

const SHOT = 120; // déclenchement (42,5 s)
const EV_A = {x: 80, y: 500, w: 920, h: 900, r: 0};
const EV_B = {x: 60, y: 500, w: 520, h: 508, r: -4};

// tirages RÉELS publiés par Ma Selfie Box
export type Print = {src: string; w: number; h: number; x: number; y: number; r: number; at: number; strip?: boolean};
export const PRINTS: Print[] = [
  {src: 'photos/tirage-60-ans-valerie.jpg', w: 440, h: 293, x: 60, y: 1050, r: -5, at: 150},
  {src: 'photos/tirage-50-ans-stephanie.jpg', w: 440, h: 293, x: 470, y: 1110, r: 6, at: 180},
  {src: 'photos/tirage-18-ans-sarah.jpg', w: 440, h: 293, x: 250, y: 1250, r: -2, at: 210},
  {src: 'photos/bandelette-1.png', w: 180, h: 534, x: 660, y: 548, r: 0, at: 240, strip: true},
  {src: 'photos/bandelette-2.png', w: 180, h: 534, x: 820, y: 548, r: 0, at: 262, strip: true},
];
// pile finale (reprise par la scène 7 « on s'occupe de la suite »)
export const pileOf = (i: number) => ({x: 540 + (i - 2) * 14, y: 860 + (i - 2) * 10, r: (i - 2) * 7});

const SLOT = {x: 640, y: 520, w: 380};

export const PrintCard: React.FC<{p: Print}> = ({p}) => (
  <div style={{padding: p.strip ? 0 : 12, background: '#FDFDFB', borderRadius: 6, boxShadow: SHADOW}}>
    <Img src={staticFile(p.src)} style={{width: p.w, height: p.h, display: 'block', borderRadius: p.strip ? 4 : 2}} />
  </div>
);

export const S7Souvenirs: React.FC = () => {
  const f = useCurrentFrame();

  const flashA = Math.max(0, 1 - f / 14);
  const flashB = f >= SHOT ? Math.max(0, 1 - (f - SHOT) / 12) : 0;

  const shrink = E.inOutExpo(seg(f, 134, 40));
  const ev = {
    x: lerp(EV_A.x, EV_B.x, shrink),
    y: lerp(EV_A.y, EV_B.y, shrink),
    w: lerp(EV_A.w, EV_B.w, shrink),
    h: lerp(EV_A.h, EV_B.h, shrink),
    r: lerp(EV_A.r, EV_B.r, shrink),
  };
  const evOut = E.inExpo(seg(f, 532, 30));

  // compte à rebours sur les temps (30, 60, 90)
  const cd = f >= 30 && f < SHOT ? 3 - Math.floor((f - 30) / 30) : 0;
  const cdP = f >= 30 && f < SHOT ? sp(f, 30 + (3 - cd) * 30, {damping: 9, stiffness: 220}) : 0;

  const panel = E.outExpo(seg(f, 330, 30));
  const dim = seg(f, 330, 30) * (1 - seg(f, 530, 20));
  const gather = E.inOutExpo(seg(f, 532, 38));

  return (
    <AbsoluteFill>
      <StepTitle num="06" lines={['À VOUS', 'DE JOUER !']} f={f} start={8} exitStart={530} />

      {/* la borne en pleine fête (vraie photo) */}
      <div
        style={{
          position: 'absolute',
          left: ev.x,
          top: ev.y,
          width: ev.w,
          height: ev.h,
          borderRadius: lerp(36, 22, shrink),
          overflow: 'hidden',
          boxShadow: SHADOW,
          transform: `rotate(${ev.r}deg) scale(${1 - evOut * 0.4})`,
          opacity: 1 - evOut,
          filter: dim > 0.01 ? `saturate(${1 - dim * 0.3})` : undefined,
        }}
      >
        <Img
          src={staticFile('photos/borne-terrasse-mer.jpg')}
          style={{position: 'absolute', width: '118%', height: '118%', left: `${-9 + Math.sin(f / 70) * 3}%`, top: '-6%', objectFit: 'cover'}}
        />
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flashB * 0.9}} />
      </div>

      {/* compte à rebours */}
      {cd > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 820 - 100,
            top: 600 - 100,
            width: 200,
            height: 200,
            borderRadius: 100,
            background: C.white,
            boxShadow: `${SHADOW}, 0 0 0 10px ${C.turq}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 130,
            color: C.text,
            transform: `scale(${lerp(0.4, 1, clamp(cdP)) + Math.max(0, cdP - 1) * 0.5})`,
          }}
        >
          {cd}
        </div>
      ) : null}

      {/* fente d'impression + bandelettes qui sortent */}
      {f >= 226 ? (
        <>
          <div style={{position: 'absolute', left: SLOT.x, top: SLOT.y - 14, width: SLOT.w, height: 28, borderRadius: 14, background: C.text, opacity: seg(f, 226, 10) * (1 - gather), transform: `scaleX(${E.outBack(seg(f, 226, 18))})`}} />
          <div style={{position: 'absolute', left: SLOT.x, top: SLOT.y, width: SLOT.w + 60, height: 1400, overflow: 'hidden'}}>
            {PRINTS.filter((p) => p.strip).map((p, k) => {
              const s = sp(f, p.at, {damping: 15, stiffness: 60});
              const swing = Math.sin((f - p.at) / 9) * 3 * (1 - clamp(s));
              const g = gather;
              if (g > 0) return null;
              return (
                <div key={k} style={{position: 'absolute', left: p.x - SLOT.x, top: lerp(-p.h - 10, p.y - SLOT.y, s), transform: `rotate(${swing + k * 3}deg)`, transformOrigin: '50% 0%'}}>
                  <PrintCard p={p} />
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* tirages qui surgissent en rythme */}
      {PRINTS.map((p, i) => {
        if (f < p.at) return null;
        if (p.strip && gather === 0) return null;
        const s = sp(f, p.at, {damping: 10, stiffness: 150});
        const pile = pileOf(i);
        const x = lerp(p.x, pile.x - (p.w + (p.strip ? 0 : 24)) / 2, gather);
        const y = lerp(p.y, pile.y - (p.h + (p.strip ? 0 : 24)) / 2, gather);
        const r = lerp(p.r + (p.strip ? (i - 3) * 3 : 0), pile.r, gather);
        return (
          <div
            key={p.src}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `rotate(${r}deg) scale(${p.strip ? 1 : lerp(0.3, 1, clamp(s)) + Math.max(0, s - 1) * 0.5})`,
              opacity: clamp(s * 3) * (1 - dim * 0.35),
            }}
          >
            <PrintCard p={p} />
          </div>
        );
      })}

      {f >= 120 && f < 470 ? <Confetti start={120} end={470} /> : null}

      {/* messages clés */}
      {f >= 326 && gather < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 1140,
            width: 960,
            height: 340,
            borderRadius: 36,
            background: 'rgba(255,255,255,0.97)',
            boxShadow: SHADOW,
            transform: `translateY(${lerp(500, 0, panel) + gather * 600}px)`,
          }}
        />
      ) : null}
      <Headline lines={['PHOTOS NUMÉRIQUES', 'ILLIMITÉES']} f={f} start={340} y={1186} size={72} align="center" exitStart={436} />
      <Headline lines={['IMPRESSIONS SELON', 'VOTRE FORMULE']} f={f} start={448} y={1166} size={70} align="center" exitStart={528} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1340, display: 'flex', justifyContent: 'center', gap: 14}}>
        {['100', '200', '300', '400'].map((n, i) => {
          const p = sp(f, 470 + i * 5, {damping: 11, stiffness: 180});
          return (
            <div
              key={n}
              style={{
                padding: '10px 22px',
                borderRadius: 24,
                background: i === 1 ? C.turq : C.bg,
                fontFamily: FONT,
                fontSize: 28,
                fontWeight: 700,
                color: C.text,
                transform: `scale(${clamp(p, 0, 1.2)})`,
                opacity: clamp(p * 2) * (1 - seg(f, 526, 10)),
              }}
            >
              {n} tirages
            </div>
          );
        })}
      </div>


      <AbsoluteFill style={{background: '#fff', opacity: flashA * 0.95, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flashB * 0.6, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
