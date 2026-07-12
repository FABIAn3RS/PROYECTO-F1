import { createContext } from 'react';
import type { UsuarioPerfil } from '../../features/perfil/services/perfilService';

export interface AuthContextValue {
  usuario: UsuarioPerfil | null;
  cargando: boolean;
  esAdmin: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
