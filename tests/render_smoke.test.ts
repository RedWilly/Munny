import { test, expect } from "bun:test";
import { CanvasRenderer } from "../src/renderer/canvas_renderer.ts";
import type { EngineConfig } from "../src/core/types.ts";
import { Circle } from "../src/shapes/circle.ts";
import { Text } from "../src/text/text.ts";
import { promises as fs } from "fs";
import { join } from "path";
import os from "os";

function tmpFile(name: string): string {
  return join(os.tmpdir(), name);
}

// Smoke render: draw a circle and text, write a PNG, ensure file exists and has bytes
// This validates the render pipeline end-to-end under Bun + node-canvas

test("render pipeline writes a PNG", async () => {
  const cfg: EngineConfig = { width: 320, height: 180, backgroundColor: "#000000", fps: 30 };
  const renderer = new CanvasRenderer(cfg);

  const circle = new Circle(30).setColor("#ff4081").setPosition(-40, 0).setOpacity(1);
  const label = new Text("Hi", { font: "Arial", size: 24 }).setColor("#ffffff").setPosition(40, 0);

  renderer.beginFrame();
  const ctx = renderer.getContext();
  circle.draw(ctx);
  label.draw(ctx);

  const file = tmpFile(`munny_render_smoke_${Date.now()}.png`);
  await renderer.writePNG(file);

  const stat = await fs.stat(file);
  expect(stat.size).toBeGreaterThan(1000);
});
