// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

import * as fontkit from 'fontkit';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Font, FontCollection, GlyphRun, Glyph } from 'fontkit';

/** Configuration for font loading behavior */
export interface FontLoadConfig {
  /** Whether to enable font caching (default: true) */
  enableCache?: boolean;
  /** Fallback font path when primary font fails */
  fallbackFontPath?: string;
  /** Maximum number of fonts to cache */
  maxCacheSize?: number;
}

/** Simple path command for building vector paths */
export interface PathCommand {
  readonly cmd: 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'bezierCurveTo' | 'closePath';
  readonly args: readonly number[];
}

/** Glyph data for individual character rendering */
export interface GlyphData {
  readonly pathCommands: readonly PathCommand[];
  readonly advanceWidth: number;
  readonly bbox: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  readonly position: Readonly<{
    x: number;
    y: number;
  }>;
  readonly unicode?: number;
  readonly glyphId?: number;
}

/** Text layout result with positioned glyphs */
export interface TextLayout {
  readonly glyphs: readonly GlyphData[];
  readonly totalWidth: number;
  readonly totalHeight: number;
  readonly baseline: number;
  readonly ascender: number;
  readonly descender: number;
}

/** Font metrics for layout calculations */
export interface FontMetrics {
  readonly ascender: number;
  readonly descender: number;
  readonly lineGap: number;
  readonly unitsPerEm: number;
  readonly capHeight?: number;
  readonly xHeight?: number;
}

/** Text rendering options */
export interface TextRenderOptions {
  fillColor?: string | null;
  strokeColor?: string | null;
  strokeWidth?: number;
  opacity?: number;
}

// ============================================================================
// ERRORS
// ============================================================================

export class FontError extends Error {
  constructor(
    message: string,
    public readonly fontPath?: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'FontError';
  }
}

export class TextLayoutError extends Error {
  constructor(
    message: string,
    public readonly text?: string,
    public readonly fontPath?: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'TextLayoutError';
  }
}

// ============================================================================
// FONT CACHE
// ============================================================================

class FontCache {
  private static instance: FontCache;
  private cache = new Map<string, Font>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private maxSize: number;

  private constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  public static getInstance(maxSize?: number): FontCache {
    if (!FontCache.instance) {
      FontCache.instance = new FontCache(maxSize);
    }
    return FontCache.instance;
  }

  public get(fontPath: string): Font | undefined {
    const font = this.cache.get(fontPath);
    if (font) {
      this.accessOrder.set(fontPath, ++this.accessCounter);
    }
    return font;
  }

  public set(fontPath: string, font: Font): void {
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(fontPath)) {
      this.evictLRU();
    }

    this.cache.set(fontPath, font);
    this.accessOrder.set(fontPath, ++this.accessCounter);
  }

  public clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  public size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestPath = '';
    let oldestAccess = Infinity;

    for (const [path, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestPath = path;
      }
    }

    if (oldestPath) {
      this.cache.delete(oldestPath);
      this.accessOrder.delete(oldestPath);
    }
  }
}

// ============================================================================
// FONT LOADER
// ============================================================================

export class FontLoader {
  private static readonly DEFAULT_FALLBACK = './src/font/ROBOTO-REGULAR.TTF';
  private cache: FontCache;
  private config: Required<FontLoadConfig>;

  constructor(config: FontLoadConfig = {}) {
    this.config = {
      enableCache: config.enableCache ?? true,
      fallbackFontPath: config.fallbackFontPath ?? FontLoader.DEFAULT_FALLBACK,
      maxCacheSize: config.maxCacheSize ?? 50,
    };
    this.cache = FontCache.getInstance(this.config.maxCacheSize);
  }

  /**
   * Load font with proper error handling and fallback support
   */
  public loadFont(fontPath: string): Font {
    // Check cache first if enabled
    if (this.config.enableCache) {
      const cached = this.cache.get(fontPath);
      if (cached) return cached;
    }

    return this.loadFontInternal(fontPath);
  }

  /**
   * Get font metrics for layout calculations
   */
  public getFontMetrics(fontPath: string): FontMetrics {
    const font = this.loadFont(fontPath);
    return {
      ascender: font.ascent,
      descender: font.descent,
      lineGap: font.lineGap,
      unitsPerEm: font.unitsPerEm,
      capHeight: font.capHeight,
      xHeight: font.xHeight,
    };
  }

