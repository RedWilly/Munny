/**
 * Rectangle shape.
 *
 * Axis-aligned rectangle centered at the local origin. Width and height are
 * specified in scene units (pixels by default).
 */
import { Mobject } from '../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';

/** Rectangle defined by width and height, centered at origin. */
export class Rectangle extends Mobject {
  private _width: number;
  private _height: number;

  /**
   * Create a Rectangle.
   * @param width Rectangle width in scene units
   * @param height Rectangle height in scene units
   * @param name Optional debug name
   */
  constructor(width: number = 100, height: number = 60, name: string = 'Rectangle') {
    super(name);
    this._width = width;
    this._height = height;
  }

  /** Rectangle width. */
  public get width(): number {
    return this._width;
  }

  /** Rectangle height. */
  public get height(): number {
    return this._height;
  }

  /**
   * Set rectangle size.
   * @param width New width
   * @param height New height
   */
  public setSize(width: number, height: number): this {
    this._width = width >= 0 ? width : 0;
    this._height = height >= 0 ? height : 0;
    return this;
  }

  /** Define the rectangle path centered at local origin. */
  protected createPath(ctx: SKRSContext2D): void {
    const w = this._width;
    const h = this._height;
    ctx.rect(-w / 2, -h / 2, w, h);
  }
}
