import { Animation } from '../base/animation.ts';
import { clamp, lerp } from '../../core/math.ts';
import type { Mobject } from '../../core/mobject.ts';
import type { ColorString } from '../../core/types.ts';

/** RGBA tuple with components in [0,255]. */
type RGBA = [number, number, number, number];

/** Try to parse common hex forms: #RRGGBB or #RRGGBBAA. */
function parseHex(color: string): RGBA | null {
  if (!color || color[0] !== '#') return null;
  const hex = color.slice(1);
  if (hex.length === 6 || hex.length === 8) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) : 255;
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) || Number.isNaN(a)) return null;
    return [r, g, b, a];
  }
  return null;
}

/** Compose hex string from RGBA, ignoring alpha (engine uses global opacity). */
function toHex(rgb: RGBA): ColorString {
  const r = clamp(Math.round(rgb[0]), 0, 255);
  const g = clamp(Math.round(rgb[1]), 0, 255);
  const b = clamp(Math.round(rgb[2]), 0, 255);
  const hh = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hh(r)}${hh(g)}${hh(b)}`;
}

/**
 * FillColorTo - transitions the fill color to a target ColorString.
 *
 * Interpolates in RGB space for hex colors. If an unsupported color format is
 * provided, falls back to setting the target color at completion.
 */
export class FillColorTo extends Animation {
  private from: RGBA = [255, 255, 255, 255];
  private to: RGBA = [255, 255, 255, 255];
  private readonly targetColor: ColorString;
  private canLerp = false;

  constructor(target: Mobject, color: ColorString) {
    super(target);
    this.targetColor = color;
  }

  public setup(): void {
    const cur = this.target.fillColor;
    const fromParsed = cur ? parseHex(cur) : null;
    const toParsed = parseHex(this.targetColor);

    this.canLerp = !!(fromParsed && toParsed);

    if (toParsed) this.to = toParsed;
    if (fromParsed) {
      this.from = fromParsed;
      // ensure fill is enabled with current color
      this.target.fill(toHex(this.from));
    } else if (toParsed) {
      // if no current color, enable fill and start from target
      this.from = toParsed;
      this.target.fill(toHex(this.from));
    } else {
      // unsupported format, keep whatever is there; we'll snap at end
    }
  }

  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    if (this.canLerp) {
      const rgb: RGBA = [
        lerp(this.from[0], this.to[0], t),
        lerp(this.from[1], this.to[1], t),
        lerp(this.from[2], this.to[2], t),
        lerp(this.from[3], this.to[3], t),
      ];
      this.target.fill(toHex(rgb));
    } else {
      // snap at the end if we can't interpolate
      if (t >= 1) this.target.fill(this.targetColor);
    }
  }
}

/**
 * StrokeColorTo - transitions the stroke color to a target ColorString.
 */
export class StrokeColorTo extends Animation {
  private from: RGBA = [0, 0, 0, 255];
  private to: RGBA = [0, 0, 0, 255];
  private readonly targetColor: ColorString;
  private canLerp = false;

  constructor(target: Mobject, color: ColorString) {
    super(target);
    this.targetColor = color;
  }

  public setup(): void {
    const cur = this.target.strokeColor;
    const fromParsed = cur ? parseHex(cur) : null;
    const toParsed = parseHex(this.targetColor);

    this.canLerp = !!(fromParsed && toParsed);

    if (toParsed) this.to = toParsed;
    if (fromParsed) {
      this.from = fromParsed;
      // ensure stroke is enabled with current color
      this.target.stroke(toHex(this.from));
    } else if (toParsed) {
      // if no current color, enable stroke and start from target
      this.from = toParsed;
      this.target.stroke(toHex(this.from));
    } else {
      // unsupported format, keep whatever is there; we'll snap at end
    }
  }

  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    if (this.canLerp) {
      const rgb: RGBA = [
        lerp(this.from[0], this.to[0], t),
        lerp(this.from[1], this.to[1], t),
        lerp(this.from[2], this.to[2], t),
        lerp(this.from[3], this.to[3], t),
      ];
      this.target.stroke(toHex(rgb));
    } else {
      if (t >= 1) this.target.stroke(this.targetColor);
    }
  }
}

/**
 * StrokeWidthTo - animates the stroke width to a target value.
 */
export class StrokeWidthTo extends Animation {
  private from: number = 1;
  private readonly to: number;

  constructor(target: Mobject, width: number) {
    super(target);
    this.to = width;
  }

  public setup(): void {
    this.from = this.target.strokeWidth;
  }

  public tick(tNorm: number): void {
    const t = this.ease(tNorm);
    const w = lerp(this.from, this.to, t);
    this.target.setStrokeWidth(w);
  }
}
