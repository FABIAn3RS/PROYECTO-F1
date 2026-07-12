export interface Pronostico {
  id: string;
  usuario_id: string;
  gran_premio_id: string;
  piloto_p1_id: string | null;
  piloto_p2_id: string | null;
  piloto_p3_id: string | null;
  piloto_pole_id: string | null;
  piloto_vuelta_rapida_id: string | null;
  confirmado: boolean;
  puntos_obtenidos: number;
  created_at: string;
  updated_at: string;
}
