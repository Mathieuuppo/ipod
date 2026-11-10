import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW} from '../theme';
import {E, bounce, clamp, lerp, seg, sp} from '../lib/anim';
import {StepTitle, Tag} from '../components/Ui';
import {BorneImg} from './S5Prepa';

const CARD = {x: 80, y: 520, w: 920, h: 760};
// positions relatives réelles (longitude / latitude) des communes desservies
const geo = (lat: number, lon: number) => ({x: 70 + ((lon - 4.3) / 0.45) * 780, y: 70 + ((44.05 - lat) / 0.43) * 620});
const CITIES = [
  {n: 'Nîmes', ...geo(43.837, 4.36)},
  {n: 'Uzès', ...geo(44.012, 4.42)},
  {n: 'Saint-Gilles', ...geo(43.678, 4.432)},
  {n: 'Arles', ...geo(43.677, 4.631)},
];
const BASE = {n: 'Beaucaire', ...geo(43.808, 4.644)};
const EVENT = {x: 360, y: 250};
const P0 = BASE;
const P1 = {x: 560, y: 120};
const P2 = {x: 420, y: 420};
const P3 = EVENT;
const bez = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
    y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
  };
};
const PATH = `M ${P0.x} ${P0.y} C ${P1.x} ${P1.y}, ${P2.x} ${P2.y}, ${P3.x} ${P3.y}`;

const WORD_Y = 1316;

