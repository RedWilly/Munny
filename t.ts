// 3d simulation on a 2d canvas
// cube.ts
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

const width = 500;
const height = 500;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Define cube vertices
let vertices = [
  [-1, -1, -1],
  [ 1, -1, -1],
  [ 1,  1, -1],
  [-1,  1, -1],
  [-1, -1,  1],
  [ 1, -1,  1],
  [ 1,  1,  1],
  [-1,  1,  1]
];

// Cube faces (each face is a list of vertex indices)
const faces = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [2, 3, 7, 6],
  [1, 2, 6, 5],
  [0, 3, 7, 4]
];

// Simple perspective projection
function project([x, y, z], angleX, angleY) {
  // Rotation around X axis
  let dy = y * Math.cos(angleX) - z * Math.sin(angleX);
  let dz = y * Math.sin(angleX) + z * Math.cos(angleX);
  y = dy;
  z = dz;

  // Rotation around Y axis
  let dx = x * Math.cos(angleY) + z * Math.sin(angleY);
  dz = -x * Math.sin(angleY) + z * Math.cos(angleY);
  x = dx;
  z = dz;

  // Perspective
  const distance = 4; // camera distance
  const scale = 200 / (z + distance);
  const x2d = x * scale + width / 2;
  const y2d = y * scale + height / 2;

  return [x2d, y2d, z];
}

function drawFrame(angleX, angleY) {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);

  // Project vertices
  const projected = vertices.map(v => project(v, angleX, angleY));

  // Sort faces by average Z for painter's algorithm
  const sortedFaces = [...faces].sort((a, b) => {
    const za = a.reduce((sum, idx) => sum + projected[idx][2], 0) / a.length;
    const zb = b.reduce((sum, idx) => sum + projected[idx][2], 0) / b.length;
    return zb - za; // draw farthest first
  });

  for (const face of sortedFaces) {
    ctx.beginPath();
    ctx.moveTo(projected[face[0]][0], projected[face[0]][1]);
    for (let i = 1; i < face.length; i++) {
      ctx.lineTo(projected[face[i]][0], projected[face[i]][1]);
    }
    ctx.closePath();

    // Light shading based on Z depth
    const avgZ = face.reduce((sum, idx) => sum + projected[idx][2], 0) / face.length;
    const shade = Math.max(0, 255 - (avgZ + 2) * 60);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }
}

// Render a single frame for demo
drawFrame(Math.PI / 6, Math.PI / 4);

// Save as PNG
fs.writeFileSync('cube.png', canvas.toBuffer('image/png'));
console.log('Saved cube.png');
