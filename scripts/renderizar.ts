#!/usr/bin/env npx tsx
/**
 * Renderiza el MP4 final de un reel. Vertical por defecto; agrega
 * "horizontal" para tambien renderizar 1920x1080 (YouTube).
 *
 * Uso: npx tsx scripts/renderizar.ts <composicion> <props-json> <id-del-reel> [horizontal]
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const [, , compositionId, propsJson, reelId, plataformaExtra] = process.argv;

if (!compositionId || !reelId) {
  console.error(
    "Uso: npx tsx scripts/renderizar.ts <composicion> <props-json> <id-del-reel> [horizontal]",
  );
  process.exit(1);
}

const inputProps = propsJson ? JSON.parse(propsJson) : {};

async function renderizarPlataforma(
  bundleLocation: string,
  id: string,
  sufijo: string,
) {
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id,
    inputProps,
  });

  const outDir = path.resolve("public/renders");
  fs.mkdirSync(outDir, { recursive: true });
  const outputLocation = path.join(outDir, `${reelId}${sufijo}.mp4`);

  console.log(
    `Renderizando ${outputLocation} (${composition.width}x${composition.height})...`,
  );
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  ${Math.round(progress * 100)}%`);
    },
  });
  console.log(`\nListo: ${outputLocation}`);
}

async function main() {
  console.log("Empaquetando el proyecto...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("src/index.ts"),
  });

  await renderizarPlataforma(bundleLocation, compositionId, "");

  if (plataformaExtra === "horizontal") {
    await renderizarPlataforma(
      bundleLocation,
      `${compositionId}Horizontal`,
      "-horizontal",
    );
  }
}

main().catch((err) => {
  console.error("Falló el render:", err);
  process.exit(1);
});
