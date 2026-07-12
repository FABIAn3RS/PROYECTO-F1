import axiosClient from '../../../core/api/axiosClient';
import type { Escuderia } from '../../../models';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';

// ==========================================
// Grandes Premios
// ==========================================
export interface GranPremioPayload {
  nombre: string;
  pais: string;
  circuito: string;
  temporada: number;
  ronda: number;
  fecha_inicio: string;
  fecha_carrera: string;
}

export type GranPremioUpdatePayload = Partial<GranPremioPayload>;

export async function crearGP(datos: GranPremioPayload): Promise<GranPremioCalendario> {
  const { data } = await axiosClient.post<GranPremioCalendario>('/admin/grandes-premios', datos);
  return data;
}

export async function actualizarGP(
  id: string,
  datos: GranPremioUpdatePayload,
): Promise<GranPremioCalendario> {
  const { data } = await axiosClient.put<GranPremioCalendario>(`/admin/grandes-premios/${id}`, datos);
  return data;
}

export async function eliminarGP(id: string): Promise<void> {
  await axiosClient.delete(`/admin/grandes-premios/${id}`);
}

export interface SincronizacionTheSportsDb {
  detail: string;
  grandes_premios: number;
  escuderias: number;
  pilotos: number;
}

export async function sincronizarTheSportsDb(temporada: number): Promise<SincronizacionTheSportsDb> {
  const { data } = await axiosClient.post<SincronizacionTheSportsDb>(
    '/admin/sincronizaciones/thesportsdb', undefined, { params: { temporada } },
  );
  return data;
}

// ==========================================
// Escuderías
// ==========================================
export interface EscuderiaPayload {
  nombre: string;
  nacionalidad: string | null;
  color: string | null;
  temporada: number;
}

export type EscuderiaUpdatePayload = Partial<EscuderiaPayload> & { puntos_temporada?: number };

export async function crearEscuderia(datos: EscuderiaPayload): Promise<Escuderia> {
  const { data } = await axiosClient.post<Escuderia>('/admin/escuderias', datos);
  return data;
}

export async function actualizarEscuderia(id: string, datos: EscuderiaUpdatePayload): Promise<Escuderia> {
  const { data } = await axiosClient.put<Escuderia>(`/admin/escuderias/${id}`, datos);
  return data;
}

export async function eliminarEscuderia(id: string): Promise<void> {
  await axiosClient.delete(`/admin/escuderias/${id}`);
}

// ==========================================
// Pilotos
// ==========================================
export interface PilotoPayload {
  nombre: string;
  nacionalidad: string | null;
  numero: number | null;
  escuderia_id: string | null;
  temporada: number;
}

export type PilotoUpdatePayload = Partial<PilotoPayload> & { puntos_temporada?: number };

export async function crearPiloto(datos: PilotoPayload): Promise<PilotoConEscuderia> {
  const { data } = await axiosClient.post<PilotoConEscuderia>('/admin/pilotos', datos);
  return data;
}

export async function actualizarPiloto(id: string, datos: PilotoUpdatePayload): Promise<PilotoConEscuderia> {
  const { data } = await axiosClient.put<PilotoConEscuderia>(`/admin/pilotos/${id}`, datos);
  return data;
}

export async function eliminarPiloto(id: string): Promise<void> {
  await axiosClient.delete(`/admin/pilotos/${id}`);
}

// ==========================================
// Resultados oficiales
// ==========================================
export interface ResultadoPosicionPayload {
  piloto_id: string;
  posicion: number;
  es_pole: boolean;
  es_vuelta_rapida: boolean;
  puntos_obtenidos: number;
}

export async function registrarResultadosOficiales(
  gpId: string,
  posiciones: ResultadoPosicionPayload[],
): Promise<{ detail: string }> {
  const { data } = await axiosClient.post<{ detail: string }>(`/admin/grandes-premios/${gpId}/resultados`, {
    posiciones,
  });
  return data;
}
