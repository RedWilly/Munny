import { Animation } from '../base/animation.ts';
import { lerp } from '../../core/math.ts';
import type { Mobject } from '../../core/mobject.ts';

/**
 * RotateTo - animates absolute rotation to a target angle (radians, CCW).
 *
 * Uses linear interpolation with configured easing.
 */
export class RotateTo extends Animation {
  private from: number = 0;
  private readonly to: number;

  constructor(target: Mobject, angleRad: number) {
    super(target);
    this.to = angleRad;
  }

  /** Capture initial rotation. */
  public setup(): void {
    this.from = this.target.rotation;
  }

  /** Interpolate rotation using easing. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    const theta = lerp(this.from, this.to, t);
    this.target.setRotation(theta);
  }
}

/**
 * RotateBy - animates a relative rotation delta (radians).
 */
export class RotateBy extends Animation {
  private from: number = 0;
  private to: number = 0;
  private readonly delta: number;

  constructor(target: Mobject, deltaRad: number) {
    super(target);
    this.delta = deltaRad;
  }

  /** Capture initial rotation and compute destination. */
  public setup(): void {
    this.from = this.target.rotation;
    this.to = this.from + this.delta;
  }

  /** Interpolate rotation using easing. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    const theta = lerp(this.from, this.to, t);
    this.target.setRotation(theta);
  }
}
