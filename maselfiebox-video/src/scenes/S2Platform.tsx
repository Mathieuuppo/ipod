import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {E, clamp, keys, lerp, logLerp, seg, sp} from '../lib/anim';
import {KineticText} from '../components/KineticText';
import {Underlined} from '../components/StepTitle';
import {BrowserFrame, ShotCrop} from '../components/Browser';
import {Logo, LOGO_RATIO} from '../components/Logo';
import {Cursor, cursorPos} from '../components/Cursor';
import {DirBlur} from '../components/Fx';
import {LOGO_W_INTRO} from './S1Intro';

// Navigateur : contenu = capture réelle 1440x900 (CSS) de reservation.maselfiebox.fr
const BX = 800;
const BY = 190;
const BW = 1010;
const BAR = 50;
const SC = BW / 1440; // échelle de la capture
const BH = 900 * SC + BAR;
// bouton réel « Vérifier ma date » (coordonnées CSS mesurées sur le site)
const CTA = {x: 176, y: 534.5, w: 186.7, h: 58.9};
const CTA_SCREEN = {x: BX + (CTA.x + CTA.w / 2) * SC, y: BY + BAR + (CTA.y + CTA.h / 2) * SC};

export const S2Platform: React.FC = () => {
  const f = useCurrentFrame();

  // --- morphing logo -> navigateur (0–44)
  const m = seg(f, 10, 34, E.inOutExpo);
  const antic = keys(f, [0, 10], [1, 1.04], E.outCubic) * (1 - m) + m;
  const logoW = lerp(LOGO_W_INTRO, 320, m) * (m < 1 ? antic : 1);
  const logoCx = lerp(960, BX + BW / 2, m);
  const logoCy = lerp(546, BY + BH / 2, m);
  const logoOp = 1 - seg(f, 40, 12);
  // rectangle sombre qui naît des contours du logo
  const r0 = {x: 960 - LOGO_W_INTRO / 2 - 30, y: 546 - (LOGO_W_INTRO * LOGO_RATIO) / 2 - 30, w: LOGO_W_INTRO + 60, h: LOGO_W_INTRO * LOGO_RATIO + 60};
  const rb = {x: BX, y: BY, w: BW, h: BH};
  const rr = {x: lerp(r0.x, rb.x, m), y: lerp(r0.y, rb.y, m), w: lerp(r0.w, rb.w, m), h: lerp(r0.h, rb.h, m)};
  const frameOp = seg(f, 6, 12);

  // --- pivot de caméra 3D
  const pivot = seg(f, 30, 150, E.outCubic);
  const flat = seg(f, 168, 30, E.inOutCubic);
  const ry = lerp(lerp(-30, -15, pivot), 0, flat) * m;
  const rx = lerp(lerp(10, 5, pivot), 0, flat) * m;
  const tz = lerp(-120, 0, pivot);

  // --- capture réelle : révélation par volet (38–70)
  const reveal = seg(f, 38, 32, E.outExpo);
  const scroll = keys(f, [70, 150], [0, -14], E.inOutCubic);

  // --- éléments réels qui flottent autour (découpes de la capture)
  const floatOut = seg(f, 168, 26, E.inExpo);
  const fl = (i: number) => {
    const s = sp(f, 70 + i * 9, {damping: 13, stiffness: 110});
    return {s, bob: Math.sin((f + i * 40) / 34) * 8};
  };

  // --- plongée : zoom dans le bouton « Vérifier ma date »
  const dive = E.inExpo(seg(f, 204, 34));
  const zoom = logLerp(1, 34, dive);
  const turqCover = seg(f, 228, 10);

  // curseur
  const cur = cursorPos(f, [
    {f: 172, x: 1560, y: 1000},
    {f: 202, x: CTA_SCREEN.x + 10, y: CTA_SCREEN.y + 6},
  ]);
  const curOp = seg(f, 172, 8) * (1 - seg(f, 214, 6));

  const textExit = 166;

  return (
    <AbsoluteFill>
      {/* texte gauche */}
      <div style={{position: 'absolute', left: 120, top: 330}}>
        <KineticText text="RÉSERVEZ" f={f} start={36} size={122} exitStart={textExit} stagger={1.4} />
        <KineticText text="EN LIGNE." f={f} start={44} size={122} exitStart={textExit + 3} stagger={1.4} />
      </div>
      <Underlined text="Simple. Rapide. À votre rythme." f={f} start={80} x={124} y={612} size={36} exitStart={textExit} />

      {/* scène zoomable */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: `${CTA_SCREEN.x}px ${CTA_SCREEN.y}px`,
          filter: dive > 0.02 ? `blur(${Math.min(14, (logLerp(1, 34, E.inExpo(seg(f + 1, 204, 34))) / zoom - 1) * 40)}px)` : undefined,
        }}
      >
        <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: `${BX + BW / 2}px ${BY + BH / 2}px`}}>
          <div
            style={{
              position: 'absolute',
              left: rr.x,
              top: rr.y,
              width: rr.w,
              height: rr.h,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${tz}px) rotateY(${ry}deg) rotateX(${rx}deg)`,
              opacity: frameOp,
            }}
          >
            {m < 1 ? (
              <div style={{position: 'absolute', inset: 0, borderRadius: lerp(28, 16, m), background: '#111414', border: `2px solid rgba(16,220,203,${0.6 * (1 - m)})`}} />
            ) : null}
            {m >= 1 ? (
              <BrowserFrame width={BW} height={BH} barH={BAR} urlProgress={seg(f, 44, 24)}>
                <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`}}>
                  <div style={{transform: `translateY(${scroll}px)`}}>
                    <Img src={staticFile('screens/site-accueil.png')} style={{width: BW, height: 900 * SC, display: 'block'}} />
                  </div>
                </div>
                {/* reflet sur la vitre */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(115deg, rgba(255,255,255,0) ${lerp(-20, 70, seg(f, 60, 60))}%, rgba(255,255,255,0.22) ${lerp(-10, 80, seg(f, 60, 60))}%, rgba(255,255,255,0) ${lerp(0, 90, seg(f, 60, 60))}%)`,
                  }}
                />
              </BrowserFrame>
            ) : null}

            {/* éléments réels en lévitation (profondeur différente = parallaxe) */}
            {[
              {i: 0, x: -70, y: 600, z: 240, crop: CTA, sc: 1.25, rot: -4},
              {i: 1, x: 760, y: -90, z: 200, crop: {x: 176, y: 814.5, w: 260, h: 354.4}, sc: 0.62, rot: 5},
              {i: 2, x: 880, y: 160, z: 320, crop: {x: 728, y: 814.5, w: 260, h: 354.4}, sc: 0.62, rot: -3},
              {i: 3, x: 640, y: 470, z: 160, crop: {x: 1004, y: 814.5, w: 260, h: 354.4}, sc: 0.58, rot: 4},
            ].map(({i, x, y, z, crop, sc, rot}) => {
              const {s, bob} = fl(i);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y + bob,
                    transform: `translateZ(${lerp(z - 500, z, s) + floatOut * 900}px) rotate(${rot * (1 - flat)}deg) scale(${lerp(0.6, 1, s)})`,
                    opacity: clamp(s * 2) * (1 - floatOut),
                    boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                    borderRadius: 12,
                  }}
                >
                  <ShotCrop
                    src="screens/site-accueil-long.jpg"
                    pageW={1440}
                    pageH={1600}
                    x={crop.x - 6}
                    y={crop.y - 6}
                    w={crop.w + 12}
                    h={crop.h + 12}
                    scale={sc}
                    radius={12}
                    style={{background: C.white}}
                  />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* logo qui se loge dans le navigateur */}
      {logoOp > 0 ? (
        <DirBlur id="s2logo" x={m > 0 && m < 1 ? 6 * Math.sin(Math.PI * m) : 0} style={{position: 'absolute', inset: 0}}>
          <div style={{position: 'absolute', left: logoCx - logoW / 2, top: logoCy - (logoW * LOGO_RATIO) / 2, opacity: logoOp}}>
            <Logo f={f} width={logoW} wordColor={C.white} cameraColor={C.logoTurq} />
          </div>
        </DirBlur>
      ) : null}

      <Cursor f={f} x={cur.x} y={cur.y} clickAt={[210]} opacity={curOp} />
      <AbsoluteFill style={{background: C.turq, opacity: turqCover}} />
    </AbsoluteFill>
  );
};
