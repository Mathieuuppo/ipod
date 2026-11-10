import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, DATA, FONT, SHADOW, SHADOW_SOFT} from '../theme';
import {E, bounce, clamp, lerp, lerpRect, seg, sp} from '../lib/anim';
import {MobileBrowser, StepTitle, Tag, Tap, tapPos} from '../components/Ui';
import {CalendarCard, CAL, SELECTED_DAY, dayCell} from '../components/CalendarCard';
import {PC, ProductCard} from '../components/Cards';
import {DirBlur} from '../components/Fx';
import {B0} from './S1Intro';

// carte récapitulative finale (reprise par la scène 3)
export const SUM = {x: 140, y: 760, w: 800, h: 430};

const BW = B0.w;
const CONTENT_W = BW - 20;
const K = CONTENT_W / 1170; // échelle capture -> écran
// zone du vrai calendrier sur la capture mobile (px image)
const CAL_IMG = {x: 36, y: 1640, w: 1098, h: 1230};
const DATE_SCROLL = CAL_IMG.y * K - 150;
const CROP_SCREEN = {x: B0.x + 10 + CAL_IMG.x * K, y: B0.y + 10 + 92 + 150, w: CAL_IMG.w * K, h: CAL_IMG.h * K};
const CAL_RECT = {x: 80, y: 520, w: 920, h: (920 * CAL.H) / CAL.W};

const SELECT_DAY = 176;
const PICK = 288; // choix de la formule
const OPT = 356; // case livre d'or
const SEND = 424; // bouton

const SC = 0.86;
const cardPos = (i: number) => ({x: 210 + (i % 2) * 350, y: 560 + Math.floor(i / 2) * 477});

const OptRow: React.FC<{img: string; pos: string; name: string; price: string; checked: number; p: number}> = ({img, pos, name, price, checked, p}) => (
  <div
    style={{
      width: 660,
      height: 150,
      borderRadius: 22,
      background: checked > 0.5 ? C.soft : C.white,
      boxShadow: `${SHADOW_SOFT}, 0 0 0 ${checked > 0.01 ? 3 : 1.5}px ${checked > 0.01 ? C.turq : C.line}`,
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      padding: '0 22px',
      fontFamily: FONT,
      color: C.text,
      transform: `translateX(${lerp(240, 0, p)}px) rotateY(${lerp(-40, 0, p)}deg)`,
      opacity: clamp(p * 2),
    }}
  >
    <Img src={staticFile(img)} style={{width: 106, height: 106, borderRadius: 14, objectFit: 'cover', objectPosition: pos}} />
    <div style={{flex: 1}}>
      <div style={{fontSize: 27, fontWeight: 700}}>{name}</div>
      <div style={{fontSize: 24, fontWeight: 600, color: C.textSoft, marginTop: 2}}>+ {price} € TTC</div>
    </div>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        border: `3px solid ${checked > 0.01 ? C.turqDark : C.textSoft}`,
        background: `rgba(28,154,143,${clamp(checked)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${1 + Math.sin(Math.PI * clamp(checked)) * 0.3})`,
      }}
    >
      <svg width={26} height={26} viewBox="0 0 16 16">
        <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.white} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - clamp(checked))} />
      </svg>
    </div>
  </div>
);