  /**
   * Clear font cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  private loadFontInternal(fontPath: string): Font {
    try {
      const fontData = fontkit.openSync(fontPath);
      const font = this.extractFont(fontData, fontPath);
      
      if (this.config.enableCache) {
        this.cache.set(fontPath, font);
      }
      
      return font;
    } catch (error) {
      return this.handleFontLoadError(fontPath, error);
    }
  }

  private extractFont(fontData: Font | FontCollection, fontPath: string): Font {
    if ('fonts' in fontData) {
      const collection = fontData as FontCollection;
      const font = collection.fonts[0];
      if (!font) {
        throw new FontError(`No fonts found in collection "${fontPath}"`);
      }
      return font;
    }
    return fontData as Font;
  }

  private handleFontLoadError(fontPath: string, error: unknown): Font {
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Don't retry fallback font to avoid infinite recursion
    if (fontPath === this.config.fallbackFontPath) {
      throw new FontError(
        `Failed to load fallback font: ${err.message}`,
        fontPath,
        err
      );
    }

    console.warn(`Failed to load font "${fontPath}", using fallback: ${err.message}`);
    return this.loadFontInternal(this.config.fallbackFontPath);
  }
}

// ============================================================================
// TEXT LAYOUT ENGINE
// ============================================================================

export class TextLayoutEngine {
  private fontLoader: FontLoader;

  constructor(fontLoader?: FontLoader) {
    this.fontLoader = fontLoader ?? new FontLoader();
  }

  /**
   * Layout text using fontkit's proper text shaping engine
   */
  public layoutText(fontPath: string, text: string, fontSize: number): TextLayout {
    if (fontSize <= 0) {
      throw new TextLayoutError('Font size must be positive', text, fontPath);
    }

    if (!text) {
      return this.createEmptyLayout(fontSize);
    }

    try {
      const font = this.fontLoader.loadFont(fontPath);
      const run = font.layout(text);
      const scale = fontSize / font.unitsPerEm;
      
      return this.processGlyphRun(run, scale, font, fontSize);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new TextLayoutError(
        `Failed to layout text: ${err.message}`,
        text,
        fontPath,
        err
      );
    }
  }

  private createEmptyLayout(fontSize: number): TextLayout {
    return {
      glyphs: [],
      totalWidth: 0,
      totalHeight: fontSize,
      baseline: fontSize * 0.8, // Approximate baseline
      ascender: fontSize,
      descender: 0,
    };
  }

  private processGlyphRun(
    run: GlyphRun,
    scale: number,
    font: Font,
    fontSize: number
  ): TextLayout {
    const glyphs: GlyphData[] = [];
    let currentX = 0;
    let maxY = 0;
    let minY = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i]!;
      const position = run.positions[i]!;

      const glyphData = this.processGlyph(glyph, position, scale, currentX);
      glyphs.push(glyphData);

      // Update bounds
      maxY = Math.max(maxY, glyphData.bbox.y + glyphData.bbox.height);
      minY = Math.min(minY, glyphData.bbox.y);

      // Move pen for next glyph
      currentX += position.xAdvance * scale;
    }

    return {
      glyphs,
      totalWidth: currentX,
      totalHeight: maxY - minY || fontSize,
      baseline: font.ascent * scale,
      ascender: font.ascent * scale,
      descender: Math.abs(font.descent * scale),
    };
  }

  private processGlyph(
    glyph: Glyph,
    position: { xOffset: number; yOffset: number; xAdvance: number; yAdvance: number },
    scale: number,
    currentX: number
  ): GlyphData {
    const pathCommands = this.extractGlyphPathCommands(glyph, scale);
    const advanceWidth = glyph.advanceWidth * scale;
    
    // Use actual glyph bbox or fallback to advance width
    const bbox = glyph.bbox || {
      minX: 0,
      minY: 0,
      maxX: glyph.advanceWidth,
      maxY: 1000, // Typical font unit height
    };

    return {
      pathCommands,
      advanceWidth,
      bbox: {
        x: bbox.minX * scale,
        y: bbox.minY * scale,
        width: (bbox.maxX - bbox.minX) * scale,
        height: (bbox.maxY - bbox.minY) * scale,
      },
      position: {
        x: currentX + (position.xOffset * scale),
        y: position.yOffset * scale,
      },
      unicode: glyph.codePoints?.[0],
      glyphId: glyph.id,
    };
  }

  private extractGlyphPathCommands(glyph: Glyph, scale: number): PathCommand[] {
    const glyphPath = glyph.path;
    if (!glyphPath) return [];

    try {
      const pathFunction = glyphPath.toFunction();
      const pathCommands: PathCommand[] = [];

      const mockCtx = {
        moveTo: (x: number, y: number) => 
          pathCommands.push({ cmd: 'moveTo', args: [x * scale, y * scale] }),
        lineTo: (x: number, y: number) => 
          pathCommands.push({ cmd: 'lineTo', args: [x * scale, y * scale] }),
        quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => 
          pathCommands.push({ 
            cmd: 'quadraticCurveTo', 
            args: [cpx * scale, cpy * scale, x * scale, y * scale] 
          }),
        bezierCurveTo: (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) =>
          pathCommands.push({ 
            cmd: 'bezierCurveTo', 
            args: [cp1x * scale, cp1y * scale, cp2x * scale, cp2y * scale, x * scale, y * scale] 
          }),
        closePath: () => pathCommands.push({ cmd: 'closePath', args: [] })
      };

      pathFunction.call(mockCtx, mockCtx);
      return pathCommands;
    } catch (error) {
      console.warn(`Failed to extract path for glyph ${glyph.id}:`, error);
      return [];
    }
  }
}

