/**
 * Marca unica. Todo video, componente o plantilla lee sus colores,
 * tipografias, handle y logo de aqui. Ningun componente define
 * colores o fuentes sueltas: siempre importan de este archivo.
 */
export const brand = {
  colors: {
    background: "#050708",
    text: "#eaf6f7",
    accent: "#2fd8e0", // un solo color vibrante por escena
    cta: "#d97757", // solo una vez por video
    black: "#000000",
    white: "#ffffff",
  },
  handle: "@tu_handle",
  logoPath: "brand/logo.png",
  fonts: {
    heading: "Outfit",
    body: "Manrope",
    code: "JetBrains Mono",
    sticker: "Montserrat",
  },
} as const;

export type Brand = typeof brand;
