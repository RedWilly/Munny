/**
 * Annulus (ring) shape.
 *
 * Filled region between an outer radius and an inner radius, centered at the
 * local origin. Uses opposite arc windings so that the default nonzero fill
 * rule produces a donut hole.
 */
import { Mobject } from '../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';

/** Annulus defined by outer and inner radii. */
export class Annulus extends Mobject {
  private _outer: number;
  private _inner: number;

  /**
   * Create an Annulus.
   * @param outer Outer radius (> 0)
   * @param inner Inner radius (>= 0 and < outer)
   * @param name Optional debug name
   */
  constructor(outer: number = 60, inner: number = 30, name: string = 'Annulus') {
    super(name);
    this._outer = outer > 0 ? outer : 0;
    this._inner = inner >= 0 ? Math.min(inner, this._outer) : 0;
  }

  /** Outer radius. */
  public get outerRadius(): number { return this._outer; }
  /** Inner radius. */
  public get innerRadius(): number { return this._inner; }

  /** Set radii (inner clamped to [0, outer]). */
  public setRadii(outer: number, inner: number): this {
    this._outer = outer > 0 ? outer : 0;
    this._inner = inner >= 0 ? Math.min(inner, this._outer) : 0;
    return this;
  }

  /** Define a donut-shaped path using opposite arc windings. */
  protected createPath(ctx: SKRSContext2D): void {
    const TWO_PI = Math.PI * 2;
    // Outer ring, clockwise (default)
    ctx.arc(0, 0, this._outer, 0, TWO_PI, false);
    // Inner hole, opposite winding so nonzero rule subtracts it
    if (this._inner > 0) {
      ctx.moveTo(this._inner, 0);
      ctx.arc(0, 0, this._inner, 0, TWO_PI, true);
      ctx.closePath();
    }
  }
}
