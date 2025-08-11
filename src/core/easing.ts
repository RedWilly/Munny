/**
 * Easing functions used by animations.
 */
import type { EasingFn, EasingName } from './types.ts';

/** Linear easing. */
export const linear: EasingFn = (t: number): number => t;

/** Quadratic ease-in. */
export const easeIn: EasingFn = (t: number): number => t * t;

/** Quadratic ease-out. */
export const easeOut: EasingFn = (t: number): number => 1 - (1 - t) * (1 - t);

/** Quadratic ease-in-out. */
export const easeInOut: EasingFn = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** Simple elastic approximation. */
export const elastic: EasingFn = (t: number): number => {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4) + 1;
};

/** Simple bounce approximation. */
export const bounce: EasingFn = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

/** Critically damped spring-like easing. */
export const spring: EasingFn = (t: number): number => {
  // Simple critically-damped spring curve approximation
  const s = 1 - Math.exp(-6 * t) * (1 + 6 * t);
  return s < 0 ? 0 : s > 1 ? 1 : s;
};

/** Map of easing names to functions. */
export const EASINGS: ReadonlyMap<EasingName, EasingFn> = new Map<EasingName, EasingFn>([
  ['linear', linear],
  ['easeIn', easeIn],
  ['easeOut', easeOut],
  ['easeInOut', easeInOut],
  ['elastic', elastic],
  ['bounce', bounce],
  ['spring', spring],
]);

/** Get an easing function by name (defaults to linear). */
export function getEasing(name: EasingName | undefined): EasingFn {
  if (!name) return linear;
  return EASINGS.get(name) ?? linear;
}
