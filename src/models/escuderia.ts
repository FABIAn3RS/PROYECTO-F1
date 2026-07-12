export interface Escuderia {
  id: string;
  nombre: string;
  nacionalidad: string | null;
  color: string | null;
  puntos_temporada: number;
  temporada: number;
  created_at: string;
  updated_at: string;
}
