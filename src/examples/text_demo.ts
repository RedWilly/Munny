/**
 * Text demo scene showcasing Text API and chaining.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/text_demo.ts TextDemo -s -o out  == save last frame as png
 * bun run src/cli/cli.ts src/examples/text_demo.ts TextDemo -f mp4 -o out/n == save as mp4
 */
import type { SceneConfig } from '../core/types.ts';
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';
import { Circle } from '../shapes/circle.ts';
import { Sequence, Parallel } from '../animation/base/combinators.ts';

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
      .setPosition(-150, 35)
      .setOpacity(0);

    this.add(headline, subtitle, footnote, dot);

    await this.play(headline.fadeIn(1), subtitle.fadeIn(1), footnote.fadeIn(1), dot.fadeIn(1));
    await this.play(dot.moveTo([113, 90]).setEasing('easeInOut').setDuration(2.0));

    // Move subtitle by a delta and give the headline a subtle rotation
    await this.play(
      subtitle.moveBy([0, -40], 1.2).setEasing('easeInOut'),
      headline.rotateBy(Math.PI / 16, 1.2).setEasing('easeInOut')
    );

    // Animate colors and stroke width
    await this.play(
      headline.fillColorTo('#00ccff', 1.0),
      dot.strokeColorTo('#00ccff', 1.0),
      dot.strokeWidthTo(4, 1.0)
    );

    // Scale headline up a bit, and enlarge the dot
    await this.play(
      headline.scaleBy([1.2, 1.2], 1.0).setEasing('easeInOut'),
      dot.scaleTo([1.5, 1.5], 1.0).setEasing('easeInOut')
    );

    // Dim the footnote slightly
    await this.play(footnote.opacityTo(0.1));

    // Reset headline rotation and nudge subtitle back a bit
    await this.play(
      headline.rotateTo(0, 0.8).setEasing('easeOut'),
      subtitle.moveBy([0, 10], 0.8).setEasing('easeOut')
    );

    // Sequence: move the dot, then fade out the subtitle
    await this.play(
      Sequence(
        dot.moveBy([40, 0], 0.6).setEasing('easeInOut'),
        subtitle.fadeOut(0.6).setEasing('easeOut')
      ).setDuration(3)
    );

    // Parallel: fade out the headline while moving the dot back
    await this.play(
      Parallel(
        headline.fadeOut(0.8).setEasing('easeIn'),
        dot.moveBy([-40, 0], 0.8).setEasing('easeInOut')
      )
    );

    // Fade out the footnote to conclude
    await this.play(footnote.fadeOut(0.6).setEasing('easeIn'));
  }
}
