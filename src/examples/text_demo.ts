/**
 * Text demo scene showcasing Text API and chaining.
 *
 * Run examples:
 *   bun run src/cli/cli.ts src/examples/text_demo.ts TextDemo -s -o out     // Save last frame as PNG
 *   bun run src/cli/cli.ts src/examples/text_demo.ts TextDemo -f mp4 -o out // Save as MP4
 */
import type { SceneConfig } from '../core/types.ts';
import { Scene } from '../scene/scene.ts';
import { Text } from '../text/text.ts';
import { Circle } from '../shapes/circle.ts';
import { Rectangle } from '../shapes/rectangle.ts';
import { Line } from '../shapes/line.ts';
import { Polygon } from '../shapes/polygon.ts';
import { Arc } from '../shapes/arc.ts';
import { Annulus } from '../shapes/annulus.ts';
import { Arrow } from '../shapes/arrow.ts';
import { Sequence, Parallel } from '../animation/base/combinators.ts';

/** File-level configuration */
export const config: SceneConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#101010', // Dark charcoal backdrop
  fps: 30,
};

export class TextDemo extends Scene {
  public static override config?: SceneConfig;

  public override async construct(): Promise<void> {
    // === INTRO TEXT ELEMENTS ===
    // The title "Munny" appears large and glowing green
    const headline = new Text('Munny', { font: 'VCR EAS', fontSize: 72 })
      .setColor('#00ff88')
      .setOpacity(0)
      .setPosition(0, 80);

    // The subtitle appears smaller, beneath the headline
    const subtitle = new Text('TypeScript Manim-like', { font: 'VCR EAS', fontSize: 28 })
      .setColor('#ffffff')
      .setOpacity(0)
      .setPosition(0, 30);

    // The footnote appears low and subtle
    const footnote = new Text('Fluent: .font(), .fontSize(), .text()', { font: 'VCR EAS', fontSize: 20 })
      .setColor('#cccccc')
      .setOpacity(0)
      .setPosition(0, -120);

    // A small green dot to the left of the subtitle
    const dot = new Circle(6)
      .setColor('#00ff88')
      .setPosition(-150, 35)
      .setOpacity(0);

    // === BACKGROUND GEOMETRY ELEMENTS ===
    const rect = new Rectangle(220, 110)
      .setColor('#19324d')
      .stroke('#00ff88')
      .setStrokeWidth(2)
      .setOpacity(0)
      .setPosition(0, -90);

    const underline = new Line([-150, 65], [150, 65])
      .stroke('#00ff88')
      .setStrokeWidth(2)
      .setOpacity(0);

    const tri = new Polygon([[-60, -35], [0, 25], [60, -35]])
      .setColor('#ffaa00')
      .stroke('#000000')
      .setStrokeWidth(2)
      .setOpacity(0)
      .setPosition(0, -10);

    const arc = new Arc(40, Math.PI * 0.9, Math.PI * 1.6)
      .stroke('#ff33aa')
      .setStrokeWidth(3)
      .setOpacity(0)
      .setPosition(-120, 35);

    const ring = new Annulus(42, 22)
      .setColor('#143535')
      .stroke('#00ff88')
      .setStrokeWidth(1)
      .setOpacity(0)
      .setPosition(200, -60);

    const arrow = new Arrow([-180, 55], [-120, 78], 18, 12)
      .stroke('#ffffff')
      .setStrokeWidth(2)
      .setOpacity(0);

    // Add everything to the scene
    this.add(headline, subtitle, footnote, dot, rect, underline, tri, arc, ring, arrow);

    // === INTRO FADE-IN ===
    await this.play(headline.fadeIn(1), subtitle.fadeIn(1), footnote.fadeIn(1), dot.fadeIn(1));

    // Dot glides to its spot near the headline
    await this.play(dot.moveTo([113, 90]).setEasing('easeInOut').setDuration(2.0));

    // Subtitle drops, headline tilts slightly
    await this.play(
      subtitle.moveBy([0, -40], 1.2).setEasing('easeInOut'),
      headline.rotateBy(Math.PI / 16, 1.2).setEasing('easeInOut')
    );

    // Colors change to cyan, dot's border thickens
    await this.play(
      headline.fillColorTo('#00ccff', 1.0),
      dot.strokeColorTo('#00ccff', 1.0),
      dot.strokeWidthTo(4, 1.0)
    );

    // Headline grows, dot enlarges
    await this.play(
      headline.scaleBy([1.2, 1.2], 1.0).setEasing('easeInOut'),
      dot.scaleTo([1.5, 1.5], 1.0).setEasing('easeInOut')
    );

    // Footnote fades slightly
    await this.play(footnote.opacityTo(0.1));

    // Headline straightens, subtitle moves back
    await this.play(
      headline.rotateTo(0, 0.8).setEasing('easeOut'),
      subtitle.moveBy([0, 10], 0.8).setEasing('easeOut')
    );

    // Dot moves, subtitle fades away
    await this.play(
      Sequence(
        dot.moveBy([40, 0], 0.6).setEasing('easeInOut'),
        subtitle.fadeOut(0.6).setEasing('easeOut')
      ).setDuration(3)
    );

    // === BRINGING IN THE SHAPES ===
    await this.play(
      Parallel(
        rect.fadeIn(0.6).setEasing('easeIn'),
        underline.fadeIn(0.6).setEasing('easeIn'),
        tri.fadeIn(0.6).setEasing('easeIn'),
        arc.fadeIn(0.6).setEasing('easeIn'),
        ring.fadeIn(0.6).setEasing('easeIn'),
        arrow.fadeIn(0.6).setEasing('easeIn')
      ).setDuration(1)
    );

    // Shapes change colors, rotate, resize
    await this.play(
      Parallel(
        rect.fillColorTo('#102a44', 0.8).setEasing('easeInOut'),
        rect.strokeColorTo('#66ffcc', 0.8).setEasing('easeInOut'),
        rect.strokeWidthTo(8, 0.8).setEasing('easeInOut'),

        underline.strokeWidthTo(4, 0.8).setEasing('easeInOut'),
        underline.strokeColorTo('#66ffcc', 0.8).setEasing('easeInOut'),

        tri.fillColorTo('#ffcc33', 0.8).setEasing('easeInOut'),
        tri.rotateBy(Math.PI / 8, 0.8).setEasing('easeInOut'),

        arc.rotateBy(-Math.PI / 6, 0.8).setEasing('easeInOut'),

        ring.scaleBy([1.15, 1.15], 0.8).setEasing('easeInOut'),
        ring.strokeWidthTo(3, 0.8).setEasing('easeInOut'),

        arrow.moveBy([20, 5], 0.8).setEasing('easeInOut')
      )
    );

    // Arrow moves forward and rotates, headline resets, dot moves
    await this.play(
      Sequence(
        Parallel(
          arrow.moveBy([-40, -10], 0.5).setEasing('easeOut'),
          arrow.rotateBy(-0.2, 0.5).setEasing('easeOut')
        ),
        headline.rotateTo(0, 0.6).setEasing('easeOut'),
        dot.moveTo([-80, 80], 0.6).setEasing('easeInOut')
      ).setDuration(2)
    );

    // === CHARACTER WAVE ANIMATION ===
    {
      const waves = [] as any[];
      for (let i = 0; i < headline.length; i++) {
        const ch = headline.at(i);
        waves.push(
          Sequence(
            Parallel(
              ch.scaleBy([1.2, 1.2], 0.25).setEasing('spring'),
              ch.rotateBy(0.25, 0.25).setEasing('easeOut')
            ),
            Parallel(
              ch.scaleTo([1, 1], 0.25).setEasing('easeOut'),
              ch.rotateTo(0, 0.25).setEasing('easeOut')
            )
          )
        );
      }
      // Letters bounce one after another
      await this.play(Sequence(...waves).setDuration(2.5));
    }

    // Headline fades, dot moves back
    await this.play(
      Parallel(
        headline.fadeOut(0.8).setEasing('easeIn'),
        dot.moveBy([-40, 0], 0.8).setEasing('easeInOut')
      )
    );

    // Footnote fades out last
    await this.play(footnote.fadeOut(0.6).setEasing('easeIn'));
  }
}
