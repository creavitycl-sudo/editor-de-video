import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";
import {brand, fontFamilies} from "../brand";
import type {EstiloProps, Estilo} from "./types";

/**
 * Minimalista: sin stickers ni gancho grande, subtítulos chicos en un
 * tercio inferior con fondo semitransparente, CTA discreto solo al final.
 * Pensado para contenido más "profesional" o calmado.
 */
const SubtitulosMinimal: React.FC<Pick<EstiloProps, "captions">> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const palabrasPorBloque = 4;
  const bloques: typeof captions[] = [];
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
  const opacidad = interpolate(timeMs, [inicio, inicio + 200], [0, 1], {
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
        left: "10%",
        right: "10%",
        bottom: "14%",
        opacity: opacidad,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: fontFamilies.body,
          fontWeight: 500,
          fontSize: 38,
          color: brand.colors.white,
          background: "rgba(5,7,8,0.55)",
          padding: "10px 22px",
          borderRadius: 999,
          textAlign: "center",
        }}
      >
        {texto}
      </span>
    </div>
  );
};

const CtaDiscreto: React.FC<{ctaPalabra: string; captions: EstiloProps["captions"]}> = ({
  ctaPalabra,
  captions,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = (frame / fps) * 1000;
  const finMs = captions.length > 0 ? captions[captions.length - 1].endMs : 0;
  const entrada = interpolate(timeMs, [finMs, finMs + 400], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (entrada <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "6%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: entrada,
      }}
    >
      <span
        style={{
          fontFamily: fontFamilies.body,
          fontSize: 24,
          letterSpacing: 2,
          color: brand.colors.accent,
          textTransform: "uppercase",
        }}
      >
        Comenta {ctaPalabra}
      </span>
    </div>
  );
};

const MinimalistaComponent: React.FC<EstiloProps> = ({videoUrl, captions, ctaPalabra}) => {
  return (
    <AbsoluteFill style={{background: brand.colors.background}}>
      <Video src={videoUrl} style={{width: "100%", height: "100%"}} objectFit="cover" />
      <SubtitulosMinimal captions={captions} />
      <CtaDiscreto ctaPalabra={ctaPalabra} captions={captions} />
    </AbsoluteFill>
  );
};

export const minimalista: Estilo = {
  id: "minimalista",
  nombre: "Minimalista",
  descripcion: "Subtítulos discretos en píldora, sin stickers, CTA solo al final.",
  previewSrc: null,
  componente: MinimalistaComponent,
};
