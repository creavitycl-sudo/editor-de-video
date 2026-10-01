import { useEffect, useState } from "react";
import { api } from "../api";
import type { Ajustes as AjustesType, Glosario } from "../../../shared/tipos";

const MODELOS: AjustesType["modeloWhisper"][] = [
  "tiny",
  "base",
  "small",
  "medium",
  "large-v3",
];

export const Ajustes: React.FC = () => {
  const [ajustes, setAjustes] = useState<AjustesType | null>(null);
  const [glosario, setGlosario] = useState<Glosario | null>(null);
  const [vocabularioTexto, setVocabularioTexto] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.obtenerAjustes().then(({ ajustes: a, glosario: g }) => {
      setAjustes(a);
      setGlosario(g);
      setVocabularioTexto(g.vocabulario.join(", "));
    });
  }, []);

  const guardar = async () => {
    if (!ajustes || !glosario) return;
    setGuardando(true);
    try {
      const vocabulario = vocabularioTexto
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const { ajustes: a, glosario: g } = await api.guardarAjustes({
        ajustes,
        glosario: { ...glosario, vocabulario },
      });
      setAjustes(a);
      setGlosario(g);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCorreccion = (mal: string) => {
    if (!glosario) return;
    const correcciones = { ...glosario.correcciones };
    delete correcciones[mal];
    setGlosario({ ...glosario, correcciones });
  };

  if (!ajustes || !glosario)
    return <p style={{ textAlign: "center" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 560, margin: "40px auto" }}>
      <h2>Ajustes</h2>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <label className="etiqueta">Modelo de Whisper</label>
        <select
          value={ajustes.modeloWhisper}
          onChange={(e) =>
            setAjustes({
              ...ajustes,
              modeloWhisper: e.target.value as AjustesType["modeloWhisper"],
            })
          }
          style={{ width: "100%", marginBottom: 12 }}
        >
          {MODELOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          Usa siempre el modelo multilingüe (nunca el sufijo .en): transcribe en
          español.
        </p>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <label className="etiqueta">
          Vocabulario (nombres de tus herramientas y marcas)
        </label>
        <textarea
          value={vocabularioTexto}
          onChange={(e) => setVocabularioTexto(e.target.value)}
          rows={3}
          style={{ width: "100%" }}
          placeholder="Claude Code, Remotion, Supabase, GitHub"
        />
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <label className="etiqueta">Correcciones del glosario</label>
        {Object.keys(glosario.correcciones).length === 0 && (
          <p style={{ opacity: 0.6, fontSize: 14 }}>
            Vacío por ahora. Cada corrección que hagas en la pantalla de Texto
            se agrega aquí sola.
          </p>
        )}
        {Object.entries(glosario.correcciones).map(([mal, bien]) => (
          <div
            key={mal}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ opacity: 0.7 }}>{mal}</span>
            <span>→</span>
            <strong>{bien}</strong>
            <button
              className="boton-secundario"
              onClick={() => eliminarCorreccion(mal)}
              style={{ marginLeft: "auto" }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="boton-primario" onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar ajustes"}
      </button>
    </div>
  );
};
