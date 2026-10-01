"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";
import {upload} from "@vercel/blob/client";
import {estilos} from "@/remotion/styles";
import {Button} from "./Button";
import {ErrorComp} from "./Error";
import {ProgressBar} from "./ProgressBar";

export const NuevoReelForm: React.FC = () => {
  const router = useRouter();
  const [video, setVideo] = useState<File | null>(null);
  const [tema, setTema] = useState("");
  const [ctaPalabra, setCtaPalabra] = useState("");
  const [queMostrar, setQueMostrar] = useState("");
  const [estiloId, setEstiloId] = useState(estilos[0].id);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [fase, setFase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!video) {
      setError("Sube un video primero.");
      return;
    }
    setError(null);
    try {
      setFase("Subiendo video...");
      setProgreso(0);
      const blob = await upload(video.name, video, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({percentage}) => setProgreso(percentage / 100),
      });

      setFase("Transcribiendo con Whisper...");
      setProgreso(null);

      const res = await fetch("/api/reels", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          videoUrl: blob.url,
          nombreOriginal: video.name,
          tema,
          ctaPalabra,
          queMostrarCuandoNombra: queMostrar,
          estiloId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el reel");

      router.push(`/app/reels/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo falló.");
      setFase("");
      setProgreso(null);
    }
  };

  const cargando = fase !== "";

  return (
    <div className="border border-unfocused-border-color rounded-geist p-geist flex flex-col gap-4">
      <h2 className="font-medium">Nuevo reel</h2>

      <label className="flex flex-col gap-1 text-sm">
        Grabación
        <input
          type="file"
          accept="video/*"
          disabled={cargando}
          onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tema (de qué hablas)
        <input
          value={tema}
          disabled={cargando}
          onChange={(e) => setTema(e.target.value)}
          className="rounded-geist bg-background border border-unfocused-border-color p-geist-half text-sm outline-none focus:border-focused-border-color"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Palabra del CTA (&quot;Comenta ___&quot;)
        <input
          value={ctaPalabra}
          disabled={cargando}
          onChange={(e) => setCtaPalabra(e.target.value)}
          className="rounded-geist bg-background border border-unfocused-border-color p-geist-half text-sm outline-none focus:border-focused-border-color"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Qué mostrar cuando nombro algo
        <textarea
          value={queMostrar}
          disabled={cargando}
          onChange={(e) => setQueMostrar(e.target.value)}
          rows={2}
          className="rounded-geist bg-background border border-unfocused-border-color p-geist-half text-sm outline-none focus:border-focused-border-color resize-y"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm">Estilo</span>
        <div className="grid grid-cols-2 gap-2">
          {estilos.map((estilo) => (
            <button
              key={estilo.id}
              type="button"
              disabled={cargando}
              onClick={() => setEstiloId(estilo.id)}
              className={`text-left rounded-geist border p-geist-half text-sm transition-colors ${
                estiloId === estilo.id
                  ? "border-accent"
                  : "border-unfocused-border-color hover:border-focused-border-color"
              }`}
            >
              <p className="font-medium">{estilo.nombre}</p>
              <p className="text-subtitle text-xs">{estilo.descripcion}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorComp message={error} />}

      {cargando && (
        <div>
          <p className="text-sm text-subtitle">{fase}</p>
          {progreso !== null && <ProgressBar progress={progreso} />}
        </div>
      )}

      <Button onClick={enviar} disabled={cargando} loading={cargando}>
        Subir y transcribir
      </Button>
    </div>
  );
};
