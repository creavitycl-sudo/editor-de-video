import type {Caption} from "@remotion/captions";

export type EstiloProps = {
  videoUrl: string;
  captions: Caption[];
  ctaPalabra: string;
};

export type Estilo = {
  id: string;
  /** Nombre visible en el selector de estilos de la app. */
  nombre: string;
  /** Una línea para la tarjeta del selector. */
  descripcion: string;
  /** Imagen de referencia (preview) en /public, o null mientras no exista. */
  previewSrc: string | null;
  componente: React.FC<EstiloProps>;
};
