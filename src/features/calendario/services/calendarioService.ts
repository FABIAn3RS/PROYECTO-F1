import axiosClient from '../../../core/api/axiosClient';
import type { GranPremio } from '../../../models';

// GranPremioListItem/GranPremioDetalle (backend) exponen las columnas de la tabla + el
// estado calculado, pero NO created_at/updated_at.
export type GranPremioCalendario = Omit<GranPremio, 'created_at' | 'updated_at'>;

// HU-08: listado del calendario, siempre público.
export async function listarCalendario(temporada?: number): Promise<GranPremioCalendario[]> {
  const { data } = await axiosClient.get<GranPremioCalendario[]>('/grandes-premios', {
    params: temporada ? { temporada } : undefined,
  });
  return data;
}

// HU-09/HU-10: detalle de un GP, protegido por verificar_acceso (pase o GP gratis).
export async function obtenerDetalleGP(gpId: string): Promise<GranPremioCalendario> {
  const { data } = await axiosClient.get<GranPremioCalendario>(`/grandes-premios/${gpId}`);
  return data;
}
