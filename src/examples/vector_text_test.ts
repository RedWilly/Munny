/**
 * Vector text test scene to validate fully vectorized text rendering.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/vector_text_test.ts VectorTextTest -s -o out
 */
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';
import { Circle } from '../shapes/circle.ts';
import type { SceneConfig } from '../core/types.ts';

// File-level configuration
export const config: SceneConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#1a1a1a',
  fps: 30,
};

export class VectorTextTest extends Scene {
  public override async construct(): Promise<void> {
    // Test vector text with bundled font
    const vectorText = new Text('Vector!', { 
      font: './src/font/ROBOTO-REGULAR.TTF', 
      fontSize: 64 
    })
      .setColor('#00ff88')
      .setOpacity(0)
      .setPosition(0, 50);

    // Test smaller vector text
    const smallText = new Text('Scalable Typography', { 
      font: './src/font/ROBOTO-REGULAR.TTF', 
      fontSize: 24 
    })
      .setColor('#ffffff')
      .setOpacity(0)
      .setPosition(0, -20);

    // Background circle for reference
    const bg = new Circle(130)
      .setColor('#333333')
      .stroke('#00ff88')
      .setStrokeWidth(2)
      .setOpacity(0)
      .setPosition(0, 30);

    this.add(bg, vectorText, smallText);

    // Animate in sequence
    await this.play(bg.fadeIn(1));
    await this.play(vectorText.fadeIn(1.5));
    await this.play(smallText.fadeIn(1));

    // Test character-level animation with vector text
    const chars = [];
    for (let i = 0; i < vectorText.length; i++) {
      chars.push(vectorText.charAt(i));
    }

    // Animate each character individually
    await this.play(
      ...chars.map((char, i) => 
        char.scaleBy([1.5, 1.5], 0.3)
          .setEasing('bounce')
          .setDuration(0.5 + i * 0.1)
      )
    );

    // Scale back down
    await this.play(
      ...chars.map((char, i) => 
        char.scaleTo([1, 1], 0.3)
          .setEasing('easeOut')
          .setDuration(0.5 + i * 0.05)
      )
    );

    // Test color animation on vector text
    await this.play(
      vectorText.fillColorTo('#ff3366', 1.5).setEasing('easeInOut'),
      smallText.fillColorTo('#66ccff', 1.5).setEasing('easeInOut')
    );

    // Final rotation
    await this.play(
      vectorText.rotateBy(Math.PI / 8, 1).setEasing('easeInOut')
    );

    // scale smallText
    await this.play(
      smallText.scaleTo([1.5, 1.5], 1).setEasing('easeInOut').setDuration(3),
    )

    // scale smallText
    await this.play(
      smallText.scaleTo([1, 1], 1).setEasing('easeInOut').setDuration(2),
    )//can also use scaleby
  }
}
