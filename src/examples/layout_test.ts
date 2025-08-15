/**
 * Layout test scene to validate the new fontkit-based text system.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/layout_test.ts LayoutTest -s -o out
 */
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';
// import { Sequence, Parallel } from '../animation/base/combinators.ts';
import type { SceneConfig } from '../core/types.ts';

// File-level configuration
export const config: SceneConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#1a1a1a',
  fps: 30,
};

export class LayoutTest extends Scene {
  public override async construct(): Promise<void> {
    // Test proper character spacing with fontkit layout
    const testText = new Text('hello world', { 
      font: './src/font/ROBOTO-REGULAR.TTF', 
      fontSize: 64 
    })
      .setColor('#00ff88')
      .setOpacity(0)
      .setPosition(0, 50);

    // Test smaller text
    const smallText = new Text('Perfect Spacing!', { 
      font: './src/font/ROBOTO-REGULAR.TTF', 
      fontSize: 32 
    })
      .setColor('#ffffff')
      .setOpacity(0)
      .setPosition(0, -50);

    this.add(testText, smallText);

    // Animate in
    await this.play(testText.fadeIn(1));
    await this.play(smallText.fadeIn(1));  
  }
}
