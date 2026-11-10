import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, DATA, FONT} from '../theme';

/** Fenêtre de navigateur sobre (chrome sombre) — contenu = vraies captures. */
export const BrowserFrame: React.FC<{
  width: number;
  height: number;
  barH?: number;
  children: React.ReactNode;
  urlProgress?: number; // frappe progressive de l'URL (0..1)
  style?: React.CSSProperties;
}> = ({width, height, barH = 50, children, urlProgress = 1, style}) => {
  const url = DATA.url.slice(0, Math.round(DATA.url.length * urlProgress));
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#111414',
        boxShadow: '0 60px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      <div style={{height: barH, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10}}>
        {['#3a4040', '#3a4040', '#3a4040'].map((c, i) => (
          <div key={i} style={{width: 13, height: 13, borderRadius: 7, background: c}} />
        ))}
        <div
          style={{
            marginLeft: 24,
            flex: 1,
            maxWidth: 620,
            height: barH - 18,
            borderRadius: 9,
            background: '#1d2222',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
            fontFamily: FONT,
            fontSize: 17,
            fontWeight: 500,
            color: '#cfd6d6',
          }}
        >
          <svg width={13} height={15} viewBox="0 0 13 15">
            <rect x={1} y={6} width={11} height={8} rx={2} fill="#cfd6d6" />
            <path d="M3.5 6V4.2a3 3 0 0 1 6 0V6" stroke="#cfd6d6" strokeWidth={1.6} fill="none" />
          </svg>
          <span>{url}</span>
          {urlProgress < 1 ? <span style={{width: 2, height: 20, background: C.turq}} /> : null}
        </div>
      </div>
      <div style={{position: 'relative', width, height: height - barH, overflow: 'hidden', background: C.white}}>{children}</div>
    </div>
  );
};

/**
 * Découpe d'une VRAIE capture d'écran (coordonnées CSS de la page, capture en 2x).
 */
export const ShotCrop: React.FC<{
  src: string;
  pageW: number; // largeur CSS de la page capturée
  pageH: number;
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  style?: React.CSSProperties;
  radius?: number;
}> = ({src, pageW, pageH, x, y, w, h, scale, style, radius = 0}) => (
  <div style={{width: w * scale, height: h * scale, overflow: 'hidden', position: 'relative', borderRadius: radius, ...style}}>
    <Img
      src={staticFile(src)}
      style={{position: 'absolute', left: -x * scale, top: -y * scale, width: pageW * scale, height: pageH * scale, maxWidth: 'none'}}
    />
  </div>
);
