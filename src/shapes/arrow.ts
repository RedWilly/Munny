/**
 * Arrow shape.
 *
 * Draws a straight shaft from `from` to `to` with a triangular head at the
 * endpoint. Angles are in scene coordinates (origin center, Y-up). The arrow
 * head is closed and will be filled if a fill color is set.
 */
import { Mobject } from '../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { ReadonlyVec2, Vec2 } from '../core/types.ts';
import { vec2 } from '../core/types.ts';

/** Arrow defined by endpoints and head dimensions. */
export class Arrow extends Mobject {
  private readonly _from: Vec2 = vec2(0, 0);
  private readonly _to: Vec2 = vec2(100, 0);
  private _headLength: number;
  private _headWidth: number;

  /**
   * Create an Arrow.
   * @param from Start point [x,y]
   * @param to End point [x,y]
   * @param headLength Length of the arrow head along the shaft direction
   * @param headWidth Total width of the arrow head base
   * @param name Optional debug name
   */
  constructor(
    from: ReadonlyVec2 = [0, 0],
    to: ReadonlyVec2 = [100, 0],
    headLength: number = 20,
    headWidth: number = 12,
    name: string = 'Arrow',
  ) {
    super(name);
    this._from[0] = from[0]; this._from[1] = from[1];
    this._to[0] = to[0]; this._to[1] = to[1];
    this._headLength = headLength > 0 ? headLength : 0;
    this._headWidth = headWidth > 0 ? headWidth : 0;
  }

  /** Start point (mutable typed array). */
  public get from(): Vec2 { return this._from; }
  /** End point (mutable typed array). */
  public get to(): Vec2 { return this._to; }
  /** Head length. */
  public get headLength(): number { return this._headLength; }
  /** Head width. */
  public get headWidth(): number { return this._headWidth; }

  /** Set endpoints. */
  public setEndpoints(ax: number, ay: number, bx: number, by: number): this {
    this._from[0] = ax; this._from[1] = ay;
    this._to[0] = bx; this._to[1] = by;
    return this;
  }

  /** Set head dimensions. */
  public setHead(headLength: number, headWidth: number): this {
    this._headLength = headLength > 0 ? headLength : 0;
    this._headWidth = headWidth > 0 ? headWidth : 0;
    return this;
  }

  /** Define the arrow path: shaft + triangular head. */
  protected createPath(ctx: SKRSContext2D): void {
    const x1 = this._from[0]!;
    const y1 = this._from[1]!;
    const x2 = this._to[0]!;
    const y2 = this._to[1]!;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      // Degenerate: draw a small triangle at the origin
      const hl = this._headLength || 6;
      const hw = this._headWidth || 4;
      ctx.moveTo(0, 0);
      ctx.lineTo(-hl, hw / 2);
      ctx.lineTo(-hl, -hw / 2);
      ctx.closePath();
      return;
    }

    const ux = dx / len;
    const uy = dy / len;
    const hl = Math.min(this._headLength, len);
    const hw2 = this._headWidth / 2;

    // Base of head along the shaft direction
    const bx = x2 - ux * hl;
    const by = y2 - uy * hl;

    // Perpendicular unit vector
    const px = -uy;
    const py = ux;

    const lx = bx + px * hw2; // left base point
    const ly = by + py * hw2;
    const rx = bx - px * hw2; // right base point
    const ry = by - py * hw2;

    // Shaft (to base of head)
    ctx.moveTo(x1, y1);
    ctx.lineTo(bx, by);

    // Head triangle
    ctx.moveTo(lx, ly);
    ctx.lineTo(x2, y2);
    ctx.lineTo(rx, ry);
    ctx.closePath();
  }
}
