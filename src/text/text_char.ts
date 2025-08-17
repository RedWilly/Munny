/**
 * Enhanced TextChar - single character mobject with improved error handling
 * 
 * Features:
 * - Robust error handling for rendering failures
 * - Better performance with render optimizations
 * - Immutable glyph data where appropriate
 * - Comprehensive character information access
 * - Type-safe property access
 */
import type { SKRSContext2D } from '@napi-rs/canvas';
import { Mobject } from '../core/mobject.ts';
import { 
  GlyphRenderer, 
  type GlyphData, 
  type TextRenderOptions 
} from '../font/glyph_path_extractor.ts';

export interface CharacterInfo {
  readonly char: string;
  readonly unicode?: number;
  readonly glyphId?: number;
  readonly advanceWidth: number;
  readonly bbox: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export class TextChar extends Mobject {
  private _glyphData: GlyphData;
  private _char: string;
  private _renderCache?: {
    fillColor: string | null;
    strokeColor: string | null;
    strokeWidth: number;
    opacity: number;
  };

  constructor(glyphData: GlyphData, char: string, name: string = 'TextChar') {
    super(name);
    this._glyphData = glyphData;
    this._char = char;
  }

  // ============================================================================
  // PUBLIC API - CHARACTER INFORMATION
  // ============================================================================

  /**
   * Get the character this glyph represents
   */
  public get char(): string {
    return this._char;
  }

  /**
   * Get comprehensive character information
   */
  public getCharacterInfo(): CharacterInfo {
    return {
      char: this._char,
      unicode: this._glyphData.unicode,
      glyphId: this._glyphData.glyphId,
      advanceWidth: this._glyphData.advanceWidth,
      bbox: { ...this._glyphData.bbox }, // Defensive copy
    };
  }

  /**
   * Get Unicode code point if available
   */
  public get unicode(): number | undefined {
    return this._glyphData.unicode;
  }

  /**
   * Get glyph ID if available
   */
  public get glyphId(): number | undefined {
    return this._glyphData.glyphId;
  }

  /**
   * Get advance width (horizontal spacing)
   */
  public get advanceWidth(): number {
    return this._glyphData.advanceWidth;
  }

  /**
   * Get glyph bounding box
   */
  public get bbox(): Readonly<{ x: number; y: number; width: number; height: number }> {
    return this._glyphData.bbox;
  }

  /**
   * Check if character has renderable content
   */
  public get hasVisibleContent(): boolean {
    return this._glyphData.pathCommands.length > 0 && 
           this._glyphData.bbox.width > 0 && 
           this._glyphData.bbox.height > 0;
  }

  // ============================================================================
  // PUBLIC API - GLYPH MANAGEMENT
  // ============================================================================

  /**
   * Update glyph data and character (used when text changes)
   * @param glyphData - New glyph data
   * @param char - New character
   */
  public updateGlyph(glyphData: GlyphData, char: string): this {
    this._glyphData = glyphData;
    this._char = char;
    this.invalidateRenderCache();
    return this;
  }

  /**
   * Get read-only access to glyph data
   */
  public getGlyphData(): Readonly<GlyphData> {
    return this._glyphData;
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /**
   * Render the character glyph with proper error handling
   */
  public override draw(ctx: SKRSContext2D): void {
    if (!this.visible || !this.hasVisibleContent) {
      return;
    }

    ctx.save();
    try {
      this.applyTransforms(ctx);
      this.renderGlyph(ctx);
    } catch (error) {
      console.warn(`Failed to render character "${this._char}":`, error);
      this.renderFallback(ctx);
    } finally {
      ctx.restore();
    }
  }

  /**
   * Override createPath since we use vector paths directly in draw()
   */
  protected createPath(_ctx: SKRSContext2D): void {
    // Vector paths are handled in draw() method
  }

  // ============================================================================
  // STYLE OVERRIDES WITH CACHE INVALIDATION
  // ============================================================================

  public override fill(color: string | null): this {
    const result = super.fill(color);
    this.invalidateRenderCache();
    return result;
  }

  public override stroke(color: string | null): this {
    const result = super.stroke(color);
    this.invalidateRenderCache();
    return result;
  }

  public override setStrokeWidth(width: number): this {
    const result = super.setStrokeWidth(width);
    this.invalidateRenderCache();
    return result;
  }

  public override setOpacity(opacity: number): this {
    const result = super.setOpacity(opacity);
    this.invalidateRenderCache();
    return result;
  }

  // ============================================================================
  // ANIMATION SUPPORT
  // ============================================================================

  /**
   * Get character center point for animations
   */
  public getCenter(): [number, number] {
    const x = this.position[0] ?? 0;
    const y = this.position[1] ?? 0;
    
    return [
      x + this._glyphData.bbox.width / 2,
      y + this._glyphData.bbox.height / 2,
    ];
  }

  /**
   * Get character bounds in world coordinates
   */
  public getWorldBounds(): { 
    left: number; 
    right: number; 
    top: number; 
    bottom: number; 
  } {
    const x = this.position[0] ?? 0;
    const y = this.position[1] ?? 0;
    const { bbox } = this._glyphData;
    
    return {
      left: x + bbox.x,
      right: x + bbox.x + bbox.width,
      top: y + bbox.y,
      bottom: y + bbox.y + bbox.height,
    };
  }

  // ============================================================================
  // PRIVATE IMPLEMENTATION
  // ============================================================================

  private applyTransforms(ctx: SKRSContext2D): void {
    // Apply position
    const x = this.position[0] ?? 0;
    const y = this.position[1] ?? 0;
    ctx.translate(x, y);
    
    // Apply rotation if present
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
    
    // Apply scale if not identity
    const scaleX = this.scale[0] ?? 1;
    const scaleY = this.scale[1] ?? 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }
  }

  private renderGlyph(ctx: SKRSContext2D): void {
    const options: TextRenderOptions = {
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      opacity: this.opacity,
    };

    // Use cached render parameters if unchanged
    if (this.canUseCachedRender(options)) {
      this.performCachedRender(ctx, options);
    } else {
      this.performFreshRender(ctx, options);
      this.updateRenderCache(options);
    }
  }

  private canUseCachedRender(options: TextRenderOptions): boolean {
    if (!this._renderCache) return false;
    
    const cache = this._renderCache;
    return (
      cache.fillColor === options.fillColor &&
      cache.strokeColor === options.strokeColor &&
      cache.strokeWidth === (options.strokeWidth ?? 0) &&
      cache.opacity === (options.opacity ?? 1)
    );
  }

  private performCachedRender(ctx: SKRSContext2D, options: TextRenderOptions): void {
    // For now, just perform fresh render
    // Could optimize further with pre-compiled paths
    this.performFreshRender(ctx, options);
  }

  private performFreshRender(ctx: SKRSContext2D, options: TextRenderOptions): void {
    GlyphRenderer.renderGlyph(
      ctx,
      this._glyphData,
      0, // No offset needed as position is handled by transforms
      0,
      options
    );
  }

  private updateRenderCache(options: TextRenderOptions): void {
    this._renderCache = {
      fillColor: options.fillColor ?? null,
      strokeColor: options.strokeColor ?? null,
      strokeWidth: options.strokeWidth ?? 0,
      opacity: options.opacity ?? 1,
    };
  }

  private invalidateRenderCache(): void {
    this._renderCache = undefined;
  }

  private renderFallback(ctx: SKRSContext2D): void {
    // Render a simple rectangle as fallback
    const { bbox } = this._glyphData;
    
    ctx.beginPath();
    ctx.rect(0, 0, bbox.width || 10, bbox.height || 10);
    
    if (this.fillColor) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    
    if (this.strokeColor && this.strokeWidth > 0) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
  }

  // ============================================================================
  // DEBUG UTILITIES
  // ============================================================================

  /**
   * Get debug information about this character
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      char: this._char,
      unicode: this._glyphData.unicode,
      glyphId: this._glyphData.glyphId,
      position: [...this.position],
      bbox: { ...this._glyphData.bbox },
      advanceWidth: this._glyphData.advanceWidth,
      pathCommandCount: this._glyphData.pathCommands.length,
      hasVisibleContent: this.hasVisibleContent,
      visible: this.visible,
      opacity: this.opacity,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
    };
  }

  /**
   * Render debug overlay (bounding box, center point, etc.)
   */
  public renderDebugOverlay(ctx: SKRSContext2D): void {
    if (!this.visible) return;

    ctx.save();
    try {
      this.applyTransforms(ctx);
      
      const { bbox } = this._glyphData;
      
      // Draw bounding box
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      
      // Draw center point
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw character info if space allows
      if (bbox.width > 20 && bbox.height > 20) {
        ctx.fillStyle = '#0000ff';
        ctx.font = '8px monospace';
        ctx.fillText(
          `${this._char}(${this._glyphData.glyphId || '?'})`,
          bbox.x + 2,
          bbox.y + 10
        );
      }
    } finally {
      ctx.restore();
    }
  }
}