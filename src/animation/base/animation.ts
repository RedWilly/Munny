/**
 * Animation base class and helpers.
 */
import type { EasingName } from '../../core/types.ts';
import { getEasing } from './easing.ts';
import type { Mobject } from '../../core/mobject.ts';

/**
 * Base animation operating on a single Mobject.
 */
export abstract class Animation {
  /** Target object to animate. */
  public readonly target: Mobject;

  /** Duration in seconds. */
  protected _duration: number = 1;

  /** Easing name. */
  protected _easing: EasingName = 'linear';

  constructor(target: Mobject) {
    this.target = target;
  }

  /** Set the duration in seconds. */
  public setDuration(seconds: number): this {
    this._duration = seconds > 0 ? seconds : 0.000_001; // avoid 0
    return this;
  }

  /** Set the easing by name. */
  public setEasing(name: EasingName): this {
    this._easing = name;
    return this;
  }

  /** Duration getter. */
  public get duration(): number {
    return this._duration;
  }

  /** Called once before ticking to capture initial state. */
  public abstract setup(): void;

  /** Called each frame with normalized time t in [0,1]. */
  public abstract tick(tNorm: number): void;

  /** Optional cleanup after finishing. */
  public cleanup(): void {
    // default no-op
  }

  /** Map linear time to eased time. */
  protected ease(tNorm: number): number {
    const fn = getEasing(this._easing);
    return fn(tNorm < 0 ? 0 : tNorm > 1 ? 1 : tNorm);
  }
}
