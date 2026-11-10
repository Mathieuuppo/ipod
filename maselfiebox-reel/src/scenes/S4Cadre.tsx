import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW, SHADOW_SOFT} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Headline, StepTitle, Tag} from '../components/Ui';
import {STRIP0} from './S3Acompte';

// Données FICTIVES, affichées comme exemple
const EX = {names: 'Léa & Hugo', date: '12 . 06 . 2027', theme: 'Bohème chic'};
const STRIP1 = {x: 700, y: 760, w: 250, h: 750};
export const STRIP2 = {x: 390, y: 660, w: 300, h: 900};
const FORM = {x: 80, y: 740, w: 580, h: 700};

/** Bandelette 5 x 15 cm (3 photos) — gabarit réel du site, rempli d'un exemple. */
export const ExampleStrip: React.FC<{w: number; h: number; names: number; date: number; deco: number; tint: number; slots?: number}> = ({w, h, names, date, deco, tint, slots = 1}) => {
  const k = w / 380;
  const pad = 22 * k;
  const slotH = 236 * k;
  return (
    <div style={{width: w, height: h, borderRadius: 12 * k, background: C.white, position: 'relative', overflow: 'hidden', fontFamily: FONT, boxShadow: SHADOW}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(16,220,203,${0.1 * tint}) 0%, rgba(255,255,255,0) 60%)`}} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: pad,
            top: pad + i * (slotH + 14 * k),
            width: w - 2 * pad,
            height: slotH,
            borderRadius: 6 * k,
            background: C.turq,
            opacity: clamp(slots * 3 - i),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 17 * k,
            fontWeight: 600,
            letterSpacing: '0.12em',
          }}
        >
          VOTRE PHOTO ICI
        </div>
      ))}
      {/* ornement « bohème » : filets et losange */}
      <div style={{position: 'absolute', left: 0, right: 0, top: pad + 3 * slotH + 2 * 14 * k + 34 * k, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * k, opacity: deco}}>
        <div style={{width: 80 * k * deco, height: 2 * k, background: C.turqDark}} />
        <div style={{width: 12 * k, height: 12 * k, background: C.turq, transform: 'rotate(45deg)'}} />
        <div style={{width: 80 * k * deco, height: 2 * k, background: C.turqDark}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: pad + 3 * slotH + 2 * 14 * k + 70 * k,
          textAlign: 'center',
          fontSize: 44 * k,
          fontWeight: 700,
          color: C.text,
          letterSpacing: '-0.01em',
          opacity: names,
          transform: `translateY(${lerp(20, 0, names)}px)`,
        }}
      >
        {EX.names}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: pad + 3 * slotH + 2 * 14 * k + 136 * k, textAlign: 'center', fontSize: 20 * k, fontWeight: 600, letterSpacing: '0.3em', color: C.turqDark, opacity: date}}>
        {EX.date}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 22 * k, textAlign: 'center', fontSize: 14 * k, fontWeight: 600, letterSpacing: '0.1em', color: C.textSoft, opacity: deco}}>
        MA SELFIE BOX
      </div>
    </div>
  );
};

const typed = (s: string, f: number, start: number, cps = 1.6) => s.slice(0, Math.max(0, Math.floor((f - start) / cps)));

const Field: React.FC<{label: string; f: number; at: number; children: React.ReactNode}> = ({label, f, at, children}) => {
  const p = E.outExpo(seg(f, at, 22));
  return (
    <div style={{marginTop: 20, opacity: p, transform: `translateX(${lerp(-40, 0, p)}px)`}}>
      <div style={{fontSize: 20, fontWeight: 600, letterSpacing: '0.08em', color: C.textSoft}}>{label}</div>
      <div style={{marginTop: 8, minHeight: 62, borderRadius: 14, border: `2px solid ${C.line}`, background: C.white, display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 30, fontWeight: 600, color: C.text, gap: 12}}>
        {children}
      </div>
    </div>
  );
};

const FRAMES = [
  {src: 'frames/cadre-vir-gillous.jpg', x: -60, y: 760, rot: -12, d: 0},
  {src: 'frames/cadre-steph-jc.jpg', x: 600, y: 900, rot: 10, d: 8},
  {src: 'frames/cadre-ville-de-nimes.webp', x: -30, y: 1230, rot: 7, d: 16},
];

export const S4Cadre: React.FC = () => {
  const f = useCurrentFrame();

  // la bandelette turquoise devient le gabarit réel « bandelette 5 x 15 »
  const toStrip = E.inOutExpo(seg(f, 0, 40));
  const slots = seg(f, 20, 24);
  const grow = E.inOutExpo(seg(f, 262, 46));
  const r1 = {
    x: lerp(STRIP0.x, STRIP1.x, toStrip),
    y: lerp(STRIP0.y, STRIP1.y, toStrip),
    w: lerp(STRIP0.w, STRIP1.w, toStrip),
    h: lerp(STRIP0.h, STRIP1.h, toStrip),
  };
  const r = {x: lerp(r1.x, STRIP2.x, grow), y: lerp(r1.y, STRIP2.y, grow), w: lerp(r1.w, STRIP2.w, grow), h: lerp(r1.h, STRIP2.h, grow)};
  const turqCover = 1 - seg(f, 14, 18);

  // les données de l'exemple volent vers la bandelette
  const fly = (at: number) => E.inOutExpo(seg(f, at, 34));
  const names = fly(214);
  const date = fly(226);
  const deco = fly(238);
  const tint = fly(250);
  const formOut = E.inExpo(seg(f, 256, 30));

  // rotation 3D + parallaxe du cadre
  const ry = Math.sin((f - 300) / 34) * 16 * seg(f, 300, 30) * (1 - seg(f, 430, 20));
  const flipOut = E.inExpo(seg(f, 440, 40));

  const formX = FORM.x - formOut * 800;
  const valueAnchor = (row: number) => ({x: formX + 50, y: FORM.y + 150 + row * 112});
  const strip = {x: r.x, y: r.y, w: r.w, h: r.h};
  const k = strip.w / 380;
  const target = {
    names: {x: strip.x + strip.w / 2 - 110, y: strip.y + strip.h * 0.72},
    date: {x: strip.x + strip.w / 2 - 80, y: strip.y + strip.h * 0.8},
    deco: {x: strip.x + strip.w / 2 - 40, y: strip.y + strip.h * 0.68},
  };
  const flyer = (txt: React.ReactNode, from: {x: number; y: number}, to: {x: number; y: number}, p: number) =>
    p > 0 && p < 1 ? (
      <div
        style={{
          position: 'absolute',
          left: lerp(from.x, to.x, p),
          top: lerp(from.y, to.y, p) - Math.sin(Math.PI * p) * 160,
          transform: `scale(${lerp(1, 0.8, p)}) rotate(${Math.sin(Math.PI * p) * 12}deg)`,
          padding: '10px 18px',
          borderRadius: 14,
          background: C.turq,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 28,
          color: C.text,
          boxShadow: SHADOW_SOFT,
          whiteSpace: 'nowrap',
          opacity: 1 - seg(p, 0.85, 0.15),
        }}
      >
        {txt}
      </div>
    ) : null;

  return (
    <AbsoluteFill>
      <StepTitle num="03" lines={['UN CADRE', 'À VOTRE IMAGE']} f={f} start={10} exitStart={444} />

      <Headline lines={['VOUS NOUS ENVOYEZ', 'VOS INFORMATIONS']} f={f} start={34} y={520} size={64} exitStart={206} />
      <Headline lines={['NOUS CRÉONS VOTRE', 'CADRE PERSONNALISÉ']} f={f} start={300} y={490} size={62} exitStart={438} />

      {/* vrais cadres Ma Selfie Box en arrière-plan */}
      {f >= 330 && f < 470 ? (
        <AbsoluteFill style={{perspective: 1600}}>
          {FRAMES.map((fr) => {
            const p = sp(f, 334 + fr.d, {damping: 13, stiffness: 100});
            return (
              <div
                key={fr.src}
                style={{
                  position: 'absolute',
                  left: fr.x,
                  top: fr.y,
                  padding: 12,
                  background: C.white,
                  borderRadius: 8,
                  boxShadow: SHADOW,
                  transform: `translateZ(${lerp(-600, -120, p)}px) rotate(${fr.rot}deg) rotateY(${-ry * 0.5}deg)`,
                  opacity: clamp(p * 2) * (1 - seg(f, 436, 14)),
                }}
              >
                <Img src={staticFile(fr.src)} style={{width: 500, height: 333, objectFit: 'cover', display: 'block'}} />
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 80, top: 1440, opacity: 1 - seg(f, 436, 10)}}>
            <Tag text="Exemples réels de cadres" p={seg(f, 350, 18)} />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* formulaire d'exemple */}
      {formOut < 1 && f >= 56 ? (
        <div
          style={{
            position: 'absolute',
            left: formX,
            top: FORM.y,
            width: FORM.w,
            height: FORM.h,
            borderRadius: 30,
            background: C.white,
            boxShadow: SHADOW,
            padding: '30px 36px',
            boxSizing: 'border-box',
            fontFamily: FONT,
            transform: `translateY(${lerp(120, 0, E.outExpo(seg(f, 56, 30)))}px) rotate(${-formOut * 10}deg)`,
            opacity: seg(f, 56, 12),
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 26, fontWeight: 800, color: C.text}}>Votre cadre</div>
            <Tag text="Exemple" p={seg(f, 70, 18)} />
          </div>
          <Field label="PRÉNOMS" f={f} at={70}>
            <span style={{opacity: names > 0.05 ? 0.25 : 1}}>{typed(EX.names, f, 84)}</span>
          </Field>
          <Field label="DATE" f={f} at={80}>
            <span style={{opacity: date > 0.05 ? 0.25 : 1}}>{typed(EX.date, f, 104)}</span>
          </Field>
          <Field label="THÈME" f={f} at={90}>
            <span style={{opacity: deco > 0.05 ? 0.25 : 1}}>{typed(EX.theme, f, 126)}</span>
          </Field>
          <Field label="COULEURS" f={f} at={100}>
            {[C.turq, C.text, C.white].map((c, i) => (
              <div key={c} style={{width: 38, height: 38, borderRadius: 19, background: c, border: `2px solid ${C.line}`, transform: `scale(${sp(f, 148 + i * 5, {damping: 10, stiffness: 200})})`}} />
            ))}
          </Field>
          <Field label="INSPIRATIONS" f={f} at={110}>
            {['frames/format-bandelette.jpg', 'frames/cadre-vir-gillous.jpg'].map((s, i) => (
              <Img key={s} src={staticFile(s)} style={{width: 74, height: 50, objectFit: 'cover', borderRadius: 6, transform: `scale(${sp(f, 168 + i * 6, {damping: 10, stiffness: 200})})`}} />
            ))}
          </Field>
        </div>
      ) : null}

      {/* bandelette */}
      <AbsoluteFill style={{perspective: 1500}}>
        <div
          style={{
            position: 'absolute',
            left: strip.x,
            top: strip.y,
            transform: `rotateY(${ry + 90 * flipOut}deg) rotate(${lerp(-6, 0, toStrip) + Math.sin(f / 50) * 1.2}deg)`,
          }}
        >
          <ExampleStrip w={strip.w} h={strip.h} names={names} date={date} deco={deco} tint={tint} slots={slots} />
          {turqCover > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: 16 * k, background: C.turq, opacity: turqCover}} /> : null}
          <div style={{position: 'absolute', right: -20, top: -24, opacity: 1 - flipOut}}>
            <Tag text="Exemple" p={seg(f, 276, 18)} />
          </div>
        </div>
      </AbsoluteFill>

      {flyer(EX.names, valueAnchor(0), target.names, names)}
      {flyer(EX.date, valueAnchor(1), target.date, date)}
      {flyer(EX.theme, valueAnchor(2), target.deco, deco)}
      {flyer(
        <div style={{display: 'flex', gap: 6}}>
          {[C.turq, C.text, C.white].map((c) => (
            <div key={c} style={{width: 24, height: 24, borderRadius: 12, background: c}} />
          ))}
        </div>,
        valueAnchor(3),
        {x: strip.x + 40, y: strip.y + 40},
        tint,
      )}
    </AbsoluteFill>
  );
};
