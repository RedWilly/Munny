/**
 * Text mobject composed of per-character `TextChar` children.
 *
 * - Inherits transforms/opacity from group (`VGroup`).
 * - Characters are individually addressable and animatable.
 * - Supports runtime numeric indexing via Proxy: `text[0]`.
 */
import type { SKRSContext2D } from '@napi-rs/canvas';
import { VGroup } from '../core/vgroup.ts';
import { TextChar } from './text_char.ts';
import { layoutText, type TextLayout, type GlyphData } from '../font/glyph_path_extractor.ts';

export class Text extends VGroup<TextChar> {
  [index: number]: TextChar; 
  private _text: string;
  private _font?: string; 
  private _fontSize: number = 48;
  private _needsLayout: boolean = true;
  /**
   * Create text. Defaults: fontSize=48. 
   * Use chaining for style (fill/stroke) from Mobject, and .font() / .fontSize().
   */
  constructor(
    text: string,
    opts?: { font?: string; fontSize?: number },
    name: string = 'Text'
  ) {
    super(name);
    this._text = text;
    if (opts?.font) this._font = opts.font;
    const sz = opts?.fontSize;
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


  /** Set font specification (chainable). Supports family names, file paths, or path#family format. */
  public setFont(font?: string): this {
    this._font = font;
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

  /** Fluent alias: .fontSize() */
  public fontSize(px: number): this { return this.setFontSize(px); }

  /** Fluent alias: .font() */
  public font(font?: string): this { return this.setFont(font); }


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

  /** Build or update character children using fontkit layout. */
  private ensureLayout(): void {
    if (!this._needsLayout) return;

    // Resolve font path
    let fontPath: string;
    if (this._font) {
      fontPath = this._font;
    } else {
      // Fallback to bundled font
      fontPath = './src/font/ROBOTO-REGULAR.TTF';
    }

    try {
      // Use fontkit layout for proper text shaping
      const layout: TextLayout = layoutText(fontPath, this._text, this._fontSize);
      const children = (this as any).children as TextChar[];

      // Adjust children count to match glyph count
      const glyphCount = layout.glyphs.length;
      for (let i = children.length; i < glyphCount; i++) {
        // Create placeholder - will be updated below
        const placeholder: GlyphData = {
          pathCommands: [],
          advanceWidth: 0,
          bbox: { x: 0, y: 0, width: 0, height: 0 },
          position: { x: 0, y: 0 }
        };
        const ch = new TextChar(placeholder, ' ');
        // Initialize with current parent style
        if (this.fillColor) ch.fill(this.fillColor);
        if (this.strokeColor) ch.stroke(this.strokeColor);
        ch.setStrokeWidth(this.strokeWidth);
        children.push(ch);
      }
      if (children.length > glyphCount) children.length = glyphCount;

      // Update each character with proper glyph data
      for (let i = 0; i < glyphCount; i++) {
        const glyphData = layout.glyphs[i]!;
        const char = this._text[i] || ' ';
        const chObj = children[i]!;
        
        // Update glyph data and position
        chObj.updateGlyph(glyphData, char);
        
        // Center the text around x=0
        const centeredX = glyphData.position.x - layout.totalWidth / 2;
        chObj.setPosition(centeredX, glyphData.position.y);
      }

      this._needsLayout = false;
    } catch (error) {
      console.error(`Failed to layout text "${this._text}": ${error}`);
    }
  }

}
