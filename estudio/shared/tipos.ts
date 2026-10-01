export type EstadoReel =
  | "subiendo"
  | "transcribiendo"
  | "listo_para_revisar"
  | "texto_confirmado"
  | "editando"
  | "editado";

export type Momento = {
  id: string;
  segundo: number;
  tipo: "sticker" | "logo" | "zoom" | "recurso";
  etiqueta: string;
  /** Para "recurso": url o ruta a un archivo que debe mostrarse. */
  referencia?: string;
};

export type Pedido = {
  tema: string;
  ctaPalabra: string;
  /** Texto libre: "cuando nombro X, muestra Y". */
  queMostrarCuandoNombra: string;
};

export type Reel = {
  id: string;
  creadoEn: string;
  estado: EstadoReel;
  nombreOriginal: string;
  pedido: Pedido;
  momentos: Momento[];
  error?: string;
};

export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};

export type Glosario = {
  vocabulario: string[];
  correcciones: Record<string, string>;
};

export type Ajustes = {
  modeloWhisper: "tiny" | "base" | "small" | "medium" | "large-v3";
  idioma: string;
  whisperCppVersion: string;
};
