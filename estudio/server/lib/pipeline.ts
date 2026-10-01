import { spawn } from "node:child_process";
import path from "node:path";
import type { Reel } from "../../shared/tipos";
import { guardarReel } from "./almacen";

const RAIZ = path.resolve(process.cwd());

function correrScript(script: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proceso = spawn("npx", ["tsx", script, ...args], {
      cwd: RAIZ,
      stdio: "pipe",
    });
    let stderr = "";
    proceso.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proceso.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
    });
    proceso.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `${script} salió con código ${code}`));
    });
  });
}

/**
 * Corre el pipeline completo de una grabación: audio a -14 LUFS,
 * transcripción en español con el glosario, y deja el reel listo para
 * revisar texto. Actualiza el estado del reel en cada paso para que la
 * app pueda mostrar progreso con polling simple.
 */
export async function correrPipeline(reel: Reel, videoPath: string) {
  try {
    reel.estado = "transcribiendo";
    guardarReel(reel);

    await correrScript("scripts/extraer-audio.ts", [videoPath, reel.id]);

    const wavPath = path.join(RAIZ, "public", "assets", `${reel.id}.wav`);
    await correrScript("scripts/transcribir.ts", [wavPath, reel.id]);

    reel.estado = "listo_para_revisar";
    guardarReel(reel);
  } catch (error) {
    reel.estado = "subiendo";
    reel.error = error instanceof Error ? error.message : String(error);
    guardarReel(reel);
  }
}
