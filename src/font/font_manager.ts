// import { GlobalFonts } from '@napi-rs/canvas';
// import { basename } from 'path';
// import FontScanner from '@redwilly/fontscanner';

// export interface ScannedFont {
//   path: string;
//   family?: string;
//   name?: string; // font name from scanner
// }

// export interface ResolvedFont {
//   family: string;
//   path: string;
// }

// export class FontManager {
//   private static instance: FontManager | null = null;

//   public static get(): FontManager {
//     if (!this.instance) this.instance = new FontManager();
//     return this.instance;
//   }

//   private readonly fonts: ScannedFont[];
//   private readonly registeredFamilies = new Set<string>();

//   private constructor() {
//     // Only keep family & path in memory
//     this.fonts = (FontScanner.scan().getFonts() as any[]).map(f => ({
//       path: f.path,
//       family: f.family || f.name || basename(f.path)
//     }));
//   }

//   public resolve(name?: string): ResolvedFont | null {
//     let pick: ScannedFont | undefined;

//     if (name) {
//       // Exact match
//       pick = this.fonts.find(f => f.family === name || f.name === name);
//       // Fuzzy match
//       if (!pick) {
//         pick = this.fonts.find(f =>
//           f.family?.toLowerCase().includes(name.toLowerCase())
//         );
//       }
//     }

//     if (!pick) pick = this.fonts[0];
//     if (!pick) return null;

//     return {
//       family: pick.family || basename(pick.path),
//       path: pick.path
//     };
//   }

//   public ensureRegistered(name?: string): string | null {
//     // Always use 'Arial' as final fallback
//     const resolved = this.resolve(name) ?? this.resolve('Arial');
//     if (!resolved) return null; // Shouldn't happen unless Arial is missing
  
//     if (!this.registeredFamilies.has(resolved.family)) {
//       try {
//         GlobalFonts.registerFromPath(resolved.path, resolved.family);
//       } catch {
//         // Ignore registration errors
//       }
//       this.registeredFamilies.add(resolved.family);
//     }
//     return resolved.family;
//   }
// }
