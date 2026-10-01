import {clasico} from "./Clasico";
import {minimalista} from "./Minimalista";
import {bold} from "./Bold";
import {editorial} from "./Editorial";
import type {Estilo} from "./types";

/**
 * Registro de estilos seleccionables en la app. Para agregar un estilo
 * nuevo (de un reel de referencia, Paso 3 de la guía): crea su archivo
 * aquí al lado, como Clasico.tsx, y agrégalo a este arreglo.
 */
export const estilos: Estilo[] = [clasico, minimalista, bold, editorial];

export const ESTILO_POR_DEFECTO = clasico.id;

export function obtenerEstilo(id: string): Estilo {
  return estilos.find((e) => e.id === id) ?? clasico;
}

export type {Estilo, EstiloProps} from "./types";
