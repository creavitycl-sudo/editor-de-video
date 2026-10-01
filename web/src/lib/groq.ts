import Groq from "groq-sdk";
import type {Caption} from "@remotion/captions";

// Instanciado perezoso: si se crea al cargar el módulo, el build falla
// cuando GROQ_API_KEY todavía no está configurada (p.ej. antes de crear
// la cuenta de Groq).
let groqClient: Groq | null = null;
function obtenerGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({apiKey: process.env.GROQ_API_KEY});
  }
  return groqClient;
}

type PalabraGroq = {word: string; start: number; end: number};

/**
 * Transcribe un video/audio con Groq (Whisper en la nube, segundos en vez
 * de minutos). Acepta el archivo de video directo: Groq, como la API de
 * OpenAI, extrae el audio solo. Pide tiempos por palabra para sincronizar
 * cada efecto con la voz, igual que el pipeline local.
 */
export async function transcribirConGroq(
  archivo: File,
  vocabulario: string[],
): Promise<Caption[]> {
  const respuesta = await obtenerGroq().audio.transcriptions.create({
    file: archivo,
    model: "whisper-large-v3-turbo",
    language: "es",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
    prompt: vocabulario.join(", "),
  });

  const palabras = (respuesta as unknown as {words?: PalabraGroq[]}).words ?? [];

  return palabras.map(
    (p): Caption => ({
      text: ` ${p.word}`,
      startMs: Math.round(p.start * 1000),
      endMs: Math.round(p.end * 1000),
      timestampMs: Math.round(p.start * 1000),
      confidence: null,
    }),
  );
}

export function aplicarCorrecciones(
  captions: Caption[],
  correcciones: Record<string, string>,
): Caption[] {
  return captions.map((c) => {
    let texto = c.text;
    for (const [mal, bien] of Object.entries(correcciones)) {
      const regex = new RegExp(`\\b${mal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      texto = texto.replace(regex, bien);
    }
    return {...c, text: texto};
  });
}