// ============================================================================
// GLYPH RENDERER
// ============================================================================

export class GlyphRenderer {
  /**
   * Render glyph path to canvas context with proper error handling
   */
  public static renderGlyph(
    ctx: SKRSContext2D,
    glyphData: GlyphData,
    offsetX: number,
    offsetY: number,
    options: TextRenderOptions = {}
  ): void {
    const { fillColor = null, strokeColor = null, strokeWidth = 0, opacity = 1 } = options;

    if (!glyphData.pathCommands.length) return;

    try {
      ctx.save();
      
      ctx.beginPath();

      // Apply path commands
      for (const command of glyphData.pathCommands) {
        this.applyPathCommand(ctx, command, offsetX, -offsetY);
      }

      // Apply opacity if needed
      const previousAlpha = ctx.globalAlpha;
      if (opacity !== 1) {
        ctx.globalAlpha = previousAlpha * opacity;
      }

      // Apply styling
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      if (strokeColor && strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }

      // Restore opacity
      if (opacity !== 1) {
        ctx.globalAlpha = previousAlpha;
      }
      
      ctx.restore();
    } catch (error) {
      console.warn('Failed to render glyph:', error);
    }
  }

  private static applyPathCommand(
    ctx: SKRSContext2D,
    command: PathCommand,
    offsetX: number,
    offsetY: number
  ): void {
    const { cmd, args } = command;

    switch (cmd) {
      case 'moveTo':
        ctx.moveTo(args[0]! + offsetX, args[1]! + offsetY);
        break;
      case 'lineTo':
        ctx.lineTo(args[0]! + offsetX, args[1]! + offsetY);
        break;
      case 'quadraticCurveTo':
        ctx.quadraticCurveTo(
          args[0]! + offsetX, args[1]! + offsetY,
          args[2]! + offsetX, args[3]! + offsetY
        );
        break;
      case 'bezierCurveTo':
        ctx.bezierCurveTo(
          args[0]! + offsetX, args[1]! + offsetY,
          args[2]! + offsetX, args[3]! + offsetY,
          args[4]! + offsetX, args[5]! + offsetY
        );
        break;
      case 'closePath':
        ctx.closePath();
        break;
      default:
        console.warn(`Unknown path command: ${cmd}`);
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS (Backward Compatibility)
// ============================================================================

const defaultLayoutEngine = new TextLayoutEngine();

/**
 * Layout text using the default layout engine (backward compatibility)
 */
export function layoutText(fontPath: string, text: string, fontSize: number): TextLayout {
  return defaultLayoutEngine.layoutText(fontPath, text, fontSize);
}

/**
 * Render glyph using the default renderer (backward compatibility)
 */
export function renderGlyph(
  ctx: SKRSContext2D,
  glyphData: GlyphData,
  offsetX: number,
  offsetY: number,
  fillColor: string | null,
  strokeColor: string | null,
  strokeWidth: number
): void {
  GlyphRenderer.renderGlyph(ctx, glyphData, offsetX, offsetY, {
    fillColor,
    strokeColor,
    strokeWidth,
  });
}

/**
 * Clear font cache (backward compatibility)
 */
export function clearCaches(): void {
  FontCache.getInstance().clear();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {FontCache };