export const S6Livraison: React.FC = () => {
  const f = useCurrentFrame();

  const mapIn = sp(f, 6, {damping: 14, stiffness: 100});
  const route = E.inOutCubic(seg(f, 44, 96));
  const tok = bez(route);
  const arrive = f >= 142 ? sp(f, 142, {damping: 8, stiffness: 200}) : 0;
  const iris = E.inOutExpo(seg(f, 150, 40));

  // INSTALLATION : les lettres tombent et s'empilent
  const W1 = 'INSTALLATION';
  const w1out = E.inExpo(seg(f, 262, 16));
  const timer = seg(f, 206, 50);
  // VÉRIFICATION : balayage d'un scanner turquoise
  const scan = seg(f, 276, 30, E.inOutCubic);
  const w2out = E.inExpo(seg(f, 334, 16));
  // DÉMONSTRATION : surgit depuis le point de tap
  const TAPF = 348;
  const w3out = E.inExpo(seg(f, 420, 16));
  const ready = f >= 404 ? sp(f, 404, {damping: 10, stiffness: 160}) : 0;

  const chk = (at: number) => (f >= at ? sp(f, at, {damping: 10, stiffness: 200}) : 0);

  return (
    <AbsoluteFill>
      <StepTitle num="05" lines={['ON VOUS', 'LIVRE']} f={f} start={14} exitStart={426} />

      {/* carte : trajet graphique depuis Beaucaire */}
      <div
        style={{
          position: 'absolute',
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 36,
          background: C.white,
          boxShadow: SHADOW,
          overflow: 'hidden',
          transform: `translateY(${lerp(200, 0, clamp(mapIn))}px) rotateX(0deg)`,
          opacity: clamp(mapIn * 2),
          fontFamily: FONT,
        }}
      >
        <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(23,22,22,0.05) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(23,22,22,0.05) 1.5px, transparent 1.5px)', backgroundSize: '60px 60px'}} />
        <svg width={CARD.w} height={CARD.h} style={{position: 'absolute', inset: 0}}>
          <path d={PATH} stroke={C.line} strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d={PATH} stroke={C.turq} strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${route} 1`} />
        </svg>
        {CITIES.map((c, i) => {
          const p = sp(f, 24 + i * 5, {damping: 12, stiffness: 160});
          return (
            <div key={c.n} style={{position: 'absolute', left: c.x - 9, top: c.y - 9, display: 'flex', alignItems: 'center', gap: 12, opacity: clamp(p * 2), transform: `scale(${clamp(p)})`}}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: C.text, opacity: 0.35}} />
              <span style={{fontSize: 26, fontWeight: 500, color: C.textSoft}}>{c.n}</span>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: BASE.x - 16, top: BASE.y - 16, display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 32, height: 32, borderRadius: 16, background: C.text, border: `6px solid ${C.turq}`, boxSizing: 'border-box'}} />
          <span style={{fontSize: 28, fontWeight: 700, color: C.text}}>{BASE.n}</span>
        </div>
        <div style={{position: 'absolute', left: EVENT.x - 24, top: EVENT.y - 24, width: 48, height: 48, borderRadius: 24, background: C.turq, transform: `scale(${0.6 + arrive * 0.6})`, boxShadow: '0 0 0 14px rgba(16,220,203,0.2)'}} />
        <div style={{position: 'absolute', left: EVENT.x - 140, top: EVENT.y - 86, width: 280, textAlign: 'center', fontSize: 28, fontWeight: 800, color: C.text, opacity: clamp(arrive)}}>Votre événement</div>
        {/* la borne en route */}
        {route > 0 && route < 1 ? (
          <div style={{position: 'absolute', left: tok.x - 50, top: tok.y - 50, width: 100, height: 100, borderRadius: 50, background: C.white, boxShadow: SHADOW, overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'center'}}>
            <BorneImg w={100} h={125} style={{marginTop: -4}} />
          </div>
        ) : null}

        {/* arrivée : la vraie photo de la borne installée */}
        {iris > 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: `circle(${iris * 1250}px at ${EVENT.x}px ${EVENT.y}px)`,
            }}
          >
            <Img
              src={staticFile('photos/borne-terrasse-mariage.jpg')}
              style={{position: 'absolute', left: 0, top: 0, width: CARD.w, height: CARD.h, objectFit: 'cover', objectPosition: '50% 32%', transform: `scale(${lerp(1.25, 1.05, seg(f, 150, 300, E.outCubic))})`}}
            />
          </div>
        ) : null}

        {/* VÉRIFICATION : tests cochés sur la photo */}
        <div style={{position: 'absolute', left: 30, top: 30, display: 'flex', flexDirection: 'column', gap: 12, opacity: 1 - w2out * 0}}>
          {['Test photo', 'Test impression'].map((t, i) => {
            const c = chk(292 + i * 14);
            return c > 0 ? (
              <div key={t} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.95)', boxShadow: SHADOW, transform: `translateX(${lerp(-200, 0, clamp(c))}px)`, opacity: (1 - seg(f, 400, 10))}}>
                <div style={{width: 30, height: 30, borderRadius: 15, background: C.turq, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width={18} height={18} viewBox="0 0 16 16">
                    <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.text} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{fontSize: 26, fontWeight: 700, color: C.text}}>{t}</span>
              </div>
            ) : null;
          })}
        </div>

        {/* DÉMONSTRATION : tap */}
        {f >= TAPF - 10 && f < TAPF + 40 ? (
          <>
            <div style={{position: 'absolute', left: 640 - 38, top: 380 - 38, width: 76, height: 76, borderRadius: 38, background: 'rgba(23,22,22,0.22)', border: '4px solid #fff', transform: `scale(${f >= TAPF - 4 && f < TAPF + 3 ? 0.8 : 1})`, opacity: 1 - seg(f, TAPF + 20, 16)}} />
            {[0, 1].map((k) => (
              <div key={k} style={{position: 'absolute', left: 640 - 120, top: 380 - 120, width: 240, height: 240, borderRadius: 120, border: `5px solid ${C.turq}`, transform: `scale(${lerp(0.2, 1.4, E.outExpo(seg(f, TAPF + k * 8, 30)))})`, opacity: f >= TAPF + k * 8 ? 1 - seg(f, TAPF + k * 8, 30) : 0}} />
            ))}
          </>
        ) : null}

        {ready > 0 ? (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center'}}>
            <div style={{padding: '16px 30px', borderRadius: 34, background: C.turq, color: C.text, fontSize: 32, fontWeight: 800, transform: `scale(${ready})`, boxShadow: '0 16px 34px rgba(16,180,170,0.35)'}}>INSTALLÉE · PRÊTE</div>
          </div>
        ) : null}
      </div>

      {/* INSTALLATION */}
      {f >= 196 && w1out < 1 ? (
        <div style={{position: 'absolute', left: 80, top: WORD_Y, display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: 82, color: C.text, letterSpacing: '-0.02em', overflow: 'hidden', padding: '0.2em 0 0.1em', margin: '-0.2em 0 -0.1em'}}>
            {W1.split('').map((ch, i) => {
              const b = bounce(f, 196 + i * 2);
              return (
                <span key={i} style={{display: 'inline-block', transform: `translateY(${lerp(-260, 0, b) + w1out * 120}%) rotate(${lerp(20, 0, clamp(b))}deg)`, opacity: clamp((f - 196 - i * 2) / 4)}}>
                  {ch}
                </span>
              );
            })}
          </div>
          <svg width={86} height={86} style={{opacity: 1 - w1out}}>
            <circle cx={43} cy={43} r={34} stroke={C.line} strokeWidth={10} fill="none" />
            <circle cx={43} cy={43} r={34} stroke={C.turq} strokeWidth={10} fill="none" strokeDasharray={`${2 * Math.PI * 34 * timer} 300`} transform="rotate(-90 43 43)" strokeLinecap="round" />
          </svg>
          <div style={{position: 'absolute', left: 4, top: 104, fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.textSoft, opacity: seg(f, 214, 14) * (1 - w1out)}}>Environ 15 minutes, sur place</div>
        </div>
      ) : null}

      {/* VÉRIFICATION */}
      {f >= 272 && w2out < 1 ? (
        <div style={{position: 'absolute', left: 80, top: WORD_Y, transform: `translateY(${-w2out * 60}px)`, opacity: 1 - w2out}}>
          <div style={{position: 'relative', fontFamily: FONT, fontWeight: 800, fontSize: 82, color: C.text, letterSpacing: '-0.02em', clipPath: `inset(-10% ${(1 - scan) * 100}% -10% 0)`}}>VÉRIFICATION</div>
          <div style={{position: 'absolute', left: `${scan * 100}%`, top: -10, width: 8, height: 110, borderRadius: 4, background: C.turq, boxShadow: `0 0 24px ${C.turq}`, opacity: scan < 1 ? 1 : 0}} />
          <div style={{marginTop: 6, fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.textSoft, opacity: seg(f, 300, 14)}}>On teste tout avec vous</div>
        </div>
      ) : null}

      {/* DÉMONSTRATION */}
      {f >= TAPF && w3out < 1 ? (
        <div style={{position: 'absolute', left: 80, top: WORD_Y, opacity: 1 - w3out, transform: `translateY(${-w3out * 60}px)`}}>
          <div style={{display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: 82, color: C.text, letterSpacing: '-0.02em'}}>
            {'DÉMONSTRATION'.split('').map((ch, i) => {
              const p = sp(f, TAPF + 4 + Math.abs(i - 6) * 1.6, {damping: 10, stiffness: 180});
              return (
                <span key={i} style={{display: 'inline-block', transform: `scale(${clamp(p, 0, 1.2)}) translateY(${lerp(-80, 0, clamp(p))}px)`, color: i < 1 ? C.text : C.text}}>
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{marginTop: 6, fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.textSoft, opacity: seg(f, 372, 14)}}>On vous explique son utilisation</div>
        </div>
      ) : null}

      <div style={{position: 'absolute', left: 80, top: 1316, opacity: seg(f, 40, 12) * (1 - seg(f, 150, 10))}}>
        <Tag text="Livrée et installée par notre équipe" p={seg(f, 40, 18)} dark={false} />
      </div>
    </AbsoluteFill>
  );
};
