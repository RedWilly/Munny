// // 3d simulation on a 2d canvas
// // cube.ts
// import { createCanvas } from '@napi-rs/canvas';
// import fs from 'fs';

// const width = 500;
// const height = 500;
// const canvas = createCanvas(width, height);
// const ctx = canvas.getContext('2d');

// // Define cube vertices
// let vertices = [
//   [-1, -1, -1],
//   [ 1, -1, -1],
//   [ 1,  1, -1],
//   [-1,  1, -1],
//   [-1, -1,  1],
//   [ 1, -1,  1],
//   [ 1,  1,  1],
//   [-1,  1,  1]
// ];

// // Cube faces (each face is a list of vertex indices)
// const faces = [
//   [0, 1, 2, 3],
//   [4, 5, 6, 7],
//   [0, 1, 5, 4],
//   [2, 3, 7, 6],
//   [1, 2, 6, 5],
//   [0, 3, 7, 4]
// ];

// // Simple perspective projection
// function project([x, y, z], angleX, angleY) {
//   // Rotation around X axis
//   let dy = y * Math.cos(angleX) - z * Math.sin(angleX);
//   let dz = y * Math.sin(angleX) + z * Math.cos(angleX);
//   y = dy;
//   z = dz;

//   // Rotation around Y axis
//   let dx = x * Math.cos(angleY) + z * Math.sin(angleY);
//   dz = -x * Math.sin(angleY) + z * Math.cos(angleY);
//   x = dx;
//   z = dz;

//   // Perspective
//   const distance = 4; // camera distance
//   const scale = 200 / (z + distance);
//   const x2d = x * scale + width / 2;
//   const y2d = y * scale + height / 2;

//   return [x2d, y2d, z];
// }

// function drawFrame(angleX, angleY) {
//   ctx.fillStyle = '#111';
//   ctx.fillRect(0, 0, width, height);

//   // Project vertices
//   const projected = vertices.map(v => project(v, angleX, angleY));

//   // Sort faces by average Z for painter's algorithm
//   const sortedFaces = [...faces].sort((a, b) => {
//     const za = a.reduce((sum, idx) => sum + projected[idx][2], 0) / a.length;
//     const zb = b.reduce((sum, idx) => sum + projected[idx][2], 0) / b.length;
//     return zb - za; // draw farthest first
//   });

//   for (const face of sortedFaces) {
//     ctx.beginPath();
//     ctx.moveTo(projected[face[0]][0], projected[face[0]][1]);
//     for (let i = 1; i < face.length; i++) {
//       ctx.lineTo(projected[face[i]][0], projected[face[i]][1]);
//     }
//     ctx.closePath();

//     // Light shading based on Z depth
//     const avgZ = face.reduce((sum, idx) => sum + projected[idx][2], 0) / face.length;
//     const shade = Math.max(0, 255 - (avgZ + 2) * 60);
//     ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
//     ctx.fill();
//     ctx.strokeStyle = '#000';
//     ctx.stroke();
//   }
// }

// // Render a single frame for demo
// drawFrame(Math.PI / 6, Math.PI / 4);

// // Save as PNG
// fs.writeFileSync('cube.png', canvas.toBuffer('image/png'));
// console.log('Saved cube.png');

import fs from "fs";
import * as fontkit from "fontkit";
import type { Font, FontCollection } from "fontkit";

// ==== CONFIG ====
const fontPath = "./src/font/ROBOTO-REGULAR.TTF"; // Can be TTF, OTF, TTC, OTC
const searchFontName = "Roboto Regular"; // Only used if TTC/OTC
const searchFontIndex: number | null = null; // Alternative: pick by index
const text = "hello";
// ================

// 1. Load font or font collection
if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found at ${fontPath}`);
}

const fontData = fontkit.openSync(fontPath);

// 2. Resolve to a Font instance
let font: Font;

if ("fonts" in fontData) {
    // It's a FontCollection
    const collection = fontData as FontCollection;
    console.log(`Loaded font collection with ${collection.fonts.length} fonts`);

    if (searchFontIndex !== null && collection.fonts[searchFontIndex]) {
        font = collection.fonts[searchFontIndex];
        console.log(`Selected by index: ${searchFontIndex} (${font.familyName})`);
    } else {
        const found = collection.fonts.find(f => f.familyName === searchFontName);
        if (!found) {
            throw new Error(`Font "${searchFontName}" not found in collection`);
        }
        font = found;
        console.log(`Selected by name: ${font.familyName}`);
    }
} else {
    // It's a single font
    font = fontData as Font;
    console.log(`Loaded single font: ${font.familyName}`);
}

// 3. Get a run of glyphs for the entire word
const run = font.layout(text);

// 4. WHOLE WORD INFO
console.log(`--- WHOLE WORD "${text}" ---`);
const wordPath = run.glyphs.map((glyph, i) => ({
    index: i,
    unicode: glyph.codePoints,
    advance: glyph.advanceWidth,
    path: glyph.path.toSVG(),
}));
console.log(wordPath);

// 5. INDIVIDUAL CHARACTERS
console.log(`--- INDIVIDUAL CHARACTERS ---`);
run.glyphs.forEach((glyph, index) => {
    const char = text[index];
    console.log(`Character: "${char}"`);
    console.log(`Unicode: ${glyph.codePoints}`);
    console.log(`Advance width: ${glyph.advanceWidth}`);
    console.log(`Bounding box:`, glyph.bbox);
    console.log(`Path (SVG): ${glyph.path.toSVG()}`);
    console.log("---");
});
