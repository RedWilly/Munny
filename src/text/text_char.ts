/**
 * TextChar - single character mobject drawn via vector paths.
 *
 * Renders individual glyphs from fontkit layout with proper positioning.
 * Supports individual character animations while maintaining text layout integrity.
 */
import type { SKRSContext2D } from '@napi-rs/canvas';
import { Mobject } from '../core/mobject.ts';
import { renderGlyph, type GlyphData } from '../font/glyph_path_extractor.ts';

export class TextChar extends Mobject {
  private _glyphData: GlyphData;
  private _char: string;

  constructor(glyphData: GlyphData, char: string, name: string = 'TextChar') {
    super(name);
    this._glyphData = glyphData;
    this._char = char;
    // Position based on glyph layout data
    // this.setPosition(glyphData.position.x, glyphData.position.y);
  }

  /** Get the character this glyph represents */
  public get char(): string {
    return this._char;
  }

  /** Update glyph data (used when text changes) */
  public updateGlyph(glyphData: GlyphData, char: string): this {
    this._glyphData = glyphData;
    this._char = char;
    this.setPosition(glyphData.position.x, glyphData.position.y);
    return this;
  }

  protected createPath(_ctx: SKRSContext2D): void {
    // Vector paths are handled in draw() method
  }

  /** Draw the glyph using vector paths */
  public override draw(ctx: SKRSContext2D): void {
    if (!this.visible) return;

    ctx.save();
    try {
      // Apply transforms
      ctx.translate(this.position[0]!, this.position[1]!);
      if (this.rotation !== 0) ctx.rotate(this.rotation);
      if (this.scale[0] !== 1 || this.scale[1] !== 1) ctx.scale(this.scale[0]!, this.scale[1]!);

      // Apply opacity
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * this.opacity;

      // Render glyph at origin (position is already applied via translate)
      renderGlyph(
        ctx,
        this._glyphData,
        0, // No additional offset needed
        0,
        this.fillColor,
        this.strokeColor,
        this.strokeWidth
      );

      ctx.globalAlpha = prevAlpha;
    } finally {
      ctx.restore();
    }
  }

}
