import {handleUpload, type HandleUploadBody} from "@vercel/blob/client";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

/**
 * Autoriza la subida directa del navegador a Vercel Blob (los videos
 * superan el límite de tamaño de una Server Action/Route en Vercel).
 * El navegador sube el archivo directo al Blob store; esta ruta solo
 * entrega el token firmado.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({error: "No autenticado"}, {status: 401});
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
          addRandomSuffix: true,
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1GB
          tokenPayload: JSON.stringify({userId: user.id}),
        };
      },
      onUploadCompleted: async () => {
        // Nada que hacer aquí: el cliente crea la fila del reel con la
        // URL resultante después de que termine la subida.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "Error al subir"},
      {status: 400},
    );
  }
}
