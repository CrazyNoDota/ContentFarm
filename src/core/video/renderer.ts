import { spawn } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import sharp from "sharp";
import { paths } from "../paths.js";
import type { RenderResult, VideoScript } from "../types.js";

const require = createRequire(import.meta.url);
const ffmpegStatic = require("ffmpeg-static") as string | null;

export interface RenderOptions {
  idPrefix: string;
  durationSeconds: number;
  photos?: string[];
}

export async function renderVerticalVideo(script: VideoScript, options: RenderOptions): Promise<RenderResult> {
  const ffmpegPath = ffmpegStatic;
  if (!ffmpegPath) throw new Error("ffmpeg-static did not resolve an FFmpeg binary.");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const renderDir = path.join(paths.renders, `${options.idPrefix}-${stamp}`);
  await mkdir(renderDir, { recursive: true });

  const framePaths = await createFrames(script, renderDir, options.photos ?? [], options.durationSeconds);
  const concatPath = path.join(renderDir, "frames.txt");
  await writeFile(
    concatPath,
    framePaths
      .map((frame) => `file '${frame.file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'\nduration ${frame.duration}`)
      .join("\n") + `\nfile '${framePaths.at(-1)?.file.replace(/\\/g, "/")}'\n`,
    "utf8"
  );

  const videoPath = path.join(paths.outputs, `${options.idPrefix}-${stamp}.mp4`);
  await runFfmpeg(ffmpegPath, [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-f",
    "lavfi",
    "-i",
    `anullsrc=channel_layout=stereo:sample_rate=44100`,
    "-shortest",
    "-vf",
    "format=yuv420p",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    videoPath
  ]);

  const scriptPath = path.join(renderDir, "script.json");
  const sourcePath = path.join(renderDir, "sources.json");
  await writeFile(scriptPath, JSON.stringify(script, null, 2), "utf8");
  await writeFile(sourcePath, JSON.stringify(script.sources, null, 2), "utf8");

  return {
    videoPath,
    scriptPath,
    sourcePath,
    createdAt: new Date().toISOString()
  };
}

async function createFrames(
  script: VideoScript,
  renderDir: string,
  photos: string[],
  durationSeconds: number
): Promise<Array<{ file: string; duration: number }>> {
  const beats = script.beats.length ? script.beats : [{ at: 0, text: script.narration, visualPrompt: "" }];
  const frameDuration = Math.max(3, Math.floor(durationSeconds / beats.length));
  const frames: Array<{ file: string; duration: number }> = [];

  for (let index = 0; index < beats.length; index += 1) {
    const beat = beats[index];
    const output = path.join(renderDir, `frame-${String(index).padStart(2, "0")}.png`);
    const photo = photos[index % Math.max(photos.length, 1)];
    if (photo) {
      const copied = path.join(renderDir, `photo-${String(index).padStart(2, "0")}${path.extname(photo)}`);
      await copyFile(photo, copied).catch(() => undefined);
    }
    await renderFrame(output, beat.text, script.title, index, photos.length > 0 ? photo : undefined);
    frames.push({ file: output, duration: frameDuration });
  }

  return frames;
}

async function renderFrame(
  output: string,
  beatText: string,
  title: string,
  index: number,
  photo?: string
): Promise<void> {
  const width = 1080;
  const height = 1920;
  const palette = [
    ["#101418", "#F2C94C", "#E63946"],
    ["#132A13", "#F4F1DE", "#3D8D7A"],
    ["#0B132B", "#F7FFF7", "#5BC0BE"],
    ["#2D1E2F", "#F7B801", "#F18701"]
  ][index % 4];
  const backgroundSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette[0]}"/>
          <stop offset="100%" stop-color="#07090B"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="48" y="96" width="984" height="760" rx="32" fill="${palette[1]}" opacity="0.13"/>
      <rect x="48" y="940" width="984" height="780" rx="32" fill="#ffffff" opacity="0.08"/>
      ${Array.from({ length: 22 })
        .map((_, i) => `<rect x="${(i * 113) % width}" y="${140 + i * 73}" width="160" height="8" fill="${palette[2]}" opacity="0.35"/>`)
        .join("")}
      <text x="60" y="88" fill="${palette[1]}" font-size="34" font-family="Arial, sans-serif" font-weight="700">CONTENTFARM / KZ DAILY</text>
      <text x="60" y="1770" fill="#ffffff" font-size="44" font-family="Arial, sans-serif" font-weight="700">#казахстан #threads #tiktokkz</text>
      ${wrapSvgText(title, 60, 1010, 46, 30, "#ffffff", 900)}
      ${wrapSvgText(beatText, 60, 1180, 72, 38, "#ffffff", 930)}
    </svg>`;

  const background = sharp(Buffer.from(backgroundSvg)).png();
  if (!photo) {
    await background.toFile(output);
    return;
  }

  const photoLayer = await sharp(photo)
    .resize(984, 760, { fit: "cover" })
    .png()
    .toBuffer()
    .catch(() => undefined);

  if (!photoLayer) {
    await background.toFile(output);
    return;
  }

  await background
    .composite([{ input: photoLayer, top: 96, left: 48 }])
    .toFile(output);
}

function wrapSvgText(text: string, x: number, y: number, size: number, charsPerLine: number, fill: string, width: number): string {
  const words = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > charsPerLine) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines
    .slice(0, 8)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * (size * 1.14)}" fill="${fill}" font-size="${size}" font-family="Arial, sans-serif" font-weight="800" textLength="${Math.min(width, line.length * size * 0.58)}">${line}</text>`
    )
    .join("");
}

function runFfmpeg(binary: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with ${code}: ${stderr.slice(-2000)}`));
    });
  });
}
