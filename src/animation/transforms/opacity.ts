import { Animation } from '../base/animation.ts';
import { lerp, clamp } from '../../core/math.ts';
import type { Mobject } from '../../core/mobject.ts';

/**
 * OpacityTo - animates opacity to a target value in [0,1].
 */
export class OpacityTo extends Animation {
  private from: number = 1;
  private readonly to: number;

  constructor(target: Mobject, opacity: number) {
    super(target);
    this.to = clamp(opacity, 0, 1);
  }

  /** Capture initial opacity. */
  public setup(): void {
    this.from = this.target.opacity;
  }

  /** Interpolate opacity using easing. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    const a = lerp(this.from, this.to, t);
    this.target.setOpacity(a);
  }
}
