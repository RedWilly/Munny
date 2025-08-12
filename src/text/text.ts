/**
 * Text mobject composed of per-character `TextChar` children.
 *
 * - Inherits transforms/opacity from group (`VGroup`).
 * - Characters are individually addressable and animatable.
 * - Supports runtime numeric indexing via Proxy: `text[0]`.
 */
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { VGroup } from '../core/vgroup.ts';
import { TextChar } from './text_char.ts';
import { FontManager } from '../font/font_manager.ts';

export class Text extends VGroup<TextChar> {
  [index: number]: TextChar; 
  private _text: string;
  private _fontFamily?: string; // requested family name
  private _resolvedFamily?: string; // registered family actually used
  private _fontSize: number = 48;
  private _needsLayout: boolean = true;
  /**
   * Create text. Defaults: size=48, family resolved via FontManager (Arial fallback).
   * Use chaining for style (fill/stroke) from Mobject, and .font() / .fontSize().
   */
  constructor(text: string, opts?: { font?: string; family?: string; size?: number; fontsize?: number }, name: string = 'Text') {
    super(name);
    this._text = text;
    const fam = opts?.font ?? opts?.family;
    if (fam) this._fontFamily = fam;
    const sz = opts?.size ?? opts?.fontsize;
    if (sz !== undefined) this._fontSize = sz > 0 ? sz : 1;
    // Default fill to white for visibility
    this.fill('#ffffff');

    // Return a Proxy enabling numeric indexing at runtime
    // Note: TypeScript will not know about the index signature by default.
    // Create a strongly typed proxy
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const idx = Number(prop);
          return target.charAt(idx);
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as this;
  }

  public setText(text: string): this {
    if (this._text !== text) {
      this._text = text;
      this._needsLayout = true;
    }
    return this;
  }

  /** Fluent alias for setText. */
  public text(text: string): this { return this.setText(text); }


  /** Set font family (chainable). Alias: .setFont() */
  public setFontFamily(family?: string): this {
    this._fontFamily = family;
    this._resolvedFamily = undefined; // re-resolve on next layout
    this._needsLayout = true;
    return this;
  }

  /** Set font size in px (chainable). Alias: .fontSize() */
  public setFontSize(px: number): this {
    const v = px > 0 ? px : 1;
    if (this._fontSize !== v) {
      this._fontSize = v;
      this._needsLayout = true;
    }
    return this;
  }

  /** Fluent alias for setFontFamily. */
  public setFont(family?: string): this { return this.setFontFamily(family); }
  /** Fluent alias: .font() */
  public font(family?: string): this { return this.setFontFamily(family); }
  /** Fluent alias: .fontSize() */
  public fontSize(px: number): this { return this.setFontSize(px); }

  /** Access number of characters. */
  public override get length(): number { return this._text.length; }

  /** Safe accessor used by proxy and charAt. */
  private getChar(index: number): TextChar {
    this.ensureLayout();
    const ch = (this as any).children?.[index];
    if (!ch) {
      throw new RangeError(
        `Text "${this._text}": index ${index} is out of range (0..${this._text.length - 1})`
      );
    }
    return ch;
  }

  /** Return the character at `index`. */
  public charAt(index: number): TextChar {
    return this.getChar(index);
  }

  /**
   * Alias for `charAt(index)` – strict-safe accessor matching Array/String `.at()` semantics.
   * Always returns a `TextChar` or throws RangeError if out of bounds.
   */
  public at(index: number): TextChar {
    return this.getChar(index);
  }

  /** Slice characters into a VGroup referencing the same children. */
  public override slice(start?: number, end?: number) {
    this.ensureLayout();
    return super.slice(start, end);
  }

  /** Iterator over characters. */
  public override [Symbol.iterator](): IterableIterator<TextChar> {
    this.ensureLayout();
    return (this as any).children[Symbol.iterator]();
  }

  /** Draw: ensure layout first, then use VGroup to render children. */
  public override draw(ctx: SKRSContext2D): void {
    if (!this.visible) return;
    this.ensureLayout();
    // Propagate current parent style to characters so updates reflect immediately
    const children = (this as any).children as TextChar[];
    for (let i = 0; i < children.length; i++) {
      const ch = children[i]!;
      if (this.fillColor !== null) ch.fill(this.fillColor);
      else ch.fill(null);
      if (this.strokeColor !== null) ch.stroke(this.strokeColor);
      else ch.stroke(null);
      ch.setStrokeWidth(this.strokeWidth);
    }
    super.draw(ctx);
  }

  /** Build or update character children and their positions. */
  private ensureLayout(): void {
    if (!this._needsLayout) return;

    // Resolve and register font once
    if (!this._resolvedFamily) {
      const fam = FontManager.get().ensureRegistered(this._fontFamily);
      this._resolvedFamily = fam ?? this._fontFamily ?? 'Arial';
    }

    const n = this._text.length;
    const children = (this as any).children as TextChar[];

    // Adjust children count to match text length
    for (let i = children.length; i < n; i++) {
      const ch = new TextChar(' ');
      // Initialize with current parent style (one-time)
      if (this.fillColor) ch.fill(this.fillColor);
      if (this.strokeColor) ch.stroke(this.strokeColor);
      ch.setStrokeWidth(this.strokeWidth);
      children.push(ch);
    }
    if (children.length > n) children.length = n;

    // Update glyphs and font on all children
    for (let i = 0; i < n; i++) {
      const chObj = children[i]!;
      chObj.setChar(this._text[i]!);
      chObj.setResolvedFamily(this._resolvedFamily);
      chObj.setFontFamily(this._fontFamily);
      chObj.setFontSize(this._fontSize);
      // Opacity multiplies via group; keep char opacity at 1 unless modified by user
    }

    // Measure widths and place characters centered around x=0
    const mctx = getMeasureContext();
    mctx.font = `${this._fontSize}px ${quoteIfNeeded(this._resolvedFamily)}`;
    const widths = new Float64Array(n);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const w = mctx.measureText(this._text[i]!).width;
      widths[i] = w;
      total += w;
    }
    let x = -total / 2;
    for (let i = 0; i < n; i++) {
      const cx = x + widths[i]! / 2;
      children[i]!.setPosition(cx, 0);
      x += widths[i]!;
    }

    this._needsLayout = false;
  }

}

function quoteIfNeeded(family: string): string {
  return /\s/.test(family) ? `'${family.replace(/'/g, "\\'")}'` : family;
}

// Cached measurement context for text metrics
let _measureCtx: SKRSContext2D | null = null;
function getMeasureContext(): SKRSContext2D {
  if (_measureCtx) return _measureCtx;
  const c = createCanvas(8, 8);
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Failed to acquire 2D context for measurement');
  _measureCtx = ctx as SKRSContext2D;
  return _measureCtx;
}
