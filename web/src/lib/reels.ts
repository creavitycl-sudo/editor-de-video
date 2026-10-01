import type {Caption} from "@remotion/captions";

export type EstadoReel =
  | "subiendo"
  | "transcribiendo"
  | "listo_para_revisar"
  | "texto_confirmado"
  | "renderizando"
  | "listo"
  | "error";

export type Momento = {
  id: string;
  segundo: number;
  tipo: "sticker" | "logo" | "zoom" | "recurso";
  etiqueta: string;
  referencia?: string;
};

export type ReelRow = {
  id: string;
  user_id: string;
  creado_en: string;
  estado: EstadoReel;
  nombre_original: string;
  video_url: string | null;
  video_normalizado_url: string | null;
  render_url: string | null;
  estilo_id: string;
  tema: string;
  cta_palabra: string;
  que_mostrar_cuando_nombra: string;
  captions: Caption[];
  momentos: Momento[];
  error: string | null;
};
