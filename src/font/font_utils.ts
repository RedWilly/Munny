/**
 * Font utilities for registering fonts and providing defaults.
 *
 * - Default font is the bundled ROBOTO-REGULAR.ttf in `src/font/`.
 * - Users can call `ensureFontRegistered(path, family)` to register custom fonts.
 * - Functions are safe to call multiple times; registration is cached by family.
 *
 * This module avoids global/system font scanning. Fonts must be registered explicitly
 * or fall back to the bundled Roboto.
 *
 * Environment: Bun/TypeScript (ESM). Uses @napi-rs/canvas GlobalFonts.
 */
import { GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'url';

/** Cache of families we've registered this process run. */
const REGISTERED_FAMILIES: Set<string> = new Set<string>();

/**
 * Ensure a font at `path` is registered with the given `family` name.
 * Safe to call repeatedly; will register only once per `family`.
 */
export function ensureFontRegistered(path: string, family: string): void {
  if (REGISTERED_FAMILIES.has(family)) return;
  try {
    GlobalFonts.registerFromPath(path, family);
  } catch {
    // Ignore registration errors; canvas will attempt fallback.
  }
  REGISTERED_FAMILIES.add(family);
}

/** Return absolute OS path to bundled Roboto Regular. */
export function defaultRobotoPath(): string {
  // This file is in src/font/; Roboto sits alongside as ROBOTO-REGULAR.TTF
  return fileURLToPath(new URL('./ROBOTO-REGULAR.TTF', import.meta.url));
}

/** Derive a reasonable family name from a file path. */
export function deriveFamilyFromPath(p: string): string {
  const norm = p.replace(/\\/g, '/');
  const base = norm.substring(norm.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return (dot > 0 ? base.substring(0, dot) : base) || 'Roboto';
}
