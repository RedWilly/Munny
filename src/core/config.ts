/**
 * Engine configuration resolution and defaults.
 *
 * Implements the 3-level hierarchy:
 * 1. Engine default (global lowest priority)
 * 2. File-level override (export const config = {...})
 * 3. Scene-level override (static config on Scene subclass)
 */
import type { EngineConfig, FileConfig, SceneConfig } from './types.ts';

/** Default engine configuration (Level 1). */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  width: 1920,
  height: 1080,
  backgroundColor: 'transparent',
  fps: 30,
};

/**
 * Merge engine defaults with file-level and scene-level overrides.
 * Later levels take precedence.
 */
export function resolveConfig(
  fileConfig?: FileConfig,
  sceneConfig?: SceneConfig,
): EngineConfig {
  const mergedWidth = sceneConfig?.width ?? fileConfig?.width ?? DEFAULT_ENGINE_CONFIG.width;
  const mergedHeight = sceneConfig?.height ?? fileConfig?.height ?? DEFAULT_ENGINE_CONFIG.height;
  const mergedBg = sceneConfig?.backgroundColor ?? fileConfig?.backgroundColor ?? DEFAULT_ENGINE_CONFIG.backgroundColor;
  const mergedFps = sceneConfig?.fps ?? fileConfig?.fps ?? DEFAULT_ENGINE_CONFIG.fps;
  return {
    width: mergedWidth,
    height: mergedHeight,
    backgroundColor: mergedBg,
    fps: mergedFps,
  } satisfies EngineConfig;
}
