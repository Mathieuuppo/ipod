import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, T} from '../theme';
import {E, clamp, lerp, seg} from '../lib/anim';
import {Backdrop, DirBlur, Grain, Vignette} from '../components/Fx';
import {SfxTrack} from '../sfx';
import {S1Intro} from '../scenes/S1Intro';
import {S2Platform} from '../scenes/S2Platform';
import {S3Date} from '../scenes/S3Date';
import {S4Formule} from '../scenes/S4Formule';
import {S5Options} from '../scenes/S5Options';
import {S6Reservation} from '../scenes/S6Reservation';
import {S7Promesse} from '../scenes/S7Promesse';
import {S8Outro} from '../scenes/S8Outro';

/**
 * DÉCLINAISON VERTICALE 9:16 (1080 x 1920)
 *
 * Les scènes 16:9 sont réutilisées telles quelles (mêmes animations, même
 * synchronisation son). Chaque scène est filmée par une ou plusieurs
 * « caméras » virtuelles : une caméra = un cadre source dans l'image 16:9
 * (s = [x, y, l, h]) projeté dans l'image verticale (d = [x, y, l]).
 * Les caméras sont animées par images clés (recadrage dynamique qui suit
 * l'action) et empilées : titre en haut, contenu en dessous.
 */
type Key = {f: number; s: [number, number, number, number]; d: [number, number, number]};
type Cam = {keys: Key[]; op?: [number, number][]; feather?: number; fadeRight?: number};

const camAt = (keys: Key[], f: number) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = E.inOutCubic(clamp((f - a.f) / Math.max(1, b.f - a.f)));
      return {
        f,
        s: a.s.map((v, k) => lerp(v, b.s[k], t)) as Key['s'],
        d: a.d.map((v, k) => lerp(v, b.d[k], t)) as Key['d'],
      };
    }
  }
  return keys[keys.length - 1];
};

