import { Animation } from '../base/animation.ts';
import { lerp, mixVec2 } from '../../core/math.ts';
import type { ReadonlyVec2, Vec2 } from '../../core/types.ts';
import { vec2 } from '../../core/types.ts';
import type { Mobject } from '../../core/mobject.ts';

/**
 * ScaleTo - animates absolute scale to a target [sx, sy].
 */
export class ScaleTo extends Animation {
  private readonly to: Vec2;
  private readonly from: Vec2 = vec2(1, 1);
  private readonly tmp: Vec2 = vec2(1, 1);

  constructor(target: Mobject, scale: ReadonlyVec2) {
    super(target);
    this.to = vec2(scale[0], scale[1]);
  }

  /** Capture starting scale. */
  public setup(): void {
    const s = this.target.scale;
    this.from[0] = s[0]!;
    this.from[1] = s[1]!;
  }

  /** Interpolate scale using easing. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    mixVec2(this.tmp, this.from, this.to, t);
    this.target.setScale(this.tmp[0]!, this.tmp[1]!);
  }
}

/**
 * ScaleBy - multiplies current scale by given factors [dx, dy].
 */
export class ScaleBy extends Animation {
  private readonly factor: Vec2;
  private readonly from: Vec2 = vec2(1, 1);
  private readonly to: Vec2 = vec2(1, 1);
  private readonly tmp: Vec2 = vec2(1, 1);

  constructor(target: Mobject, factor: ReadonlyVec2) {
    super(target);
    this.factor = vec2(factor[0], factor[1]);
  }

  /** Compute absolute target from multiplicative factor. */
  public setup(): void {
    const s = this.target.scale;
    this.from[0] = s[0]!;
    this.from[1] = s[1]!;
    this.to[0] = this.from[0]! * this.factor[0]!;
    this.to[1] = this.from[1]! * this.factor[1]!;
  }

  /** Interpolate multiplicative scaling. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    // Interpolate in linear space between from and to
    this.tmp[0] = lerp(this.from[0]!, this.to[0]!, t);
    this.tmp[1] = lerp(this.from[1]!, this.to[1]!, t);
    this.target.setScale(this.tmp[0]!, this.tmp[1]!);
  }
}
