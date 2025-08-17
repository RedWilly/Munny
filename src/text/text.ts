/**
 * Enhanced Text mobject with improved error handling and performance
 * 
 * Features:
 * - Robust error handling with specific error types
 * - Proper TypeScript types and immutability where appropriate  
 * - Performance optimizations with layout caching
 * - Better separation of concerns
 * - Comprehensive documentation
 */
import type { SKRSContext2D } from '@napi-rs/canvas';
import { VGroup } from '../core/vgroup.ts';
import { TextChar } from './text_char.ts';
import { 
  TextLayoutEngine, 
  FontLoader,
  TextLayoutError,
  type TextLayout, 
  type GlyphData,
  type FontLoadConfig 
} from '../font/glyph_path_extractor.ts';

export interface TextOptions {
  /** Font path or family name */
  font?: string;
  /** Font size in pixels (must be > 0) */
  fontSize?: number;
  /** Font loader configuration */
  fontConfig?: FontLoadConfig;
}

export interface TextMetrics {
  readonly width: number;
  readonly height: number;
  readonly baseline: number;
  readonly ascender: number;
  readonly descender: number;
}

export class Text extends VGroup<TextChar> {
  [index: number]: TextChar;
  
  // Core text properties
  private _text: string;
  private _font?: string;
  private _fontSize: number = 48;
  
  // Layout management
  private _needsLayout: boolean = true;
  private _lastLayoutHash?: string;
  private _cachedLayout?: TextLayout;
  
  // System dependencies
  private readonly layoutEngine: TextLayoutEngine;
  private readonly fontLoader: FontLoader;

  /**
   * Create text mobject with optional styling and configuration
   * 
   * @param text - Text content to render
   * @param options - Font and layout options
   * @param name - Mobject name for debugging
   */
  constructor(
    text: string,
    options: TextOptions = {},
    name: string = 'Text'
  ) {
    super(name);
    
    // Initialize text properties
    this._text = text;
    this._font = options.font;
    
    if (options.fontSize !== undefined) {
      this.setFontSize(options.fontSize);
    }
    
    // Initialize font system
    this.fontLoader = new FontLoader(options.fontConfig);
    this.layoutEngine = new TextLayoutEngine(this.fontLoader);
    
    // Default to white fill for visibility
    this.fill('#ffffff');

    // Return proxy for numeric indexing
    return this.createIndexedProxy();
  }

  // ============================================================================
  // PUBLIC API - TEXT CONTENT
  // ============================================================================

  /**
   * Get current text content
   */
  public getText(): string {
    return this._text;
  }

  /**
   * Set text content (chainable)
   * @param text - New text content
   */
  public setText(text: string): this {
    if (this._text !== text) {
      this._text = text;
      this.invalidateLayout();
    }
    return this;
  }

  /** Fluent alias for setText */
  public text(text: string): this {
    return this.setText(text);
  }

  // ============================================================================
  // PUBLIC API - FONT STYLING
  // ============================================================================

  /**
   * Get current font path/family
   */
  public getFont(): string | undefined {
    return this._font;
  }

  /**
   * Set font path or family name (chainable)
   * @param font - Font path or family name
   */
  public setFont(font?: string): this {
    if (this._font !== font) {
      this._font = font;
      this.invalidateLayout();
    }
    return this;
  }

  /** Fluent alias for setFont */
  public font(font?: string): this {
    return this.setFont(font);
  }

  /**
   * Get current font size in pixels
   */
  public getFontSize(): number {
    return this._fontSize;
  }

  /**
   * Set font size in pixels (chainable)
   * @param px - Font size (must be > 0)
   */
  public setFontSize(px: number): this {
    if (px <= 0) {
      throw new Error(`Font size must be positive, got: ${px}`);
    }
    
    if (this._fontSize !== px) {
      this._fontSize = px;
      this.invalidateLayout();
    }
    return this;
  }

  /** Fluent alias for setFontSize */
  public fontSize(px: number): this {
    return this.setFontSize(px);
  }

  // ============================================================================
  // PUBLIC API - TEXT METRICS
  // ============================================================================

  /**
   * Get text metrics (forces layout if needed)
   */
  public getMetrics(): TextMetrics {
    this.ensureLayout();
    const layout = this._cachedLayout!;
    
    return {
      width: layout.totalWidth,
      height: layout.totalHeight,
      baseline: layout.baseline,
      ascender: layout.ascender,
      descender: layout.descender,
    };
  }

  /**
   * Get total character count
   */
  public override get length(): number {
    return this._text.length;
  }

  // ============================================================================
  // PUBLIC API - CHARACTER ACCESS
  // ============================================================================

  /**
   * Get character at specific index (throws if out of bounds)
   * @param index - Character index
   */
  public charAt(index: number): TextChar {
    return this.getCharAt(index);
  }

  /**
   * Get character at specific index with bounds checking
   * @param index - Character index
   */
  public at(index: number): TextChar {
    return this.getCharAt(index);
  }

  /**
   * Create slice of characters as new VGroup
   */
  public override slice(start?: number, end?: number): VGroup<TextChar> {
    this.ensureLayout();
    return super.slice(start, end);
  }

