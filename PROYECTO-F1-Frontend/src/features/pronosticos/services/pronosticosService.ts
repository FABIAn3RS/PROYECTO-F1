import axiosClient from '../../../core/api/axiosClient';
import type { Pronostico } from '../../../models';

export interface PronosticoPayload {
  gran_premio_id: string;
  piloto_p1_id: string | null;
  piloto_p2_id: string | null;
  piloto_p3_id: string | null;
  piloto_pole_id: string | null;
  piloto_vuelta_rapida_id: string | null;
}

export type PronosticoUpdatePayload = Omit<PronosticoPayload, 'gran_premio_id'>;

// HU-15 a HU-18: crear mi pronóstico (ganador/pole/podio/vuelta rápida) para un GP.
export async function crearPronostico(datos: PronosticoPayload): Promise<Pronostico> {
  const { data } = await axiosClient.post<Pronostico>('/pronosticos', datos);
  return data;
}

// Obtiene mi pronóstico ya creado para un GP puntual (404 si aún no existe).
export async function obtenerPronosticoDeGP(gpId: string): Promise<Pronostico> {
  const { data } = await axiosClient.get<Pronostico>(`/pronosticos/gp/${gpId}`);
  return data;
}

// HU-19: editar mi pronóstico mientras no esté confirmado y el plazo siga abierto.
export async function actualizarPronostico(
  pronosticoId: string,
  datos: PronosticoUpdatePayload,
): Promise<Pronostico> {
  const { data } = await axiosClient.put<Pronostico>(`/pronosticos/${pronosticoId}`, datos);
  return data;
}

// HU-20: confirmar mi pronóstico (ya no se podrá editar).
export async function confirmarPronostico(pronosticoId: string): Promise<Pronostico> {
  const { data } = await axiosClient.post<Pronostico>(`/pronosticos/${pronosticoId}/confirmar`);
  return data;
}
