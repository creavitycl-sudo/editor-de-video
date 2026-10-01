import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, fontFamilies } from "../brand";

type Props = {
  texto: string;
  /** Segundo (en la composicion) en que entra el sticker. */
  desdeSegundos: number;
  top?: number;
  rotacionGrados?: number;
};

/**
 * Caja blanca con texto negro, una caja por linea, como el texto con
 * fondo de Instagram. Se usa para el gancho inicial y para el CTA final.
 */
export const Sticker: React.FC<Props> = ({
  texto,
  desdeSegundos,
  top = 80,
  rotacionGrados = -2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frameEntrada = desdeSegundos * fps;
  const relativo = frame - frameEntrada;

  if (relativo < 0) return null;

  const escala = spring({
    frame: relativo,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${interpolate(escala, [0, 1], [0.6, 1])}) rotate(${rotacionGrados}deg)`,
      }}
    >
      <div
        style={{
          background: brand.colors.white,
          color: brand.colors.black,
          fontFamily: fontFamilies.sticker,
          fontWeight: 800,
          fontSize: 44,
          padding: "16px 36px",
          borderRadius: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        {texto}
      </div>
    </div>
  );
};
