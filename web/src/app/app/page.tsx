import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {cerrarSesion} from "../login/actions";
import type {ReelRow} from "@/lib/reels";
import {NuevoReelForm} from "@/components/NuevoReelForm";

const ETIQUETA_ESTADO: Record<string, string> = {
  subiendo: "Subiendo",
  transcribiendo: "Transcribiendo...",
  listo_para_revisar: "Listo para revisar texto",
  texto_confirmado: "Texto confirmado",
  renderizando: "Renderizando...",
  listo: "Listo",
  error: "Error",
};

export default async function AppDashboard() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  const {data: reels} = await supabase
    .from("reels")
    .select("*")
    .order("creado_en", {ascending: false});

  return (
    <div className="max-w-screen-md m-auto px-4 py-10 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Editor de video</h1>
          <p className="text-subtitle text-sm">{user?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/app/ajustes" className="text-sm text-subtitle hover:text-foreground">
            Ajustes
          </Link>
          <form action={cerrarSesion}>
            <button className="text-sm text-subtitle hover:text-foreground">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <NuevoReelForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-subtitle">Mis reels</h2>
        {(!reels || reels.length === 0) && (
          <p className="text-subtitle text-sm">Todavía no subiste ningún reel.</p>
        )}
        {(reels as ReelRow[] | null)?.map((reel) => (
          <Link
            key={reel.id}
            href={`/app/reels/${reel.id}`}
            className="border border-unfocused-border-color rounded-geist p-geist-half flex items-center justify-between hover:border-focused-border-color transition-colors"
          >
            <div>
              <p className="font-medium">{reel.tema || reel.nombre_original}</p>
              <p className="text-subtitle text-sm">
                {ETIQUETA_ESTADO[reel.estado] ?? reel.estado}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
