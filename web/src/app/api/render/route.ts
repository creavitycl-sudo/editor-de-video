import {
  addBundleToSandbox,
  createSandbox,
  renderMediaOnVercel,
  uploadToVercelBlob,
} from "@remotion/vercel";
import {waitUntil} from "@vercel/functions";
import {COMP_NAME} from "../../../../types/constants";
import {RenderRequest} from "../../../../types/schema";
import {bundleRemotionProject, formatSSE, type RenderProgress} from "./helpers";
import {restoreSnapshot} from "./restore-snapshot";
import {createClient} from "@/lib/supabase/server";
import type {ReelRow} from "@/lib/reels";

export const maxDuration = 300;

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. Create a Blob store in your Vercel project and add it to .env.',
    );
  }

  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({error: "No autenticado"}), {status: 401});
  }

  const payload = await req.json();
  const {reelId} = RenderRequest.parse(payload);

  const {data: reel, error: reelError} = await supabase
    .from("reels")
    .select("*")
    .eq("id", reelId)
    .single();

  if (reelError || !reel) {
    return new Response(JSON.stringify({error: "No existe ese reel"}), {status: 404});
  }
  const reelRow = reel as ReelRow;

  const inputProps = {
    videoUrl: reelRow.video_url ?? "",
    tema: reelRow.tema,
    ctaPalabra: reelRow.cta_palabra,
    estiloId: reelRow.estilo_id,
    fps: 30,
    captions: reelRow.captions,
  };

  await supabase.from("reels").update({estado: "renderizando"}).eq("id", reelId);

  const send = async (message: RenderProgress) => {
    await writer.write(encoder.encode(formatSSE(message)));
  };

  const runRender = async () => {
    await send({type: "phase", phase: "Creando sandbox...", progress: 0});
    const sandbox = process.env.VERCEL
      ? await restoreSnapshot()
      : await createSandbox({
          onProgress: async ({progress, message}) => {
            await send({
              type: "phase",
              phase: message,
              progress,
              subtitle: "Esto solo pasa en desarrollo.",
            });
          },
        });

    try {
      if (!process.env.VERCEL) {
        bundleRemotionProject(".remotion");
        await addBundleToSandbox({sandbox, bundleDir: ".remotion"});
      }

      const {sandboxFilePath, contentType} = await renderMediaOnVercel({
        sandbox,
        compositionId: COMP_NAME,
        inputProps,
        onProgress: async (update) => {
          switch (update.stage) {
            case "opening-browser":
              await send({type: "phase", phase: "Abriendo navegador...", progress: update.overallProgress});
              break;
            case "selecting-composition":
              await send({type: "phase", phase: "Seleccionando composición...", progress: update.overallProgress});
              break;
            case "render-progress":
              await send({type: "phase", phase: "Renderizando video...", progress: update.overallProgress});
              break;
            default:
              break;
          }
        },
      });

      await send({type: "phase", phase: "Subiendo video...", progress: 1});

      const {url, size} = await uploadToVercelBlob({
        sandbox,
        sandboxFilePath,
        contentType,
        blobToken,
        access: "public",
      });

      await supabase.from("reels").update({estado: "listo", render_url: url}).eq("id", reelId);

      await send({type: "done", url, size});
    } catch (err) {
      const mensaje = (err as Error).message;
      await supabase.from("reels").update({estado: "error", error: mensaje}).eq("id", reelId);
      await send({type: "error", message: mensaje});
    } finally {
      await sandbox?.stop().catch(() => {});
      await writer.close();
    }
  };

  waitUntil(runRender());

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
