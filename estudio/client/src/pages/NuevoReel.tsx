import { useState } from "react";
import { api } from "../api";

type Props = {
  onReelCreado: (id: string) => void;
};

export const NuevoReel: React.FC<Props> = ({ onReelCreado }) => {
  const [video, setVideo] = useState<File | null>(null);
  const [tema, setTema] = useState("");
  const [ctaPalabra, setCtaPalabra] = useState("");
  const [queMostrar, setQueMostrar] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!video) {
      setError("Sube un video primero.");
      return;
    }
    setSubiendo(true);
    setError(null);
    try {
      const { reel } = await api.crearReel({
        video,
        tema,
        ctaPalabra,
        queMostrarCuandoNombra: queMostrar,
      });
      onReelCreado(reel.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Algo falló subiendo el video.",
      );
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="tarjeta" style={{ maxWidth: 560, margin: "40px auto" }}>
      <h2 style={{ marginTop: 0 }}>Nuevo reel</h2>

      <label className="etiqueta">Grabación</label>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
        style={{ marginBottom: 16, width: "100%" }}
      />

      <label className="etiqueta">Tema (de qué hablas)</label>
      <input
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        style={{ width: "100%", marginBottom: 16 }}
        placeholder="Ej: cómo armé mi editor de video con Claude Code"
      />

      <label className="etiqueta">Palabra del CTA ("Comenta ___")</label>
      <input
        value={ctaPalabra}
        onChange={(e) => setCtaPalabra(e.target.value)}
        style={{ width: "100%", marginBottom: 16 }}
        placeholder="Ej: EDITOR"
      />

      <label className="etiqueta">
        Qué mostrar cuando nombro algo (web, herramienta, documento)
      </label>
      <textarea
        value={queMostrar}
        onChange={(e) => setQueMostrar(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: 20, resize: "vertical" }}
        placeholder="Ej: cuando digo 'Remotion', muestra remotion.dev"
      />

      {error && <p style={{ color: "#ff8a8a" }}>{error}</p>}

      <button className="boton-primario" onClick={enviar} disabled={subiendo}>
        {subiendo ? "Subiendo y transcribiendo..." : "Subir y transcribir"}
      </button>
    </div>
  );
};
