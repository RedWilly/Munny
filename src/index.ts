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
export { MoveTo, MoveBy } from './animation/transforms/move.ts';
export { RotateTo, RotateBy } from './animation/transforms/rotate.ts';
export { ScaleTo, ScaleBy } from './animation/transforms/scale.ts';
export { OpacityTo } from './animation/transforms/opacity.ts';
export { FillColorTo, StrokeColorTo, StrokeWidthTo } from './animation/transforms/style.ts';
export { FadeIn, FadeOut } from './animation/transforms/fade.ts';
export { Sequence, Parallel, SequenceAnimation, ParallelAnimation } from './animation/base/combinators.ts';
export { Circle } from './shapes/circle.ts';
export { Text } from './text/text.ts';
export { linear, easeIn, easeOut, easeInOut, elastic, bounce, spring } from './animation/base/easing.ts';