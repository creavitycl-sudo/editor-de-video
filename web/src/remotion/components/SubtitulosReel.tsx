import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import { brand, fontFamilies } from "../brand";

type Props = {
  captions: Caption[];
  /** Agrupa palabras en bloques de 1 a 3, como pide el estilo del usuario. */
  palabrasPorBloque?: 1 | 2 | 3;
};

/**
 * Subtitulos blancos con contorno negro, Montserrat 800, de 1 a 3 palabras,
 * a la altura del pecho. Nunca parte nombres propios de dos palabras
 * ("Claude Code") ni deja preposiciones colgando: agrupalas en el mismo
 * bloque al construir `captions` si tu estilo lo exige.
 */
export const SubtitulosReel: React.FC<Props> = ({
  captions,
  palabrasPorBloque = 2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const bloques: Caption[][] = [];
  for (let i = 0; i < captions.length; i += palabrasPorBloque) {
    bloques.push(captions.slice(i, i + palabrasPorBloque));
  }

  const bloqueActivo = bloques.find((bloque) => {
    const inicio = bloque[0]?.startMs ?? 0;
    const fin = bloque[bloque.length - 1]?.endMs ?? 0;
    return timeMs >= inicio && timeMs <= fin;
  });

  if (!bloqueActivo) return null;

  const inicioBloque = bloqueActivo[0].startMs;
  const entrada = interpolate(
    timeMs,
    [inicioBloque, inicioBloque + 120],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const texto = bloqueActivo
    .map((c) => c.text)
    .join("")
    .trim();

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "38%", // altura del pecho en formato vertical
        display: "flex",
        justifyContent: "center",
        opacity: entrada,
        filter: `blur(${(1 - entrada) * 6}px)`,
      }}
    >
      <span
        style={{
          fontFamily: fontFamilies.sticker,
          fontWeight: 800,
          fontSize: 64,
          color: brand.colors.white,
          textShadow: [
            "-3px -3px 0 #000",
            "3px -3px 0 #000",
            "-3px 3px 0 #000",
            "3px 3px 0 #000",
            "0 0 12px rgba(0,0,0,0.6)",
          ].join(", "),
          padding: "0 32px",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {texto.toUpperCase()}
      </span>
    </div>
  );
};
