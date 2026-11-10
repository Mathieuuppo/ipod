import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Headline, Tag} from '../components/Ui';
import {KineticText} from '../components/KineticText';
import {DirBlur} from '../components/Fx';
import {SUM, SumCard} from './S2Reservation';

// forme turquoise finale (bandelette) reprise par la scène 4
export const STRIP0 = {x: 390, y: 560, w: 300, h: 900};

const PCT_AT = 60; // impact du « % » (13,5 s + 0,5 s = temps fort)
const RING = {x: 540, y: 1150, r: 220};

const BankCard: React.FC = () => (
  <div
    style={{
      width: 440,
      height: 278,
      borderRadius: 26,
      background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2F1 55%, #E2E9E8 100%)',
      boxShadow: SHADOW,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: FONT,
    }}
  >
    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, background: C.turq}} />
    <div style={{position: 'absolute', left: 60, top: 64, width: 66, height: 50, borderRadius: 10, background: 'linear-gradient(135deg,#d9dede,#b9c2c2)', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.08)'}} />
    <div style={{position: 'absolute', left: 60, top: 160, fontSize: 30, fontWeight: 600, letterSpacing: '0.18em', color: C.text}}>•••• •••• •••• ••••</div>
    <div style={{position: 'absolute', left: 60, bottom: 30, fontSize: 18, fontWeight: 600, letterSpacing: '0.14em', color: C.textSoft}}>CARTE BANCAIRE</div>
    <div style={{position: 'absolute', right: -80, top: -80, width: 260, height: 260, borderRadius: 130, border: `2px solid rgba(16,220,203,0.35)`}} />
  </div>
);

