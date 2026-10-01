import {z} from "zod";

export const COMP_NAME = "Reel";

const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const CompositionProps = z.object({
  videoUrl: z.string(),
  tema: z.string(),
  ctaPalabra: z.string(),
  estiloId: z.string(),
  fps: z.number().default(30),
  captions: z.array(captionSchema).default([]),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  videoUrl: "",
  tema: "",
  ctaPalabra: "",
  estiloId: "clasico",
  fps: 30,
  captions: [],
};

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
