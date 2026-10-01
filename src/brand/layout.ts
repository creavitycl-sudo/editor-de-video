/**
 * Zonas seguras y dimensiones por plataforma. Ahi van los botones de
 * Instagram y TikTok: nada importante se coloca fuera de estos margenes.
 */
import type React from "react";

export const dimensions = {
  vertical: { width: 1080, height: 1920 },
  horizontal: { width: 1920, height: 1080 },
} as const;

export type Platform = keyof typeof dimensions;

export const safeArea = {
  vertical: { top: 250, bottom: 520, left: 90, right: 90 },
  // En horizontal no hay overlays de red social superpuestos: margen uniforme.
  horizontal: { top: 60, bottom: 60, left: 80, right: 80 },
} as const;

export const getSafeAreaStyle = (platform: Platform): React.CSSProperties => {
  const area = safeArea[platform];
  return {
    position: "absolute",
    top: area.top,
    bottom: area.bottom,
    left: area.left,
    right: area.right,
  };
};
