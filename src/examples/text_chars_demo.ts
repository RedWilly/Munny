/**
 * Text chars demo: character-level addressing and animation.
 *
 * Run:
 *   bun run src/cli/cli.ts src/examples/text_chars_demo.ts TextCharsDemo -s -o out
 */
import type { SceneConfig } from '../core/types.ts';
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';

export const config: SceneConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#101010',
  fps: 30,
};

export class TextCharsDemo extends Scene {
  public override async construct(): Promise<void> {
    const text = new Text('Hello World').font('Arial').fontSize(64).setColor('#ffffff');
    this.add(text);

    // Indexing and slicing
    const h = (text as any)[0];
    //also support these too=>>
    // // const h = text.at(0);
    // const h = text[0];
    const ello = text.slice(1, 5);
    const world = text.slice(6, 11);

    // Animate individual parts
    await this.play(text.fadeIn(0.8));
    await this.play(h.moveTo([ -200, 100 ]).setDuration(1.2).setEasing('easeInOut'));
    await this.play(ello.fadeIn(0.8), world.fadeIn(0.8));
  }
}
