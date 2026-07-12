import axiosClient from '../../../core/api/axiosClient';
import type { Escuderia, Piloto } from '../../../models';

// PilotoOut (backend) agrega la escudería relacionada, además de las columnas de la tabla.
export type PilotoConEscuderia = Piloto & { escuderia: Escuderia | null };

// HU-11: listado de pilotos.
export async function listarPilotos(temporada?: number): Promise<PilotoConEscuderia[]> {
  const { data } = await axiosClient.get<PilotoConEscuderia[]>('/pilotos', {
    params: temporada ? { temporada } : undefined,
  });
  return data;
}

// HU-13: clasificación de pilotos (ordenada por puntos_temporada desc).
export async function clasificacionPilotos(temporada: number): Promise<PilotoConEscuderia[]> {
  const { data } = await axiosClient.get<PilotoConEscuderia[]>('/pilotos/clasificacion', {
    params: { temporada },
  });
  return data;
}

// HU-12: listado de escuderías.
export async function listarEscuderias(temporada?: number): Promise<Escuderia[]> {
  const { data } = await axiosClient.get<Escuderia[]>('/escuderias', {
    params: temporada ? { temporada } : undefined,
  });
  return data;
}

// HU-14: clasificación de constructores (ordenada por puntos_temporada desc).
export async function clasificacionEscuderias(temporada: number): Promise<Escuderia[]> {
  const { data } = await axiosClient.get<Escuderia[]>('/escuderias/clasificacion', {
    params: { temporada },
  });
  return data;
}
