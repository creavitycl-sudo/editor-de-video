import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";
import type {Caption} from "@remotion/captions";
import {brand, fontFamilies} from "../brand";
import type {EstiloProps, Estilo} from "./types";

const ALTO_LETTERBOX = 70;

/** Barras tipo cine arriba y abajo: look más "documental". */
const Letterbox: React.FC = () => (
  <>
    <div style={{position: "absolute", top: 0, left: 0, right: 0, height: ALTO_LETTERBOX, background: brand.colors.black}} />
    <div style={{position: "absolute", bottom: 0, left: 0, right: 0, height: ALTO_LETTERBOX, background: brand.colors.black}} />
  </>
);

/** Franja tipo "lower third" de noticias, con línea superior de acento. */
const SubtitulosEditorial: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const palabrasPorBloque = 5;
  const bloques: Caption[][] = [];
  for (let i = 0; i < captions.length; i += palabrasPorBloque) {
    bloques.push(captions.slice(i, i + palabrasPorBloque));
  }

  const activo = bloques.find((b) => {
    const inicio = b[0]?.startMs ?? 0;
    const fin = b[b.length - 1]?.endMs ?? 0;
    return timeMs >= inicio && timeMs <= fin;
  });

  if (!activo) return null;

  const inicio = activo[0].startMs;
  const anchoEntrada = interpolate(timeMs, [inicio, inicio + 300], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const texto = activo
    .map((c) => c.text)
    .join("")
    .trim();

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: ALTO_LETTERBOX + 110,
        overflow: "hidden",
        width: `${anchoEntrada}%`,
        maxWidth: "88%",
      }}
    >
      <div
        style={{
          borderTop: `3px solid ${brand.colors.accent}`,
          background: "rgba(5,7,8,0.75)",
          padding: "14px 24px",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: fontFamilies.body,
            fontWeight: 600,
            fontSize: 34,
            color: brand.colors.white,
          }}
        >
          {texto}
        </span>
      </div>
    </div>
  );
};

const BadgeCta: React.FC<{ctaPalabra: string}> = ({ctaPalabra}) => (
  <div
    style={{
      position: "absolute",
      bottom: ALTO_LETTERBOX + 24,
      right: 24,
      background: brand.colors.accent,
      color: brand.colors.black,
      fontFamily: fontFamilies.body,
      fontWeight: 700,
      fontSize: 20,
      padding: "8px 16px",
      borderRadius: 8,
    }}
  >
    Comenta {ctaPalabra.toUpperCase()}
  </div>
);

const EditorialComponent: React.FC<EstiloProps> = ({videoUrl, captions, ctaPalabra}) => {
  return (
    <AbsoluteFill style={{background: brand.colors.background}}>
      <Video src={videoUrl} style={{width: "100%", height: "100%"}} objectFit="cover" />
      <Letterbox />
      <SubtitulosEditorial captions={captions} />
      <BadgeCta ctaPalabra={ctaPalabra} />
    </AbsoluteFill>
  );
};

export const editorial: Estilo = {
  id: "editorial",
  nombre: "Editorial",
  descripcion: "Barras de cine, franja tipo noticiero para el texto, CTA en insignia.",
  previewSrc: null,
  componente: EditorialComponent,
};
