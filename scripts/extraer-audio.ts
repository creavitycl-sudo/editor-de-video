#!/usr/bin/env npx tsx
/**
 * Extrae el audio de un video, lo normaliza a -14 LUFS (loudnorm en dos
 * pasadas) y deja un WAV 16kHz mono listo para Whisper. La imagen nunca
 * se toca: el video normalizado usa -c:v copy.
 *
 * Uso: npx tsx scripts/extraer-audio.ts <ruta-del-video> [id-del-reel]
 * Salida:
 *   public/assets/<id>.mp4   (video con audio a -14 LUFS, imagen intacta)
 *   public/assets/<id>.wav   (WAV 16kHz mono para Whisper)
 */
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const inputPath = process.argv[2];
const reelId =
  process.argv[3] ??
  path.basename(inputPath ?? "", path.extname(inputPath ?? ""));

if (!inputPath) {
  console.error(
    "Uso: npx tsx scripts/extraer-audio.ts <ruta-del-video> [id-del-reel]",
  );
  process.exit(1);
}

const absoluteInput = path.resolve(inputPath);
const assetsDir = path.resolve("public/assets");
fs.mkdirSync(assetsDir, { recursive: true });

const normalizedVideoPath = path.join(assetsDir, `${reelId}.mp4`);
const wavPath = path.join(assetsDir, `${reelId}.wav`);
// Si el origen ya es el destino (el reel sube directo a su carpeta final),
// ffmpeg no puede editar en el sitio: normalizamos a un archivo temporal
// y lo reemplazamos al terminar.
const mismoArchivo = normalizedVideoPath === absoluteInput;
const normalizedVideoWritePath = mismoArchivo
  ? path.join(assetsDir, `${reelId}.tmp.mp4`)
  : normalizedVideoPath;

function run(args: string[]) {
  return execFileSync("ffmpeg", args, { encoding: "utf-8" });
}

console.log("Pasada 1/2: midiendo el loudness original...");
const measure = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-i",
    absoluteInput,
    "-af",
    "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf-8" },
);
const measurePass = measure.stderr ?? "";

const jsonMatch = measurePass.match(/\{[\s\S]*\}/);
const measured = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

console.log("Pasada 2/2: normalizando a -14 LUFS (imagen intacta)...");
const loudnormFilter = measured
  ? `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`
  : "loudnorm=I=-14:TP=-1.5:LRA=11";

run([
  "-y",
  "-i",
  absoluteInput,
  "-c:v",
  "copy",
  "-af",
  loudnormFilter,
  "-c:a",
  "aac",
  "-b:a",
  "256k",
  normalizedVideoWritePath,
]);

if (mismoArchivo) {
  fs.renameSync(normalizedVideoWritePath, normalizedVideoPath);
}

console.log("Generando WAV 16kHz mono para Whisper...");
run(["-y", "-i", normalizedVideoPath, "-ar", "16000", "-ac", "1", wavPath]);

console.log(`\nListo:`);
console.log(`  Video normalizado: ${normalizedVideoPath}`);
console.log(`  WAV para Whisper:  ${wavPath}`);
