import { test, expect } from "bun:test";
import { Text } from "../src/text/text.ts";

// Validate fluent chaining and default behavior of Text

test("Text fluent API", () => {
  const t = new Text("hello")
    .text("world")
    .setFont("Arial")
    .setFontSize(42)
    .setColor("#abcdef")
    .setStrokeWidth(2)
    .stroke("#123456")
    .setOpacity(0.5)
    .setPosition(10, 20)
    .setRotation(Math.PI / 6)
    .setScale(2, 1.5);

  // Just ensure the instance is returned for chains and is an object
  expect(t).toBeDefined();
  // No runtime exceptions during chaining indicates API shape is intact
});
