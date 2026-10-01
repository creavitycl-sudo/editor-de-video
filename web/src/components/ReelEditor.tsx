"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {Player} from "@remotion/player";
import type {Caption} from "@remotion/captions";
import type {ReelRow, Momento} from "@/lib/reels";
import {estilos, obtenerEstilo} from "@/remotion/styles";
import {VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH} from "../../types/constants";
import {useRendering} from "@/helpers/use-rendering";
import {Button} from "./Button";
import {ErrorComp} from "./Error";
import {ProgressBar} from "./ProgressBar";
import {DownloadButton} from "./DownloadButton";

const TIPOS_MOMENTO: Momento["tipo"][] = ["sticker", "logo", "zoom", "recurso"];

export const ReelEditor: React.FC<{reelId: string}> = ({reelId}) => {
  const [reel, setReel] = useState<ReelRow | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [estiloId, setEstiloId] = useState("clasico");
  const [correcciones, setCorrecciones] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const estadoRef = useRef<string | null>(null);
  const {renderMedia, state: renderState} = useRendering(reelId);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      const res = await fetch(`/api/reels/${reelId}`);
      if (!res.ok || !activo) return;
      const data: ReelRow = await res.json();
      estadoRef.current = data.estado;
      setReel(data);
      setCaptions(data.captions);
      setMomentos(data.momentos);
      setEstiloId(data.estilo_id);
    };
    cargar();
    const intervalo = setInterval(() => {
      if (estadoRef.current === "subiendo" || estadoRef.current === "transcribiendo") {
        cargar();
      }
    }, 2000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [reelId]);

  const corregirPalabra = (indice: number, nuevoTexto: string) => {
    const original = captions[indice].text.trim();
    const copia = [...captions];
    copia[indice] = {...copia[indice], text: nuevoTexto};
    setCaptions(copia);
    if (original && original !== nuevoTexto.trim()) {
      setCorrecciones((prev) => ({...prev, [original]: nuevoTexto.trim()}));
    }
  };

  const agregarMomento = () => {
    const nuevo: Momento = {
      id: crypto.randomUUID().slice(0, 8),
      segundo: 0,
      tipo: "sticker",
      etiqueta: "",
    };
    setMomentos((prev) => [...prev, nuevo]);
  };

  const actualizarMomento = (id: string, cambios: Partial<Momento>) => {
    setMomentos((prev) => prev.map((m) => (m.id === id ? {...m, ...cambios} : m)));
  };

  const eliminarMomento = (id: string) => {
    setMomentos((prev) => prev.filter((m) => m.id !== id));
  };

  const guardarCambios = async (confirmar: boolean) => {
    if (!reel) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/reels/${reelId}`, {
        method: "PATCH",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({captions, momentos, correcciones, estiloId, confirmar}),
      });
      const data: ReelRow = await res.json();
      setReel(data);
      estadoRef.current = data.estado;
      setCorrecciones({});
    } finally {
      setGuardando(false);
    }
  };

  const inputProps = useMemo(
    () => ({
      videoUrl: reel?.video_url ?? "",
      tema: reel?.tema ?? "",
      ctaPalabra: reel?.cta_palabra ?? "",
      estiloId,
      fps: VIDEO_FPS,
      captions,
    }),
    [reel, estiloId, captions],
  );

  const Estilo = obtenerEstilo(estiloId).componente;
  const durationInFrames = useMemo(() => {
    const finMs = captions.length > 0 ? captions[captions.length - 1].endMs : 3000;
    return Math.max(Math.ceil(((finMs + 2000) / 1000) * VIDEO_FPS), VIDEO_FPS * 3);
  }, [captions]);

  if (!reel) {
    return <p className="max-w-screen-md m-auto px-4 py-10">Cargando...</p>;
  }

  return (
    <div className="max-w-screen-md m-auto px-4 py-10 flex flex-col gap-6">
      <Link href="/app" className="text-sm text-subtitle">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">{reel.tema || reel.nombre_original}</h1>

      {(reel.estado === "subiendo" || reel.estado === "transcribiendo") && (
        <p className="text-subtitle">Transcribiendo con Whisper en español...</p>
      )}

      {reel.estado === "error" && <ErrorComp message={reel.error ?? "Algo falló."} />}

      {(reel.estado === "listo_para_revisar" ||
        reel.estado === "texto_confirmado" ||
        reel.estado === "renderizando" ||
        reel.estado === "listo") &&
        reel.video_url && (
          <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] max-w-[360px]">
            <Player
              component={Estilo ? (props) => <Estilo {...props} /> : () => null}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              fps={VIDEO_FPS}
              compositionWidth={VIDEO_WIDTH}
              compositionHeight={VIDEO_HEIGHT}
              style={{width: "100%"}}
              controls
            />
          </div>
        )}

      {(reel.estado === "listo_para_revisar" || reel.estado === "texto_confirmado") && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Estilo</span>
            <div className="grid grid-cols-2 gap-2">
              {estilos.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEstiloId(e.id)}
                  className={`text-left rounded-geist border p-geist-half text-sm ${
                    estiloId === e.id ? "border-accent" : "border-unfocused-border-color"
                  }`}
                >
                  <p className="font-medium">{e.nombre}</p>
                  <p className="text-subtitle text-xs">{e.descripcion}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-unfocused-border-color rounded-geist p-geist">
            <p className="text-sm font-medium mb-3">Texto (corrige palabra por palabra)</p>
            <div className="leading-[2.2]">
              {captions.map((c, i) => (
                <input
                  key={i}
                  value={c.text}
                  onChange={(e) => corregirPalabra(i, e.target.value)}
                  className="rounded-geist bg-background border border-unfocused-border-color text-sm px-2 py-1 mr-1 mb-1"
                  style={{width: Math.max(50, c.text.length * 10)}}
                />
              ))}
            </div>
          </div>

          <div className="border border-unfocused-border-color rounded-geist p-geist">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Momentos (sticker, logo, zoom, recurso)</p>
              <Button secondary onClick={agregarMomento}>
                + agregar
              </Button>
            </div>
            {momentos.length === 0 && (
              <p className="text-subtitle text-sm">Sin momentos marcados.</p>
            )}
            {momentos.map((m) => (
              <div key={m.id} className="flex gap-2 items-center mb-2">
                <input
                  type="number"
                  value={m.segundo}
                  onChange={(e) => actualizarMomento(m.id, {segundo: Number(e.target.value)})}
                  className="w-16 rounded-geist bg-background border border-unfocused-border-color text-sm px-2 py-1"
                />
                <select
                  value={m.tipo}
                  onChange={(e) =>
                    actualizarMomento(m.id, {tipo: e.target.value as Momento["tipo"]})
                  }
                  className="rounded-geist bg-background border border-unfocused-border-color text-sm px-2 py-1"
                >
                  {TIPOS_MOMENTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  value={m.etiqueta}
                  onChange={(e) => actualizarMomento(m.id, {etiqueta: e.target.value})}
                  placeholder="etiqueta"
                  className="flex-1 rounded-geist bg-background border border-unfocused-border-color text-sm px-2 py-1"
                />
                <button onClick={() => eliminarMomento(m.id)} className="text-subtitle text-sm">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Button onClick={() => guardarCambios(true)} disabled={guardando} loading={guardando}>
            Confirmar texto
          </Button>
        </>
      )}

      {(reel.estado === "texto_confirmado" ||
        reel.estado === "renderizando" ||
        reel.estado === "listo") && (
        <div className="border border-unfocused-border-color rounded-geist p-geist flex flex-col gap-3">
          <p className="text-sm font-medium">Render</p>
          {renderState.status === "init" && (
            <Button onClick={renderMedia}>Renderizar video</Button>
          )}
          {renderState.status === "invoking" && (
            <div>
              <p className="text-sm text-subtitle">{renderState.phase}</p>
              <ProgressBar progress={renderState.progress} />
            </div>
          )}
          {renderState.status === "error" && <ErrorComp message={renderState.error.message} />}
          {renderState.status === "done" && (
            <DownloadButton state={renderState} undo={() => {}} />
          )}
          {renderState.status === "init" && reel.render_url && (
            <a href={reel.render_url} className="text-sm text-accent underline">
              Ver último render
            </a>
          )}
        </div>
      )}
    </div>
  );
};