  /**
   * Iterator over characters
   */
  public override *[Symbol.iterator](): IterableIterator<TextChar> {
    this.ensureLayout();
    yield* super[Symbol.iterator]();
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /**
   * Render text by drawing all character children
   */
  public override draw(ctx: SKRSContext2D): void {
    if (!this.visible) return;
    
    try {
      this.ensureLayout();
      this.propagateStylesToChildren();
      super.draw(ctx);
    } catch (error) {
      console.error(`Failed to render text "${this._text}":`, error);
      // Could optionally render error indicator or fallback
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear font cache (affects all Text instances)
   */
  public static clearFontCache(): void {
    // This would clear the global font cache
    const fontLoader = new FontLoader();
    fontLoader.clearCache();
  }

  /**
   * Force layout recalculation on next access
   */
  public invalidateLayout(): this {
    this._needsLayout = true;
    this._lastLayoutHash = undefined;
    this._cachedLayout = undefined;
    return this;
  }

  // ============================================================================
  // PRIVATE IMPLEMENTATION
  // ============================================================================

  private createIndexedProxy(): this {
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // Handle numeric string indices
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = Number(prop);
          return target.getCharAt(index);
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as this;
  }

  private getCharAt(index: number): TextChar {
    this.ensureLayout();
    
    const children = (this as any).children as TextChar[];
    const char = children[index];
    
    if (!char) {
      throw new RangeError(
        `Text "${this._text}": index ${index} out of range (0..${this._text.length - 1})`
      );
    }
    
    return char;
  }

  private ensureLayout(): void {
    if (!this._needsLayout && this._cachedLayout) {
      return;
    }

    // Check if we can reuse cached layout
    const currentHash = this.getLayoutHash();
    if (this._lastLayoutHash === currentHash && this._cachedLayout) {
      this._needsLayout = false;
      return;
    }

    try {
      this.performLayout();
      this._lastLayoutHash = currentHash;
      this._needsLayout = false;
    } catch (error) {
      console.error(`Layout failed for text "${this._text}":`, error);
      this.createFallbackLayout();
    }
  }

  private getLayoutHash(): string {
    return `${this._text}|${this._font || 'default'}|${this._fontSize}`;
  }

  private performLayout(): void {
    const fontPath = this._font || './src/font/ROBOTO-REGULAR.TTF';
    
    try {
      const layout = this.layoutEngine.layoutText(fontPath, this._text, this._fontSize);
      this._cachedLayout = layout;
      this.updateCharacterChildren(layout);
    } catch (error) {
      if (error instanceof TextLayoutError) {
        throw error; // Re-throw with context
      }
      throw new TextLayoutError(
        `Unexpected layout error: ${error}`,
        this._text,
        fontPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  private updateCharacterChildren(layout: TextLayout): void {
    const children = (this as any).children as TextChar[];
    const glyphCount = layout.glyphs.length;
    
    // Adjust children array size
    this.resizeChildrenArray(children, glyphCount);
    
    // Update each character with proper glyph data
    for (let i = 0; i < glyphCount; i++) {
      const glyphData = layout.glyphs[i]!;
      const char = this._text[i] || ' ';
      const child = children[i]!;
      
      // Update glyph data
      child.updateGlyph(glyphData, char);
      
      // Center text around x=0
      const centeredX = glyphData.position.x - layout.totalWidth / 2;
      child.setPosition(centeredX, glyphData.position.y);
      
      // Apply current styles
      this.applyStylesToChild(child);
    }
  }

  private resizeChildrenArray(children: TextChar[], targetSize: number): void {
    // Add new children if needed
    while (children.length < targetSize) {
      const placeholder: GlyphData = {
        pathCommands: [],
        advanceWidth: 0,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        position: { x: 0, y: 0 }
      };
      
      const child = new TextChar(placeholder, ' ');
      this.applyStylesToChild(child);
      children.push(child);
    }
    
    // Remove excess children
    if (children.length > targetSize) {
      children.length = targetSize;
    }
  }

  private createFallbackLayout(): void {
    console.warn(`Creating fallback layout for text: "${this._text}"`);
    
    // Create minimal layout to prevent crashes
    this._cachedLayout = {
      glyphs: [],
      totalWidth: 0,
      totalHeight: this._fontSize,
      baseline: this._fontSize * 0.8,
      ascender: this._fontSize,
      descender: 0,
    };
    
    // Clear children since layout failed
    const children = (this as any).children as TextChar[];
    children.length = 0;
  }

  private propagateStylesToChildren(): void {
    const children = (this as any).children as TextChar[];
    
    for (const child of children) {
      this.applyStylesToChild(child);
    }
  }

  private applyStylesToChild(child: TextChar): void {
    if (this.fillColor !== null) {
      child.fill(this.fillColor);
    } else {
      child.fill(null);
    }
    
    if (this.strokeColor !== null) {
      child.stroke(this.strokeColor);
    } else {
      child.stroke(null);
    }
    
    child.setStrokeWidth(this.strokeWidth);
  }
}