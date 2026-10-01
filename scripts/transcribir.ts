#!/usr/bin/env npx tsx
/**
 * Transcribe un WAV con Whisper.cpp en español, con tiempos por palabra.
 * Usa splitOnWord para que whisper.cpp una las sub-palabras el mismo
 * (evita "ENSEÑ AR"), un --prompt de vocabulario desde data/glosario.json,
 * y aplica las correcciones del glosario al texto final.
 *
 * Uso: npx tsx scripts/transcribir.ts <ruta-del-wav> <id-del-reel>
 * Salida: public/captions-<id>.json
 */
import path from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";

const inputPath = process.argv[2];
const reelId = process.argv[3];

if (!inputPath || !reelId) {
  console.error(
    "Uso: npx tsx scripts/transcribir.ts <ruta-del-wav> <id-del-reel>",
  );
  process.exit(1);
}

// Whisper.cpp exige ruta absoluta: si no, imprime su ayuda y no transcribe.
const absoluteInput = path.resolve(inputPath);
if (!existsSync(absoluteInput)) {
  console.error(`No se encontró el audio: ${absoluteInput}`);
  console.error("Corre primero scripts/extraer-audio.ts");
  process.exit(1);
}

const glosarioPath = path.resolve("data/glosario.json");
mkdirSync(path.dirname(glosarioPath), { recursive: true });

type Glosario = {
  vocabulario: string[];
  correcciones: Record<string, string>;
};

function leerGlosario(): Glosario {
  if (!existsSync(glosarioPath)) {
    const inicial: Glosario = { vocabulario: [], correcciones: {} };
    writeFileSync(glosarioPath, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  return JSON.parse(readFileSync(glosarioPath, "utf-8"));
}

/**
 * Si el modelo quedó a medio descargar (red cortada, dos procesos
 * descargando a la vez), @remotion/install-whisper-cpp avisa el tamaño
 * esperado vs. el real y no reintenta solo. Lo borramos y descargamos
 * de nuevo una vez antes de rendirnos.
 */
async function descargarModeloConReintento<
  Fn extends (args: { model: never; folder: string }) => Promise<unknown>,
>(
  downloadWhisperModel: Fn,
  model: Parameters<Fn>[0]["model"],
  whisperPath: string,
): Promise<void> {
  try {
    await downloadWhisperModel({ model, folder: whisperPath });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    if (!mensaje.includes("but the size is")) throw error;

    console.log("El modelo quedó incompleto, lo vuelvo a descargar...");
    const modelPath = path.join(whisperPath, `ggml-${model}.bin`);
    if (existsSync(modelPath)) unlinkSync(modelPath);
    await downloadWhisperModel({ model, folder: whisperPath });
  }
}

function aplicarCorrecciones(
  texto: string,
  correcciones: Record<string, string>,
): string {
  let resultado = texto;
  for (const [mal, bien] of Object.entries(correcciones)) {
    const regex = new RegExp(
      `\\b${mal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    resultado = resultado.replace(regex, bien);
  }
  return resultado;
}

async function main() {
  const glosario = leerGlosario();
  const { installWhisperCpp, downloadWhisperModel, transcribe } =
    await import("@remotion/install-whisper-cpp");
  const { toCaptions } = await import("@remotion/install-whisper-cpp");

  const whisperPath = path.resolve("whisper.cpp");
  const whisperCppVersion = "1.5.5";
  const model = "medium"; // multilingüe, nunca el .en

  console.log("Instalando Whisper.cpp (solo la primera vez)...");
  const { alreadyExisted } = await installWhisperCpp({
    to: whisperPath,
    version: whisperCppVersion,
  });
  console.log(
    alreadyExisted
      ? "Whisper.cpp ya estaba instalado"
      : "Whisper.cpp instalado",
  );

  console.log(
    `Descargando modelo ${model} (puede tardar, ~1.5GB la primera vez)...`,
  );
  await descargarModeloConReintento(downloadWhisperModel, model, whisperPath);
  console.log("Modelo listo");

  const prompt = glosario.vocabulario.join(", ");
  console.log(`Transcribiendo en español: ${absoluteInput}`);
  if (prompt) console.log(`Vocabulario: ${prompt}`);

  const whisperOutput = await transcribe({
    inputPath: absoluteInput,
    whisperPath,
    whisperCppVersion,
    model,
    language: "es",
    tokenLevelTimestamps: true,
    splitOnWord: true,
    additionalArgs: prompt ? [["--prompt", prompt]] : undefined,
  });

  const { captions } = toCaptions({ whisperCppOutput: whisperOutput });

  const captionsCorregidas = captions.map((c) => ({
    ...c,
    text: aplicarCorrecciones(c.text, glosario.correcciones),
  }));

  const outputPath = path.resolve(`public/captions-${reelId}.json`);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(captionsCorregidas, null, 2));

  console.log(`\nCaptions guardados en ${outputPath}`);
  console.log(`  ${captionsCorregidas.length} palabras/tokens`);
}

main().catch((err) => {
  console.error("Falló la transcripción:", err.message);
  process.exit(1);
});
