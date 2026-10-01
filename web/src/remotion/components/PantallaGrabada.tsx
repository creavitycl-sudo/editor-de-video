import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand";

type Momento = {
  /** Segundo, dentro de este componente, en que ocurre. */
  segundo: number;
  tipo: "zoom" | "clic" | "resaltar" | "difuminar";
  /** Punto (0-1, 0-1) relativo a la captura, usado por zoom/clic/resaltar. */
  punto?: { x: number; y: number };
  /** Rectangulo (0-1) usado por resaltar/difuminar. */
  rect?: { x: number; y: number; width: number; height: number };
  zoomNivel?: number;
};

type Props = {
  /** Ruta de la captura (public/) tomada con scripts/capturar-web.ts */
  capturaSrc: string;
  anchoCaptura: number;
  altoCaptura: number;
  momentos: Momento[];
};

/**
 * Anima una captura de pantalla real como si fuera una grabacion: zoom y
 * paneo entre momentos, cursor que hace clic, resaltados y desenfoque de
 * datos privados. Todo en tiempos en segundos, como el resto del proyecto.
 */
export const PantallaGrabada: React.FC<Props> = ({
  capturaSrc,
  anchoCaptura,
  altoCaptura,
  momentos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segundos = frame / fps;

  const ordenados = [...momentos].sort((a, b) => a.segundo - b.segundo);
  const actual =
    [...ordenados].reverse().find((m) => m.segundo <= segundos) ?? ordenados[0];
  const siguiente = ordenados.find((m) => m.segundo > segundos);

  const progreso = siguiente
    ? interpolate(segundos, [actual.segundo, siguiente.segundo], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const puntoActual = actual?.punto ?? { x: 0.5, y: 0.5 };
  const puntoSiguiente = siguiente?.punto ?? puntoActual;
  const punto = {
    x: puntoActual.x + (puntoSiguiente.x - puntoActual.x) * progreso,
    y: puntoActual.y + (puntoSiguiente.y - puntoActual.y) * progreso,
  };

  const zoomActual = actual?.zoomNivel ?? 1;
  const zoomSiguiente = siguiente?.zoomNivel ?? zoomActual;
  // Maximo 1.06 para que el zoom no invada el espacio de la palabra activa.
  const zoom = Math.min(
    zoomActual + (zoomSiguiente - zoomActual) * progreso,
    1.5,
  );

  const clicActivo = actual?.tipo === "clic" && segundos - actual.segundo < 0.4;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: brand.colors.background,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: `${punto.x * 100}% ${punto.y * 100}%`,
        }}
      >
        <Img
          src={capturaSrc}
          style={{
            width: anchoCaptura,
            height: altoCaptura,
            objectFit: "cover",
          }}
        />
        {actual?.tipo === "resaltar" && actual.rect ? (
          <div
            style={{
              position: "absolute",
              left: `${actual.rect.x * 100}%`,
              top: `${actual.rect.y * 100}%`,
              width: `${actual.rect.width * 100}%`,
              height: `${actual.rect.height * 100}%`,
              boxShadow: `0 0 0 4px ${brand.colors.accent}`,
              borderRadius: 8,
            }}
          />
        ) : null}
        {actual?.tipo === "difuminar" && actual.rect ? (
          <div
            style={{
              position: "absolute",
              left: `${actual.rect.x * 100}%`,
              top: `${actual.rect.y * 100}%`,
              width: `${actual.rect.width * 100}%`,
              height: `${actual.rect.height * 100}%`,
              backdropFilter: "blur(16px)",
              background: "rgba(0,0,0,0.3)",
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: `${punto.x * 100}%`,
          top: `${punto.y * 100}%`,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: brand.colors.white,
          border: `3px solid ${brand.colors.black}`,
          transform: `translate(-50%, -50%) scale(${clicActivo ? 0.7 : 1})`,
          boxShadow: clicActivo
            ? `0 0 0 10px ${brand.colors.accent}55`
            : "none",
        }}
      />
    </div>
  );
};
