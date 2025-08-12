import { Animation } from './animation.ts';
import type { Mobject } from '../core/mobject.ts';

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
 * FadeOut animation - interpolates opacity from 1 to initial.
 */

//todo