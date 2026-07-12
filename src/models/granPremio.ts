// El estado no es una columna persistida en `grandes_premios`: el backend lo
// calcula al vuelo comparando fecha_inicio/fecha_carrera contra NOW() (ver init.sql).
export type EstadoGP = 'proximo' | 'en_curso' | 'finalizado';

export interface GranPremio {
  id: string;
  nombre: string;
  pais: string;
  circuito: string;
  temporada: number;
  ronda: number;
  fecha_inicio: string;
  fecha_carrera: string;
  created_at: string;
  updated_at: string;
  estado: EstadoGP;
}
