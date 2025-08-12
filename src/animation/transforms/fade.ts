import { Animation } from '../base/animation.ts';
import type { Mobject } from '../../core/mobject.ts';

/**
 * FadeIn animation - interpolates opacity from initial to 1.
 */

export class FadeIn extends Animation {
  private fromOpacity = 0;

  constructor(target: Mobject) {
    super(target);
  }

  public setup(): void {
    this.fromOpacity = this.target.opacity;
    // Ensure starts visible
    this.target.setOpacity(this.fromOpacity);
  }

  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    const next = this.fromOpacity + (1 - this.fromOpacity) * t;
    this.target.setOpacity(next);
  }
}


/**
 * FadeOut animation - interpolates opacity from current value to 0.
 */
export class FadeOut extends Animation {
  private fromOpacity = 1;

  constructor(target: Mobject) {
    super(target);
  }

  /** Capture the starting opacity. */
  public setup(): void {
    this.fromOpacity = this.target.opacity;
    // Ensure we start from the current opacity value
    this.target.setOpacity(this.fromOpacity);
  }

  /** Interpolate opacity toward 0 using easing. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    const next = this.fromOpacity * (1 - t);
    this.target.setOpacity(next);
  }

  /** Snap to fully transparent at completion. */
  public override cleanup(): void {
    this.target.setOpacity(0);
  }
}