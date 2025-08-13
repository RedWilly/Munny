/**
 * TextChar - single character mobject drawn via canvas text APIs.
 *
 * Draws one character at its local origin (baseline y=0) with center alignment,
 * and applies a local Y-scale flip to cancel the global scene Y-up flip.
 */
import type { SKRSContext2D } from '@napi-rs/canvas';
import { Mobject } from '../core/mobject.ts';
import { ensureFontRegistered, defaultRobotoPath, deriveFamilyFromPath } from '../font/font_utils.ts';

export class TextChar extends Mobject {
  private _char: string;
  private _fontFamily?: string;
  private _resolvedFamily?: string;
  private _fontPath?: string;
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

  /** Set explicit font file path for this character. */
  public setFontPath(path: string): this {
    this._fontPath = path;
    this._resolvedFamily = undefined;
    return this;
  }
  /** Fluent alias */
  public fontPath(path: string): this { return this.setFontPath(path); }

  /** For internal use when parent already resolved the family. */
  public setResolvedFamily(family: string): this {
    this._resolvedFamily = family;
    return this;
  }

  protected createPath(_ctx: SKRSContext2D): void {
    // No prebuilt path; draws directly
  }

  /** Draw a single character centered horizontally at baseline y=0. */
  public override draw(ctx: SKRSContext2D): void {
    if (!this.visible) return;

    // Ensure font is registered, prefer already-resolved
    if (!this._resolvedFamily) {
      // Prefer explicit font path; otherwise use bundled Roboto.
      const path = this._fontPath ?? defaultRobotoPath();
      const family = this._fontPath ? (this._fontFamily ?? deriveFamilyFromPath(path)) : deriveFamilyFromPath(path);
      ensureFontRegistered(path, family);
      this._resolvedFamily = family;
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
