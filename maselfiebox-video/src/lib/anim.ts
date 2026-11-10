import {Easing, interpolate, spring} from 'remotion';
import {FPS, Rect} from '../theme';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Courbes d'animation personnalisées (équivalents des courbes « graph editor »)
export const E = {
  linear: (t: number) => t,
  outCubic: Easing.bezier(0.33, 1, 0.68, 1),
  inCubic: Easing.bezier(0.32, 0, 0.67, 0),
  inOutCubic: Easing.bezier(0.65, 0, 0.35, 1),
  outQuint: Easing.bezier(0.22, 1, 0.36, 1),
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
  // anticipation + dépassement
  anticipate: Easing.bezier(0.68, -0.55, 0.27, 1.55),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  outBackSoft: Easing.bezier(0.34, 1.3, 0.64, 1),
  // fouetté de caméra : démarrage lent, vitesse maximale, freinage fort
  whip: Easing.bezier(0.75, 0, 0.15, 1),
  // décélération « inertie » très longue
  glide: Easing.bezier(0.05, 0.7, 0.1, 1),
};

/** Progression 0..1 d'un segment [start, start+dur] avec easing. */
export const seg = (f: number, start: number, dur: number, ease: (t: number) => number = E.linear) =>
  ease(clamp((f - start) / dur));

/** Interpolation multi-clés avec easing par segment. */
export const keys = (f: number, frames: number[], values: number[], ease: (t: number) => number = E.inOutCubic) =>
  interpolate(f, frames, values, {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const sp = (f: number, delay = 0, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  spring({frame: f - delay, fps: FPS, config: {damping: 14, stiffness: 140, mass: 0.9, ...cfg}});

/** Ressort avec rebond marqué (overshoot). */
export const bounce = (f: number, delay = 0) => sp(f, delay, {damping: 9, stiffness: 120, mass: 0.8});

/** Vitesse instantanée d'une fonction animée (pour le flou de mouvement). */
export const vel = (fn: (f: number) => number, f: number) => fn(f) - fn(f - 1);

export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

/** Zoom perceptuellement linéaire (interpolation logarithmique). */
export const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));

/** Formatage prix français : 394 -> "394", 118.2 -> "118,20" */
export const euro = (v: number, decimals = 0) =>
  v.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
