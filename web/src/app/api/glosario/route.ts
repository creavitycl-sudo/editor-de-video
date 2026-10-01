import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const {data} = await supabase
    .from("glosarios")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(data ?? {vocabulario: [], correcciones: {}});
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "No autenticado"}, {status: 401});

  const body = await request.json();
  const {vocabulario, correcciones} = body as {
    vocabulario: string[];
    correcciones: Record<string, string>;
  };

  const {data, error} = await supabase
    .from("glosarios")
    .upsert({user_id: user.id, vocabulario, correcciones})
    .select("*")
    .single();

  if (error) return NextResponse.json({error: error.message}, {status: 500});
  return NextResponse.json(data);
}
