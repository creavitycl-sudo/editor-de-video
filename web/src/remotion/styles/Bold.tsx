import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";
import type {Caption} from "@remotion/captions";
import {brand, fontFamilies} from "../brand";
import type {EstiloProps, Estilo} from "./types";

/**
 * Bold: subtítulos grandes palabra por palabra, la palabra activa resalta
 * con una barra de color detrás ("karaoke"). CTA en pastilla que pulsa.
 * Ritmo rápido, pensado para contenido más "viral".
 */
const SubtitulosBold: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const activa = captions.find((c) => timeMs >= c.startMs && timeMs <= c.endMs);
  if (!activa) return null;

  const relativo = timeMs - activa.startMs;
  const entrada = spring({frame: (relativo / 1000) * fps, fps, config: {damping: 10, stiffness: 220}});
  const escala = interpolate(entrada, [0, 1], [0.7, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "42%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: fontFamilies.sticker,
          fontWeight: 900,
          fontSize: 76,
          color: brand.colors.black,
          background: brand.colors.accent,
          padding: "6px 28px",
          borderRadius: 16,
          transform: `scale(${escala})`,
          textTransform: "uppercase",
        }}
      >
        {activa.text.trim()}
      </span>
    </div>
  );
};

const CtaPulsante: React.FC<{ctaPalabra: string; desdeSegundos: number}> = ({
  ctaPalabra,
  desdeSegundos,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frameEntrada = desdeSegundos * fps;
  if (frame < frameEntrada) return null;

  const pulso = 1 + Math.sin((frame - frameEntrada) / 8) * 0.04;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "8%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: fontFamilies.sticker,
          fontWeight: 900,
          fontSize: 40,
          color: brand.colors.white,
          background: brand.colors.cta,
          padding: "14px 34px",
          borderRadius: 999,
          transform: `scale(${pulso})`,
          textTransform: "uppercase",
        }}
      >
        Comenta {ctaPalabra}
      </span>
    </div>
  );
};

const BoldComponent: React.FC<EstiloProps> = ({videoUrl, captions, ctaPalabra}) => {
  const finSegundos = captions.length > 0 ? captions[captions.length - 1].endMs / 1000 : 0;
  return (
    <AbsoluteFill style={{background: brand.colors.background}}>
      <Video src={videoUrl} style={{width: "100%", height: "100%"}} objectFit="cover" />
      <SubtitulosBold captions={captions} />
      <CtaPulsante ctaPalabra={ctaPalabra} desdeSegundos={finSegundos} />
    </AbsoluteFill>
  );
};

export const bold: Estilo = {
  id: "bold",
  nombre: "Bold",
  descripcion: "Palabra por palabra en grande con fondo de color, CTA pulsante. Ritmo rápido.",
  previewSrc: null,
  componente: BoldComponent,
};
