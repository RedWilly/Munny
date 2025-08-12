/**
 * VGroup<T> - Vector-only group container for Mobjects.
 *
 * Applies group-level transforms and opacity to children, then draws each child.
 * Styling (fill/stroke) is not applied at group level; children own their style.
 */
import type { SKRSContext2D } from '@napi-rs/canvas';
import { Mobject } from './mobject.ts';

/**
 * Vector-only group that holds child Mobjects.
 */
export class VGroup<T extends Mobject = Mobject> extends Mobject {
  protected readonly children: T[] = [];

  constructor(name: string = 'VGroup') {
    super(name);
    // Groups start fully transparent? No; default 1 like base Mobject
  }

  /** Number of children. */
  public get length(): number {
    return this.children.length;
  }

  /** Iterator over children. */
  public [Symbol.iterator](): IterableIterator<T> {
    return this.children[Symbol.iterator]();
  }

  /** Get child at index or undefined. */
  public get(i: number): T | undefined {
    return this.children[i];
  }

  /** Slice into a new group (references same children). */
  public slice(start?: number, end?: number): VGroup<T> {
    const g = new VGroup<T>(`${this.name}.slice`);
    for (const child of this.children.slice(start, end)) g.add(child);
    return g;
  }

  /** Add children to the group. */
  public add(...objs: T[]): this {
    for (const o of objs) this.children.push(o);
    return this;
  }

  /** Remove a child if present. */
  public remove(obj: T): this {
    const idx = this.children.indexOf(obj);
    if (idx >= 0) this.children.splice(idx, 1);
    return this;
  }

  /** Clear all children. */
  public clear(): this {
    this.children.length = 0;
    return this;
  }

  /** No path for a group. */
  protected createPath(_ctx: SKRSContext2D): void {}

  /**
   * Draw group: apply transforms and opacity, then draw each child.
   */
  public override draw(ctx: SKRSContext2D): void {
    if (!this.visible) return;

    ctx.save();
    try {
      // Group transforms: translate -> rotate -> scale
      ctx.translate(this.position[0]!, this.position[1]!);
      if (this.rotation !== 0) ctx.rotate(this.rotation);
      if (this.scale[0] !== 1 || this.scale[1] !== 1) ctx.scale(this.scale[0]!, this.scale[1]!);

      // Opacity multiply
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * this.opacity;

      // Draw children
      for (const child of this.children) child.draw(ctx);

      ctx.globalAlpha = prevAlpha;
    } finally {
      ctx.restore();
    }
  }
}
