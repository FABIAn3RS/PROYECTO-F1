export interface Piloto {
  id: string;
  nombre: string;
  nacionalidad: string | null;
  numero: number | null;
  escuderia_id: string | null;
  puntos_temporada: number;
  temporada: number;
  created_at: string;
  updated_at: string;
}