export const S3Acompte: React.FC = () => {
  const f = useCurrentFrame();

  // la carte de réservation se couche et devient « 30 »
  const lay = E.inOutCubic(seg(f, 0, 30));
  const d3 = sp(f, 10, {damping: 12, stiffness: 120});
  const d0 = sp(f, 18, {damping: 12, stiffness: 120});
  const pct = f >= PCT_AT - 8 ? sp(f, PCT_AT - 8, {damping: 9, stiffness: 200, mass: 0.8}) : 0;
  const shake = f >= PCT_AT && f < PCT_AT + 14 ? Math.sin((f - PCT_AT) * 2.4) * (1 - (f - PCT_AT) / 14) * 10 : 0;

  // « 30 % » remonte en tête d'écran
  const up = E.inOutExpo(seg(f, 84, 34));
  const bigScale = lerp(1, 0.5, up);
  const bigY = lerp(980, 440, up);

  // carte bancaire + anneau 30 %
  const card = sp(f, 128, {damping: 13, stiffness: 100});
  const insert = E.inOutExpo(seg(f, 176, 26));
  const fill = E.inOutCubic(seg(f, 200, 50)) * 0.3;
  const ringIn = sp(f, 140, {damping: 14, stiffness: 110});
  const check = f >= 256 ? sp(f, 256, {damping: 9, stiffness: 190}) : 0;

  // sortie : le « % » se transforme en bandelette
  const out = E.inExpo(seg(f, 300, 24));
  const morph = E.inOutExpo(seg(f, 306, 46));
  const pctBox = {x: 540 + 245 * bigScale - 90, y: bigY - 280 * bigScale, w: 330 * bigScale, h: 380 * bigScale};
  const mr = {
    x: lerp(pctBox.x, STRIP0.x, morph),
    y: lerp(pctBox.y, STRIP0.y, morph),
    w: lerp(pctBox.w, STRIP0.w, morph),
    h: lerp(pctBox.h, STRIP0.h, morph),
  };

  const circ = 2 * Math.PI * RING.r;
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${-shake * 0.6}px)`}}>
      {/* carte de demande qui se couche */}
      {lay < 1 ? (
        <AbsoluteFill style={{perspective: 1400}}>
          <div style={{position: 'absolute', left: SUM.x, top: SUM.y, transformOrigin: '50% 100%', transform: `rotateX(${70 * lay}deg) scale(${lerp(1, 1.15, lay)})`, opacity: 1 - lay}}>
            <SumCard p={1} sent={1} />
          </div>
        </AbsoluteFill>
      ) : null}

      <div style={{position: 'absolute', left: 80, top: 262, opacity: seg(f, 96, 14) * (1 - out)}}>
        <KineticText text="02 — L’ACOMPTE" f={f} start={96} size={44} weight={700} color={C.turqDark} stagger={0.8} />
      </div>

      {/* « 30 % » géant en perspective */}
      <AbsoluteFill style={{perspective: 1300, perspectiveOrigin: '50% 60%'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: bigY - 300,
            height: 420,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            transform: `scale(${bigScale}) translateY(${-out * 300}px)`,
            transformOrigin: '50% 100%',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 460,
            lineHeight: 0.8,
            letterSpacing: '-0.06em',
            color: C.text,
            opacity: 1 - out,
          }}
        >
          {[d3, d0].map((d, i) => (
            <span key={i} style={{display: 'inline-block', transformOrigin: '50% 100%', transform: `rotateX(${lerp(84, 0, d)}deg) translateY(${lerp(160, 0, clamp(d))}px)`, opacity: clamp(d * 3)}}>
              {i === 0 ? '3' : '0'}
            </span>
          ))}
          <span
            style={{
              display: 'inline-block',
              marginLeft: 20,
              fontSize: 330,
              color: C.turq,
              transform: `scale(${lerp(4, 1, pct)}) rotate(${lerp(-30, 0, clamp(pct))}deg)`,
              opacity: morph > 0 ? 0 : clamp(pct * 3),
              filter: pct < 0.9 ? `blur(${(1 - pct) * 12}px)` : undefined,
              textShadow: '0 20px 40px rgba(16,180,170,0.25)',
            }}
          >
            %
          </span>
        </div>
      </AbsoluteFill>
      {/* onde d'impact du % */}
      {f >= PCT_AT && f < PCT_AT + 34 ? (
        <div
          style={{
            position: 'absolute',
            left: 760 - 400,
            top: 860 - 400,
            width: 800,
            height: 800,
            borderRadius: 400,
            border: `5px solid ${C.turq}`,
            transform: `scale(${lerp(0.15, 1.1, E.outExpo(seg(f, PCT_AT, 34)))})`,
            opacity: 1 - seg(f, PCT_AT, 34),
          }}
        />
      ) : null}

      <Headline lines={['RÉGLEZ VOTRE', 'ACOMPTE']} f={f} start={104} y={660} size={92} exitStart={298} />

      {/* anneau : 30 % rempli, le reste neutre */}
      {f >= 136 ? (
        <div style={{position: 'absolute', left: RING.x - RING.r - 30, top: RING.y - RING.r - 30, transform: `scale(${lerp(0.5, 1, clamp(ringIn)) * (1 - out)})`, opacity: clamp(ringIn * 2) * (1 - out)}}>
          <svg width={RING.r * 2 + 60} height={RING.r * 2 + 60}>
            <circle cx={RING.r + 30} cy={RING.r + 30} r={RING.r} stroke="#E1E7E6" strokeWidth={38} fill={C.white} />
            <circle
              cx={RING.r + 30}
              cy={RING.r + 30}
              r={RING.r}
              stroke={C.turq}
              strokeWidth={38}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circ * fill} ${circ}`}
              transform={`rotate(-90 ${RING.r + 30} ${RING.r + 30})`}
            />
          </svg>
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: C.text}}>
            <div style={{fontSize: 120, fontWeight: 800, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums'}}>{Math.round(fill * 100)} %</div>
            <div style={{fontSize: 26, fontWeight: 600, color: C.textSoft}}>du montant TTC</div>
          </div>
          {check > 0 ? (
            <div style={{position: 'absolute', right: 34, top: 34, width: 96, height: 96, borderRadius: 48, background: C.turq, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${check})`, boxShadow: '0 14px 30px rgba(16,180,170,0.35)'}}>
              <svg width={52} height={52} viewBox="0 0 16 16">
                <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.text} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* carte bancaire illustrative */}
      {f >= 126 && insert < 1 ? (
        <AbsoluteFill style={{perspective: 1400}}>
          <DirBlur id="bank" y={(E.inOutExpo(seg(f, 176, 26)) - E.inOutExpo(seg(f - 1, 176, 26))) * 260 * 0.2} style={{position: 'absolute', inset: 0}}>
            <div
              style={{
                position: 'absolute',
                left: lerp(lerp(1300, 600, card), RING.x - 220, insert),
                top: lerp(860, RING.y - 139, insert),
                transform: `rotateY(${lerp(lerp(-70, -22, card), 0, insert) + Math.sin(f / 18) * 4 * (1 - insert)}deg) rotateX(${lerp(14, 70, insert)}deg) rotateZ(${lerp(-8, 0, insert)}deg) scale(${lerp(0.9, 0.4, insert)})`,
                opacity: 1 - seg(f, 194, 8),
              }}
            >
              <BankCard />
            </div>
          </DirBlur>
        </AbsoluteFill>
      ) : null}

      <div style={{position: 'absolute', left: 0, right: 0, top: 1404, display: 'flex', justifyContent: 'center', gap: 16, opacity: seg(f, 150, 16) * (1 - out)}}>
        <Tag text="Réglé en ligne par carte, à la réservation" p={seg(f, 150, 18)} dark={false} />
      </div>
      <div style={{position: 'absolute', right: 80, top: 880, opacity: 1 - out}}>
        <Tag text="Illustration" p={seg(f, 160, 18)} />
      </div>

      {/* le « % » se transforme en bandelette turquoise */}
      {morph > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: mr.x,
            top: mr.y,
            width: mr.w,
            height: mr.h,
            borderRadius: lerp(120, 16, morph),
            background: C.turq,
            transform: `rotate(${Math.sin(Math.PI * morph) * -14}deg)`,
            boxShadow: SHADOW,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
