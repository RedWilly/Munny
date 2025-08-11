/**
 * Minimal example scene to validate the engine pipeline.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/hello.ts HelloWorld -s -o out
 */
import { Scene } from '../scene/scene.ts';
import { Circle } from '../shapes/circle.ts';
import { FadeIn } from '../animation/fade_in.ts';
import { MoveTo } from '../animation/move_to.ts';
import type { SceneConfig } from '../core/types.ts';

// File-level configuration (Level 2)
export const config: SceneConfig = {
  width: 640,
  height: 360,
  backgroundColor: '#1a1a1a',
  fps: 30,
};

export class HelloWorld extends Scene {
  // Scene-level override (Level 3) - keeping default here for demo
  public static override config?: SceneConfig;

  public override async construct(): Promise<void> {
    const circle = new Circle(60)
      .setColor('#1e90ff') // dodgerblue
      .setStrokeWidth(4)
      .setOpacity(0)
      .setPosition(0, 0);

    this.add(circle);

    // Fade in, then move
    this.play(new FadeIn(circle).setDuration(1.0));
    this.play(new MoveTo(circle, [150, 90]).setDuration(2.0).setEasing('easeInOut'));
  }
}