const Camera: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => {
  const f = useCurrentFrame();
  const k = camAt(cam.keys, f);
  const [sx, sy, sw, sh] = k.s;
  const [dx, dy, dw] = k.d;
  const sc = dw / sw;
  const op = cam.op ? interpolate(f, cam.op.map((o) => o[0]), cam.op.map((o) => o[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  if (op <= 0.001) return null;
  const fe = cam.feather ?? 0;
  const mask = fe
    ? `linear-gradient(to bottom, transparent 0px, #000 ${fe}px, #000 calc(100% - ${fe}px), transparent 100%)`
    : cam.fadeRight
      ? `linear-gradient(to right, #000 calc(100% - ${cam.fadeRight}px), transparent 100%)`
      : undefined;
  return (
    <div
      style={{
        position: 'absolute',
        left: dx,
        top: dy,
        width: dw,
        height: sh * sc,
        overflow: 'hidden',
        opacity: op,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <div style={{position: 'absolute', left: -sx * sc, top: -sy * sc, width: 1920, height: 1080, transform: `scale(${sc})`, transformOrigin: '0 0'}}>
        {children}
      </div>
    </div>
  );
};

const Shot: React.FC<{cams: Cam[]; scene: React.FC}> = ({cams, scene: Scene}) => (
  <AbsoluteFill>
    {cams.map((c, i) => (
      <Camera key={i} cam={c}>
        <Scene />
      </Camera>
    ))}
  </AbsoluteFill>
);

// ------------------------------------------------------------- plans
const WIDE: Key['s'] = [210, 0, 1500, 1080];

const S1V: Cam[] = [{keys: [{f: 0, s: WIDE, d: [0, 571, 1080]}], feather: 150}];

const S2V: Cam[] = [
  {
    keys: [
      {f: 0, s: WIDE, d: [0, 571, 1080]},
      {f: 12, s: WIDE, d: [0, 571, 1080]},
      {f: 46, s: [720, 110, 1180, 900], d: [0, 850, 1080]},
    ],
    feather: 60,
  },
  {keys: [{f: 0, s: [100, 290, 680, 420], d: [100, 320, 816]}], op: [[40, 0], [50, 1], [190, 1], [200, 0]]},
];

const S3_CARD: Key['s'] = [950, 130, 880, 820];
const S3_END: Key['s'] = [420, 40, 1080, 1000];
const S3V: Cam[] = [
  {
    keys: [
      {f: 0, s: [380, 0, 1160, 1080], d: [0, 420, 1080]},
      {f: 58, s: [380, 0, 1160, 1080], d: [0, 420, 1080]},
      {f: 112, s: S3_CARD, d: [0, 780, 1080]},
      {f: 362, s: S3_CARD, d: [0, 780, 1080]},
      {f: 414, s: S3_END, d: [0, 560, 1080]},
    ],
    feather: 24,
  },
  {keys: [{f: 0, s: [100, 170, 860, 580], d: [100, 170, 860]}], op: [[92, 0], [100, 1], [352, 1], [364, 0]]},
];

const S4_SEL: Key['s'] = [560, 240, 800, 700];
const S4V: Cam[] = [
  {
    keys: [
      {f: 0, s: S3_END, d: [0, 560, 1080]},
      {f: 40, s: S3_END, d: [0, 560, 1080]},
      {f: 130, s: [150, 230, 1620, 800], d: [0, 700, 1080]},
      {f: 240, s: [150, 330, 1620, 620], d: [0, 760, 1080]},
      {f: 300, s: [900, 320, 900, 640], d: [0, 700, 1080]},
      {f: 330, s: [350, 320, 900, 640], d: [0, 700, 1080]},
      {f: 380, s: [350, 320, 900, 640], d: [0, 700, 1080]},
      {f: 440, s: S4_SEL, d: [0, 700, 1080]},
    ],
    feather: 20,
  },
  {keys: [{f: 0, s: [100, 50, 1100, 200], d: [60, 330, 960]}], op: [[0, 1], [440, 1], [452, 0]]},
  {keys: [{f: 0, s: [560, 985, 800, 40], d: [140, 1680, 800]}]},
];

const OVERVIEW: Key['s'] = [100, 280, 1720, 760];
const S5V: Cam[] = [
  {
    keys: [
      {f: 0, s: S4_SEL, d: [0, 700, 1080]},
      {f: 44, s: OVERVIEW, d: [0, 760, 1080]},
      {f: 100, s: OVERVIEW, d: [0, 760, 1080]},
      {f: 130, s: [120, 480, 760, 560], d: [0, 720, 1080]},
      {f: 178, s: [120, 480, 760, 560], d: [0, 720, 1080]},
      {f: 206, s: [620, 480, 760, 560], d: [0, 720, 1080]},
      {f: 236, s: OVERVIEW, d: [0, 760, 1080]},
      {f: 262, s: [860, 250, 960, 720], d: [0, 1000, 1080]},
      {f: 420, s: [860, 250, 960, 720], d: [0, 1000, 1080]},
      {f: 466, s: OVERVIEW, d: [0, 760, 1080]},
    ],
    feather: 20,
  },
  {keys: [{f: 0, s: [100, 50, 1260, 200], d: [40, 330, 1000]}], op: [[0, 1], [446, 1], [458, 0]]},
  {keys: [{f: 0, s: [100, 320, 700, 420], d: [100, 500, 780]}], op: [[250, 0], [262, 1], [440, 1], [446, 0]]},
];

const S6_CARD: Key['s'] = [980, 90, 840, 900];
const S6V: Cam[] = [
  {
    keys: [
      {f: 0, s: OVERVIEW, d: [0, 760, 1080]},
      {f: 44, s: S6_CARD, d: [0, 760, 1080]},
    ],
    feather: 16,
  },
  {keys: [{f: 0, s: [100, 140, 860, 500], d: [100, 180, 880]}], op: [[30, 0], [44, 1], [446, 1], [460, 0]]},
];

const S7V: Cam[] = [
  {
    keys: [
      {f: 0, s: S6_CARD, d: [0, 760, 1080]},
      {f: 12, s: S6_CARD, d: [0, 760, 1080]},
      {f: 56, s: [700, 0, 1220, 1080], d: [0, 780, 1080]},
      {f: 150, s: [700, 0, 1220, 1080], d: [0, 780, 1080]},
      {f: 196, s: [840, 120, 1000, 940], d: [0, 780, 1080]},
    ],
    feather: 40,
  },
  {keys: [{f: 0, s: [100, 380, 960, 240], d: [90, 420, 900]}], op: [[36, 0], [44, 1]], fadeRight: 70},
];

const S8V: Cam[] = [
  {keys: [{f: 0, s: [380, 330, 1160, 740], d: [0, 720, 1080]}], feather: 80},
  {keys: [{f: 0, s: [200, 170, 1520, 130], d: [0, 540, 1080]}]},
];

// ------------------------------------------------------------- raccords plein cadre
const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  // fin de la plongée dans « Vérifier ma date » -> turquoise plein cadre
  if (f >= 468 && f < 480) out.push(<AbsoluteFill key="t2" style={{background: C.turq, opacity: seg(f, 468, 10)}} />);
  // iris d'ouverture de l'étape 1
  if (f >= 480 && f < 514) {
    const r = E.outExpo(seg(f, 480, 32)) * 2200;
    const m = `radial-gradient(circle at 50% 58%, transparent ${r}px, #000 ${r + 2}px)`;
    out.push(<AbsoluteFill key="iris" style={{background: C.turq, WebkitMaskImage: m, maskImage: m}} />);
  }
  // volet turquoise diagonal vers l'outro
  const w0 = T.promesse.from + 292;
  if (f >= w0 && f < T.outro.from) {
    const wipe = E.inOutExpo(seg(f, w0, 54));
    const prev = E.inOutExpo(seg(f - 1, w0, 54));
    out.push(
      <DirBlur key="wipe" id="vwipe" y={(wipe - prev) * 3400 * 0.25} style={{position: 'absolute', inset: 0}}>
        <div style={{position: 'absolute', left: -600, right: -600, top: lerp(-3400, -600, wipe), height: 3400, background: C.turq, transform: 'skewY(-14deg)'}} />
      </DirBlur>,
    );
  }
  return <>{out}</>;
};

const OutroBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.turq}}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 70% 45% at 50% 52%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)',
          opacity: seg(f, 0, 30),
        }}
      />
    </AbsoluteFill>
  );
};

