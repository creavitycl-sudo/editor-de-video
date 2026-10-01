import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Caption, Momento, Reel } from "../../../shared/tipos";

type Props = {
  reelId: string | null;
  onVolver: () => void;
};

const TIPOS_MOMENTO: Momento["tipo"][] = ["sticker", "logo", "zoom", "recurso"];

export const Texto: React.FC<Props> = ({ reelId, onVolver }) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [reel, setReel] = useState<Reel | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [correcciones, setCorrecciones] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const estadoRef = useRef<Reel["estado"] | null>(null);

  useEffect(() => {
    api.listarReels().then(setReels);
  }, []);

  useEffect(() => {
    if (!reelId) {
      setReel(null);
      return;
    }
    let activo = true;
    estadoRef.current = null;
    const cargar = () => {
      api.obtenerReel(reelId).then(({ reel: r, captions: c }) => {
        if (!activo) return;
        estadoRef.current = r.estado;
        setReel(r);
        setMomentos(r.momentos);
        if (
          r.estado === "listo_para_revisar" ||
          r.estado === "texto_confirmado"
        ) {
          setCaptions(c);
        }
      });
    };
    cargar();
    // Mientras transcribe, consultamos cada 2s (polling simple, sin SSE).
    // Usa un ref (no el "reel" del cierre, que queda obsoleto) para saber
    // si todavia hay que seguir consultando.
    const intervalo = setInterval(() => {
      if (
        estadoRef.current === "transcribiendo" ||
        estadoRef.current === "subiendo"
      )
        cargar();
    }, 2000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelId]);

  const corregirPalabra = (indice: number, nuevoTexto: string) => {
    const original = captions[indice].text.trim();
    const copia = [...captions];
    copia[indice] = { ...copia[indice], text: nuevoTexto };
    setCaptions(copia);
    if (original && original !== nuevoTexto.trim()) {
      setCorrecciones((prev) => ({ ...prev, [original]: nuevoTexto.trim() }));
    }
  };

  const agregarMomento = (segundo: number) => {
    const nuevo: Momento = {
      id: crypto.randomUUID().slice(0, 8),
      segundo: Math.round(segundo * 10) / 10,
      tipo: "sticker",
      etiqueta: "",
    };
    setMomentos((prev) =>
      [...prev, nuevo].sort((a, b) => a.segundo - b.segundo),
    );
  };

  const actualizarMomento = (id: string, cambios: Partial<Momento>) => {
    setMomentos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...cambios } : m)),
    );
  };

  const eliminarMomento = (id: string) => {
    setMomentos((prev) => prev.filter((m) => m.id !== id));
  };

  const confirmar = async () => {
    if (!reel) return;
    setGuardando(true);
    try {
      const { reel: actualizado } = await api.guardarCaptions(reel.id, {
        captions,
        momentos,
        correcciones,
      });
      setReel(actualizado);
      setCorrecciones({});
    } finally {
      setGuardando(false);
    }
  };

  if (!reelId) {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto" }}>
        <h2>Mis reels</h2>
        {reels.length === 0 && (
          <p style={{ opacity: 0.7 }}>Todavía no subiste ningún reel.</p>
        )}
        <div style={{ display: "grid", gap: 12 }}>
          {reels.map((r) => (
            <div
              key={r.id}
              className="tarjeta"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{r.pedido.tema || r.nombreOriginal}</strong>
                <div style={{ opacity: 0.6, fontSize: 13 }}>
                  estado: {r.estado}
                </div>
              </div>
              <button
                className="boton-secundario"
                onClick={() => (window.location.hash = `#texto/${r.id}`)}
              >
                Abrir
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!reel) return <p style={{ textAlign: "center" }}>Cargando...</p>;

  if (reel.estado === "subiendo" || reel.estado === "transcribiendo") {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
        <p>
          Transcribiendo con Whisper en español... esto puede tardar un poco.
        </p>
        {reel.error && <p style={{ color: "#ff8a8a" }}>{reel.error}</p>}
        <button className="boton-secundario" onClick={onVolver}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto" }}>
      <button
        className="boton-secundario"
        onClick={onVolver}
        style={{ marginBottom: 20 }}
      >
        ← Volver
      </button>
      <h2>{reel.pedido.tema || reel.nombreOriginal}</h2>

      <audio
        ref={audioRef}
        controls
        src={`/public/assets/${reel.id}.wav`}
        style={{ width: "100%", marginBottom: 20 }}
      />

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <label className="etiqueta">Texto (corrige palabra por palabra)</label>
        <div style={{ lineHeight: 2.2 }}>
          {captions.map((c, i) => (
            <input
              key={i}
              value={c.text}
              onChange={(e) => corregirPalabra(i, e.target.value)}
              style={{
                width: Math.max(50, c.text.length * 10),
                marginRight: 4,
                marginBottom: 6,
                padding: "4px 6px",
              }}
              title={`${(c.startMs / 1000).toFixed(1)}s`}
            />
          ))}
        </div>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <label className="etiqueta" style={{ marginBottom: 0 }}>
            Momentos (sticker, logo, zoom, recurso)
          </label>
          <button
            className="boton-secundario"
            onClick={() => agregarMomento(audioRef.current?.currentTime ?? 0)}
          >
            + marcar en{" "}
            {Math.round((audioRef.current?.currentTime ?? 0) * 10) / 10}s
          </button>
        </div>
        {momentos.length === 0 && (
          <p style={{ opacity: 0.6, fontSize: 14 }}>Sin momentos marcados.</p>
        )}
        {momentos.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ width: 56, opacity: 0.7, fontSize: 13 }}>
              {m.segundo}s
            </span>
            <select
              value={m.tipo}
              onChange={(e) =>
                actualizarMomento(m.id, {
                  tipo: e.target.value as Momento["tipo"],
                })
              }
            >
              {TIPOS_MOMENTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={m.etiqueta}
              onChange={(e) =>
                actualizarMomento(m.id, { etiqueta: e.target.value })
              }
              placeholder="etiqueta (ej: Claude Code)"
              style={{ flex: 1 }}
            />
            <button
              className="boton-secundario"
              onClick={() => eliminarMomento(m.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        className="boton-primario"
        onClick={confirmar}
        disabled={guardando}
      >
        {guardando ? "Guardando..." : "Confirmar texto"}
      </button>
      {reel.estado === "texto_confirmado" && (
        <p style={{ opacity: 0.7, marginTop: 12 }}>
          Texto confirmado. Dile a Claude Code: "edita el reel {reel.id} del
          Estudio".
        </p>
      )}
    </div>
  );
};
