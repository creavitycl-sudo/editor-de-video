import {AbsoluteFill} from "remotion";
import {Video} from "@remotion/media";
import {brand} from "../brand";
import {SubtitulosReel} from "../components/SubtitulosReel";
import {Sticker} from "../components/Sticker";
import type {EstiloProps, Estilo} from "./types";

/**
 * Estilo base: subtítulos blancos con contorno, sticker de gancho/CTA.
 * Referencia para los otros 3 estilos (Paso 3 de la guía).
 */
const ClasicoComponent: React.FC<EstiloProps> = ({videoUrl, captions, ctaPalabra}) => {
  return (
    <AbsoluteFill style={{background: brand.colors.background}}>
      <Video src={videoUrl} style={{width: "100%", height: "100%"}} objectFit="cover" />
      <SubtitulosReel captions={captions} />
      <Sticker texto={`Comenta ${ctaPalabra.toUpperCase()}`} desdeSegundos={0} />
    </AbsoluteFill>
  );
};

export const clasico: Estilo = {
  id: "clasico",
  nombre: "Clásico",
  descripcion: "Subtítulos con contorno, sticker de gancho y CTA final.",
  previewSrc: null,
  componente: ClasicoComponent,
};
