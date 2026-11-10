import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, FONT} from '../theme';
import {E, clamp, lerp} from '../lib/anim';

export const PC = {W: 360, H: 520, IMG: 340};

/**
 * Carte formule — reprend la carte réelle du site (visuel officiel de la
 * borne, « N tirages · photos numériques illimitées », prix « dès »).
 */
export const ProductCard: React.FC<{
  n: number;
  img: string;
  price: string;
  hover?: number;
  selected?: number; // 0..1+ (ressort)
}> = ({n, img, price, hover = 0, selected = 0}) => {
  const s = clamp(selected);
  return (
    <div
      style={{
        width: PC.W,
        height: PC.H,
        borderRadius: 18,
        overflow: 'hidden',
        background: s > 0 ? `color-mix(in srgb, ${C.soft} ${Math.round(s * 100)}%, white)` : C.white,
        boxShadow: `0 0 0 ${lerp(2, 3, s)}px ${s > 0.01 || hover > 0.01 ? C.turq : C.line}, 0 ${30 + hover * 20}px ${60 + hover * 30}px rgba(0,0,0,${0.45 + hover * 0.1})`,
        fontFamily: FONT,
        color: C.text,
        position: 'relative',
      }}
    >
      <div style={{height: PC.IMG, overflow: 'hidden', position: 'relative'}}>
        <Img
          src={staticFile(img)}
          style={{width: PC.W, height: PC.W, objectFit: 'cover', transform: `scale(${1 + hover * 0.05}) translateY(-6px)`, display: 'block'}}
        />
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 5, background: C.turq}} />
      </div>
      <div style={{padding: '16px 22px'}}>
        <div style={{fontSize: 27, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1}}>{n} IMPRESSIONS</div>
        <div style={{fontSize: 13.5, color: C.textSoft, marginTop: 6, lineHeight: 1.35}}>
          {n} tirages papier · photos numériques illimitées
        </div>
        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 6}}>
            <span style={{fontSize: 14, color: C.textSoft}}>dès</span>
            <span style={{fontSize: 26, fontWeight: 700}}>{price} € TTC</span>
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              border: `2px solid ${s > 0.01 ? C.turqDark : C.textSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <div style={{width: 14, height: 14, borderRadius: 7, background: C.turqDark, transform: `scale(${selected})`}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const OC = {W: 520, H: 420, IMG: 250};

/** Carte option (« Avec la borne » / « Livre d’or audio »...) avec case à cocher. */
export const OptionCard: React.FC<{
  name: string;
  img: string;
  price: string;
  desc: string;
  pos?: string;
  hover?: number;
  checked?: number; // 0..1
}> = ({name, img, price, desc, pos = '50% 50%', hover = 0, checked = 0}) => {
  const c = clamp(checked);
  return (
    <div
      style={{
        width: OC.W,
        height: OC.H,
        borderRadius: 16,
        overflow: 'hidden',
        background: c > 0 ? `color-mix(in srgb, ${C.soft} ${Math.round(c * 100)}%, white)` : C.white,
        boxShadow: `0 0 0 ${lerp(1.5, 3, c)}px ${c > 0.01 || hover > 0.01 ? C.turq : C.line}, 0 ${18 + hover * 22}px ${40 + hover * 30}px rgba(0,0,0,${0.18 + hover * 0.12})`,
        fontFamily: FONT,
        color: C.text,
      }}
    >
      <div style={{height: OC.IMG, overflow: 'hidden'}}>
        <Img src={staticFile(img)} style={{width: OC.W, height: OC.IMG, objectFit: 'cover', objectPosition: pos, transform: `scale(${1.02 + hover * 0.05})`, display: 'block'}} />
      </div>
      <div style={{padding: '16px 22px 0'}}>
        <div style={{display: 'flex', gap: 14, alignItems: 'flex-start'}}>
          <div
            style={{
              flex: '0 0 auto',
              width: 26,
              height: 26,
              marginTop: 2,
              borderRadius: 6,
              border: `2px solid ${c > 0.01 ? C.turqDark : C.textSoft}`,
              background: `rgba(28,154,143,${c})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${1 + Math.sin(Math.PI * c) * 0.25})`,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 16 16">
              <path
                d="M3 8.5 L6.5 12 L13 4.5"
                stroke={C.white}
                strokeWidth={2.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={20}
                strokeDashoffset={20 * (1 - E.outCubic(c))}
              />
            </svg>
          </div>
          <div style={{fontSize: 19, fontWeight: 700, lineHeight: 1.3}}>{name}</div>
        </div>
        <div style={{fontSize: 14, color: C.textSoft, marginTop: 8, lineHeight: 1.4, height: 40, overflow: 'hidden'}}>{desc}</div>
        <div style={{fontSize: 22, fontWeight: 700, marginTop: 6}}>+ {price} € TTC</div>
      </div>
    </div>
  );
};
