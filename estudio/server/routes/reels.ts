import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import {
  ASSETS_DIR,
  guardarCaptions,
  guardarGlosario,
  guardarReel,
  leerCaptions,
  leerGlosario,
  leerReel,
  listarReels,
} from "../lib/almacen";
import { correrPipeline } from "../lib/pipeline";
import type { Momento, Pedido, Reel } from "../../shared/tipos";

export const reelsRouter = Router();

const uploadsDir = path.join(ASSETS_DIR, "_subidas");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

reelsRouter.get("/", (_req, res) => {
  res.json(listarReels());
});

reelsRouter.get("/:id", (req, res) => {
  const reel = leerReel(req.params.id);
  if (!reel) return res.status(404).json({ error: "No existe ese reel" });
  res.json({ reel, captions: leerCaptions(req.params.id) });
});

reelsRouter.post("/", upload.single("video"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "Falta el archivo de video" });

  const id = crypto.randomUUID().slice(0, 8);
  const extension = path.extname(req.file.originalname) || ".mp4";
  const rutaConExtension = path.join(uploadsDir, `${id}${extension}`);
  fs.renameSync(req.file.path, rutaConExtension);

  const pedido: Pedido = {
    tema: req.body.tema ?? "",
    ctaPalabra: req.body.ctaPalabra ?? "",
    queMostrarCuandoNombra: req.body.queMostrarCuandoNombra ?? "",
  };

  const reel: Reel = {
    id,
    creadoEn: new Date().toISOString(),
    estado: "subiendo",
    nombreOriginal: req.file.originalname,
    pedido,
    momentos: [],
  };
  guardarReel(reel);

  // El pipeline corre en segundo plano; el cliente consulta GET /:id
  // (polling simple) para ver cuándo pasa a "listo_para_revisar".
  correrPipeline(reel, rutaConExtension).catch((err) => {
    console.error(`Pipeline falló para ${id}:`, err);
  });

  res.status(201).json({ reel });
});

reelsRouter.put("/:id/captions", (req, res) => {
  const reel = leerReel(req.params.id);
  if (!reel) return res.status(404).json({ error: "No existe ese reel" });

  const { captions, momentos, correcciones } = req.body as {
    captions: unknown[];
    momentos?: Momento[];
    correcciones?: Record<string, string>;
  };

  guardarCaptions(req.params.id, captions);

  if (momentos) {
    reel.momentos = momentos;
  }
  reel.estado = "texto_confirmado";
  guardarReel(reel);

  if (correcciones && Object.keys(correcciones).length > 0) {
    const glosario = leerGlosario();
    guardarGlosario({
      ...glosario,
      correcciones: { ...glosario.correcciones, ...correcciones },
    });
  }

  res.json({ reel });
});
