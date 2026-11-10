import React from 'react';
import {C, DATA, FONT} from '../theme';
import {E, clamp, lerp, seg, sp} from '../lib/anim';

/**
 * Reconstitution animable du calendrier de l'étape « 1 Votre date » de
 * reservation.maselfiebox.fr (mêmes libellés, mêmes styles : cases libres
 * bordées de turquoise, cases grisées = déjà prises ou hors période).
 * Le mois n'est volontairement pas nommé : la date sélectionnée est un
 * EXEMPLE, jamais présentée comme réellement disponible.
 */
export const CAL = {
  W: 820,
  H: 780,
  PAD: 46,
  GT: 336,
  CW: (820 - 2 * 46 - 6 * 10) / 7,
  CH: 66,
  GAP: 10,
  OFFSET: 2, // le 1er tombe un mercredi
};
export const UNAVAILABLE = new Set([1, 2, 3, 4, 5, 6, 7, 8, 13, 20]);
export const SELECTED_DAY = 25;

export const dayCell = (d: number) => {
  const idx = d - 1 + CAL.OFFSET;
  const row = Math.floor(idx / 7);
  const col = idx % 7;
  return {row, col, x: CAL.PAD + col * (CAL.CW + CAL.GAP), y: CAL.GT + row * (CAL.CH + CAL.GAP)};
};

const WEEK = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

export const StepsBar: React.FC<{active: number; done: number; f?: number; doneAt?: number[]; size?: number; dark?: boolean}> = ({
  active,
  done,
  f = 0,
  doneAt = [],
  size = 15,
  dark = false,
}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT, fontSize: size, color: dark ? '#cfd6d6' : C.textSoft}}>
    {DATA.steps.map((s, i) => {
      const isDone = i < done || (doneAt[i] !== undefined && f >= doneAt[i]);
      const pop = doneAt[i] !== undefined ? sp(f, doneAt[i], {damping: 9, stiffness: 200}) : 1;
      const isActive = i === active && !isDone;
      return (
        <div key={s} style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: isActive ? 600 : 500, color: isActive ? (dark ? C.white : C.text) : undefined}}>
          <div
            style={{
              width: size * 1.75,
              height: size * 1.75,
              borderRadius: '50%',
              border: `2px solid ${isDone ? C.turq : isActive ? (dark ? C.white : C.text) : C.line}`,
              background: isDone ? C.turq : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.85,
              color: isDone ? C.text : undefined,
              transform: isDone ? `scale(${lerp(0.6, 1, pop)})` : undefined,
            }}
          >
            {isDone ? (
              <svg width={size} height={size} viewBox="0 0 16 16">
                <path d="M3 8.5 L6.5 12 L13 4.5" stroke={C.text} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {s}
        </div>
      );
    })}
  </div>
);

