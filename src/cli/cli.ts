/**
 * Bun CLI for the TypeScript Manim-like engine.
 */
import { Command } from 'commander';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { Scene } from '../scene/scene.ts';
import type { FileConfig, RenderOutputOptions, SceneConfig } from '../core/types.ts';

interface CliOptions {
  save_last_frame?: boolean;
  pngs?: boolean;
  format?: 'mp4' | 'webm' | 'gif' | 'mov';
  fps?: string;
  outdir?: string;
}

async function run(sceneFile: string, sceneName: string, options: CliOptions): Promise<void> {
  const abs = resolve(process.cwd(), sceneFile);
  const fileURL = pathToFileURL(abs).href;
  const mod = await import(fileURL);

  const fileConfig: SceneConfig | undefined = (mod.config as FileConfig | undefined) ?? undefined;

  const Ctor = mod[sceneName] as unknown as {
    new (fileConfig: SceneConfig | undefined, output: RenderOutputOptions): Scene;
  };
  if (!Ctor || typeof Ctor !== 'function') {
    throw new Error(`Scene class '${sceneName}' was not found in module ${abs}`);
  }

  const out: RenderOutputOptions = {
    outDir: options.outdir ?? 'out',
    saveLastFrame: Boolean(options.save_last_frame),
    savePNGs: Boolean(options.pngs),
    format: (options.format as RenderOutputOptions['format']) ?? 'mp4',
  };

  const fpsNum = options.fps ? Number(options.fps) : undefined;
  const mergedFileConfig: SceneConfig | undefined = fpsNum ? { ...(fileConfig ?? {}), fps: fpsNum } : fileConfig;

  const scene = new Ctor(mergedFileConfig, out);
  await scene.construct();
}

export async function main(argv: string[]): Promise<void> {
  const program = new Command();
  program
    .name('manim-ts')
    .description('Server-side TypeScript Manim-like engine (Bun)')
    .argument('<sceneFile>', 'Path to scene file')
    .argument('<sceneName>', 'Scene class to render')
    .option('-s, --save_last_frame', 'Save last frame as PNG')
    .option('--pngs', 'Save animation frames as PNGs')
    .option('-f, --format <type>', 'Video format', 'mp4')
    .option('--fps <number>', 'Frames per second', '30')
    .option('-o, --outdir <dir>', 'Output directory', 'out')
    .action(async (sceneFile: string, sceneName: string, opts: CliOptions) => {
      await run(sceneFile, sceneName, opts);
    });

  await program.parseAsync(argv);
}

// Allow running directly with `bun run src/cli/cli.ts`.
if (import.meta.main) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  main(process.argv).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
