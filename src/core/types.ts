/**
 * Core type definitions for the server-side Manim-like engine.
 *
 * All numeric vector data uses Typed Arrays to align with the user's performance preferences.
 * These types are intentionally minimal to keep the initial scaffold lean.
 */

/**
 * 2D vector represented as a Float64Array with length 2.
 * Use helper creators instead of constructing arrays inline for clarity.
 */
export type Vec2 = Float64Array & { readonly length: 2 };

/** Create a new Vec2. */
export function vec2(x: number, y: number): Vec2 {
  const v = new Float64Array(2) as Vec2;
  v[0] = x;
  v[1] = y;
  return v;
}

/** Readonly tuple view of a vec2. */
export type ReadonlyVec2 = readonly [number, number];

/** Color represented as CSS string (e.g., '#RRGGBB', 'rgba(...)', or named). */
export type ColorString = string;

/** Supported easing names. */
export type EasingName =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'elastic'
  | 'bounce'
  | 'spring';

/** Easing function signature mapping t in [0,1] to eased t in [0,1]. */
export type EasingFn = (t: number) => number;

/** Engine configuration resolved per scene after merges. */
export interface EngineConfig {
  width: number;
  height: number;
  backgroundColor: ColorString | 'transparent';
  fps: number;
}

/** File-level configuration (Level 2) allowing partial overrides. */
export type FileConfig = Partial<EngineConfig>;

/** Scene-level configuration (Level 3) allowing partial overrides. */
export type SceneConfig = Partial<EngineConfig>;

/**
 * Renderer options controlling output behavior.
 */
export interface RenderOutputOptions {
  outDir: string;
  saveLastFrame: boolean;
  savePNGs: boolean;
  /** Placeholder for future video export using ffmpeg. */
  format?: 'mp4' | 'webm' | 'gif' | 'mov';
}

/** Rectangle bounds in scene coordinates. */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Disposable pattern for resources. */
export interface Disposable {
  dispose(): void;
}
