#!/usr/bin/env npx tsx
/**
 * Detecta silencios con silencedetect para proponer jump cuts.
 * Uso: npx tsx scripts/detectar-silencios.ts <ruta-audio-o-video> [umbral-dB] [duracion-min-s]
 * Salida: lista en stdout y public/assets/<id>.silencios.json
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const inputPath = process.argv[2];
const noiseDb = process.argv[3] ?? "-30dB";
const minDuration = process.argv[4] ?? "0.4";

if (!inputPath) {
  console.error(
    "Uso: npx tsx scripts/detectar-silencios.ts <ruta-audio-o-video> [umbral-dB] [duracion-min-s]",
  );
  process.exit(1);
}

const absoluteInput = path.resolve(inputPath);

const result = spawnSync(
  "ffmpeg",
  [
    "-i",
    absoluteInput,
    "-af",
    `silencedetect=noise=${noiseDb}:d=${minDuration}`,
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf-8" },
);

const stderr = result.stderr ?? "";
const silences: { inicio: number; fin: number | null }[] = [];

const startRegex = /silence_start:\s*([\d.]+)/g;
const endRegex = /silence_end:\s*([\d.]+)/g;

const starts = [...stderr.matchAll(startRegex)].map((m) => Number(m[1]));
const ends = [...stderr.matchAll(endRegex)].map((m) => Number(m[1]));

starts.forEach((inicio, i) => {
  silences.push({ inicio, fin: ends[i] ?? null });
});

const outputPath = path.join(
  path.dirname(absoluteInput),
  `${path.basename(absoluteInput, path.extname(absoluteInput))}.silencios.json`,
);
fs.writeFileSync(outputPath, JSON.stringify(silences, null, 2));

console.log(JSON.stringify(silences, null, 2));
console.log(
  `\n${silences.length} silencios encontrados. Guardado en ${outputPath}`,
);