export const CalendarCard: React.FC<{
  f: number;
  daysStart: number;
  hoverAt: number;
  selectAt: number;
  foldStart?: number;
}> = ({f, daysStart, hoverAt, selectAt, foldStart = 99999}) => {
  const headOut = seg(f, foldStart, 18, E.inCubic);
  const hover = seg(f, hoverAt, 8, E.outCubic);
  const sel = sp(f, selectAt, {damping: 10, stiffness: 190, mass: 0.7});
  const press = f >= selectAt - 4 && f < selectAt + 2 ? 1 : 0;
  const check = seg(f, selectAt + 4, 14, E.outCubic);
  const tag = sp(f, selectAt + 10, {damping: 12, stiffness: 160});
  const rows = [0, 1, 2, 3, 4];

  const days = new Array(30).fill(0).map((_, i) => i + 1);
  return (
    <div style={{position: 'relative', width: CAL.W, height: CAL.H, fontFamily: FONT, color: C.text, transformStyle: 'preserve-3d'}}>
      <div style={{position: 'absolute', left: CAL.PAD, top: 38, opacity: 1 - headOut, transform: `translateY(${-30 * headOut}px)`}}>
        <StepsBar active={0} done={0} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: CAL.PAD,
          top: 88,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          opacity: 1 - headOut,
          transform: `translateY(${-30 * headOut}px)`,
        }}
      >
        Quelle date, et à quel moment ?
      </div>
      <div style={{position: 'absolute', left: CAL.PAD, top: 160, fontSize: 18, fontWeight: 600, opacity: 1 - headOut}}>Journée ou soirée ?</div>
      <div style={{position: 'absolute', left: CAL.PAD, top: 192, display: 'flex', gap: 14, opacity: 1 - headOut}}>
        {[
          {l: 'Journée', s: '10:30 – 17:30', on: false},
          {l: 'Soirée', s: '', on: true},
        ].map((p) => (
          <div
            key={p.l}
            style={{
              height: 56,
              padding: '0 22px',
              borderRadius: 28,
              border: `2px solid ${p.on ? C.turq : C.line}`,
              background: p.on ? C.soft : C.white,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            <div style={{width: 18, height: 18, borderRadius: 9, border: `2px solid ${p.on ? C.turqDark : C.textSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {p.on ? <div style={{width: 9, height: 9, borderRadius: 5, background: C.turqDark}} /> : null}
            </div>
            {p.l}
            {p.s ? <span style={{fontSize: 14, fontWeight: 500, color: C.textSoft}}>{p.s}</span> : null}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: CAL.PAD, top: 272, fontSize: 15, fontWeight: 600, color: C.textSoft, opacity: 1 - headOut}}>
        Disponibilités du mois
      </div>
      <div style={{position: 'absolute', left: CAL.PAD, top: 304, display: 'flex', gap: CAL.GAP, opacity: 1 - headOut}}>
        {WEEK.map((w) => (
          <div key={w} style={{width: CAL.CW, textAlign: 'center', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: C.textSoft, textTransform: 'uppercase'}}>
            {w}
          </div>
        ))}
      </div>

      {/* grille : chaque rangée se replie (accordéon 3D) lors de la transition */}
      {rows.map((r) => {
        const fold = E.inCubic(seg(f, foldStart + 6 + (4 - r) * 4, 16));
        return (
          <div
            key={r}
            style={{
              position: 'absolute',
              left: 0,
              top: CAL.GT + r * (CAL.CH + CAL.GAP),
              width: CAL.W,
              height: CAL.CH,
              transformOrigin: '50% 0%',
              transform: `rotateX(${-95 * fold}deg)`,
              opacity: 1 - seg(f, foldStart + 14 + (4 - r) * 4, 10),
              transformStyle: 'preserve-3d',
            }}
          >
            {days
              .filter((d) => dayCell(d).row === r)
              .map((d) => {
                const c = dayCell(d);
                const st = daysStart + (c.row + c.col) * 2.4;
                const p = seg(f, st, 22, E.outBack);
                const appear = clamp((f - st) / 8);
                const free = !UNAVAILABLE.has(d);
                const isSel = d === SELECTED_DAY;
                const h = isSel ? hover * (1 - clamp(sel)) : 0;
                const s = isSel ? sel : 0;
                const scale = lerp(0.4, 1, p) * (1 + h * 0.06 - press * 0.08 + Math.max(0, s - 1) * 0.6);
                return (
                  <div
                    key={d}
                    style={{
                      position: 'absolute',
                      left: c.x,
                      top: 0,
                      width: CAL.CW,
                      height: CAL.CH,
                      borderRadius: 12,
                      border: free ? `2px solid ${C.turq}` : '2px solid transparent',
                      background: isSel ? `rgba(16,220,203,${clamp(h * 0.18 + s)})` : C.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 21,
                      fontWeight: free ? (isSel && s > 0.5 ? 800 : 600) : 500,
                      color: free ? C.text : '#AAB0B0',
                      opacity: appear,
                      transform: `translateZ(${isSel ? 40 * clamp(s) + 12 * h : 0}px) rotateX(${lerp(70, 0, clamp(p))}deg) scale(${scale})`,
                      boxShadow: isSel ? `0 ${lerp(0, 18, clamp(s))}px ${lerp(0, 36, clamp(s))}px rgba(16,160,150,${0.45 * clamp(s)})` : undefined,
                    }}
                  >
                    {d}
                    {isSel && check > 0 ? (
                      <div
                        style={{
                          position: 'absolute',
                          right: -10,
                          top: -10,
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: C.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: `scale(${lerp(0, 1, E.outBack(check))})`,
                        }}
                      >
                        <svg width={16} height={16} viewBox="0 0 16 16">
                          <path
                            d="M3 8.5 L6.5 12 L13 4.5"
                            stroke={C.turq}
                            strokeWidth={2.6}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={20}
                            strokeDashoffset={20 * (1 - check)}
                          />
                        </svg>
                      </div>
                    ) : null}
                    {isSel && tag > 0.01 ? (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: CAL.CH + 14,
                          left: '50%',
                          transform: `translateX(-50%) translateY(${lerp(14, 0, clamp(tag))}px) scale(${lerp(0.7, 1, tag)})`,
                          opacity: clamp(tag * 2) * (1 - headOut),
                          whiteSpace: 'nowrap',
                          background: C.text,
                          color: C.white,
                          fontSize: 14,
                          fontWeight: 600,
                          padding: '8px 14px',
                          borderRadius: 18,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div style={{width: 8, height: 8, borderRadius: 4, background: C.turq}} />
                        Date d’exemple
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: CAL.PAD, right: CAL.PAD, top: 724, fontSize: 14, color: C.textSoft, opacity: (1 - headOut) * seg(f, daysStart + 20, 20)}}>
        Les dates grisées sont déjà prises ou hors de notre période de réservation.
      </div>
    </div>
  );
};
