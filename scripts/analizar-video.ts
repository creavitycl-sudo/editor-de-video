#!/usr/bin/env npx tsx
/**
 * Analiza un video: duración, fps, resolución y si tiene audio.
 * Uso: npx tsx scripts/analizar-video.ts <ruta-del-video>
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Uso: npx tsx scripts/analizar-video.ts <ruta-del-video>");
  process.exit(1);
}

const absolutePath = path.resolve(inputPath);

const raw = execFileSync("ffprobe", [
  "-v",
  "error",
  "-print_format",
  "json",
  "-show_format",
  "-show_streams",
  absolutePath,
]).toString();

const data = JSON.parse(raw);

const videoStream = data.streams.find(
  (s: { codec_type: string }) => s.codec_type === "video",
);
const audioStream = data.streams.find(
  (s: { codec_type: string }) => s.codec_type === "audio",
);

if (!videoStream) {
  console.error("No se encontró un stream de video en el archivo.");
  process.exit(1);
}

const [num, den] = String(videoStream.r_frame_rate).split("/").map(Number);
const fps = den ? num / den : num;

const info = {
  ruta: absolutePath,
  duracionSegundos: Number(data.format.duration),
  ancho: videoStream.width,
  alto: videoStream.height,
  fps: Math.round(fps * 100) / 100,
  tieneAudio: Boolean(audioStream),
  codecVideo: videoStream.codec_name,
  codecAudio: audioStream?.codec_name ?? null,
};

console.log(JSON.stringify(info, null, 2));
