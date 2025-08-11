import { test, expect } from "bun:test";
import { FontManager } from "../src/font/font_manager.ts";

// Ensure a system font can be resolved & registered (Arial fallback in manager)
test("FontManager.ensureRegistered returns a family string", () => {
  const fam = FontManager.get().ensureRegistered("Arial");
  expect(typeof fam).toBe("string");
  expect((fam as string).length).toBeGreaterThan(0);
});
