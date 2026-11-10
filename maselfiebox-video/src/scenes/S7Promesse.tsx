import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, R} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {KineticText} from '../components/KineticText';
import {Shatter} from '../components/Three';
import {Confirmation} from './S6Reservation';
import {DirBlur} from '../components/Fx';

const SHUTTER = 150;

export const S7Promesse: React.FC = () => {
  const f = useCurrentFrame();

  // 1. la carte de confirmation se désassemble en éléments turquoise
  const cardOp = 1 - seg(f, 2, 6);

  // 2. photo réelle de la borne en situation (terrasse face à la mer)
  const reveal = E.inOutExpo(seg(f, 10, 48));
  const kb = seg(f, 0, 360, E.linear);
  const imgScale = lerp(1.08, 1.0, kb);
  const imgX = lerp(30, -30, kb);

  // 3. obturateur : la photo devient un tirage papier
  const flash = f >= SHUTTER ? Math.max(0, 1 - (f - SHUTTER) / 9) : 0;
  const toPrint = E.inOutExpo(seg(f, SHUTTER + 4, 40));
  // cadre plein écran -> tirage posé à droite
  const full = {x: 0, y: 0, w: 1920, h: 1080};
  const printR = {x: 1010, y: 150, w: 760, h: 700};
  const pr = {
    x: lerp(full.x, printR.x, toPrint),
    y: lerp(full.y, printR.y, toPrint),
    w: lerp(full.w, printR.w, toPrint),
    h: lerp(full.h, printR.h, toPrint),
  };
  const border = lerp(0, 20, toPrint);
  const imgSize = lerp(1400, 980, toPrint);
  const rot = lerp(0, -3, toPrint) + Math.sin(f / 45) * 0.5 * toPrint;

  // 4. un vrai tirage Ma Selfie Box sort de l'imprimante
  const out = sp(f, SHUTTER + 34, {damping: 16, stiffness: 70});
  const P2W = 600;
  const P2H = (P2W * 1024) / 1535;

  // 5. volet turquoise vers l'outro
  const wipe = E.inOutExpo(seg(f, 292, 54));
  const wipePrev = E.inOutExpo(seg(f - 1, 292, 54));
  const exitUp = E.inExpo(seg(f, 296, 40));

  return (
    <AbsoluteFill>
      {/* photo / tirage */}
      <div
        style={{
          position: 'absolute',
          left: pr.x - border,
          top: pr.y - border + exitUp * -900,
          width: pr.w + border * 2,
          height: pr.h + border * 2,
          background: '#fbfbf8',
          padding: border,
          borderRadius: lerp(0, 6, toPrint),
          transform: `rotate(${rot}deg)`,
          boxShadow: toPrint > 0 ? `0 ${60 * toPrint}px ${120 * toPrint}px rgba(0,0,0,${0.6 * toPrint})` : undefined,
          clipPath: toPrint > 0 ? undefined : `inset(0 0 0 ${(1 - reveal) * 100}%)`,
        }}
      >
        <div style={{position: 'relative', width: pr.w, height: pr.h, overflow: 'hidden'}}>
          <Img
            src={staticFile('photos/borne-terrasse-mer.jpg')}
            style={{
              position: 'absolute',
              width: imgSize,
              height: imgSize,
              left: lerp(600, pr.w / 2 - 0.48 * imgSize, toPrint) + imgX,
              top: lerp((1080 - imgSize) / 2 + 60, (pr.h - imgSize) / 2 + 30, toPrint),
              transform: `scale(${imgScale})`,
              transformOrigin: '48% 40%',
              maxWidth: 'none',
            }}
          />
          {/* dégradé pour la lisibilité du texte (plein cadre uniquement) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(5,7,8,1) 0%, rgba(5,7,8,0.96) 30%, rgba(5,7,8,0.55) 46%, rgba(5,7,8,0) 64%)',
              opacity: 1 - toPrint,
            }}
          />
          {/* lumière chaude / turquoise qui dérive */}
          <div
            style={{
              position: 'absolute',
              left: lerp(-200, 900, kb),
              top: -200,
              width: 900,
              height: 900,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,220,203,0.22) 0%, rgba(16,220,203,0) 70%)',
              mixBlendMode: 'screen',
            }}
          />
          <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.85}} />
        </div>
      </div>

      {/* tirage réel qui sort de l'imprimante */}
      {f >= SHUTTER + 30 ? (
        <div
          style={{
            position: 'absolute',
            left: 860,
            top: lerp(1180, 600, out) + exitUp * -1200,
            padding: 14,
            background: '#fbfbf8',
            borderRadius: 4,
            transform: `rotate(${lerp(10, 5, out)}deg)`,
            boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
          }}
        >
          <Img src={staticFile('photos/tirage-60-ans-valerie.jpg')} style={{width: P2W, height: P2H, display: 'block'}} />
        </div>
      ) : null}

      {/* phrases */}
      <div style={{position: 'absolute', left: 120, top: 400}}>
        <KineticText text="QUELQUES CLICS" f={f} start={44} size={84} stagger={1.6} dur={30} exitStart={136} />
        <KineticText text="POUR RÉSERVER." f={f} start={52} size={84} stagger={1.6} dur={30} exitStart={139} />
      </div>
      <div style={{position: 'absolute', left: 120, top: 400}}>
        <KineticText text="DES SOUVENIRS" f={f} start={172} size={84} stagger={1.8} dur={34} exitStart={296} />
        <KineticText text="POUR LONGTEMPS." f={f} start={182} size={84} stagger={1.8} dur={34} exitStart={299} />
      </div>

      {/* carte qui se brise */}
      {cardOp > 0 ? (
        <div style={{position: 'absolute', left: R.recap.x, top: R.recap.y, width: R.recap.w, height: R.recap.h, borderRadius: 22, background: C.white, opacity: cardOp}}>
          <Confirmation p={1} check={1} />
        </div>
      ) : null}
      {f < 90 ? <Shatter rect={R.recap} start={0} origin={{x: R.recap.x + 400, y: R.recap.y + 245}} /> : null}

      {/* volet turquoise diagonal */}
      {wipe > 0 ? (
        <DirBlur id="wipe7" x={(wipe - wipePrev) * 3000 * 0.25} style={{position: 'absolute', inset: 0}}>
          <div
            style={{
              position: 'absolute',
              left: lerp(-2900, -400, wipe),
              top: -400,
              width: 2900,
              height: 1900,
              background: C.turq,
              transform: 'skewX(-18deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: lerp(-2900, -400, wipe) + 2900 - 40,
              top: -400,
              width: 22,
              height: 1900,
              background: C.white,
              transform: 'skewX(-18deg)',
              opacity: clamp(1 - wipe) * 0.9,
            }}
          />
        </DirBlur>
      ) : null}
    </AbsoluteFill>
  );
};
