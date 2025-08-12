/**
 * CanvasRenderer - server-side renderer using @napi-rs/canvas.
 */
import { createCanvas, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { EngineConfig } from '../core/types.ts';

/**
 * Renderer that manages a canvas and draws frames.
 */
export class CanvasRenderer {
  private readonly canvas: Canvas;
  private readonly ctx: SKRSContext2D;
  private readonly width: number;
  private readonly height: number;

  constructor(private readonly config: EngineConfig) {
    this.width = config.width;
    this.height = config.height;
    this.canvas = createCanvas(this.width, this.height) as unknown as Canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to acquire 2D context');
    this.ctx = ctx as SKRSContext2D;
  }

  /** 2D context with scene coordinate system (origin center, Y-up). */
  public getContext(): SKRSContext2D {
    const ctx = this.ctx;
    // Reset transform, clear and set coordinate system per frame by caller.
    return ctx;
  }

  /** Prepare frame: clear and set transforms for scene coordinates. */
  public beginFrame(): void {
    const ctx = this.ctx;
    ctx.save();
    // Reset to identity
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear background
    if (this.config.backgroundColor === 'transparent') {
      ctx.clearRect(0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = this.config.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Set mathematical coordinates: origin center, Y-up
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(1, -1);
  }

  /** Finish frame and return PNG bytes. */
  public async endFrameToPNG(): Promise<Uint8Array> {
    // Restore transform stack corresponding to beginFrame
    this.ctx.restore();
    // encode reads current canvas pixels
    const bytes = await this.canvas.encode('png');
    return bytes;
  }

  /** Finish frame without producing a buffer. */
  public endFrame(): void {
    this.ctx.restore();
  }

  /** Write PNG to file asynchronously. */
  public async writePNG(filePath: string): Promise<void> {
    const buf = await this.endFrameToPNG();
    await fs.mkdir(dirname(filePath), { recursive: true }).catch(() => {});
    await fs.writeFile(filePath, buf);
  }
}
