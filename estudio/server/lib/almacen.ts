import path from "node:path";
import fs from "node:fs";
import type { Ajustes, Glosario, Reel } from "../../shared/tipos";

const RAIZ = path.resolve(process.cwd());
export const DATA_DIR = path.join(RAIZ, "data");
export const REELS_DIR = path.join(DATA_DIR, "reels");
export const ASSETS_DIR = path.join(RAIZ, "public", "assets");
export const GLOSARIO_PATH = path.join(DATA_DIR, "glosario.json");
export const AJUSTES_PATH = path.join(DATA_DIR, "ajustes.json");

fs.mkdirSync(REELS_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });

export function rutaReel(id: string) {
  return path.join(REELS_DIR, id, "reel.json");
}

export function leerReel(id: string): Reel | null {
  const ruta = rutaReel(id);
  if (!fs.existsSync(ruta)) return null;
  return JSON.parse(fs.readFileSync(ruta, "utf-8"));
}

export function guardarReel(reel: Reel) {
  const dir = path.join(REELS_DIR, reel.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(rutaReel(reel.id), JSON.stringify(reel, null, 2));
}

export function listarReels(): Reel[] {
  if (!fs.existsSync(REELS_DIR)) return [];
  return fs
    .readdirSync(REELS_DIR)
    .map((id) => leerReel(id))
    .filter((r): r is Reel => r !== null)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export function leerGlosario(): Glosario {
  if (!fs.existsSync(GLOSARIO_PATH)) {
    const inicial: Glosario = { vocabulario: [], correcciones: {} };
    fs.writeFileSync(GLOSARIO_PATH, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  return JSON.parse(fs.readFileSync(GLOSARIO_PATH, "utf-8"));
}

export function guardarGlosario(glosario: Glosario) {
  fs.writeFileSync(GLOSARIO_PATH, JSON.stringify(glosario, null, 2));
}

export function leerAjustes(): Ajustes {
  if (!fs.existsSync(AJUSTES_PATH)) {
    const inicial: Ajustes = {
      modeloWhisper: "medium",
      idioma: "es",
      whisperCppVersion: "1.5.5",
    };
    fs.writeFileSync(AJUSTES_PATH, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  return JSON.parse(fs.readFileSync(AJUSTES_PATH, "utf-8"));
}

export function guardarAjustes(ajustes: Ajustes) {
  fs.writeFileSync(AJUSTES_PATH, JSON.stringify(ajustes, null, 2));
}

export function rutaCaptions(id: string) {
  return path.join(RAIZ, "public", `captions-${id}.json`);
}

export function leerCaptions(id: string) {
  const ruta = rutaCaptions(id);
  if (!fs.existsSync(ruta)) return [];
  return JSON.parse(fs.readFileSync(ruta, "utf-8"));
}

export function guardarCaptions(id: string, captions: unknown) {
  fs.writeFileSync(rutaCaptions(id), JSON.stringify(captions, null, 2));
}
