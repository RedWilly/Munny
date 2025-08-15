/**
 * Font test scene to validate system font resolution and text orientation fixes.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/font_test.ts FontTest -s -o out
 */
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';
import type { SceneConfig } from '../core/types.ts';

// File-level configuration
export const config: SceneConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#1a1a1a',
  fps: 30,
};

export class FontTest extends Scene {
  public override async construct(): Promise<void> {
    // Test system font (should fallback to bundled font but register Arial)
    const arialText = new Text('Arial Test', { 
      font: 'Arial', 
      fontSize: 48 
    })
      .setColor('#ff6b6b')
      .setOpacity(0)
      .setPosition(0, 100);

    // Test bundled font with file path
    const robotoText = new Text('Roboto Test', { 
      font: './src/font/ROBOTO-REGULAR.TTF', 
      fontSize: 48 
    })
      .setColor('#4ecdc4')
      .setOpacity(0)
      .setPosition(0, 0);

    const munny = new Text('Munny', { font: 'VCR EAS', fontSize: 48 })
      .setColor('#00ff88')
      .setOpacity(0)
      .setPosition(0, 160);

    // Test default font (should use bundled)
    const defaultText = new Text('Default Font', { 
      fontSize: 48 
    })
      .setColor('#45b7d1')
      .setOpacity(0)
      .setPosition(0, -100);

    this.add(arialText, robotoText, defaultText, munny);

    // Animate in sequence to test orientation
    await this.play(arialText.fadeIn(1));
    await this.play(robotoText.fadeIn(1));
    await this.play(defaultText.fadeIn(1));
    await this.play(munny.fadeIn())

    // // Test that text is right-side up by rotating
    // await this.play(
    //   arialText.rotateBy(Math.PI / 6, 1).setEasing('easeInOut'),
    //   robotoText.rotateBy(-Math.PI / 6, 1).setEasing('easeInOut'),
    //   defaultText.rotateBy(Math.PI / 4, 1).setEasing('easeInOut')
    // );

    // Scale test to verify vector scalability
    // await this.play(
    //   arialText.scaleBy([1.5, 1.5], 1).setEasing('bounce'),
    //   robotoText.scaleBy([0.7, 0.7], 1).setEasing('bounce'),
    //   defaultText.scaleBy([1.2, 1.2], 1).setEasing('bounce')
    // );
  }
}
