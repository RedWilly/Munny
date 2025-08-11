/**
 * Minimal math helpers and vector utilities.
 */
import type { ReadonlyVec2, Vec2 } from './types.ts';

/** Clamp x to [min, max]. */
export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

/** Linear interpolation between a and b. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Copy into an existing Vec2 from tuple. */
export function setVec2(out: Vec2, v: ReadonlyVec2): Vec2 {
  out[0] = v[0];
  out[1] = v[1];
  return out;
}

/** Mix two vectors into out by factor t. */
export function mixVec2(out: Vec2, a: ReadonlyVec2 | ArrayLike<number>, b: ReadonlyVec2 | ArrayLike<number>, t: number): Vec2 {
  // Using non-nullish assertions to satisfy noUncheckedIndexedAccess under tight tuple/typed-array types
  out[0] = lerp(a[0]!, b[0]!, t);
  out[1] = lerp(a[1]!, b[1]!, t);
  return out;
}
