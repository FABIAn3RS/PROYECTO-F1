import axiosClient from '../../../core/api/axiosClient';
import type { ResultadoOficial, ResultadoPosicion } from '../../../models';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';

// ResultadoPosicionOut (backend) agrega el piloto relacionado (con su escudería).
export type ResultadoPosicionConPiloto = ResultadoPosicion & { piloto: PilotoConEscuderia | null };

// ResultadoOficialOut (backend): columnas de la tabla + las posiciones ya resueltas.
export type ResultadoOficialConPosiciones = ResultadoOficial & {
  posiciones: ResultadoPosicionConPiloto[];
};

// EP-06: resultados oficiales de un GP. Protegido por verificar_acceso (pase o GP gratis).
export async function obtenerResultadosGP(gpId: string): Promise<ResultadoOficialConPosiciones> {
  const { data } = await axiosClient.get<ResultadoOficialConPosiciones>(
    `/grandes-premios/${gpId}/resultados`,
  );
  return data;
}
