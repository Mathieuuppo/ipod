import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, R} from '../theme';
import {E, clamp, euro, lerp, lerpRect, seg, sp} from '../lib/anim';
import {StepTitle} from '../components/StepTitle';
import {StepsBar} from '../components/CalendarCard';
import {Cursor, cursorPos} from '../components/Cursor';
import {OptionsPanelContent} from './S5Options';

const RC = R.recap;
const PAD = 48;
const SCROLL = 330;
export const PAY_CLICK = 330;
const CONFIRM = 360;
const ORIGIN = {x: 1400, y: 700};

/** Bloc de confirmation (illustration) — réutilisé par la scène 7. */
export const Confirmation: React.FC<{p: number; check: number}> = ({p, check}) => (
  <div style={{position: 'absolute', inset: 0, fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 170}}>
    <div
      style={{
        width: 150,
        height: 150,
        borderRadius: 75,
        background: C.turq,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${p})`,
        boxShadow: `0 0 0 ${lerp(0, 22, check)}px rgba(16,220,203,0.18)`,
      }}
    >
      <svg width={80} height={80} viewBox="0 0 16 16">
        <path
          d="M3 8.5 L6.5 12 L13 4.5"
          stroke={C.text}
          strokeWidth={1.7}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={20}
          strokeDashoffset={20 * (1 - check)}
        />
      </svg>
    </div>
    <div style={{fontSize: 46, fontWeight: 800, marginTop: 44, opacity: clamp(p), letterSpacing: '-0.01em'}}>Acompte réglé</div>
    <div style={{fontSize: 20, lineHeight: 1.5, color: C.textSoft, marginTop: 14, width: 560, textAlign: 'center', opacity: clamp(p)}}>
      Nous vérifions la livraison, puis nous confirmons votre réservation par e-mail.
    </div>
    <div
      style={{
        marginTop: 54,
        fontSize: 15,
        fontWeight: 600,
        color: C.textSoft,
        border: `1.5px solid ${C.line}`,
        borderRadius: 20,
        padding: '9px 18px',
        opacity: clamp(p),
      }}
    >
      Illustration du parcours — aucune réservation réelle
    </div>
  </div>
);

const Row: React.FC<{f: number; at: number; label: string; value: string; price?: string; accent?: boolean}> = ({f, at, label, value, price, accent}) => {
  const p = E.outExpo(seg(f, at, 24));
  return (
    <div style={{height: 78, overflow: 'hidden', borderBottom: `1px solid ${C.line}`}}>
      <div style={{display: 'flex', alignItems: 'center', height: 78, transform: `translateX(${lerp(-60, 0, p)}px)`, opacity: p}}>
        <div style={{flex: 1}}>
          <div style={{fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: C.textSoft}}>{label}</div>
          <div style={{fontSize: 20, fontWeight: 600, marginTop: 2, color: accent ? C.turqDark : C.text}}>{value}</div>
        </div>
        {price ? <div style={{fontSize: 21, fontWeight: 700, color: accent ? C.turqDark : C.text}}>{price}</div> : null}
      </div>
    </div>
  );
};

export const S6Reservation: React.FC = () => {
  const f = useCurrentFrame();

  // morphing panneau d'options -> carte récapitulatif
  const m = E.inOutExpo(seg(f, 0, 42));
  const rect = lerpRect(R.panel, RC, m);
  const oldOut = 1 - seg(f, 0, 14);
  const newIn = seg(f, 30, 16);

  // défilement vers le paiement + poussée de caméra
  const scroll = E.inOutExpo(seg(f, 200, 44)) * SCROLL;
  const push = lerp(1, 1.07, E.inOutCubic(seg(f, 196, 50))) - 0.07 * E.inOutCubic(seg(f, 372, 50));
  const amount = 118.2 * E.outCubic(seg(f, 226, 30));

  // clic, chargement, validation
  const btnPress = f >= PAY_CLICK - 4 && f < PAY_CLICK + 3 ? 1 : 0;
  const loading = seg(f, PAY_CLICK + 2, 6) * (1 - seg(f, CONFIRM - 6, 6));
  const btnDone = seg(f, CONFIRM - 6, 8);
  const confirm = sp(f, CONFIRM, {damping: 11, stiffness: 140});
  const check = seg(f, CONFIRM + 8, 22, E.outCubic);
  const contentOut = seg(f, CONFIRM - 2, 16);

  // bouton : coordonnées carte -> écran
  const btn = {x: PAD + (800 - 2 * PAD) / 2, y: 900 + 39 - SCROLL};
  const toScreen = (x: number, y: number, P: number) => ({x: ORIGIN.x + (RC.x + x - ORIGIN.x) * P, y: ORIGIN.y + (RC.y + y - ORIGIN.y) * P});
  const bS = toScreen(btn.x, btn.y, 1.07);
  const cur = cursorPos(f, [
    {f: 252, x: 1700, y: 1150},
    {f: 318, x: bS.x + 20, y: bS.y + 6},
    {f: 344, x: bS.x + 26, y: bS.y + 12},
    {f: 380, x: 1900, y: 1150},
  ]);
  const curOp = seg(f, 252, 6) * (1 - seg(f, 360, 12));

  // l'étape « Vos coordonnées » (capture réelle, formulaire vide) défile en profondeur
  const pass = seg(f, 104, 130, E.inOutCubic);
  const passOp = seg(f, 104, 16) * (1 - seg(f, 214, 20));

  return (
    <AbsoluteFill>
      {passOp > 0 ? (
        <AbsoluteFill style={{perspective: 1800}}>
          <div
            style={{
              position: 'absolute',
              left: lerp(1500, -700, pass),
              top: 640,
              transform: 'rotateY(-30deg) translateZ(-260px)',
              opacity: passOp * 0.9,
            }}
          >
            <div style={{fontFamily: FONT, fontSize: 20, fontWeight: 600, color: C.turq, marginBottom: 12, letterSpacing: '0.04em'}}>ÉTAPE 3 · VOS COORDONNÉES</div>
            <div style={{width: 760, height: 475, borderRadius: 14, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)'}}>
              <Img src={staticFile('screens/tunnel-3-coordonnees.png')} style={{width: 760, height: 475}} />
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      <StepTitle num="04" lines={['FINALISEZ', 'VOTRE', 'RÉSERVATION']} f={f} start={14} x={120} y={150} size={96} numSize={170} exitStart={436} />

      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`}}>
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            borderRadius: 22,
            background: C.white,
            overflow: 'hidden',
            boxShadow: '0 50px 110px rgba(0,0,0,0.55)',
            fontFamily: FONT,
            color: C.text,
          }}
        >
          {oldOut > 0 ? (
            <div style={{position: 'absolute', left: 0, top: 0, width: R.panel.w, height: R.panel.h, opacity: oldOut, transform: `scale(${lerp(1, 0.6, m)})`, transformOrigin: '0 0'}}>
              <OptionsPanelContent f={999} appear={1} checkAt={0} hover={[0, 0, 0]} />
              <div style={{position: 'absolute', left: 28, top: 24, width: 92, height: 92, borderRadius: 12, overflow: 'hidden'}}>
                <Img src={staticFile('products/pack-200.webp')} style={{width: 92, height: 92, objectFit: 'cover'}} />
              </div>
            </div>
          ) : null}

          {newIn > 0 ? (
            <div style={{position: 'absolute', left: 0, top: 0, width: RC.w, height: RC.h, opacity: newIn}}>
              {/* contenu qui défile */}
              <div
                style={{
                  position: 'absolute',
                  left: PAD,
                  top: 0,
                  width: RC.w - 2 * PAD,
                  transform: `translateY(${-scroll}px)`,
                  opacity: 1 - contentOut,
                  filter: contentOut > 0.01 ? `blur(${contentOut * 8}px)` : undefined,
                }}
              >
                <div style={{position: 'absolute', top: 104, fontSize: 34, fontWeight: 800}}>Votre sélection</div>
                <div style={{position: 'absolute', top: 166, width: '100%'}}>
                  <Row f={f} at={46} label="DATE" value="Date d’exemple · soirée" />
                  <Row f={f} at={58} label="FORMULE" value="Location borne photobooth – 200 impressions" price="325 € TTC" />
                  <Row f={f} at={70} label="OPTION" value="Livre d’or audio" price="+ 89 € TTC" />
                  <Row f={f} at={82} label="REMISE" value="Livre d’or avec photobooth" price="− 20 €" accent />
                </div>
                <div style={{position: 'absolute', top: 504, width: '100%', opacity: seg(f, 96, 16)}}>
                  <div style={{fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: C.textSoft}}>TOTAL</div>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
                    <div style={{fontSize: 56, fontWeight: 800, letterSpacing: '-0.02em'}}>{euro(Math.round(lerp(0, 394, E.outCubic(seg(f, 96, 30)))))} € TTC</div>
                    <div style={{fontSize: 17, color: C.textSoft}}>328,33 € HT</div>
                  </div>
                  <div style={{fontSize: 15, color: C.textSoft, marginTop: 4}}>Hors livraison, calculée selon votre adresse à l’étape suivante.</div>
                </div>
                {/* paiement de l'acompte (conditions générales : 30 % TTC) */}
                <div style={{position: 'absolute', top: 690, width: '100%', opacity: seg(f, 204, 24)}}>
                  <div style={{fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', color: C.turqDark}}>PAIEMENT</div>
                  <div style={{fontSize: 28, fontWeight: 700, marginTop: 6}}>Acompte à régler en ligne</div>
                  <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10}}>
                    <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
                      <span style={{fontSize: 62, fontWeight: 800, color: C.turqDark, letterSpacing: '-0.02em'}}>30 %</span>
                      <span style={{fontSize: 18, color: C.textSoft}}>du montant TTC</span>
                    </div>
                    <span style={{fontSize: 42, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{euro(amount, 2)} €</span>
                  </div>
                  <div style={{fontSize: 15, color: C.textSoft, marginTop: 4}}>Le solde est réglé au plus tard 72 h avant la prestation.</div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 900,
                    width: '100%',
                    height: 78,
                    opacity: seg(f, 214, 20),
                    borderRadius: 14,
                    background: btnDone > 0 ? C.turqDark : C.turq,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 23,
                    fontWeight: 700,
                    color: C.text,
                    transform: `scale(${1 - btnPress * 0.035})`,
                    boxShadow: `0 ${lerp(16, 6, btnPress)}px ${lerp(30, 12, btnPress)}px rgba(16,220,203,0.35)`,
                  }}
                >
                  {loading > 0.05 ? (
                    <svg width={36} height={36} viewBox="0 0 36 36" style={{opacity: loading, transform: `rotate(${(f - PAY_CLICK) * 14}deg)`}}>
                      <circle cx={18} cy={18} r={14} stroke={C.text} strokeWidth={3.5} fill="none" strokeDasharray="60 30" strokeLinecap="round" />
                    </svg>
                  ) : btnDone > 0 ? (
                    <span style={{color: C.white}}>✓</span>
                  ) : (
                    'Régler l’acompte'
                  )}
                </div>
                <div style={{position: 'absolute', top: 994, fontSize: 14, color: C.textSoft}}>Paiement par carte bancaire.</div>
              </div>
              {/* barre d'étapes réelle, fixe */}
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 92, background: C.white, opacity: 1 - contentOut}}>
                <div style={{position: 'absolute', left: PAD, top: 36}}>
                  <StepsBar active={f >= 196 ? 3 : 2} done={2} f={f} doneAt={[0, 0, 196]} size={15} />
                </div>
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: PAD,
                  bottom: 26,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: C.textSoft,
                  opacity: seg(f, 200, 16) * (1 - contentOut),
                }}
              >
                ILLUSTRATION
              </div>
              {f >= CONFIRM ? <Confirmation p={confirm} check={check} /> : null}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      <Cursor f={f} x={cur.x} y={cur.y} clickAt={[PAY_CLICK]} opacity={curOp} />
    </AbsoluteFill>
  );
};
