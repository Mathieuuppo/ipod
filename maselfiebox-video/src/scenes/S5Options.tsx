import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, DATA, FONT, R} from '../theme';
import {E, clamp, euro, lerp, lerpRect, seg, sp} from '../lib/anim';
import {StepTitle} from '../components/StepTitle';
import {KineticText} from '../components/KineticText';
import {OC, OptionCard, PC, ProductCard} from '../components/Cards';
import {Cursor, cursorPos} from '../components/Cursor';
import {DirBlur} from '../components/Fx';

export const CHECK_AT = 150;
const P = R.panel;
const cardX = (j: number) => 30 + j * (OC.W + 30);
const CARD_Y = 196;
const THUMB = {x: P.x + 28, y: P.y + 24, w: 92, h: 92};

/** Contenu du panneau d'options (réutilisé au début de la scène 6). */
export const OptionsPanelContent: React.FC<{f: number; appear: number; checkAt: number; hover: number[]}> = ({f, appear, checkAt, hover}) => {
  const checked = f >= checkAt ? sp(f, checkAt, {damping: 11, stiffness: 200}) : 0;
  const price = lerp(325, 394, E.outCubic(seg(f, checkAt + 2, 26)));
  const promo = sp(f, checkAt + 20, {damping: 14, stiffness: 140});
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: FONT, color: C.text}}>
      <div style={{position: 'absolute', left: 146, top: 30, opacity: appear, transform: `translateX(${lerp(-20, 0, appear)}px)`}}>
        <div style={{fontSize: 15, fontWeight: 700, color: C.turqDark, letterSpacing: '0.06em'}}>FORMULE SÉLECTIONNÉE</div>
        <div style={{fontSize: 27, fontWeight: 700, marginTop: 4}}>Location borne photobooth – 200 impressions</div>
      </div>
      <div style={{position: 'absolute', right: 34, top: 44, fontSize: 15, fontWeight: 500, color: C.textSoft, opacity: appear}}>Étape 2 · Votre formule</div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 140, height: 1.5, background: C.line, transform: `scaleX(${appear})`, transformOrigin: '0 0'}} />
      <div style={{position: 'absolute', left: 30, top: 154, display: 'flex', gap: 12, alignItems: 'baseline', opacity: appear}}>
        <span style={{fontSize: 19, fontWeight: 700}}>Avec la borne</span>
        <span style={{fontSize: 15, color: C.textSoft}}>À ajouter, si vous voulez.</span>
      </div>
      <div style={{position: 'absolute', inset: 0, perspective: 2000}}>
        {DATA.options.map((o, j) => {
          const s = sp(f, 52 + j * 10, {damping: 12, stiffness: 120});
          const h = hover[j] ?? 0;
          return (
            <div
              key={o.name}
              style={{
                position: 'absolute',
                left: cardX(j),
                top: CARD_Y,
                opacity: clamp(s * 2.5),
                transformOrigin: '50% 100%',
                transform: `translateY(${lerp(150, 0, s) - h * 10}px) translateZ(${lerp(-260, 0, s) + h * 30}px) rotateX(${lerp(72, 0, s) + h * 3}deg) rotateY(${lerp((j - 1) * 14, 0, s) + h * (j - 1) * -4}deg)`,
              }}
            >
              <OptionCard name={o.name} img={o.img} pos={o.pos} price={o.price} desc={o.desc} hover={h} checked={j === 0 ? checked : 0} />
            </div>
          );
        })}
      </div>
      {/* barre « Votre sélection » (libellés réels du site) */}
      <div
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          top: 630,
          height: 66,
          borderRadius: 14,
          background: C.bg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 22,
          opacity: seg(f, 96, 16),
          transform: `translateY(${lerp(30, 0, E.outExpo(seg(f, 96, 24)))}px)`,
        }}
      >
        <div style={{fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: C.textSoft}}>VOTRE SÉLECTION</div>
        <div style={{fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + Math.sin(Math.PI * seg(f, checkAt + 2, 26)) * 0.08})`}}>
          {euro(Math.round(price))} € TTC
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: C.turqDark,
            opacity: clamp(promo * 2),
            transform: `translateX(${lerp(-24, 0, clamp(promo))}px)`,
          }}
        >
          Livre d’or avec photobooth : −20 € déjà déduits
        </div>
        <div style={{marginLeft: 'auto', fontSize: 14, color: C.textSoft}}>Exemple en soirée · hors livraison</div>
      </div>
    </div>
  );
};

export const S5Options: React.FC = () => {
  const f = useCurrentFrame();

  // morphing : carte sélectionnée -> panneau d'options
  const m = E.inOutExpo(seg(f, 0, 44));
  const rect = lerpRect(R.selCard, P, m);
  const cardFade = 1 - seg(f, 4, 14);
  const thumb = lerpRect({x: R.selCard.x, y: R.selCard.y, w: R.selCard.w, h: R.selCard.w * (PC.IMG / PC.W)}, THUMB, m);
  const appear = seg(f, 30, 24, E.outCubic);

  // séquence « cadre photo personnalisé » : le panneau recule dans la profondeur
  const k = seg(f, 252, 40, E.inOutExpo) * (1 - seg(f, 424, 46, E.inOutExpo));
  const print = sp(f, 262, {damping: 13, stiffness: 90});
  const printOut = E.inExpo(seg(f, 408, 30));
  const printOutPrev = E.inExpo(seg(f - 1, 408, 30));
  const PW = 860;
  const PH = (PW * 1707) / 2560;
  const px = lerp(2500, 1330, print) + printOut * 1400;
  const py = lerp(180, 600, print) - printOut * 120;
  const prot = lerp(28, -4, print) + Math.sin(f / 50) * 0.8 + printOut * 18;

  const hover = [
    seg(f, 132, 8) * (1 - seg(f, 176, 10)),
    seg(f, 190, 10) * (1 - seg(f, 228, 10)),
    0,
  ];
  const cb = {x: P.x + cardX(0) + 22 + 13, y: P.y + CARD_Y + OC.IMG + 16 + 15};
  const cur = cursorPos(f, [
    {f: 104, x: 1150, y: 1160},
    {f: 140, x: cb.x + 4, y: cb.y + 4},
    {f: 168, x: cb.x + 10, y: cb.y + 8},
    {f: 200, x: P.x + cardX(1) + 300, y: P.y + CARD_Y + 160},
    {f: 238, x: 1300, y: 1160},
  ]);
  const curOp = seg(f, 104, 6) * (1 - seg(f, 226, 12));

  return (
    <AbsoluteFill>
      <StepTitle num="03" lines={['PERSONNALISEZ', 'VOTRE EXPÉRIENCE']} f={f} start={18} x={120} y={66} size={72} numSize={140} layout="row" exitStart={440} />

      <AbsoluteFill style={{perspective: 2400}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transformOrigin: `${P.x}px 600px`,
            transform: `translateX(${-420 * k}px) translateZ(${-560 * k}px) rotateY(${18 * k}deg)`,
            opacity: 1 - 0.9 * k,
            filter: k > 0.01 ? `blur(${5 * k}px)` : undefined,
          }}
        >
          {/* conteneur qui morphe */}
          <div
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              borderRadius: lerp(18, 22, m),
              background: C.white,
              overflow: 'hidden',
              boxShadow: '0 50px 110px rgba(0,0,0,0.55)',
            }}
          >
            {cardFade > 0 ? (
              <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${R.selCard.w / PC.W})`, transformOrigin: '0 0', opacity: cardFade}}>
                <ProductCard n={200} img="products/pack-200.webp" price="280" selected={1} />
              </div>
            ) : null}
            {f >= 26 ? <OptionsPanelContent f={f} appear={appear} checkAt={CHECK_AT} hover={hover} /> : null}
          </div>
          {/* le visuel de la formule devient la vignette */}
          <div
            style={{
              position: 'absolute',
              left: thumb.x,
              top: thumb.y,
              width: thumb.w,
              height: thumb.h,
              borderRadius: lerp(0, 12, m),
              overflow: 'hidden',
              opacity: m > 0.02 ? 1 : 0,
            }}
          >
            <Img src={staticFile('products/pack-200.webp')} style={{width: '100%', height: thumb.w, objectFit: 'cover', display: 'block'}} />
          </div>
        </div>
      </AbsoluteFill>

      {/* exemple réel de cadre photo personnalisé */}
      {f >= 250 && f < 445 ? (
        <>
          <div style={{position: 'absolute', left: 120, top: 330}}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: C.turq,
                border: `1.5px solid ${C.turq}`,
                borderRadius: 20,
                padding: '7px 16px',
                opacity: seg(f, 272, 14) * (1 - seg(f, 402, 10)),
              }}
            >
              EXEMPLE RÉEL DE CADRE
            </div>
          </div>
          <div style={{position: 'absolute', left: 120, top: 396}}>
            <KineticText text="VOTRE CADRE PHOTO" f={f} start={282} size={58} exitStart={402} />
            <KineticText text="PERSONNALISÉ." f={f} start={290} size={58} exitStart={405} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 122,
              top: 560,
              width: 640,
              fontFamily: FONT,
              fontSize: 23,
              lineHeight: 1.5,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.86)',
              opacity: seg(f, 306, 18) * (1 - seg(f, 400, 12)),
              filter: `blur(${(1 - seg(f, 306, 18)) * 8}px)`,
            }}
          >
            Prénoms, date, couleurs, logo : nous le préparons avec vous quelques semaines avant l’événement, puis vous le validez depuis votre espace client.
          </div>
          <DirBlur id="print5" x={(printOut - printOutPrev) * 1400 * 0.3} style={{position: 'absolute', inset: 0}}>
            <div
              style={{
                position: 'absolute',
                left: px - PW / 2 - 18,
                top: py - PH / 2 - 18,
                padding: 18,
                background: '#fbfbf8',
                borderRadius: 6,
                transform: `rotate(${prot}deg)`,
                boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 6px 18px rgba(0,0,0,0.3)',
              }}
            >
              <Img src={staticFile('photos/cadre-vir-gillous.jpg')} style={{width: PW, height: PH, display: 'block'}} />
            </div>
          </DirBlur>
        </>
      ) : null}

      <Cursor f={f} x={cur.x} y={cur.y} clickAt={[CHECK_AT]} opacity={curOp} />
    </AbsoluteFill>
  );
};
