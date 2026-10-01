import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {aplicarCorrecciones, transcribirConGroq} from "@/lib/groq";
import type {ReelRow} from "@/lib/reels";

export const maxDuration = 60;

export async function GET() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const {data, error} = await supabase
    .from("reels")
    .select("*")
    .order("creado_en", {ascending: false});

  if (error) return NextResponse.json({error: error.message}, {status: 500});
  return NextResponse.json(data as ReelRow[]);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const body = await request.json();
  const {videoUrl, nombreOriginal, tema, ctaPalabra, queMostrarCuandoNombra, estiloId} = body as {
    videoUrl: string;
    nombreOriginal: string;
    tema: string;
    ctaPalabra: string;
    queMostrarCuandoNombra: string;
    estiloId: string;
  };

  if (!videoUrl) {
    return NextResponse.json({error: "Falta la URL del video"}, {status: 400});
  }

  const {data: reel, error: insertError} = await supabase
    .from("reels")
    .insert({
      user_id: user.id,
      estado: "transcribiendo",
      nombre_original: nombreOriginal,
      video_url: videoUrl,
      estilo_id: estiloId || "clasico",
      tema: tema ?? "",
      cta_palabra: ctaPalabra ?? "",
      que_mostrar_cuando_nombra: queMostrarCuandoNombra ?? "",
    })
    .select("*")
    .single();

  if (insertError || !reel) {
    return NextResponse.json({error: insertError?.message ?? "No se pudo crear el reel"}, {status: 500});
  }

  try {
    const {data: glosarioRow} = await supabase
      .from("glosarios")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const vocabulario = glosarioRow?.vocabulario ?? [];
    const correcciones = glosarioRow?.correcciones ?? {};

    const respuestaVideo = await fetch(videoUrl);
    const blobVideo = await respuestaVideo.blob();
    const archivo = new File([blobVideo], nombreOriginal || "video.mp4", {
      type: blobVideo.type || "video/mp4",
    });

    const captionsCrudas = await transcribirConGroq(archivo, vocabulario);
    const captions = aplicarCorrecciones(captionsCrudas, correcciones);

    const {data: reelActualizado, error: updateError} = await supabase
      .from("reels")
      .update({estado: "listo_para_revisar", captions})
      .eq("id", reel.id)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json(reelActualizado as ReelRow, {status: 201});
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Falló la transcripción";
    await supabase.from("reels").update({estado: "error", error: mensaje}).eq("id", reel.id);
    return NextResponse.json({error: mensaje, reel}, {status: 500});
  }
}
