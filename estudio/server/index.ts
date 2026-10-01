/**
 * App local del estudio de edición. Corre solo en 127.0.0.1: nada queda
 * expuesto a internet. Express sirve la API; Vite sirve el cliente en dev
 * (ver estudio/client) o los archivos ya construidos en producción.
 */
import express from "express";
import cors from "cors";
import path from "node:path";
import { reelsRouter } from "./routes/reels";
import { ajustesRouter } from "./routes/ajustes";

const app = express();
const PORT = process.env.ESTUDIO_PORT ? Number(process.env.ESTUDIO_PORT) : 4321;

app.use(cors({ origin: /^http:\/\/(127\.0\.0\.1|localhost):\d+$/ }));
app.use(express.json());

app.use("/api/reels", reelsRouter);
app.use("/api/ajustes", ajustesRouter);

app.use("/public", express.static(path.resolve(process.cwd(), "public")));

const clientDist = path.resolve(process.cwd(), "estudio/client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Estudio corriendo en http://127.0.0.1:${PORT}`);
});
