import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, SHADOW} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Headline, Tag} from '../components/Ui';
import {KineticText} from '../components/KineticText';
import {GAL} from './S8Reprise';

// photos réelles (extraites des tirages publiés par Ma Selfie Box)
export const PHOTOS = [
  'gallery/g1.jpg',
  'photos/tirage-60-ans-valerie.jpg',
  'gallery/g4.jpg',
  'gallery/g2.jpg',
  'photos/tirage-18-ans-sarah.jpg',
  'gallery/g5.jpg',
  'photos/tirage-50-ans-stephanie.jpg',
  'gallery/g3.jpg',
  'gallery/g6.jpg',
];

// la galerie du téléphone contient davantage de vignettes (photos réelles réutilisées)
export const PHONE_PHOTOS = [...PHOTOS, 'gallery/g6.jpg', 'gallery/g2.jpg', 'gallery/g5.jpg', 'gallery/g1.jpg', 'gallery/g4.jpg', 'gallery/g3.jpg'];

export const PHONE = {x: 300, y: 800, w: 480, h: 980};
const SCR = {pad: 16, head: 130, cell: 136, gap: 8};
export const phoneCell = (i: number) => ({
  x: PHONE.x + SCR.pad + 12 + (i % 3) * (SCR.cell + SCR.gap),
  y: PHONE.y + SCR.pad + SCR.head + Math.floor(i / 3) * (SCR.cell + SCR.gap),
  s: SCR.cell,
});

export const PhoneScreen: React.FC<{f: number; notifAt: number}> = ({f, notifAt}) => {
  const n = f >= notifAt ? sp(f, notifAt, {damping: 13, stiffness: 160}) : 0;
  return (
    <div style={{width: PHONE.w, height: PHONE.h, borderRadius: 64, background: C.text, padding: SCR.pad, boxSizing: 'border-box', boxShadow: SHADOW}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 50, background: C.white, overflow: 'hidden', fontFamily: FONT}}>
        <div style={{position: 'absolute', left: '50%', top: 14, width: 120, height: 32, borderRadius: 16, background: C.text, transform: 'translateX(-50%)'}} />
        <div style={{position: 'absolute', left: 24, top: 64}}>
          <div style={{fontSize: 28, fontWeight: 800, color: C.text}}>Galerie en ligne privée</div>
          <div style={{fontSize: 20, fontWeight: 500, color: C.textSoft}}>Vos photos de l’événement</div>
        </div>
        {PHONE_PHOTOS.map((p, i) => {
          const c = phoneCell(i);
          return <Img key={`${p}${i}`} src={staticFile(p)} style={{position: 'absolute', left: c.x - PHONE.x - SCR.pad, top: c.y - PHONE.y - SCR.pad, width: c.s, height: c.s, objectFit: 'cover', borderRadius: 10}} />;
        })}
        {/* notification illustrative */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: lerp(-160, 54, clamp(n)),
            borderRadius: 26,
            background: 'rgba(255,255,255,0.98)',
            boxShadow: '0 16px 40px rgba(20,60,60,0.25)',
            padding: '16px 18px',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <div style={{width: 58, height: 58, borderRadius: 14, background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'}}>
            <Img src={staticFile('brand/favicon-camera.png')} style={{width: 40, height: 40}} />
          </div>
          <div>
            <div style={{fontSize: 20, fontWeight: 700, color: C.text}}>Ma Selfie Box</div>
            <div style={{fontSize: 19, fontWeight: 500, color: C.textSoft, lineHeight: 1.25}}>Votre galerie photo est en ligne</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const S9Numerique: React.FC = () => {
  const f = useCurrentFrame();
  const toPhone = E.inOutExpo(seg(f, 62, 40));
  const phoneIn = sp(f, 70, {damping: 14, stiffness: 90});
  const phoneOp = seg(f, 92, 12);
  const ry = lerp(-34, -10, clamp(phoneIn)) + Math.sin(f / 40) * 3;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 80, top: 262}}>
        <KineticText text="ET VOS PHOTOS ?" f={f} start={4} size={96} mode="rise" stagger={1.4} exitStart={250} />
      </div>
      <Headline lines={['TOUTES VOS', 'PHOTOS']} f={f} start={72} y={420} size={104} exitStart={152} />
      <Headline lines={['EN VERSION', 'NUMÉRIQUE']} f={f} start={160} y={420} size={104} exitStart={252} />

      {/* galerie : les tuiles turquoise se retournent sur les photos */}
      {toPhone < 1
        ? PHOTOS.map((p, i) => {
            const g = GAL(i);
            const c = phoneCell(i);
            const fl = sp(f, ((i % 3) + Math.floor(i / 3)) * 4, {damping: 13, stiffness: 140});
            const ryT = lerp(180, 360, clamp(fl));
            const back = ryT % 360 > 90 && ryT % 360 < 270;
            const x = lerp(g.x, c.x, toPhone);
            const y = lerp(g.y, c.y, toPhone);
            const s = lerp(g.s, c.s, toPhone);
            return (
              <div key={p} style={{position: 'absolute', left: x, top: y, width: s, height: s, perspective: 1200, opacity: 1 - seg(f, 98, 6)}}>
                <div style={{width: '100%', height: '100%', transform: `rotateY(${ryT}deg)`, borderRadius: lerp(22, 10, toPhone), overflow: 'hidden', boxShadow: SHADOW, background: back ? (i % 2 ? C.turq : C.turqDark) : C.white}}>
                  {!back ? <Img src={staticFile(p)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
                </div>
              </div>
            );
          })
        : null}

      {/* smartphone 3D */}
      <AbsoluteFill style={{perspective: 1800}}>
        <div
          style={{
            position: 'absolute',
            left: PHONE.x,
            top: PHONE.y,
            opacity: phoneOp,
            transform: `rotateY(${ry}deg) rotateX(${6 - toPhone * 2}deg) translateY(${lerp(200, 0, clamp(phoneIn))}px)`,
          }}
        >
          <PhoneScreen f={f} notifAt={186} />
        </div>
      </AbsoluteFill>

      <div style={{position: 'absolute', left: 80, top: 690, opacity: 1 - seg(f, 250, 10)}}>
        <Tag text="Après l’événement · Illustration" p={seg(f, 200, 18)} dark={false} />
      </div>
    </AbsoluteFill>
  );
};
