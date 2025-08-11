/**
 * Public API exports for the server-side TypeScript Manim-like engine.
 */
export { Scene } from './scene/scene.ts';
export { Mobject } from './core/mobject.ts';
export type {
  EngineConfig,
  FileConfig,
  SceneConfig,
  RenderOutputOptions,
  Vec2,
  ReadonlyVec2,
  ColorString,
  EasingName,
} from './core/types.ts';
export { resolveConfig, DEFAULT_ENGINE_CONFIG } from './core/config.ts';
export { CanvasRenderer } from './renderer/canvas_renderer.ts';
export { MoveTo } from './animation/move_to.ts';
export { FadeIn } from './animation/fade_in.ts';
export { Circle } from './shapes/circle.ts';
export { linear, easeIn, easeOut, easeInOut, elastic, bounce, spring } from './core/easing.ts';