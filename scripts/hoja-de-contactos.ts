#!/usr/bin/env npx tsx
/**
 * Renderiza varios fotogramas clave en una sola pasada (un solo
 * empaquetado) y los junta en una hoja de contactos. "remotion still"
 * empaqueta el proyecto en cada llamada: llamarlo varias veces para
 * revisar momentos distintos es lentísimo. Este script empaqueta una vez
 * y renderiza todos los fotogramas pedidos sobre ese mismo bundle.
 *
 * Uso: npx tsx scripts/hoja-de-contactos.ts <composicion> <id-props-json> <frame1,frame2,...>
 * Ejemplo: npx tsx scripts/hoja-de-contactos.ts Reel '{"reelId":"demo","tema":"Demo","ctaPalabra":"DEMO","fps":30}' 0,30,60,90
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import sharp from "sharp";

const [, , compositionId, propsJson, framesArg] = process.argv;

if (!compositionId || !framesArg) {
  console.error(
    "Uso: npx tsx scripts/hoja-de-contactos.ts <composicion> <props-json> <frame1,frame2,...>",
  );
  process.exit(1);
}

const inputProps = propsJson ? JSON.parse(propsJson) : {};
const frames = framesArg.split(",").map(Number);

async function main() {
  console.log("Empaquetando el proyecto (una sola vez)...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("src/index.ts"),
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  const outDir = path.resolve("public/contactos");
  fs.mkdirSync(outDir, { recursive: true });

  const rutas: string[] = [];
  for (const frame of frames) {
    const outputPath = path.join(outDir, `frame-${frame}.png`);
    console.log(`Renderizando fotograma ${frame}...`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outputPath,
      frame,
      inputProps,
    });
    rutas.push(outputPath);
  }

  console.log("Armando la hoja de contactos...");
  const columnas = Math.min(rutas.length, 4);
  const filas = Math.ceil(rutas.length / columnas);
  const miniAncho = 270;
  const miniAlto = Math.round(
    (composition.height / composition.width) * miniAncho,
  );

  const composiciones = await Promise.all(
    rutas.map(async (ruta, i) => ({
      input: await sharp(ruta).resize(miniAncho, miniAlto).toBuffer(),
      left: (i % columnas) * miniAncho,
      top: Math.floor(i / columnas) * miniAlto,
    })),
  );

  const hojaPath = path.resolve("public/contactos/hoja-de-contactos.png");
  await sharp({
    create: {
      width: miniAncho * columnas,
      height: miniAlto * filas,
      channels: 3,
      background: "#050708",
    },
  })
    .composite(composiciones)
    .png()
    .toFile(hojaPath);

  console.log(`\nHoja de contactos: ${hojaPath}`);
}

main().catch((err) => {
  console.error("Falló la hoja de contactos:", err);
  process.exit(1);
});
