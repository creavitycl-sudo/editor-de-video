# Editor de video — SaaS

App web para subir una grabación, elegir un estilo de edición y recibir el
reel ya editado. Next.js + Remotion, render en Vercel Sandbox (sin AWS),
transcripción con Groq (Whisper en la nube), login y datos en Supabase.

## 1. Crear las cuentas que faltan

### Supabase (login + base de datos)

1. Ve a [supabase.com](https://supabase.com) → crea un proyecto (plan gratis).
2. Project Settings → API: copia **Project URL** y **anon public key**.
3. SQL Editor → pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) → Run.
4. (Opcional) Authentication → Providers: si quieres que la confirmación por
   email sea obligatoria, actívala ahí; por defecto Supabase deja crear
   cuenta sin confirmar en proyectos nuevos.

### Groq (transcripción rápida)

1. Ve a [console.groq.com](https://console.groq.com) → API Keys → crea una.
2. Groq tiene capa gratuita generosa; si subes mucho volumen revisa precios
   en [groq.com/pricing](https://groq.com/pricing).

### Vercel Blob (guardar videos)

1. En tu proyecto de Vercel: Storage → Create Database → Blob.
2. Conéctalo a este proyecto. Si corres `vercel env pull`, el token llega
   solo; si no, cópialo a mano desde Storage → tu Blob store → `.env.local`.

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y llena los 4 valores:

```bash
cp .env.example .env.local
```

```
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GROQ_API_KEY=
```

## 3. Correr en desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. La primera vez que renderices un video en
desarrollo, `@remotion/vercel` crea un sandbox temporal para probarlo; en
producción (`VERCEL=1`) usa el snapshot ya armado por `npm run build`.

## 4. Desplegar a Vercel

```bash
vercel link
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GROQ_API_KEY
vercel --prod
```

El `buildCommand` (`vercel.json`) ya corre `create-snapshot` para que el
render en producción no tenga que re-empaquetar el proyecto en cada
request.

## Cómo está armado

```
src/app/
  login/              Login y registro (Supabase Auth)
  app/                Dashboard: subir reel, ver mis reels
  app/reels/[id]/      Revisar texto, elegir estilo, renderizar
  api/upload/          Autoriza la subida directa del navegador a Vercel Blob
  api/reels/           Crear reel (dispara transcripción con Groq) y listar
  api/reels/[id]/       Leer/editar un reel (texto, momentos, estilo, confirmar)
  api/render/           Dispara el render en Vercel Sandbox (SSE de progreso)
src/remotion/
  brand/               Marca única: colores, tipografías, zonas seguras
  components/          Sticker, SubtitulosReel, LogoBadge, PantallaGrabada...
  styles/               Catálogo de estilos seleccionables (Clasico.tsx + 3 más)
  compositions/Reel.tsx Arma el video final según el estilo elegido
supabase/schema.sql     Tablas reels y glosarios, con RLS por usuario
```

### Agregar un estilo nuevo

1. Analiza el reel de referencia (hoja de contactos, como el Paso 3 de la
   guía original).
2. Crea `src/remotion/styles/TuEstilo.tsx` siguiendo `Clasico.tsx` como
   modelo.
3. Agrégalo al arreglo `estilos` en `src/remotion/styles/index.ts`.

Aparece solo en el selector de la app (subida de reel y pantalla de
revisión) y en el `Player` de vista previa — no hace falta tocar nada más.

## Estado de los 4 estilos

No tenía tus videos de referencia, así que diseñé 4 conceptos distintos y
bien diferenciados en vez de esperar:

- **Clásico** — sticker de gancho/CTA, subtítulos con contorno negro.
- **Minimalista** — sin stickers, subtítulos chicos en píldora, CTA discreto solo al final.
- **Bold** — palabra por palabra en grande con fondo de color, CTA en pastilla que pulsa. Ritmo rápido, estilo "viral".
- **Editorial** — barras de cine, franja tipo noticiero para el texto, CTA en insignia. Más "documental".

Si me mandas tus 4 reels de referencia, los reemplazo por los tuyos (o
ajusto estos para que se parezcan más) — es solo cuestión de editar los
archivos en `src/remotion/styles/`.

## Pendiente / siguientes pasos

- Normalización de audio a -14 LUFS antes de transcribir (ahora se manda
  el video tal cual a Groq; funciona, pero el audio final no queda
  normalizado como en el pipeline local).
- Planes/límites de uso si vas a cobrar.
