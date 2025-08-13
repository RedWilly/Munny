/**
 * Line segment shape.
 *
 * Draws a straight segment between two endpoints in local coordinates.
 * Fill is disabled by default.
 */
import { Mobject } from '../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { ReadonlyVec2, Vec2 } from '../core/types.ts';
import { vec2 } from '../core/types.ts';

/** Line segment defined by two endpoints. */
export class Line extends Mobject {
  private readonly _a: Vec2 = vec2(0, 0);
  private readonly _b: Vec2 = vec2(100, 0);

  /**
   * Create a Line.
   * @param a Start point [x,y]
   * @param b End point [x,y]
   * @param name Optional debug name
   */
  constructor(a: ReadonlyVec2 = [0, 0], b: ReadonlyVec2 = [100, 0], name: string = 'Line') {
    super(name);
    this._a[0] = a[0];
    this._a[1] = a[1];
    this._b[0] = b[0];
    this._b[1] = b[1];
    // Lines are stroked by default; no fill
    this.fill(null);
  }

  /** Read-only access to start point array. */
  public get a(): Vec2 { return this._a; }
  /** Read-only access to end point array. */
  public get b(): Vec2 { return this._b; }

  /**
   * Set endpoints.
   * @param ax Start x
   * @param ay Start y
   * @param bx End x
   * @param by End y
   */
  public setEndpoints(ax: number, ay: number, bx: number, by: number): this {
    this._a[0] = ax; this._a[1] = ay;
    this._b[0] = bx; this._b[1] = by;
    return this;
  }

  /** Define the line path between endpoints. */
  protected createPath(ctx: SKRSContext2D): void {
    ctx.moveTo(this._a[0]!, this._a[1]!);
    ctx.lineTo(this._b[0]!, this._b[1]!);
  }
}
