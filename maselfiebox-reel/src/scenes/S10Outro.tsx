import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, DATA, FONT, SHADOW} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';
import {Logo, LOGO_RATIO} from '../components/Logo';
import {Headline} from '../components/Ui';
import {PHONE, PHOTOS, PhoneScreen, phoneCell} from './S9Numerique';

export const FINAL_HIT = 60; // = 62,0 s
const CX = 540;
const CY = 860;

export const S10Outro: React.FC = () => {
  const f = useCurrentFrame();

  // le téléphone s'efface, les photos s'envolent vers le centre
  const phoneOut = E.inExpo(seg(f, 0, 22));
  const gather = E.inOutExpo(seg(f, 6, 34));
  const disc = seg(f, 26, 18, E.outBack) * (1 - E.inExpo(seg(f, 46, 16)));
  const hit = f >= FINAL_HIT ? sp(f, FINAL_HIT, {damping: 8, stiffness: 170}) : 0;
  const pulse = f >= FINAL_HIT ? Math.sin(Math.PI * clamp((f - FINAL_HIT) / 16)) : 0;
  const LW = 860;
  const urlIn = sp(f, 118, {damping: 12, stiffness: 140});
  const drift = lerp(1, 1.03, seg(f, 60, 180, E.linear));

  return (
    <AbsoluteFill>
      {phoneOut < 1 ? (
        <AbsoluteFill style={{perspective: 1800}}>
          <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, transform: `rotateY(${-10 + phoneOut * 40}deg) translateY(${phoneOut * 400}px)`, opacity: 1 - phoneOut}}>
            <PhoneScreen f={999} notifAt={9999} />
          </div>
        </AbsoluteFill>
      ) : null}

      {gather < 1
        ? PHOTOS.map((p, i) => {
            const c = phoneCell(i);
            const a = (i / PHOTOS.length) * Math.PI * 2 + gather * 3;
            const rad = lerp(0, 260, Math.sin(Math.PI * gather));
            const x = lerp(c.x + c.s / 2, CX + Math.cos(a) * rad, gather);
            const y = lerp(c.y + c.s / 2, CY + Math.sin(a) * rad, gather);
            const s = lerp(c.s, 30, gather);
            return (
              <div key={p} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: 12, overflow: 'hidden', boxShadow: SHADOW, transform: `rotate(${gather * 180}deg)`, opacity: f > 0 ? 1 : 0}}>
                <Img src={staticFile(p)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                <div style={{position: 'absolute', inset: 0, background: C.turq, opacity: gather}} />
              </div>
            );
          })
        : null}

      {/* forme turquoise qui révèle le logo */}
      {disc > 0.001 ? <div style={{position: 'absolute', left: CX - 220, top: CY - 220, width: 440, height: 440, borderRadius: 220, background: C.turq, transform: `scale(${disc})`, boxShadow: '0 30px 60px rgba(16,180,170,0.3)'}} /> : null}

      <AbsoluteFill style={{transform: `scale(${drift})`, transformOrigin: `${CX}px ${CY}px`}}>
        {/* éléments turquoise discrets */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <circle cx={CX} cy={CY} r={500} fill="none" stroke={C.turq} strokeWidth={2} strokeDasharray="10 14" strokeDashoffset={-f * 1.2} opacity={seg(f, 50, 30) * 0.8} transform={`rotate(${f * 0.1} ${CX} ${CY})`} />
          <circle cx={CX} cy={CY} r={lerp(300, 560, E.outExpo(seg(f, FINAL_HIT, 40)))} fill="none" stroke={C.turq} strokeWidth={4} opacity={f >= FINAL_HIT ? 1 - seg(f, FINAL_HIT, 40) : 0} />
        </svg>
        {[0, 1, 2, 3].map((i) => {
          const s = sp(f, 50 + i * 5, {damping: 12, stiffness: 120});
          const tx = [-430, 430, -380, 380][i];
          const ty = [-300, -300, 300, 300][i];
          return <div key={i} style={{position: 'absolute', left: CX + tx * s - 9, top: CY + ty * s - 9, width: 18, height: 18, background: i % 2 ? C.turq : C.text, transform: `rotate(${lerp(180, 45, s)}deg)`, opacity: clamp(s * 2) * 0.8}} />;
        })}

        <div style={{position: 'absolute', left: CX - LW / 2, top: CY - (LW * LOGO_RATIO) / 2, transform: `scale(${1 + pulse * 0.04})`}}>
          <Logo f={f} start={34} width={LW} assemble wordColor={C.text} cameraColor={C.logoTurq} sweepStart={FINAL_HIT + 4} sweepColor="rgba(16,220,203,0.95)" id="logoOutro" />
        </div>
        <div style={{opacity: hit > 0 ? 1 : 1}}>
          <Headline lines={['VOUS PROFITEZ.']} f={f} start={78} y={1090} size={84} align="center" />
          <Headline lines={['ON S’OCCUPE DU RESTE.']} f={f} start={92} y={1196} size={62} align="center" />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1330, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              background: C.text,
              color: C.white,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 40,
              padding: '20px 40px',
              borderRadius: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transform: `scale(${lerp(0.5, 1, clamp(urlIn))})`,
              opacity: clamp(urlIn * 2),
              boxShadow: '0 20px 44px rgba(20,60,60,0.22)',
            }}
          >
            {DATA.url}
            <svg width={30} height={30} viewBox="0 0 30 30">
              <path d="M6 15 H23 M16 8 L23 15 L16 22" stroke={C.turq} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
