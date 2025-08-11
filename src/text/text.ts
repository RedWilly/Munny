/**
 * Text mobject using node-canvas and FontManager for system fonts.
 *
 * Styling (fill, stroke, opacity, transforms) is handled by Mobject.
 * Font family and size are provided here with simple fluent setters.
 */
import type { CanvasRenderingContext2D } from 'canvas';
import { Mobject } from '../core/mobject.ts';
import { FontManager } from '../font/font_manager.ts';

export class Text extends Mobject {
  private _text: string;
  private _fontFamily?: string; // requested family name
  private _resolvedFamily?: string; // registered family actually used
  private _fontSize: number = 48;

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
  }

  public setText(text: string): this {
    this._text = text;
    return this;
  }

  /** Set font family (chainable). Alias: .setFont() */
  public setFontFamily(family?: string): this {
    this._fontFamily = family;
    this._resolvedFamily = undefined; // re-resolve on next draw
    return this;
  }

  /** Set font size in px (chainable). Alias: .fontSize() */
  public setFontSize(px: number): this {
    this._fontSize = px > 0 ? px : 1;
    return this;
  }

  /** Fluent alias for setFontFamily. */
  public setFont(family?: string): this { return this.setFontFamily(family); }

  protected createPath(_ctx: CanvasRenderingContext2D): void {
    // Text draws directly; no path to prebuild here.
  }

  public override draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Ensure font is registered and keep the selected family cached.
    if (!this._resolvedFamily) {
      const fam = FontManager.get().ensureRegistered(this._fontFamily);
      this._resolvedFamily = fam ?? this._fontFamily ?? 'Arial';
    }

    ctx.save();
    try {
      // Apply transforms
      ctx.translate(this.position[0]!, this.position[1]!);
      // Cancel the scene's global Y-up flip first so rotation keeps its sign
      ctx.scale(1, -1);
      if (this.rotation !== 0) ctx.rotate(this.rotation);
      if (this.scale[0] !== 1 || this.scale[1] !== 1) ctx.scale(this.scale[0]!, this.scale[1]!);

      // Opacity
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * this.opacity;

      // Configure text styles (fixed center alignment for now)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `${this._fontSize}px ${quoteIfNeeded(this._resolvedFamily)}`;

      // Fill then stroke (if configured)
      if (this.fillColor) {
        ctx.fillStyle = this.fillColor as string;
        ctx.fillText(this._text, 0, 0);
      }
      if (this.strokeColor && this.strokeWidth > 0) {
        ctx.strokeStyle = this.strokeColor as string;
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeText(this._text, 0, 0);
      }

      ctx.globalAlpha = prevAlpha;
    } finally {
      ctx.restore();
    }
  }
}

function quoteIfNeeded(family: string): string {
  return /\s/.test(family) ? `'${family.replace(/'/g, "\\'")}'` : family;
}
