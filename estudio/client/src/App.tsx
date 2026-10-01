import { useEffect, useState } from "react";
import { NuevoReel } from "./pages/NuevoReel";
import { Texto } from "./pages/Texto";
import { Ajustes } from "./pages/Ajustes";

type Ruta = { pantalla: "nuevo" | "texto" | "ajustes"; reelId: string | null };

function leerRuta(): Ruta {
  const hash = window.location.hash.replace(/^#/, "");
  const [pantalla, reelId] = hash.split("/");
  if (pantalla === "texto")
    return { pantalla: "texto", reelId: reelId ?? null };
  if (pantalla === "ajustes") return { pantalla: "ajustes", reelId: null };
  return { pantalla: "nuevo", reelId: null };
}

export const App: React.FC = () => {
  const [ruta, setRuta] = useState<Ruta>(leerRuta());

  useEffect(() => {
    const onHashChange = () => setRuta(leerRuta());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const ir = (hash: string) => {
    window.location.hash = hash;
  };

  return (
    <div>
      <nav
        style={{
          display: "flex",
          gap: 8,
          padding: "16px 24px",
          borderBottom: "1px solid var(--borde)",
        }}
      >
        <strong style={{ marginRight: 16 }}>Estudio</strong>
        <button className="boton-secundario" onClick={() => ir("")}>
          Nuevo reel
        </button>
        <button className="boton-secundario" onClick={() => ir("texto")}>
          Mis reels
        </button>
        <button className="boton-secundario" onClick={() => ir("ajustes")}>
          Ajustes
        </button>
      </nav>

      {ruta.pantalla === "nuevo" && (
        <NuevoReel onReelCreado={(id) => ir(`texto/${id}`)} />
      )}
      {ruta.pantalla === "texto" && (
        <Texto reelId={ruta.reelId} onVolver={() => ir("texto")} />
      )}
      {ruta.pantalla === "ajustes" && <Ajustes />}
    </div>
  );
};
