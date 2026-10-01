import { z } from "zod";

const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const reelPropsSchema = z.object({
  reelId: z.string(),
  tema: z.string(),
  ctaPalabra: z.string(),
  fps: z.number().default(30),
  // Se llena en calculateMetadata (fetch de public/captions-<reelId>.json);
  // el componente nunca toca el sistema de archivos, solo lee este prop.
  captions: z.array(captionSchema).default([]),
});

export type ReelProps = z.infer<typeof reelPropsSchema>;
