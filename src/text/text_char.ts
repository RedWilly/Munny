/**
 * TextChar - single character mobject drawn via canvas text APIs.
 *
 * Draws one character at its local origin (baseline y=0) with center alignment,
 * and applies a local Y-scale flip to cancel the global scene Y-up flip.
 */
import type { CanvasRenderingContext2D } from 'canvas';
import { Mobject } from '../core/mobject.ts';
import { FontManager } from '../font/font_manager.ts';

export class TextChar extends Mobject {
  private _char: string;
  private _fontFamily?: string;
  private _resolvedFamily?: string;
  private _fontSize: number = 48;

  constructor(ch: string, name: string = 'TextChar') {
    super(name);
    this._char = ch;
    // Characters default to inheriting parent color; leave fill default '#ffffff' from parent
  }

  /** Set character glyph. */
  public setChar(ch: string): this {
    this._char = ch;
    return this;
  }

  /** Configure font family to resolve. */
  public setFontFamily(family?: string): this {
    this._fontFamily = family;
    this._resolvedFamily = undefined;
    return this;
  }

  /** Set font size in px. */
  public setFontSize(px: number): this {
    this._fontSize = px > 0 ? px : 1;
    return this;
  }

  /** For internal use when parent already resolved the family. */
  public setResolvedFamily(family: string): this {
    this._resolvedFamily = family;
    return this;
  }

  protected createPath(_ctx: CanvasRenderingContext2D): void {
    // No prebuilt path; draws directly
  }

  /** Draw a single character centered horizontally at baseline y=0. */
  public override draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Ensure font is registered, prefer already-resolved
    if (!this._resolvedFamily) {
      const fam = FontManager.get().ensureRegistered(this._fontFamily);
      this._resolvedFamily = fam ?? this._fontFamily ?? 'Arial';
    }

    ctx.save();
    try {
      // Local transforms
      ctx.translate(this.position[0]!, this.position[1]!);
      // Cancel global Y-up flip so text appears upright
      ctx.scale(1, -1);
      if (this.rotation !== 0) ctx.rotate(this.rotation);
      if (this.scale[0] !== 1 || this.scale[1] !== 1) ctx.scale(this.scale[0]!, this.scale[1]!);

      // Opacity multiply
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * this.opacity;

      // Configure text styles
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `${this._fontSize}px ${quoteIfNeeded(this._resolvedFamily)}`;

      if (this.fillColor) {
        ctx.fillStyle = this.fillColor as string;
        ctx.fillText(this._char, 0, 0);
      }
      if (this.strokeColor && this.strokeWidth > 0) {
        ctx.strokeStyle = this.strokeColor as string;
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeText(this._char, 0, 0);
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
