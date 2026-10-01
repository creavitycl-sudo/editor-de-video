import type {
  Ajustes,
  Caption,
  Glosario,
  Momento,
  Reel,
} from "../../shared/tipos";

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(ruta, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  listarReels: () => pedir<Reel[]>("/api/reels"),
  obtenerReel: (id: string) =>
    pedir<{ reel: Reel; captions: Caption[] }>(`/api/reels/${id}`),
  crearReel: async (datos: {
    video: File;
    tema: string;
    ctaPalabra: string;
    queMostrarCuandoNombra: string;
  }) => {
    const form = new FormData();
    form.append("video", datos.video);
    form.append("tema", datos.tema);
    form.append("ctaPalabra", datos.ctaPalabra);
    form.append("queMostrarCuandoNombra", datos.queMostrarCuandoNombra);
    const res = await fetch("/api/reels", { method: "POST", body: form });
    if (!res.ok) throw new Error("No se pudo crear el reel");
    return res.json() as Promise<{ reel: Reel }>;
  },
  guardarCaptions: (
    id: string,
    datos: {
      captions: Caption[];
      momentos: Momento[];
      correcciones?: Record<string, string>;
    },
  ) =>
    pedir<{ reel: Reel }>(`/api/reels/${id}/captions`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  obtenerAjustes: () =>
    pedir<{ ajustes: Ajustes; glosario: Glosario }>("/api/ajustes"),
  guardarAjustes: (datos: { ajustes?: Ajustes; glosario?: Glosario }) =>
    pedir<{ ajustes: Ajustes; glosario: Glosario }>("/api/ajustes", {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
};
