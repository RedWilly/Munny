/**
 * Animation combinators for sequencing and parallel execution.
 */
import { Animation } from './animation.ts';
import { Mobject as BaseMobject } from '../../core/mobject.ts';
import type { SKRSContext2D } from '@napi-rs/canvas';

/**
 * Internal no-op mobject used as target for composite animations.
 * It is never added to a scene; it only satisfies the Animation base class.
 */
class NullMobject extends BaseMobject {
  protected createPath(_ctx: SKRSContext2D): void {
    // no-op
  }
}

/**
 * Run animations one after another.
 * Duration defaults to sum of child durations; setting a new duration scales children proportionally.
 */
export class SequenceAnimation extends Animation {
  private readonly children: Animation[];
  private readonly durations: number[];
  private readonly ends: number[]; // cumulative end times in seconds
  private started: boolean[];
  private cleaned: boolean[];
  private currentIndex = 0;

  constructor(...children: Animation[]) {
    super(new NullMobject());
    if (children.length === 0) throw new Error('Sequence requires at least one animation');
    this.children = children;
    this.durations = children.map((c) => c.duration);
    this.ends = [];
    let acc = 0;
    for (let i = 0; i < this.durations.length; i++) {
      acc += this.durations[i]!;
      this.ends.push(acc);
    }
    this._duration = acc;
    this.started = new Array(children.length).fill(false);
    this.cleaned = new Array(children.length).fill(false);
  }

  /** Scale child durations proportionally to new total duration. */
  public override setDuration(seconds: number): this {
    const old = this._duration;
    const factor = seconds > 0 ? seconds / old : 0.000001 / old;
    for (let i = 0; i < this.children.length; i++) {
      const d = Math.max(this.children[i]!.duration * factor, 0.000001);
      this.children[i]!.setDuration(d);
      this.durations[i] = d;
    }
    // recompute ends
    this.ends.length = 0;
    let acc = 0;
    for (let i = 0; i < this.durations.length; i++) {
      acc += this.durations[i]!;
      this.ends.push(acc);
    }
    this._duration = acc;
    return this;
  }

  public override setup(): void {
    // Do not pre-setup all children; setup each when it starts to capture state after previous ones finished.
    this.currentIndex = 0;
    this.started.fill(false);
    this.cleaned.fill(false);
  }

  public override tick(tNorm: number): void {
    const total = this._duration;
    const tAbs = Math.min(Math.max(tNorm, 0), 1) * total;

    // finalize any children that have fully ended before current tAbs
    while (
      this.currentIndex < this.children.length &&
      tAbs >= this.ends[this.currentIndex]!
    ) {
      const idx = this.currentIndex;
      if (!this.started[idx]) {
        this.children[idx]!.setup();
        this.started[idx] = true;
      }
      // ensure it ends at 1
      this.children[idx]!.tick(1);
      if (!this.cleaned[idx]) {
        this.children[idx]!.cleanup();
        this.cleaned[idx] = true;
      }
      this.currentIndex++;
    }

    if (this.currentIndex >= this.children.length) {
      return; // all done
    }

    const start = this.currentIndex === 0 ? 0 : this.ends[this.currentIndex - 1]!;
    const dur = this.durations[this.currentIndex]!;
    if (!this.started[this.currentIndex]) {
      this.children[this.currentIndex]!.setup();
      this.started[this.currentIndex] = true;
    }
    const localT = dur > 0 ? (tAbs - start) / dur : 1;
    this.children[this.currentIndex]!.tick(Math.min(Math.max(localT, 0), 1));
  }

  public override cleanup(): void {
    for (let i = 0; i < this.children.length; i++) {
      if (!this.started[i]) {
        this.children[i]!.setup();
        this.started[i] = true;
      }
      if (!this.cleaned[i]) {
        this.children[i]!.tick(1);
        this.children[i]!.cleanup();
        this.cleaned[i] = true;
      }
    }
  }
}

/**
 * Run animations in parallel.
 * Duration defaults to the max child duration; setting a new duration scales children proportionally.
 */
export class ParallelAnimation extends Animation {
  private readonly children: Animation[];
  private cleaned: boolean[];
  private readonly baseDurations: number[];

  constructor(...children: Animation[]) {
    super(new NullMobject());
    if (children.length === 0) throw new Error('Parallel requires at least one animation');
    this.children = children;
    this.baseDurations = children.map((c) => c.duration);
    this._duration = this.baseDurations.reduce((a, b) => (a > b ? a : b), 0);
    this.cleaned = new Array(children.length).fill(false);
  }

  /** Scale child durations proportionally to new total duration (relative to their original durations). */
  public override setDuration(seconds: number): this {
    const oldMax = this._duration;
    const factor = seconds > 0 ? seconds / oldMax : 0.000001 / oldMax;
    for (let i = 0; i < this.children.length; i++) {
      const d = Math.max(this.children[i]!.duration * factor, 0.000001);
      this.children[i]!.setDuration(d);
    }
    this._duration = seconds > 0 ? seconds : 0.000001;
    return this;
  }

  public override setup(): void {
    // parallel: all capture initial state at t=0
    for (let i = 0; i < this.children.length; i++) this.children[i]!.setup();
  }

  public override tick(tNorm: number): void {
    const total = this._duration;
    const tAbs = Math.min(Math.max(tNorm, 0), 1) * total;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i]!;
      const d = child.duration;
      const localT = d > 0 ? Math.min(tAbs / d, 1) : 1;
      child.tick(localT);
      if (localT >= 1 && !this.cleaned[i]) {
        child.cleanup();
        this.cleaned[i] = true;
      }
    }
  }

  public override cleanup(): void {
    for (let i = 0; i < this.children.length; i++) {
      if (!this.cleaned[i]) {
        this.children[i]!.tick(1);
        this.children[i]!.cleanup();
        this.cleaned[i] = true;
      }
    }
  }
}

/** Helper functions for ergonomic creation */
export function Sequence(...anims: Animation[]): SequenceAnimation {
  return new SequenceAnimation(...anims);
}

export function Parallel(...anims: Animation[]): ParallelAnimation {
  return new ParallelAnimation(...anims);
}
