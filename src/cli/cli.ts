/**
 * Bun CLI for the TypeScript Manim-like engine.
 */
import { Command } from 'commander';
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import type { Scene } from '../scene/scene.ts';
import type { FileConfig, RenderOutputOptions, SceneConfig } from '../core/types.ts';
import { promises as fs } from 'fs';

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

  // If a format is requested but --pngs wasn't, we still need frames for ffmpeg.
  const needPNGs = Boolean(options.format);

  const out: RenderOutputOptions = {
    outDir: options.outdir ?? 'out',
    saveLastFrame: Boolean(options.save_last_frame),
    savePNGs: Boolean(options.pngs) || needPNGs,
    format: options.format as RenderOutputOptions['format'] | undefined,
  };

  const fpsNum = options.fps ? Number(options.fps) : undefined;
  const mergedFileConfig: SceneConfig | undefined = fpsNum ? { ...(fileConfig ?? {}), fps: fpsNum } : fileConfig;

  const scene = new Ctor(mergedFileConfig, out);
  await scene.construct();

  // If a video format was requested, encode frames via ffmpeg
  if (options.format) {
    const cfg = scene.getConfig();
    const fps = cfg.fps;
    const pattern = join(out.outDir, `${scene.name}_%05d.png`);
    const outputFile = join(out.outDir, `${scene.name}.${options.format}`);

    await encodeWithFFmpeg(pattern, fps, options.format, outputFile);

    // Clean up frames if user didn't explicitly ask to keep them
    if (!options.pngs) {
      await cleanupFrames(out.outDir, scene.name);
    }
  }
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
    .option('-f, --format <type>', 'Video format (mp4|webm|gif|mov)')
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

async function encodeWithFFmpeg(pattern: string, fps: number, fmt: 'mp4' | 'webm' | 'gif' | 'mov', outFile: string): Promise<void> {
  const args = buildFfmpegArgs(pattern, fps, fmt, outFile);
  const proc = Bun.spawn(['ffmpeg', ...args], { stdout: 'inherit', stderr: 'inherit' });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`ffmpeg failed with exit code ${code}`);
  }
}

function buildFfmpegArgs(pattern: string, fps: number, fmt: 'mp4' | 'webm' | 'gif' | 'mov', outFile: string): string[] {
  const common = ['-y', '-framerate', String(fps), '-start_number', '0', '-i', pattern];
  switch (fmt) {
    case 'mp4':
      return [...common, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', outFile];
    case 'webm':
      return [...common, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '35', outFile];
    case 'gif':
      // Simple direct conversion; for best quality a palette pass is recommended.
      return [...common, '-vf', `fps=${fps}`, outFile];
    case 'mov':
      return [...common, '-c:v', 'prores_ks', '-profile:v', '3', outFile];
  }
}

async function cleanupFrames(outDir: string, sceneName: string): Promise<void> {
  const dirents = await fs.readdir(outDir, { withFileTypes: true });
  const prefix = `${sceneName}_`;
  const suffix = '.png';
  await Promise.all(
    dirents
      .filter((d) => d.isFile() && d.name.startsWith(prefix) && d.name.endsWith(suffix))
      .map((d) => fs.unlink(join(outDir, d.name)))
  );
}
