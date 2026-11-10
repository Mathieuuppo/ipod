import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DATA, FONT, R} from '../theme';
import {E, bounce, clamp, lerp, seg, sp} from '../lib/anim';
import {StepTitle} from '../components/StepTitle';
import {PC, ProductCard} from '../components/Cards';
import {Cursor, cursorPos} from '../components/Cursor';
import {DirBlur} from '../components/Fx';

const PIVOT = {x: 960, y: 1900};
const RAD = 1300;
const ANG = [-24, -8, 8, 24];
const fanPos = (i: number) => {
  const a = (ANG[i] * Math.PI) / 180;
  return {x: PIVOT.x + RAD * Math.sin(a), y: PIVOT.y - RAD * Math.cos(a), r: ANG[i]};
};
const rowPos = (i: number) => ({x: 960 + (i - 1.5) * 410, y: 640, r: 0});
const STAGE_K = 0.97;
const STAGE_S = (f: number) => lerp(1, STAGE_K, seg(f, 0, 150, E.outCubic));

export const SELECT_AT_F = 360;
const SEL = 1; // carte d'exemple : 200 impressions

type St = {x: number; y: number; r: number; ry: number; sc: number; op: number; blur: number; z: number};

const cardState = (i: number, f: number): St => {
  const fan = fanPos(i);
  const row = rowPos(i);
  const t = sp(f, 160 + i * 6, {damping: 15, stiffness: 120});
  const base = {x: lerp(fan.x, row.x, t), y: lerp(fan.y, row.y, t), r: lerp(fan.r, 0, t)};
  let st: St = {...base, ry: 0, sc: 1, op: 1, blur: 0, z: 0};
  if (i === 1) {
    // la carte issue du calendrier : retournement + glisse dans l'éventail
    const flip = sp(f, 0, {damping: 13, stiffness: 120});
    const go = sp(f, 22, {damping: 14, stiffness: 110});
    st = {
      ...st,
      x: lerp(960, base.x, go),
      y: lerp(590, base.y, go),
      r: lerp(0, base.r, go),
      ry: lerp(180, 360, flip),
    };
  } else if (i === 0) {
    const p = E.outExpo(seg(f, 34, 30));
    const pPrev = E.outExpo(seg(f - 1, 34, 30));
    st = {...st, x: lerp(-900, base.x, p), r: lerp(-50, base.r, p), op: clamp((f - 34) / 4), blur: (p - pPrev) * 1900 * 0.35};
  } else if (i === 2) {
    const b = bounce(f, 56);
    st = {...st, y: lerp(-760, base.y, b), r: lerp(18, base.r, b), op: clamp((f - 56) / 4)};
  } else {
    const p = E.outExpo(seg(f, 78, 36));
    st = {...st, sc: lerp(3.4, 1, p), op: clamp((f - 78) / 10), blur: 0, z: 0};
    (st as St & {focus: number}).focus = (1 - p) * 18;
  }
  // sortie : la sélection passe au premier plan, les autres s'écartent
  if (i !== SEL) {
    const dir = i < SEL ? -1 : 1;
    const k = Math.abs(i - SEL) - 1;
    const e = E.inExpo(seg(f, 386 + k * 5, 40));
    st.x += dir * 1500 * e;
    st.ry += dir * 45 * e;
    st.op *= 1 - seg(f, 400 + k * 5, 24);
    st.blur += e * 30;
  } else {
    const e = E.inOutExpo(seg(f, 390, 50));
    const stageS = STAGE_K;
    st.x = lerp(st.x, 960, e);
    st.y = lerp(st.y, 540 + (R.selCard.y + R.selCard.h / 2 - 540) / stageS, e);
    st.sc = lerp(st.sc, R.selCard.w / PC.W / stageS, e);
  }
  return st;
};

export const S4Formule: React.FC = () => {
  const f = useCurrentFrame();
  const stageS = STAGE_S(f);
  const tiltX = lerp(9, 0, seg(f, 150, 80, E.inOutCubic));

  const hover400 = seg(f, 282, 10) * (1 - seg(f, 316, 10));
  const hover200 = seg(f, 328, 10) * (1 - seg(f, 384, 12));
  const sel = f >= SELECT_AT_F ? sp(f, SELECT_AT_F, {damping: 9, stiffness: 220, mass: 0.6}) : 0;
  const press = f >= SELECT_AT_F - 4 && f < SELECT_AT_F + 3 ? 0.04 : 0;

  const cur = cursorPos(f, [
    {f: 248, x: 1990, y: 1120},
    {f: 290, x: 1572, y: 786},
    {f: 336, x: 792, y: 800},
    {f: 372, x: 798, y: 806},
    {f: 410, x: 1120, y: 1160},
  ]);
  const curOp = seg(f, 248, 6) * (1 - seg(f, 396, 12));

  const order = [3, 0, 2, 1]; // la carte sélectionnée est dessinée au-dessus
  return (
    <AbsoluteFill>
      <StepTitle num="02" lines={['CHOISISSEZ', 'VOTRE FORMULE']} f={f} start={36} x={120} y={66} size={76} numSize={150} layout="row" exitStart={430} />

      <AbsoluteFill style={{transform: `scale(${stageS})`, transformOrigin: '960px 540px'}}>
        <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: '50% 60%'}}>
          <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `rotateX(${tiltX}deg)`, transformOrigin: '50% 70%'}}>
            {order.map((i) => {
              const st = cardState(i, f);
              if (st.op <= 0.001) return null;
              const focus = (st as St & {focus?: number}).focus ?? 0;
              const hv = i === 3 ? hover400 : i === 1 ? hover200 : 0;
              const bob = Math.sin((f + i * 37) / 40) * 5 * seg(f, 120, 40);
              const ry = st.ry % 360;
              const showBack = ry > 90 && ry < 270;
              const fm = DATA.formules[i];
              return (
                <DirBlur key={i} id={`pc${i}`} x={st.blur} style={{position: 'absolute', inset: 0, opacity: st.op}}>
                  <div
                    style={{
                      position: 'absolute',
                      left: st.x - PC.W / 2,
                      top: st.y - PC.H / 2 + bob - hv * 16,
                      width: PC.W,
                      height: PC.H,
                      transform: `rotate(${st.r}deg) rotateY(${st.ry}deg) scale(${st.sc * (1 - (i === SEL ? press : 0))})`,
                      filter: focus > 0.3 ? `blur(${focus}px)` : undefined,
                    }}
                  >
                    {showBack ? (
                      <div style={{width: PC.W, height: PC.H, borderRadius: 18, background: C.white, boxShadow: '0 30px 60px rgba(0,0,0,0.45)'}} />
                    ) : (
                      <ProductCard n={fm.n} img={fm.img} price={fm.from} hover={hv} selected={i === SEL ? sel : 0} />
                    )}
                  </div>
                </DirBlur>
              );
            })}
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1000,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.55)',
          opacity: seg(f, 220, 20) * (1 - seg(f, 384, 14)),
        }}
      >
        Tarifs « dès » TTC affichés sur {DATA.url}
      </div>

      <Cursor f={f} x={cur.x} y={cur.y} clickAt={[SELECT_AT_F]} opacity={curOp} />
    </AbsoluteFill>
  );
};
