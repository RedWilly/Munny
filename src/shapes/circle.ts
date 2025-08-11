/**
 * Circle shape.
 */
import { Mobject } from '../core/mobject.ts';
import type { CanvasRenderingContext2D } from 'canvas';

/** Circle defined by radius. */
export class Circle extends Mobject {
  private _radius: number;

  constructor(radius: number = 50, name: string = 'Circle') {
    super(name);
    this._radius = radius;
  }

  /** Radius in scene units (pixels by default). */
  public get radius(): number {
    return this._radius;
  }

  /** Set radius. */
  public setRadius(r: number): this {
    this._radius = r > 0 ? r : 0;
    return this;
  }

  protected createPath(ctx: CanvasRenderingContext2D): void {
    const r = this._radius;
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
}
