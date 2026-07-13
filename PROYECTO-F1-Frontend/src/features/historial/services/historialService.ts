import axiosClient from '../../../core/api/axiosClient';
import type { Pronostico } from '../../../models';

// HU-23: historial de pronósticos del usuario autenticado.
export async function obtenerMisPronosticos(): Promise<Pronostico[]> {
  const { data } = await axiosClient.get<Pronostico[]>('/users/me/pronosticos');
  return data;
}

// HU-24/HU-25: aciertos, fallos y puntuación acumulada del usuario autenticado.
export interface Estadisticas {
  pronosticos_totales: number;
  pronosticos_confirmados: number;
  puntos_totales: number;
  aciertos_pole: number;
  aciertos_vuelta_rapida: number;
  aciertos_podio: number;
}

export async function obtenerMisEstadisticas(): Promise<Estadisticas> {
  const { data } = await axiosClient.get<Estadisticas>('/users/me/estadisticas');
  return data;
}

// HU-26: ranking global de usuarios por puntos, público.
export interface RankingItem {
  nombre: string;
  puntos_totales: number;
  posicion_ranking: number;
}

export async function obtenerRanking(): Promise<RankingItem[]> {
  const { data } = await axiosClient.get<RankingItem[]>('/ranking');
  return data;
}
