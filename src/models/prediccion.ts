export type NivelConfianza = 'bajo' | 'medio' | 'alto';

export interface PilotoProbabilidad {
  piloto_id: string;
  nombre: string;
  escuderia: string | null;
  puntaje: number;
  probabilidad: number;
}

export interface PrediccionGP {
  gran_premio_id: string;
  temporada: number;
  generado_en: string;
  ganador_probable: PilotoProbabilidad;
  podio_probable: PilotoProbabilidad[];
  probabilidades: PilotoProbabilidad[];
  nivel_confianza: NivelConfianza;
  observaciones: string[];
}
