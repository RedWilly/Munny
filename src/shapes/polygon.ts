/**
 * Polygon shape.
 *
 * Draws a polygon from a list of points in local coordinates. By default the
 * polygon is closed and filled; can be used as an open polyline by setting
 * `closed` to false (fill typically disabled in that case).
 */
import { Mobject } from '../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { ReadonlyVec2, Vec2 } from '../core/types.ts';
import { vec2 } from '../core/types.ts';

/** Polygon defined by a list of vertices. */
export class Polygon extends Mobject {
  private readonly _points: Vec2[] = [];
  private _closed: boolean = true;

  /**
   * Create a Polygon.
   * @param points Array of points [x,y] in local coordinates
   * @param closed Whether to close the polygon (default true)
   * @param name Optional debug name
   */
  constructor(
    points: ReadonlyVec2[] = [[-50, -40], [50, -40], [0, 60]],
    closed: boolean = true,
    name: string = 'Polygon',
  ) {
    super(name);
    this.setPoints(points);
    this._closed = closed;
  }

  /** Current points array (mutable Vec2 entries). */
  public get points(): readonly Vec2[] { return this._points; }

  /** Whether polygon is closed. */
  public get closed(): boolean { return this._closed; }

  /** Set closed flag. */
  public setClosed(closed: boolean): this { this._closed = closed; return this; }

  /** Replace all points (cloned into Vec2 typed arrays). */
  public setPoints(points: ReadonlyVec2[]): this {
    this._points.length = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      this._points.push(vec2(p[0], p[1]));
    }
    return this;
  }

  /** Define the polygon path. */
  protected createPath(ctx: SKRSContext2D): void {
    if (this._points.length === 0) return;
    const p0 = this._points[0]!;
    ctx.moveTo(p0[0]!, p0[1]!);
    for (let i = 1; i < this._points.length; i++) {
      const p = this._points[i]!;
      ctx.lineTo(p[0]!, p[1]!);
    }
    if (this._closed) ctx.closePath();
  }
}