export const SumCard: React.FC<{p?: number; sent?: number}> = ({p = 1, sent = 0}) => (
  <div style={{width: SUM.w, height: SUM.h, borderRadius: 30, background: C.white, boxShadow: SHADOW, fontFamily: FONT, color: C.text, padding: '40px 46px', boxSizing: 'border-box', position: 'relative'}}>
    <div style={{fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: C.turqDark}}>VOTRE DEMANDE</div>
    {[
      ['Date', 'Date d’exemple · soirée'],
      ['Formule', 'Borne photobooth – 200 impressions'],
      ['Option', 'Livre d’or audio'],
    ].map(([l, v], i) => (
      <div key={l} style={{display: 'flex', gap: 20, alignItems: 'baseline', marginTop: i === 0 ? 24 : 14, opacity: clamp((p - i * 0.15) * 2)}}>
        <div style={{width: 130, fontSize: 22, color: C.textSoft, fontWeight: 500}}>{l}</div>
        <div style={{fontSize: 28, fontWeight: 600}}>{v}</div>
      </div>
    ))}
    <div style={{position: 'absolute', left: 46, bottom: 36, display: 'flex', alignItems: 'center', gap: 14, opacity: clamp(sent * 2)}}>
      <div style={{width: 44, height: 44, borderRadius: 22, background: C.turq, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${lerp(0.4, 1, E.outBack(clamp(sent)))})`}}>
        <svg width={26} height={26} viewBox="0 0 16 16">
          <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.text} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{fontSize: 28, fontWeight: 700}}>Demande envoyée</div>
    </div>
    <div style={{position: 'absolute', right: 40, bottom: 40, fontSize: 18, fontWeight: 600, letterSpacing: '0.12em', color: C.textSoft, opacity: clamp(sent * 2)}}>ILLUSTRATION</div>
  </div>
);

export const S2Reservation: React.FC = () => {
  const f = useCurrentFrame();

  // 1. navigation : accueil -> page « Votre date » (vraies captures)
  const nav = seg(f, 26, 26, E.inOutExpo);
  const recede = seg(f, 70, 40, E.inOutCubic);
  const brOp = 1 - seg(f, 104, 30);

  // 2. le vrai calendrier se détache puis se retourne
  const lift = seg(f, 62, 20, E.outCubic);
  const flip = seg(f, 82, 36, E.inOutCubic);
  const move = seg(f, 76, 44, E.inOutExpo);
  const calOut = seg(f, 200, 26, E.inExpo);
  let calRect = lerpRect(CROP_SCREEN, CAL_RECT, move);
  calRect = {...calRect, x: lerp(calRect.x, -200, calOut), y: lerp(calRect.y, 60, calOut)};
  const calScale = lerp(1, 0.3, calOut);
  const calOp = 1 - seg(f, 214, 12);

  // 3. formules : 4 cartes flottantes en 3D
  const picked = f >= PICK ? sp(f, PICK, {damping: 9, stiffness: 220, mass: 0.6}) : 0;
  const settle = E.inOutExpo(seg(f, PICK + 18, 40));

  // 5. bouton « ENVOYER MA DEMANDE » -> récapitulatif
  const btnIn = sp(f, 384, {damping: 12, stiffness: 150});
  const morph = E.inOutExpo(seg(f, SEND + 4, 18));
  const loading = seg(f, SEND + 8, 6) * (1 - seg(f, SEND + 26, 6));
  const done = seg(f, SEND + 28, 8);
  const gather = E.inOutExpo(seg(f, 448, 26));
  const sent = seg(f, 462, 14);

  const dc = dayCell(SELECTED_DAY);
  const cs = CAL_RECT.w / CAL.W;
  const tapDay = {x: CAL_RECT.x + (dc.x + CAL.CW / 2) * cs, y: CAL_RECT.y + (dc.y + CAL.CH / 2) * cs};
  const c1 = cardPos(1);
  const tap = tapPos(f, [
    {f: 130, x: 980, y: 1560},
    {f: 166, x: tapDay.x + 6, y: tapDay.y + 6},
    {f: 200, x: tapDay.x + 30, y: tapDay.y + 120},
    {f: 276, x: c1.x + 160, y: c1.y + 380},
    {f: 320, x: 900, y: 900},
    {f: 348, x: 935, y: 650},
    {f: 380, x: 900, y: 1000},
    {f: 414, x: 560, y: 1188},
    {f: 446, x: 760, y: 1450},
  ]);
  const tapOp = seg(f, 130, 8) * (1 - seg(f, 444, 10));

  const btnW = lerp(840, 120, morph);

  return (
    <AbsoluteFill>
      <StepTitle num="01" lines={['VOUS', 'RÉSERVEZ']} f={f} start={8} exitStart={452} />

      {/* navigateur : vraie capture, navigation vers « Votre date » */}
      {brOp > 0 ? (
        <AbsoluteFill style={{perspective: 1800}}>
          <div
            style={{
              position: 'absolute',
              left: B0.x,
              top: B0.y,
              opacity: brOp,
              transform: `translateZ(${-500 * recede}px) rotateY(${lerp(B0.ry, 8, recede)}deg) rotateX(${B0.rx}deg)`,
              filter: recede > 0.01 ? `blur(${4 * recede}px)` : undefined,
            }}
          >
            <MobileBrowser w={BW} h={B0.h} src="screens/m-accueil.jpg" imgH={1992}>
              <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - nav) * 1100}px)`, background: C.white}}>
                <Img src={staticFile('screens/m-date.jpg')} style={{position: 'absolute', left: 0, top: -DATE_SCROLL, width: CONTENT_W, height: 4386 * K, maxWidth: 'none'}} />
              </div>
            </MobileBrowser>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* calendrier : face avant = vrai calendrier ; face arrière = calendrier animé */}
      {f >= 60 && calOp > 0 ? (
        <AbsoluteFill style={{perspective: 2200}}>
          <div
            style={{
              position: 'absolute',
              left: calRect.x,
              top: calRect.y,
              width: calRect.w,
              height: calRect.h,
              opacity: calOp,
              transformOrigin: '50% 50%',
              transform: `translateZ(${120 * lift * (1 - move)}px) rotateY(${180 * flip}deg) scale(${calScale})`,
            }}
          >
            {flip < 0.5 ? (
              <div style={{position: 'absolute', inset: 0, borderRadius: lerp(0, 26, lift), overflow: 'hidden', background: C.white, boxShadow: lift > 0 ? SHADOW : undefined}}>
                <Img
                  src={staticFile('screens/m-date.jpg')}
                  style={{position: 'absolute', left: (-CAL_IMG.x * calRect.w) / CAL_IMG.w, top: (-CAL_IMG.y * calRect.h) / CAL_IMG.h, width: (1170 * calRect.w) / CAL_IMG.w, maxWidth: 'none'}}
                />
              </div>
            ) : (
              <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', borderRadius: 26, background: C.white, boxShadow: SHADOW}}>
                <div style={{transform: `scale(${calRect.w / CAL.W}, ${calRect.h / CAL.H})`, transformOrigin: '0 0'}}>
                  <CalendarCard f={f} daysStart={112} hoverAt={160} selectAt={SELECT_DAY} />
                </div>
              </div>
            )}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* puce date retenue */}
      {f >= 214 ? (
        <div style={{position: 'absolute', left: 80, top: 470, transform: `translateY(${-gather * 0}px)`, opacity: 1 - gather}}>
          <Tag text="Date d’exemple · soirée" p={seg(f, 214, 18)} />
        </div>
      ) : null}

      {/* formules 100 / 200 / 300 / 400 */}
      {f >= 210 && f < 470 ? (
        <AbsoluteFill style={{perspective: 2000}}>
          {[0, 2, 3, 1].map((i) => {
            const base = cardPos(i);
            const st = 214 + i * 8;
            let x = base.x;
            let y = base.y;
            let rz = 0;
            let ry = 0;
            let sc = SC;
            let op = 1;
            let blur = 0;
            if (i === 0) {
              const p = E.outExpo(seg(f, st, 26));
              x = lerp(-700, base.x, p);
              rz = lerp(-30, 0, p);
              blur = (E.outExpo(seg(f, st, 26)) - E.outExpo(seg(f - 1, st, 26))) * 1100 * 0.3;
              op = clamp((f - st) / 4);
            } else if (i === 1) {
              const p = sp(f, st, {damping: 12, stiffness: 120});
              ry = lerp(180, 0, p);
              op = clamp((f - st) / 4);
            } else if (i === 2) {
              const b = bounce(f, st);
              y = lerp(-700, base.y, b);
              op = clamp((f - st) / 4);
            } else {
              const p = E.outExpo(seg(f, st, 32));
              sc = SC * lerp(3, 1, p);
              op = clamp((f - st) / 8);
              blur = (1 - p) * 30;
            }
            const bob = Math.sin((f + i * 41) / 36) * 6;
            // sélection et sortie
            if (i !== 1) {
              const g = E.inCubic(seg(f, PICK + 10 + i * 3, 30));
              y += 1600 * g;
              rz += (i % 2 ? 1 : -1) * 40 * g;
              op *= 1 - seg(f, PICK + 26 + i * 3, 14);
            } else {
              x = lerp(base.x, 80, settle);
              y = lerp(base.y, 560, settle);
              sc = lerp(SC, 0.62, settle);
              if (f > SEND + 20) {
                op *= 1 - gather;
              }
            }
            const hover = i === 1 ? seg(f, 268, 8) * (1 - settle) : 0;
            const showBack = ry > 90;
            if (op <= 0.001) return null;
            const fm = DATA.formules[i];
            return (
              <DirBlur key={i} id={`fc${i}`} x={blur} style={{position: 'absolute', inset: 0, opacity: op}}>
                <div
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y + bob - hover * 16,
                    width: PC.W,
                    height: PC.H,
                    transformOrigin: '0 0',
                    transform: `scale(${sc}) rotate(${rz}deg) rotateY(${ry}deg)`,
                    filter: i === 3 && blur > 0.5 ? `blur(${blur}px)` : undefined,
                  }}
                >
                  {showBack ? (
                    <div style={{width: PC.W, height: PC.H, borderRadius: 18, background: C.turq, boxShadow: SHADOW}} />
                  ) : (
                    <ProductCard n={fm.n} img={fm.img} price={fm.from} hover={hover} selected={i === 1 ? picked : 0} />
                  )}
                </div>
              </DirBlur>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* option */}
      {f >= 318 && f < 476 ? (
        <AbsoluteFill style={{perspective: 1600}}>
          {DATA.options.map((o, j) => {
            const p = sp(f, 320 + j * 8, {damping: 13, stiffness: 130});
            const ch = j === 0 && f >= OPT ? sp(f, OPT, {damping: 10, stiffness: 200}) : 0;
            return (
              <div key={o.name} style={{position: 'absolute', left: 340, top: 572 + j * 172, opacity: 1 - gather}}>
                <OptRow img={o.img} pos={o.pos} name={o.name} price={o.price} checked={ch} p={p} />
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* bouton -> chargement -> validation */}
      {f >= 380 && f < 470 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - btnW / 2,
            top: 1128,
            width: btnW,
            height: 120,
            borderRadius: 60,
            background: done > 0 ? C.turqDark : C.turq,
            boxShadow: '0 24px 50px rgba(16,180,170,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: '0.02em',
            color: C.text,
            transform: `scale(${lerp(0.4, 1, clamp(btnIn)) * (f >= SEND - 4 && f < SEND + 3 ? 0.95 : 1)}) translateY(${-gather * 200}px)`,
            opacity: clamp(btnIn * 2) * (1 - gather),
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {morph < 0.3 ? (
            <span style={{opacity: 1 - morph * 3}}>ENVOYER MA DEMANDE</span>
          ) : loading > 0.05 ? (
            <svg width={56} height={56} viewBox="0 0 36 36" style={{transform: `rotate(${f * 14}deg)`, opacity: loading}}>
              <circle cx={18} cy={18} r={13} stroke={C.text} strokeWidth={4} fill="none" strokeDasharray="56 30" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width={56} height={56} viewBox="0 0 16 16" style={{transform: `scale(${lerp(0.4, 1, E.outBack(done))})`}}>
              <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.white} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ) : null}

      {/* tout se rassemble dans la demande */}
      {f >= 448 ? (
        <div
          style={{
            position: 'absolute',
            left: SUM.x,
            top: SUM.y,
            transform: `scale(${lerp(0.3, 1, gather)}) translateY(${lerp(300, 0, gather)}px)`,
            opacity: clamp(gather * 2),
          }}
        >
          <SumCard p={gather} sent={sent} />
        </div>
      ) : null}

      <Tap f={f} x={tap.x} y={tap.y} taps={[SELECT_DAY, PICK, OPT, SEND]} opacity={tapOp} />
    </AbsoluteFill>
  );
};
