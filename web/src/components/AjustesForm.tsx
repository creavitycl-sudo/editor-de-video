"use client";

import {useEffect, useState} from "react";
import {Button} from "./Button";

type Glosario = {vocabulario: string[]; correcciones: Record<string, string>};

export const AjustesForm: React.FC = () => {
  const [glosario, setGlosario] = useState<Glosario | null>(null);
  const [vocabularioTexto, setVocabularioTexto] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/glosario")
      .then((r) => r.json())
      .then((g: Glosario) => {
        setGlosario(g);
        setVocabularioTexto(g.vocabulario.join(", "));
      });
  }, []);

  const guardar = async () => {
    if (!glosario) return;
    setGuardando(true);
    try {
      const vocabulario = vocabularioTexto
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const res = await fetch("/api/glosario", {
        method: "PUT",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({vocabulario, correcciones: glosario.correcciones}),
      });
      const data: Glosario = await res.json();
      setGlosario(data);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCorreccion = (mal: string) => {
    if (!glosario) return;
    const correcciones = {...glosario.correcciones};
    delete correcciones[mal];
    setGlosario({...glosario, correcciones});
  };

  if (!glosario) return <p className="text-subtitle text-sm">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-unfocused-border-color rounded-geist p-geist">
        <p className="text-sm font-medium mb-2">
          Vocabulario (nombres de tus herramientas y marcas)
        </p>
        <textarea
          value={vocabularioTexto}
          onChange={(e) => setVocabularioTexto(e.target.value)}
          rows={3}
          className="w-full rounded-geist bg-background border border-unfocused-border-color p-geist-half text-sm outline-none focus:border-focused-border-color resize-y"
          placeholder="Claude Code, Remotion, Supabase, GitHub"
        />
      </div>

      <div className="border border-unfocused-border-color rounded-geist p-geist">
        <p className="text-sm font-medium mb-2">Correcciones del glosario</p>
        {Object.keys(glosario.correcciones).length === 0 && (
          <p className="text-subtitle text-sm">
            Vacío por ahora. Cada corrección que hagas al revisar un reel se agrega aquí sola.
          </p>
        )}
        {Object.entries(glosario.correcciones).map(([mal, bien]) => (
          <div key={mal} className="flex items-center gap-2 mb-2 text-sm">
            <span className="text-subtitle">{mal}</span>
            <span>→</span>
            <strong>{bien}</strong>
            <button
              onClick={() => eliminarCorreccion(mal)}
              className="ml-auto text-subtitle"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button onClick={guardar} disabled={guardando} loading={guardando}>
        Guardar ajustes
      </Button>
    </div>
  );
};
