import { Router } from "express";
import {
  guardarAjustes,
  guardarGlosario,
  leerAjustes,
  leerGlosario,
} from "../lib/almacen";

export const ajustesRouter = Router();

ajustesRouter.get("/", (_req, res) => {
  res.json({ ajustes: leerAjustes(), glosario: leerGlosario() });
});

ajustesRouter.put("/", (req, res) => {
  const { ajustes, glosario } = req.body;
  if (ajustes) guardarAjustes(ajustes);
  if (glosario) guardarGlosario(glosario);
  res.json({ ajustes: leerAjustes(), glosario: leerGlosario() });
});
