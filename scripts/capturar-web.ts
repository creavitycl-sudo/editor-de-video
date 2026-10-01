#!/usr/bin/env npx tsx
/**
 * Abre webs o archivos Markdown con el Chrome ya instalado (no el Chromium
 * de Playwright, que a veces no coincide de version) y guarda capturas a
 * 2x listas para animar con <PantallaGrabada>. Tambien guarda la posicion
 * (0-1, relativa a la captura) de los elementos que le pidas por selector,
 * para usarlos como puntos de zoom/clic/resaltado.
 *
 * Uso: npx tsx scripts/capturar-web.ts <ruta-del-config.json>
 *
 * Formato del config:
 * {
 *   "salida": "public/assets/mi-reel",
 *   "capturas": [{
 *     "nombre": "landing",
 *     "url": "https://tu-web.com",
 *     "ancho": 1100, "alto": 1600, "dpr": 2,
 *     "paginaCompleta": true, "cargarScroll": true,
 *     "ocultar": [".cookie-banner"],
 *     "marcas": {"titulo": "h1", "precio": "#pricing"}
 *   }]
 * }
 */
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";
import { marked } from "marked";

type Captura = {
  nombre: string;
  url: string;
  ancho: number;
  alto: number;
  dpr?: number;
  paginaCompleta?: boolean;
  cargarScroll?: boolean;
  ocultar?: string[];
  marcas?: Record<string, string>;
};

type Config = {
  salida: string;
  capturas: Captura[];
};

const configPath = process.argv[2];
if (!configPath) {
  console.error("Uso: npx tsx scripts/capturar-web.ts <ruta-del-config.json>");
  process.exit(1);
}

const config: Config = JSON.parse(
  fs.readFileSync(path.resolve(configPath), "utf-8"),
);
const salidaDir = path.resolve(config.salida);
fs.mkdirSync(salidaDir, { recursive: true });

async function esperarScrollCompleto(page: import("playwright-core").Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let total = 0;
      const distancia = 400;
      const timer = setInterval(() => {
        const altura = document.body.scrollHeight;
        window.scrollBy(0, distancia);
        total += distancia;
        if (total >= altura) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 80);
    });
  });
}

async function main() {
  // Usa el Chrome instalado del sistema: el Chromium que descarga
  // Playwright a veces no coincide de version y falla al abrir.
  const browser = await chromium.launch({ channel: "chrome" });
  const resultados: Record<
    string,
    {
      archivo: string;
      ancho: number;
      alto: number;
      marcas: Record<
        string,
        { x: number; y: number; width: number; height: number }
      >;
    }
  > = {};

  for (const captura of config.capturas) {
    const context = await browser.newContext({
      viewport: { width: captura.ancho, height: captura.alto },
      deviceScaleFactor: captura.dpr ?? 2,
    });
    const page = await context.newPage();

    const esMarkdown = captura.url.endsWith(".md");
    if (esMarkdown) {
      const contenido = fs.readFileSync(path.resolve(captura.url), "utf-8");
      const html = `<html><body style="font-family:sans-serif;max-width:900px;margin:40px auto;">${marked(contenido)}</body></html>`;
      await page.setContent(html, { waitUntil: "networkidle" });
    } else {
      await page.goto(captura.url, { waitUntil: "networkidle" });
    }

    for (const selector of captura.ocultar ?? []) {
      await page.evaluate((sel) => {
        document
          .querySelectorAll(sel)
          .forEach((el) => ((el as HTMLElement).style.display = "none"));
      }, selector);
    }

    if (captura.cargarScroll) {
      await esperarScrollCompleto(page);
    }

    const archivoSalida = path.join(salidaDir, `${captura.nombre}.png`);
    await page.screenshot({
      path: archivoSalida,
      fullPage: captura.paginaCompleta ?? false,
    });

    const marcas: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {};
    for (const [nombreMarca, selector] of Object.entries(
      captura.marcas ?? {},
    )) {
      const box = await page.locator(selector).first().boundingBox();
      if (!box) continue;
      const paginaAltura = captura.paginaCompleta
        ? await page.evaluate(() => document.body.scrollHeight)
        : captura.alto;
      marcas[nombreMarca] = {
        x: box.x / captura.ancho,
        y: box.y / paginaAltura,
        width: box.width / captura.ancho,
        height: box.height / paginaAltura,
      };
    }

    resultados[captura.nombre] = {
      archivo: archivoSalida,
      ancho: captura.ancho,
      alto: captura.alto,
      marcas,
    };

    console.log(`Capturado: ${captura.nombre} -> ${archivoSalida}`);
    await context.close();
  }

  await browser.close();

  const metaPath = path.join(salidaDir, "capturas.json");
  fs.writeFileSync(metaPath, JSON.stringify(resultados, null, 2));
  console.log(`\nMetadatos guardados en ${metaPath}`);
}

main().catch((err) => {
  console.error("Falló la captura:", err);
  process.exit(1);
});
