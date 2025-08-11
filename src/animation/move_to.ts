/**
 * MoveTo animation - moves a Mobject to an absolute position.
 */
import { Animation } from './animation.ts';
import type { ReadonlyVec2, Vec2 } from '../core/types.ts';
import { vec2 } from '../core/types.ts';
import { mixVec2 } from '../core/math.ts';
import type { Mobject } from '../core/mobject.ts';

export class MoveTo extends Animation {
  private readonly to: Vec2;
  private readonly from: Vec2 = vec2(0, 0);

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
    const tmp = vec2(0, 0);
    mixVec2(tmp, this.from, this.to, t);
    this.target.setPosition(tmp[0]!, tmp[1]!);
  }
}
