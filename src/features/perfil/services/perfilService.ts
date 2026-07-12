import axiosClient from '../../../core/api/axiosClient';
import type { Rol } from '../../../models';

/** DTO devuelto por GET/PUT /users/me (UsuarioPerfilOut). No es la tabla `usuarios` completa. */
export interface UsuarioPerfil {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  rol: Rol;
  piloto_favorito_id: string | null;
  escuderia_favorita_id: string | null;
  gp_gratis_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function obtenerPerfil(): Promise<UsuarioPerfil> {
  const { data } = await axiosClient.get<UsuarioPerfil>('/users/me');
  return data;
}
