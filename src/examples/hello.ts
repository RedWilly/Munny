/**
 * Minimal example scene to validate the engine pipeline.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/hello.ts HelloWorld -s -o out
 */
import { Scene } from '../scene/scene.ts';
import { Circle } from '../shapes/circle.ts';
import { Text } from '../text/text.ts';
// import { FadeIn } from '../animation/fade_in.ts';
// import { MoveTo } from '../animation/move_to.ts';
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
    // const circle = new Circle()
    //   .setRadius(60)
    //   .setColor('#1e90ff') // dodgerblue
    //   .setStrokeWidth(4)
    //   .setOpacity(0)
    //   .setPosition(0, 0);

    const title = new Text('Hello Munny', { font: 'VCR EAS', fontSize: 32 })
    /*or can use .setFont('Arial') and .setFontSize(32)*/
      .setColor('#00ff00')
      .setOpacity(0)
      .setPosition(0, 0);

    this.add(title);

    // Fade in, then move
    await this.play(title.fadeIn(3));
    // await this.play(circle.fadeIn(3), title.fadeIn(1));
    // await this.play(circle.moveTo([150, 90]).setEasing('easeInOut').setDuration(2.0));
  }
}
