import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, R} from '../theme';
import {E, clamp, lerp, lerpRect, seg} from '../lib/anim';
import {StepTitle, Underlined} from '../components/StepTitle';
import {CalendarCard, CAL, SELECTED_DAY, dayCell} from '../components/CalendarCard';
import {ShotCrop} from '../components/Browser';
import {Cursor, cursorPos} from '../components/Cursor';

// capture réelle de l'étape 1 (1440x900 CSS) affichée plein cadre
const PS = 1920 / 1440;
const PAGE_TOP = -60;
// zone du vrai calendrier (titre + choix du créneau + grille), coordonnées CSS
const CROP = {x: 296, y: 84, w: 848, h: 812};
const CROP_SCREEN = {x: CROP.x * PS, y: CROP.y * PS + PAGE_TOP, w: CROP.w * PS, h: CROP.h * PS};

const SELECT_AT = 240;
const FOLD = 352;

export const S3Date: React.FC = () => {
  const f = useCurrentFrame();

  // ouverture circulaire depuis le turquoise de la scène précédente
  const iris = E.outExpo(seg(f, 0, 30)) * 1300;

  // la page réelle recule dans la profondeur
  const recede = seg(f, 26, 50, E.inOutCubic);
  const pageOp = 1 - seg(f, 84, 34);

  // le calendrier réel se détache, se retourne et devient la carte animée
  const lift = seg(f, 22, 26, E.outCubic);
  const flipT = seg(f, 64, 46, E.inOutCubic);
  const move = seg(f, 60, 52, E.inOutExpo);
  const foldMove = seg(f, FOLD + 16, 46, E.inOutExpo);
  let rect = lerpRect(CROP_SCREEN, R.calCard, move);
  rect = lerpRect(rect, R.cardCenter, foldMove);
  const tilt = lerp(lerp(0, -9, seg(f, 100, 60, E.outCubic)), -4, seg(f, 170, 40, E.inOutCubic)) * (1 - foldMove);
  const tiltX = lerp(4, 0, foldMove) * seg(f, 90, 40);
  const liftZ = lerp(0, 90, lift) * (1 - move);
  const cardScale = rect.w / CAL.W;

  // cible du curseur (centre de la case d'exemple, projection approx.)
  const cell = dayCell(SELECTED_DAY);
  const tx = R.calCard.x + (cell.x + CAL.CW / 2) * 1.006 + 1;
  const ty = R.calCard.y + CAL.GT + (cell.y - CAL.GT) + CAL.CH / 2 + 2;
  const cur = cursorPos(f, [
    {f: 176, x: 1980, y: 1140},
    {f: 226, x: tx + 6, y: ty + 4},
    {f: 300, x: tx + 40, y: ty + 70},
    {f: 340, x: 1990, y: 1150},
  ]);
  const curOp = seg(f, 176, 6) * (1 - seg(f, 320, 14));

  return (
    <AbsoluteFill>
      {/* page réelle */}
      {pageOp > 0 ? (
        <AbsoluteFill style={{perspective: 1600, perspectiveOrigin: '50% 30%'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: PAGE_TOP,
              width: 1920,
              height: 1200,
              transformOrigin: '50% 40%',
              transform: `translateZ(${-900 * recede}px) rotateX(${22 * recede}deg) scale(${1 + 0.03 * seg(f, 0, 30)})`,
              filter: `brightness(${lerp(1, 0.28, recede)}) blur(${4 * recede}px)`,
              opacity: pageOp,
            }}
          >
            <Img src={staticFile('screens/tunnel-1-date.png')} style={{width: 1920, height: 1200}} />
          </div>
        </AbsoluteFill>
      ) : null}

      <StepTitle num="01" lines={['CHOISISSEZ', 'VOTRE DATE']} f={f} start={100} x={120} y={200} size={100} numSize={170} exitStart={FOLD - 4} />
      <Underlined text="Vérifiez les disponibilités." f={f} start={262} x={124} y={640} size={38} exitStart={FOLD - 6} />

      {/* carte : face avant = découpe de la vraie capture, face arrière = calendrier animé */}
      <AbsoluteFill style={{perspective: 2400}}>
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${liftZ}px) rotateY(${180 * flipT + tilt}deg) rotateX(${tiltX}deg)`,
          }}
        >
          {/* face avant */}
          {flipT < 0.5 ? (<div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              borderRadius: lerp(0, 22, lift),
              overflow: 'hidden',
              boxShadow: `0 ${40 * lift}px ${90 * lift}px rgba(0,0,0,${0.6 * lift}), 0 0 0 ${2 * lift}px rgba(16,220,203,${0.8 * lift})`,
              background: C.white,
            }}
          >
            <ShotCrop src="screens/tunnel-1-date.png" pageW={1440} pageH={900} x={CROP.x} y={CROP.y} w={CROP.w} h={CROP.h} scale={rect.w / CROP.w} />
          </div>) : null}
          {/* face arrière */}
          {flipT >= 0.5 ? (<div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 22,
              background: C.white,
              boxShadow: '0 50px 110px rgba(0,0,0,0.6)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${cardScale}, ${rect.h / CAL.H})`, transformOrigin: '0 0', transformStyle: 'preserve-3d'}}>
              <CalendarCard f={f} daysStart={116} hoverAt={218} selectAt={SELECT_AT} foldStart={FOLD} />
            </div>
          </div>) : null}
        </div>
      </AbsoluteFill>

      <Cursor f={f} x={cur.x} y={cur.y} clickAt={[SELECT_AT]} opacity={curOp} />

      {/* iris turquoise d'ouverture */}
      {f < 32 ? (
        <AbsoluteFill
          style={{
            background: C.turq,
            WebkitMaskImage: `radial-gradient(circle at 50% 55%, transparent ${iris}px, #000 ${iris + 2}px)`,
            maskImage: `radial-gradient(circle at 50% 55%, transparent ${iris}px, #000 ${iris + 2}px)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
