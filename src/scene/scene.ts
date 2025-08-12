/**
 * Scene - orchestrates animations and rendering.
 */
import { CanvasRenderer } from '../renderer/canvas_renderer.ts';
import { clamp } from '../core/math.ts';
import type { EngineConfig, RenderOutputOptions, SceneConfig } from '../core/types.ts';
import { resolveConfig } from '../core/config.ts';
import type { Mobject } from '../core/mobject.ts';
import type { Animation } from '../animation/base/animation.ts';
import { join } from 'path';
import { promises as fs } from 'fs';

/**
 * Base Scene class to subclass by users.
 */
export abstract class Scene {
  /** Optional scene-level configuration override (Level 3). */
  public static config?: SceneConfig;

  /** Name derived from constructor. */
  public readonly name: string;

  /** Effective configuration for this scene. */
  protected readonly config: EngineConfig;

  /** Renderer instance. */
  protected readonly renderer: CanvasRenderer;

  /** Render output options. */
  protected readonly output: RenderOutputOptions;

  /** Objects in draw order. */
  protected readonly objects: Mobject[] = [];

  /** Running frame counter across all play() calls (for PNG naming). */
  private frameCounter: number = 0;

  constructor(fileConfig: SceneConfig | undefined, output: RenderOutputOptions) {
    // Resolve hierarchical config
    const sceneCtor = this.constructor as typeof Scene;
    const sceneLevel = sceneCtor.config;
    this.config = resolveConfig(fileConfig, sceneLevel);

    this.renderer = new CanvasRenderer(this.config);
    this.output = output;
    this.name = sceneCtor.name || 'Scene';
  }

  /** Hook for user construction (create objects, etc.). */
  public async construct(): Promise<void> {
    // Users override
  }

  /**
   * Expose effective configuration for this scene.
   */
  public getConfig(): EngineConfig {
    return this.config;
  }

  /** Add objects to the scene in draw order. */
  public add(...objs: Mobject[]): this {
    const arr = this.objects;
    for (let i = 0, n = objs.length; i < n; i++) arr.push(objs[i]!);
    return this;
  }

  /** Draw everything for current frame. */
  protected draw(): void {
    const ctx = this.renderer.getContext();
    for (let i = 0, n = this.objects.length; i < n; i++) {
      const obj = this.objects[i]!;
      obj.draw(ctx);
    }
  }

  /**
   * Play animations in parallel.
   */
  public async play(...anims: Animation[]): Promise<void> {
    if (anims.length === 0) return;

    // Setup animations
    for (let i = 0; i < anims.length; i++) anims[i]!.setup();

    // Determine max duration and frames
    let maxDur = 0;
    for (let i = 0; i < anims.length; i++) {
      const a = anims[i]!;
      if (a.duration > maxDur) maxDur = a.duration;
    }
    const fps = this.config.fps;
    const totalFrames = Math.max(1, Math.ceil(maxDur * fps));

    // Ensure out dir exists if writing PNGs
    if (this.output.savePNGs) {
      await fs.mkdir(this.output.outDir, { recursive: true }).catch(() => {});
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      const tSec = frame / fps;

      // Tick each animation
      for (let i = 0; i < anims.length; i++) {
        const a = anims[i]!;
        const t = clamp(tSec / a.duration, 0, 1);
        a.tick(t);
      }

      // Render frame
      this.renderer.beginFrame();
      this.draw();

      if (this.output.savePNGs) {
        const file = join(this.output.outDir, `${this.name}_${String(this.frameCounter).padStart(5, '0')}.png`);
        await this.renderer.writePNG(file);
        this.frameCounter++;
      } else {
        // Not writing intermediate frames, just end frame
        this.renderer.endFrame();
      }
    }

    // Cleanup
    for (let i = 0; i < anims.length; i++) anims[i]!.cleanup();

    // Save last frame if requested and not already saved as PNGs
    if (this.output.saveLastFrame && !this.output.savePNGs) {
      await fs.mkdir(this.output.outDir, { recursive: true }).catch(() => {});
      const last = join(this.output.outDir, `${this.name}_last.png`);
      // Re-render once more to capture the last state
      this.renderer.beginFrame();
      this.draw();
      await this.renderer.writePNG(last);
    }
  }
}
