import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../../brand";

type Props = {
  /** Ruta dentro de public/, ej. "logos/claude.png" */
  logoSrc: string;
  desdeSegundos: number;
  duracionSegundos?: number;
  top?: number;
  left?: number;
};

/**
 * Icono circular de la herramienta nombrada. Salta al aparecer y se queda
 * un momento quieto antes de salir.
 */
export const LogoBadge: React.FC<Props> = ({
  logoSrc,
  desdeSegundos,
  duracionSegundos = 2,
  top = 160,
  left = 60,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frameEntrada = desdeSegundos * fps;
  const frameSalida = (desdeSegundos + duracionSegundos) * fps;
  const relativo = frame - frameEntrada;

  if (frame < frameEntrada || frame > frameSalida) return null;

  const salto = spring({
    frame: relativo,
    fps,
    config: { damping: 9, stiffness: 200, mass: 0.5 },
  });

  const salida = interpolate(frame, [frameSalida - 10, frameSalida], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: brand.colors.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 0 4px ${brand.colors.accent}`,
        transform: `scale(${interpolate(salto, [0, 1], [0.3, 1])})`,
        opacity: salida,
      }}
    >
      <Img
        src={logoSrc}
        style={{ width: 64, height: 64, objectFit: "contain" }}
      />
    </div>
  );
};
