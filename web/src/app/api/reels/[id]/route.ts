import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import type {ReelRow} from "@/lib/reels";

type Params = {params: Promise<{id: string}>};

export async function GET(_request: Request, {params}: Params) {
  const {id} = await params;
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const {data, error} = await supabase.from("reels").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({error: "No existe ese reel"}, {status: 404});

  return NextResponse.json(data as ReelRow);
}

export async function PATCH(request: Request, {params}: Params) {
  const {id} = await params;
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const body = await request.json();
  const {captions, momentos, correcciones, estiloId, confirmar} = body as {
    captions?: unknown[];
    momentos?: unknown[];
    correcciones?: Record<string, string>;
    estiloId?: string;
    confirmar?: boolean;
  };

  const cambios: Record<string, unknown> = {};
  if (captions) cambios.captions = captions;
  if (momentos) cambios.momentos = momentos;
  if (estiloId) cambios.estilo_id = estiloId;
  if (confirmar) cambios.estado = "texto_confirmado";

  const {data, error} = await supabase
    .from("reels")
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({error: error?.message ?? "No se pudo actualizar"}, {status: 500});
  }

  if (correcciones && Object.keys(correcciones).length > 0) {
    const {data: glosarioRow} = await supabase
      .from("glosarios")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase.from("glosarios").upsert({
      user_id: user.id,
      vocabulario: glosarioRow?.vocabulario ?? [],
      correcciones: {...(glosarioRow?.correcciones ?? {}), ...correcciones},
    });
  }

  return NextResponse.json(data as ReelRow);
}

export async function DELETE(_request: Request, {params}: Params) {
  const {id} = await params;
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const {error} = await supabase.from("reels").delete().eq("id", id);
  if (error) return NextResponse.json({error: error.message}, {status: 500});
  return NextResponse.json({ok: true});
}
