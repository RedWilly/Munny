/**
 * Font utilities for parsing and registering fonts.
 *
 * Supports unified font specification:
 * - "Arial" - system font family
 * - "./path/to/font.ttf" - font file path
 * - "./path/to/font.ttf#CustomName" - font file path with explicit family name
 *
 * No fallback fonts - if a font is not found or cannot be registered, an error is thrown.
 *
 * Environment: Bun/TypeScript (ESM). Uses @napi-rs/canvas GlobalFonts.
 */
import { GlobalFonts } from '@napi-rs/canvas';

/** Cache of families we've registered this process run. */
const REGISTERED_FAMILIES: Set<string> = new Set<string>();

/**
 * Parse a font specification and return the resolved family name.
 * Handles registration for file paths automatically.
 * 
 * @param font - Font specification (family name, path, or path#family)
 * @returns The resolved font family name to use in CSS font declarations
 * @throws Error if font file cannot be registered or specification is invalid
 */
export function parseAndRegisterFont(font: string): string {
  if (!font || font.trim() === '') {
    throw new Error('Font specification cannot be empty');
  }

  const trimmed = font.trim();
  
  // Check if it's a file path (contains . or / or \)
  if (trimmed.includes('.') || trimmed.includes('/') || trimmed.includes('\\')) {
    // It's a file path, possibly with #family
    const hashIndex = trimmed.indexOf('#');
    let filePath: string;
    let familyName: string;
    
    if (hashIndex !== -1) {
      // Path with explicit family: "./font.ttf#MyFont"
      filePath = trimmed.substring(0, hashIndex);
      familyName = trimmed.substring(hashIndex + 1);
      if (!familyName) {
        throw new Error(`Invalid font specification: missing family name after '#' in "${font}"`);
      }
    } else {
      // Path without explicit family: "./font.ttf"
      filePath = trimmed;
      familyName = deriveFamilyFromPath(filePath);
    }
    
    // Register the font if not already registered
    if (!REGISTERED_FAMILIES.has(familyName)) {
      try {
        GlobalFonts.registerFromPath(filePath, familyName);
        REGISTERED_FAMILIES.add(familyName);
      } catch (error) {
        throw new Error(`Failed to register font from "${filePath}": ${error}`);
      }
    }
    
    return familyName;
  } else {
    // It's a system font family name
    return trimmed;
  }
}



/** Derive a reasonable family name from a file path. */
function deriveFamilyFromPath(p: string): string {
  const norm = p.replace(/\\/g, '/');
  const base = norm.substring(norm.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  const name = dot > 0 ? base.substring(0, dot) : base;
  if (!name) {
    throw new Error(`Cannot derive font family name from path: "${p}"`);
  }
  return name;
}
