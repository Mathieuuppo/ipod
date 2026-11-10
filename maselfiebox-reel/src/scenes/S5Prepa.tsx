import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW_SOFT} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {StepTitle} from '../components/Ui';
import {ExampleStrip} from './S4Cadre';

// visuel officiel de la borne (tête + LED latérale) — fond blanc fondu par « multiply »
export const BORNE = {x: 230, y: 640, w: 620, h: 775};

export const BorneImg: React.FC<{w: number; h: number; style?: React.CSSProperties}> = ({w, h, style}) => (
  <Img
    src={staticFile('brand/borne-tete-led.webp')}
    style={{
      width: w,
      height: h,
      mixBlendMode: 'multiply',
      maskImage: 'linear-gradient(to bottom, #000 82%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, #000 82%, transparent 100%)',
      ...style,
    }}
  />
);

const Pill: React.FC<{label: string; p: number; ok: number; children?: React.ReactNode}> = ({label, p, ok, children}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 18,
      padding: '18px 26px',
      borderRadius: 26,
      background: C.white,
      boxShadow: `${SHADOW_SOFT}, 0 0 0 ${ok > 0.01 ? 3 : 0}px ${C.turq}`,
      fontFamily: FONT,
      color: C.text,
      transform: `scale(${lerp(0.5, 1, clamp(p))}) translateY(${lerp(40, 0, clamp(p))}px)`,
      opacity: clamp(p * 2),
    }}
  >
    {children}
    <div>
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: '0.01em'}}>{label}</div>
    </div>
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        background: ok > 0.01 ? C.turq : C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${ok > 0 ? lerp(0.5, 1, clamp(ok)) + Math.sin(Math.PI * clamp(ok)) * 0.2 : 1})`,
      }}
    >
      {ok > 0.01 ? (
        <svg width={28} height={28} viewBox="0 0 16 16">
          <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.text} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  </div>
);

const COUNT = [100, 200, 300, 400];

export const S5Prepa: React.FC = () => {
  const f = useCurrentFrame();
  const inB = sp(f, 0, {damping: 14, stiffness: 90});
  const ry = lerp(-90, -8, inB) + Math.sin(f / 40) * 4 * seg(f, 40, 30);

  const t1 = sp(f, 52, {damping: 12, stiffness: 140});
  const t2 = sp(f, 82, {damping: 12, stiffness: 140});
  const t3 = sp(f, 112, {damping: 12, stiffness: 140});
  const ok = (at: number) => (f >= at ? sp(f, at, {damping: 9, stiffness: 220}) : 0);
  const o1 = ok(222);
  const o2 = ok(234);
  const o3 = ok(246);
  const badge = f >= 270 ? sp(f, 270, {damping: 8, stiffness: 160}) : 0;
  const out = E.inExpo(seg(f, 316, 30));

  // compteur 100 -> 200 -> 300 -> 400 puis arrêt sur l'exemple (200)
  const roll = seg(f, 130, 70, E.outCubic);
  const idx = f < 200 ? Math.floor(roll * 9) % 4 : 1;
  const tick = f < 200 ? (roll * 9) % 1 : 0;

  // traits de liaison étiquettes -> borne
  const line = (x1: number, y1: number, x2: number, y2: number, p: number) => (
    <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={C.turq} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
  );

  return (
    <AbsoluteFill>
      <StepTitle num="04" lines={['ON PRÉPARE', 'TOUT']} f={f} start={8} exitStart={322} />

      {/* éclairage studio */}
      <div style={{position: 'absolute', left: 540 - 520, top: 560, width: 1040, height: 1040, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0) 70%)'}} />
      <div style={{position: 'absolute', left: 540 - 300, top: 1388, width: 600, height: 70, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(20,60,60,0.22) 0%, rgba(20,60,60,0) 70%)', opacity: clamp(inB) * (1 - out)}} />

      <AbsoluteFill style={{perspective: 1600, mixBlendMode: 'multiply'}}>
        <div style={{position: 'absolute', left: BORNE.x + out * 700, top: BORNE.y, transform: `rotateY(${ry}deg)`, opacity: clamp(inB * 3)}}>
          <BorneImg w={BORNE.w} h={BORNE.h} />
        </div>
      </AbsoluteFill>

      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
        {line(330, 640, 420, 800, seg(f, 60, 24))}
        {line(780, 900, 700, 900, seg(f, 90, 24))}
        {line(330, 1240, 430, 1120, seg(f, 120, 24))}
      </svg>

      <div style={{position: 'absolute', left: 80, top: 520, transform: `translateX(${-out * 600}px)`}}>
        <Pill label="VOTRE CADRE" p={t1} ok={o1}>
          <div style={{width: 40, height: 120, overflow: 'hidden', borderRadius: 4}}>
            <ExampleStrip w={40} h={120} names={1} date={1} deco={1} tint={1} />
          </div>
        </Pill>
      </div>
      <div style={{position: 'absolute', left: 560, top: 840, transform: `translateX(${out * 600}px)`}}>
        <Pill label="VOTRE FORMULE" p={t2} ok={o2} />
        <div style={{marginTop: 12, marginLeft: 26, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.textSoft, opacity: clamp(t2)}}>ex. 200 impressions</div>
      </div>
      <div style={{position: 'absolute', left: 80, top: 1180, transform: `translateX(${-out * 600}px)`}}>
        <Pill label="VOS IMPRESSIONS" p={t3} ok={o3}>
          <div
            style={{
              width: 136,
              height: 76,
              borderRadius: 16,
              background: C.text,
              color: C.turq,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              position: 'relative',
            }}
          >
            <span style={{transform: `translateY(${-tick * 70}px)`, display: 'inline-block'}}>{COUNT[idx]}</span>
          </div>
        </Pill>
        <div style={{marginTop: 12, marginLeft: 26, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.textSoft, opacity: clamp(t3)}}>tirages selon la formule choisie</div>
      </div>

      {/* validation finale */}
      {badge > 0 ? (
        <div style={{position: 'absolute', left: 600, top: 1060, display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${badge}) translateX(${out * 700}px)`, transformOrigin: '60px 60px'}}>
          <div style={{width: 120, height: 120, borderRadius: 60, background: C.turq, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(16,180,170,0.35)'}}>
            <svg width={66} height={66} viewBox="0 0 16 16">
              <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.text} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.text, lineHeight: 1.05}}>
            MONTÉE
            <br />
            ET TESTÉE
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
