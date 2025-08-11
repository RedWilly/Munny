/**
 * Text demo scene showcasing Text API and chaining.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/text_demo.ts TextDemo -s -o out
 */
import type { SceneConfig } from '../core/types.ts';
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';
import { Circle } from '../shapes/circle.ts';

/** File-level configuration (Level 2). */
export const config: SceneConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#101010',
  fps: 30,
};

/**
 * A demo scene rendering several pieces of text with different sizes.
 */
export class TextDemo extends Scene {
  public static override config?: SceneConfig;

  public override async construct(): Promise<void> {
    const headline = new Text('Munny', { font: 'Arial', size: 72 })
      .setColor('#00ff88')
      .setOpacity(0)
      .setPosition(0, 80);

    const subtitle = new Text('TypeScript Manim-like', { font: 'Arial', size: 28 })
      .setColor('#ffffff')
      .setOpacity(0)
      .setPosition(0, 30);

    const footnote = new Text('Fluent: .font(), .fontSize(), .text()', { font: 'Arial', size: 20 })
      .setColor('#cccccc')
      .setOpacity(0)
      .setPosition(0, -120);

    const dot = new Circle(6)
      .setColor('#00ff88')
      .setPosition(-120, 30)
      .setOpacity(0);

    this.add(headline, subtitle, footnote, dot);

    this.play(headline.fadeIn(1), subtitle.fadeIn(1), footnote.fadeIn(1), dot.fadeIn(1));
    this.play(dot.moveTo([150, 90]).setEasing('easeInOut').setDuration(2.0));
}
}
