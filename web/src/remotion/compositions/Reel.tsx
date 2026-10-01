import {CalculateMetadataFunction} from "remotion";
import {CompositionProps} from "../../../types/constants";
import {dimensions} from "../brand";
import {obtenerEstilo} from "../styles";
import type {z} from "zod";

export type ReelProps = z.infer<typeof CompositionProps>;

const COLA_FINAL_SEGUNDOS = 2;

// Las props (incluidas las captions) ya vienen resueltas desde la base de
// datos antes del render: no hay fetch ni filesystem aquí, solo calcular
// la duración a partir de los tiempos de las captions.
export const calculateMetadata: CalculateMetadataFunction<ReelProps> = async ({
  props,
}) => {
  const finMs =
    props.captions.length > 0
      ? props.captions[props.captions.length - 1].endMs
      : 3000;
  const durationInFrames = Math.ceil(
    ((finMs + COLA_FINAL_SEGUNDOS * 1000) / 1000) * props.fps,
  );

  return {
    durationInFrames: Math.max(durationInFrames, props.fps * 3),
    width: dimensions.vertical.width,
    height: dimensions.vertical.height,
  };
};

export const Reel: React.FC<ReelProps> = ({videoUrl, captions, ctaPalabra, estiloId}) => {
  const estilo = obtenerEstilo(estiloId);
  const Componente = estilo.componente;
  return <Componente videoUrl={videoUrl} captions={captions} ctaPalabra={ctaPalabra} />;
};
