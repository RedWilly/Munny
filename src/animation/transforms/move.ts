import { Animation } from '../base/animation.ts';
import type { ReadonlyVec2, Vec2 } from '../../core/types.ts';
import { vec2 } from '../../core/types.ts';
import { mixVec2 } from '../../core/math.ts';
import type { Mobject } from '../../core/mobject.ts';


/**
 * MoveTo animation - moves a Mobject to an absolute position.
 */
export class MoveTo extends Animation {
  private readonly to: Vec2;
  private readonly from: Vec2 = vec2(0, 0);
  private readonly tmp: Vec2 = vec2(0, 0);

  constructor(target: Mobject, to: ReadonlyVec2) {
    super(target);
    this.to = vec2(to[0], to[1]);
  }

  public setup(): void {
    const p = this.target.position; // Vec2
    this.from[0] = p[0]!;
    this.from[1] = p[1]!;
  }

  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    mixVec2(this.tmp, this.from, this.to, t);
    this.target.setPosition(this.tmp[0]!, this.tmp[1]!);
  }
}


/**
 * MoveBy animation - moves a Mobject by a relative position.
 */
export class MoveBy extends Animation {
  private readonly delta: Vec2;
  private readonly from: Vec2 = vec2(0, 0);
  private readonly to: Vec2 = vec2(0, 0);
  private readonly tmp: Vec2 = vec2(0, 0);

  /**
   * Create a MoveBy animation.
   * @param target Target mobject to move
   * @param delta Translation delta [dx, dy] in scene units
   */
  constructor(target: Mobject, delta: ReadonlyVec2) {
    super(target);
    this.delta = vec2(delta[0], delta[1]);
  }

  /** Capture starting position and compute absolute destination. */
  public setup(): void {
    const p = this.target.position;
    this.from[0] = p[0]!;
    this.from[1] = p[1]!;
    this.to[0] = this.from[0]! + this.delta[0]!;
    this.to[1] = this.from[1]! + this.delta[1]!;
  }

  /** Interpolate from start to start+delta over time. */
  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    mixVec2(this.tmp, this.from, this.to, t);
    this.target.setPosition(this.tmp[0]!, this.tmp[1]!);
  }
}