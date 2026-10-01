# Editor de video automático

Editor de reels sin timeline: le describes el video a Claude Code en español,
él escribe la composición en [Remotion](https://remotion.dev) y la renderiza
a MP4. Tu marca y tu estilo de edición viven en `src/brand/` y en
`CLAUDE.md`, y se aplican solos en cada video.

Ver [CLAUDE.md](./CLAUDE.md) para la metodología de edición, las reglas
técnicas y los flujos de trabajo completos.

## Primeros pasos

```bash
npm install
npm run dev        # Remotion Studio, para ver y ajustar composiciones
npm run estudio     # App local (http://127.0.0.1:5173) para subir y editar reels
```

## Estructura

```
src/brand/        Marca única: colores, tipografías, zonas seguras
src/components/   Sticker, SubtitulosReel, LogoBadge, PantallaGrabada, transiciones
src/compositions/ Tus videos registrados en Remotion
src/templates/    Plantillas reutilizables
scripts/          Pipeline: analizar, extraer audio, transcribir, detectar
                   silencios, capturar webs, render final y hoja de contactos
estudio/          App local (Express + Vite + React) para subir, corregir
                   texto y pedir ediciones sin tocar la terminal
data/              glosario.json, ajustes.json y reel.json por reel
.claude/skills/    Skills oficiales de Remotion, como carpetas reales
```

## Pipeline de una grabación

```bash
npx tsx scripts/analizar-video.ts public/assets/mi-video.mp4
npx tsx scripts/extraer-audio.ts public/assets/mi-video.mp4 mi-reel
npx tsx scripts/transcribir.ts public/assets/mi-reel.wav mi-reel
npx tsx scripts/detectar-silencios.ts public/assets/mi-reel.wav
```

Luego le pides a Claude Code que edite el reel (ver Paso 6 de la guía), revisa
con la hoja de contactos y renderiza:

```bash
npx tsx scripts/hoja-de-contactos.ts Reel '{"reelId":"mi-reel","tema":"...","ctaPalabra":"...","fps":30,"captions":[]}' 0,60,120
npx tsx scripts/renderizar.ts Reel '{"reelId":"mi-reel","tema":"...","ctaPalabra":"...","fps":30,"captions":[]}' mi-reel [horizontal]
```

## Primera vez

- La primera transcripción instala Whisper.cpp y descarga el modelo
  `medium` (~1.5GB) en `whisper.cpp/`.
- `scripts/capturar-web.ts` necesita Chrome instalado en el sistema (usa
  `channel: "chrome"`, no el Chromium de Playwright).
- Personaliza `src/brand/brand.ts` con tus colores, tipografías, handle y
  logo antes de tu primer reel real.
