import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  children: React.ReactNode;
  /** Segundo en que empieza la transicion. */
  desdeSegundos: number;
  duracionSegundos?: number;
  direccion?: "entrada" | "salida";
};

/**
 * Pasa de la cara al B-roll (o viceversa) con zoom y desenfoque de
 * movimiento. Uso tipico: envolver <PantallaGrabada> con direccion
 * "entrada" y, mas adelante en la linea de tiempo, otra instancia con
 * "salida" envolviendo la cara.
 */
export const ZoomBlur: React.FC<Props> = ({
  children,
  desdeSegundos,
  duracionSegundos = 0.4,
  direccion = "entrada",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segundos = frame / fps;

  const progreso = interpolate(
    segundos,
    [desdeSegundos, desdeSegundos + duracionSegundos],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const t = direccion === "entrada" ? progreso : 1 - progreso;
  const escala = interpolate(t, [0, 1], [1.25, 1]);
  const blur = interpolate(t, [0, 1], [18, 0]);
  const opacidad = interpolate(t, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${escala})`,
        filter: `blur(${blur}px)`,
        opacity: opacidad,
      }}
    >
      {children}
    </div>
  );
};
