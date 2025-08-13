// // t.ts
// // t.ts
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const fontkit = require('fontkit');
// import type { Font, FontCollection, Glyph } from 'fontkit';

// const fontPath = './ROBOTO-REGULAR.TTF';const font: Font | FontCollection = fontkit.openSync(fontPath);

// const activeFont: Font = (font as FontCollection).fonts
//   ? (font as FontCollection).fonts[0]
//   : (font as Font);

// const text = 'hello';
// const glyphs: Glyph[] = activeFont.glyphsForString(text);

// glyphs.forEach((glyph, i) => {
//   console.log(`Character: "${text[i]}"`);
//   console.log(`  Glyph ID: ${glyph.id}`);
//   console.log(`  Glyph Name: ${glyph.name}`);
//   console.log(`  Unicode: ${glyph.codePoints.map(cp => `U+${cp.toString(16)}`).join(', ')}`);
//   console.log(`  Path Commands:`, glyph.path.commands);
// });


const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
console.log("Available fonts:", GlobalFonts.families);
