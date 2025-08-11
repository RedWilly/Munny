/**
 * Base drawable object (Mobject) for the engine.
 *
 * Provides transform and styling state, chainable setters, and a uniform
 * drawing pipeline that delegates path creation to subclasses.
 */
import type { ColorString, ReadonlyVec2, Vec2 } from './types.ts';
import { vec2 } from './types.ts';
import type { CanvasRenderingContext2D } from 'canvas';
import { FadeIn } from '../animation/fade_in.ts';
import { MoveTo } from '../animation/move_to.ts';

/**
 * Abstract base class for all renderable objects.
 */
export abstract class Mobject {
  /** Optional debug name. */
  public readonly name: string;

  /** Position in scene coordinates (origin center, Y-up). */
  protected readonly _position: Vec2 = vec2(0, 0);

  /** Scale in X and Y. */
  protected readonly _scale: Vec2 = vec2(1, 1);

  /** Rotation in radians (counter-clockwise, mathematical orientation). */
  protected _rotation: number = 0;

  /** Opacity in [0,1]. */
  protected _opacity: number = 1;

  /** Fill and stroke styling. */
  protected _fillColor: ColorString | null = '#ffffff';
  protected _strokeColor: ColorString | null = '#000000';
  protected _strokeWidth: number = 1;

  /** Visibility flag. */
  protected _visible: boolean = true;

  constructor(name: string = 'Mobject') {
    this.name = name;
  }

  /** Current position (mutable typed array). */
  public get position(): Vec2 {
    return this._position;
  }

  /** Current scale (mutable typed array). */
  public get scale(): Vec2 {
    return this._scale;
  }

  /** Current rotation in radians. */
  public get rotation(): number {
    return this._rotation;
  }

  /** Current opacity in [0,1]. */
  public get opacity(): number {
    return this._opacity;
  }

  /** Whether visible. */
  public get visible(): boolean {
    return this._visible;
  }

  /** Fill color or null for no fill. */
  public get fillColor(): ColorString | null {
    return this._fillColor;
  }

  /** Stroke color or null for no stroke. */
  public get strokeColor(): ColorString | null {
    return this._strokeColor;
  }

  /** Stroke width in pixels. */
  public get strokeWidth(): number {
    return this._strokeWidth;
  }

  /** Set absolute position. */
  public setPosition(x: number, y: number): this {
    this._position[0] = x;
    this._position[1] = y;
    return this;
  }

  /** Translate by delta. */
  public translate(dx: number, dy: number): this {
    this._position[0]! += dx;
    this._position[1]! += dy;
    return this;
  }

  /** Set rotation in radians. */
  public setRotation(thetaRad: number): this {
    this._rotation = thetaRad;
    return this;
  }

  /** Set scale in X and Y. */
  public setScale(sx: number, sy?: number): this {
    this._scale[0] = sx;
    this._scale[1] = sy ?? sx;
    return this;
  }

  /** Set opacity in [0,1]. */
  public setOpacity(alpha: number): this {
    const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
    this._opacity = a;
    return this;
  }

  /** Set only fill color; pass null to disable fill. */
  public fill(color: ColorString | null): this {
    this._fillColor = color;
    return this;
  }

  /** Set only stroke color; pass null to disable stroke. */
  public stroke(color: ColorString | null): this {
    this._strokeColor = color;
    return this;
  }

  /** Set stroke width in pixels. */
  public setStrokeWidth(width: number): this {
    this._strokeWidth = width;
    return this;
  }

  /** Convenience to set both fill and stroke to same color. */
  public setColor(color: ColorString): this {
    this._fillColor = color;
    this._strokeColor = color;
    return this;
  }

  /** Immediate move to absolute position via tuple. */
  public positionTo(v: ReadonlyVec2): this {
    this._position[0] = v[0];
    this._position[1] = v[1];
    return this;
  }

  /**
   * Create a FadeIn animation for this object.
   * @param duration Optional duration in seconds (defaults to 1 if omitted)
   */
  public fadeIn(duration?: number): FadeIn {
    const anim = new FadeIn(this);
    if (duration !== undefined) anim.setDuration(duration);
    return anim;
  }

  /**
   * Create a MoveTo animation for this object.
   * @param to Destination position (absolute)
   * @param duration Optional duration in seconds (defaults to 1 if omitted)
   */
  public moveTo(to: ReadonlyVec2, duration?: number): MoveTo {
    const anim = new MoveTo(this, to);
    if (duration !== undefined) anim.setDuration(duration);
    return anim;
  }

  /**
   * Create a path for this object at local origin. Subclasses must implement.
   * The base draw method will handle fill/stroke after this path is defined.
   */
  protected abstract createPath(ctx: CanvasRenderingContext2D): void;

  /**
   * Draw with current transforms and style.
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this._visible) return;

    ctx.save();
    try {
      // Apply transforms: translate -> rotate -> scale
      ctx.translate(this._position[0]!, this._position[1]!);
      if (this._rotation !== 0) ctx.rotate(this._rotation);
      if (this._scale[0] !== 1 || this._scale[1] !== 1) ctx.scale(this._scale[0]!, this._scale[1]!);

      // Apply opacity (multiplicative)
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * this._opacity;

      // Build path
      ctx.beginPath();
      this.createPath(ctx);

      // Fill if requested
      if (this._fillColor) {
        ctx.fillStyle = this._fillColor;
        ctx.fill();
      }

      // Stroke if requested
      if (this._strokeColor && this._strokeWidth > 0) {
        ctx.strokeStyle = this._strokeColor;
        ctx.lineWidth = this._strokeWidth;
        ctx.stroke();
      }

      // Restore alpha
      ctx.globalAlpha = prevAlpha;
    } finally {
      ctx.restore();
    }
  }
}
