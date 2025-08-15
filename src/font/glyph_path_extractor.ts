/**
 * Font layout system using fontkit for proper text shaping and glyph positioning.
 * 
 * Uses fontkit's layout engine for accurate kerning, ligatures, and character spacing.
 * Provides both whole-text layout and individual glyph access for animations.
 */
import * as fontkit from 'fontkit';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Font, FontCollection, GlyphRun, Glyph } from 'fontkit';

/** Simple path command for building vector paths */
interface PathCommand {
  cmd: string;
  args: number[];
}

/** Cache for loaded fonts to avoid repeated file I/O */
const FONT_CACHE = new Map<string, Font>();

/** Glyph data for individual character rendering */
export interface GlyphData {
  pathCommands: PathCommand[];
  advanceWidth: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
}

/** Text layout result with positioned glyphs */
export interface TextLayout {
  glyphs: GlyphData[];
  totalWidth: number;
  totalHeight: number;
}

/**
 * Load and cache font from file path
 * @param fontPath Font file path
 * @returns fontkit.Font object
 */
function loadFont(fontPath: string): Font {
  // Check cache first
  if (FONT_CACHE.has(fontPath)) {
    return FONT_CACHE.get(fontPath)!;
  }

  try {
    const fontData = fontkit.openSync(fontPath);
    
    // Handle FontCollection vs Font
    let font: Font;
    if ('fonts' in fontData) {
      const collection = fontData as FontCollection;
      font = collection.fonts[0]!;
      if (!font) {
        throw new Error(`No fonts found in collection "${fontPath}"`);
      }
    } else {
      font = fontData as Font;
    }
    
    FONT_CACHE.set(fontPath, font);
    return font;
  } catch (error) {
    // Fallback to bundled font
    const fallbackPath = './src/font/ROBOTO-REGULAR.TTF';
    if (fontPath === fallbackPath) {
      throw new Error(`Failed to load fallback font: ${error}`);
    }
    
    console.warn(`Failed to load font "${fontPath}", using fallback: ${error}`);
    return loadFont(fallbackPath);
  }
}

/**
 * Layout text using fontkit's proper text shaping engine
 * @param fontPath Font file path
 * @param text Text to layout
 * @param fontSize Font size in pixels
 * @returns TextLayout with positioned glyphs
 */
export function layoutText(fontPath: string, text: string, fontSize: number): TextLayout {
  try {
    const font = loadFont(fontPath);
    const run: GlyphRun = font.layout(text);
    const scale = fontSize / font.unitsPerEm;

    const glyphs: GlyphData[] = [];
    let currentX = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i]!;
      const position = run.positions[i]!;

      const pathCommands = extractGlyphPathCommands(glyph, scale);
      const advanceWidth = glyph.advanceWidth * scale;
      const bbox = glyph.bbox || {
        minX: 0,
        minY: 0,
        maxX: advanceWidth,
        maxY: fontSize,
      };

      glyphs.push({
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
      });

      // Move pen for next glyph
      currentX += position.xAdvance * scale;
    }

    return {
      glyphs,
      totalWidth: currentX,
      totalHeight: fontSize,
    };
  } catch (error) {
    throw new Error(`Failed to layout text "${text}": ${error}`);
  }
}

/**
 * Extract path commands from a fontkit glyph
 * @param glyph fontkit Glyph object
 * @param scale Scale factor from font units to pixels
 * @returns Array of path commands
 */
function extractGlyphPathCommands(glyph: Glyph, scale: number): PathCommand[] {
  const glyphPath = glyph.path;
  if (!glyphPath) {
    return [];
  }
  
  const pathFunction = glyphPath.toFunction();
  const pathCommands: PathCommand[] = [];
  
  const mockCtx = {
    moveTo: (x: number, y: number) => pathCommands.push({ cmd: 'moveTo', args: [x * scale, y * scale] }),
    lineTo: (x: number, y: number) => pathCommands.push({ cmd: 'lineTo', args: [x * scale, y * scale] }),
    quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => 
      pathCommands.push({ cmd: 'quadraticCurveTo', args: [cpx * scale, cpy * scale, x * scale, y * scale] }),
    bezierCurveTo: (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) =>
      pathCommands.push({ cmd: 'bezierCurveTo', args: [cp1x * scale, cp1y * scale, cp2x * scale, cp2y * scale, x * scale, y * scale] }),
    closePath: () => pathCommands.push({ cmd: 'closePath', args: [] })
  };
  
  pathFunction.call(mockCtx, mockCtx);
  return pathCommands;
}

/**
 * Render glyph path to canvas context
 * @param ctx Canvas 2D context
 * @param glyphData Glyph data with path commands
 * @param offsetX X offset for positioning
 * @param offsetY Y offset for positioning
 * @param fillColor Fill color (null for no fill)
 * @param strokeColor Stroke color (null for no stroke)
 * @param strokeWidth Stroke width
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
  ctx.beginPath();
  
  // Apply path commands
  for (const command of glyphData.pathCommands) {
    switch (command.cmd) {
      case 'moveTo':
        ctx.moveTo(command.args[0]! + offsetX, command.args[1]! + offsetY);
        break;
      case 'lineTo':
        ctx.lineTo(command.args[0]! + offsetX, command.args[1]! + offsetY);
        break;
      case 'quadraticCurveTo':
        ctx.quadraticCurveTo(
          command.args[0]! + offsetX, command.args[1]! + offsetY,
          command.args[2]! + offsetX, command.args[3]! + offsetY
        );
        break;
      case 'bezierCurveTo':
        ctx.bezierCurveTo(
          command.args[0]! + offsetX, command.args[1]! + offsetY,
          command.args[2]! + offsetX, command.args[3]! + offsetY,
          command.args[4]! + offsetX, command.args[5]! + offsetY
        );
        break;
      case 'closePath':
        ctx.closePath();
        break;
    }
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
}

/**
 * Clear font cache (useful for testing or memory management)
 */
export function clearCaches(): void {
  FONT_CACHE.clear();
}