const FinalOverlays: React.FC = () => {
  const f = useCurrentFrame();
  const outro = f >= T.outro.from;
  return (
    <>
      <Vignette strength={outro ? 0.2 : 0.5} />
      <Grain opacity={outro ? 0.05 : 0.07} />
    </>
  );
};

export const MaSelfieBoxAdVertical: React.FC = () => (
  <AbsoluteFill style={{background: C.ink, fontFamily: FONT}}>
    <Sequence from={T.intro.dur} durationInFrames={T.outro.from - T.intro.dur} name="Fond">
      <Backdrop />
    </Sequence>
    <Sequence from={T.intro.from} durationInFrames={T.intro.dur} name="01 Intro">
      <Shot cams={S1V} scene={S1Intro} />
    </Sequence>
    <Sequence from={T.platform.from} durationInFrames={T.platform.dur} name="02 Plateforme">
      <Shot cams={S2V} scene={S2Platform} />
    </Sequence>
    <Sequence from={T.date.from} durationInFrames={T.date.dur} name="03 Date">
      <Shot cams={S3V} scene={S3Date} />
    </Sequence>
    <Sequence from={T.formule.from} durationInFrames={T.formule.dur} name="04 Formule">
      <Shot cams={S4V} scene={S4Formule} />
    </Sequence>
    <Sequence from={T.options.from} durationInFrames={T.options.dur} name="05 Options">
      <Shot cams={S5V} scene={S5Options} />
    </Sequence>
    <Sequence from={T.resa.from} durationInFrames={T.resa.dur} name="06 Réservation">
      <Shot cams={S6V} scene={S6Reservation} />
    </Sequence>
    <Sequence from={T.promesse.from} durationInFrames={T.promesse.dur} name="07 Promesse">
      <Shot cams={S7V} scene={S7Promesse} />
    </Sequence>
    <Sequence from={T.outro.from} durationInFrames={T.outro.dur} name="08 Outro">
      <OutroBg />
      <Shot cams={S8V} scene={S8Outro} />
    </Sequence>
    <Overlays />
    <FinalOverlays />
    <Audio src={staticFile('audio/music-maselfiebox-120bpm.wav')} volume={0.6} />
    <SfxTrack />
  </AbsoluteFill>
);
