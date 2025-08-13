/**
 * Arc shape.
 *
 * Circular arc segment centered at the local origin. Angles are in radians in
 * the engine's mathematical coordinate system (origin center, Y-up, CCW).
 * By default, fill is disabled since arcs are typically stroked.
 */
import { Mobject } from '../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';

/** Circular arc defined by radius and start/end angles. */
export class Arc extends Mobject {
  private _radius: number;
  private _start: number;
  private _end: number;
  private _anticlockwise: boolean;

  /**
   * Create an Arc.
   * @param radius Radius in scene units
   * @param start Start angle (radians, CCW)
   * @param end End angle (radians, CCW)
   * @param anticlockwise Sweep direction flag for the underlying canvas arc
   * @param name Optional debug name
   */
  constructor(
    radius: number = 50,
    start: number = 0,
    end: number = Math.PI / 2,
    anticlockwise: boolean = false,
    name: string = 'Arc',
  ) {
    super(name);
    this._radius = radius >= 0 ? radius : 0;
    this._start = start;
    this._end = end;
    this._anticlockwise = anticlockwise;
    // Arcs default to stroke-only
    this.fill(null);
  }

  /** Radius. */
  public get radius(): number { return this._radius; }
  /** Start angle (rad). */
  public get start(): number { return this._start; }
  /** End angle (rad). */
  public get end(): number { return this._end; }
  /** Anticlockwise flag passed to canvas arc. */
  public get anticlockwise(): boolean { return this._anticlockwise; }

  /** Set parameters. */
  public set(radius: number, start: number, end: number, anticlockwise?: boolean): this {
    this._radius = radius >= 0 ? radius : 0;
    this._start = start;
    this._end = end;
    if (anticlockwise !== undefined) this._anticlockwise = anticlockwise;
    return this;
  }

  /** Define the arc segment path. */
  protected createPath(ctx: SKRSContext2D): void {
    ctx.arc(0, 0, this._radius, this._start, this._end, this._anticlockwise);
  }
}
