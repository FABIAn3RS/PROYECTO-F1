export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password_hash: string;
  rol_id: number;
  activo: boolean;
  piloto_favorito_id: string | null;
  escuderia_favorita_id: string | null;
  gp_gratis_id: string | null;
  created_at: string;
  updated_at: string;
}
