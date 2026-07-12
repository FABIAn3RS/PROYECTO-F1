import axiosClient from '../../../core/api/axiosClient';
import type { PrediccionGP } from '../../../models';

export type { PrediccionGP, PilotoProbabilidad, NivelConfianza } from '../../../models';

// Predicción algorítmica generada por el backend (módulo `predicciones`) a partir de
// datos reales: clasificación de pilotos/escuderías, historial en el circuito y forma
// reciente. Protegida igual que el detalle del GP (pase de temporada o GP gratis).
export async function obtenerPrediccion(gpId: string): Promise<PrediccionGP> {
  const { data } = await axiosClient.get<PrediccionGP>(`/predicciones/${gpId}`);
  return data;
}
