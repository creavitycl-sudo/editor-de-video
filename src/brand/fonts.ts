/**
 * Carga de tipografias via @remotion/google-fonts. Se cargan una sola
 * vez aqui y los componentes importan los nombres de familia resultantes,
 * nunca el string "Outfit" o "Manrope" a mano.
 */
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const outfit = loadOutfit("normal", { weights: ["500", "600", "700", "800"] });
const manrope = loadManrope("normal", {
  weights: ["400", "500", "600", "700"],
});
const jetbrainsMono = loadJetBrainsMono("normal", {
  weights: ["400", "500", "600"],
});
const montserrat = loadMontserrat("normal", { weights: ["700", "800", "900"] });

export const fontFamilies = {
  heading: outfit.fontFamily,
  body: manrope.fontFamily,
  code: jetbrainsMono.fontFamily,
  sticker: montserrat.fontFamily,
} as const;

export const fontWaitlist = Promise.all([
  outfit.waitUntilDone(),
  manrope.waitUntilDone(),
  jetbrainsMono.waitUntilDone(),
  montserrat.waitUntilDone(),
]);
