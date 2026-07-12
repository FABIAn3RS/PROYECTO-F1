import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../../features/auth/services/authService';
import { obtenerPerfil } from '../../features/perfil/services/perfilService';
import type { UsuarioPerfil } from '../../features/perfil/services/perfilService';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

const TOKEN_KEY = 'token';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCargando(false);
      return;
    }

    obtenerPerfil()
      .then(setUsuario)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  async function iniciarSesion(correo: string, password: string): Promise<void> {
    const { access_token } = await authService.login(correo, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    const perfil = await obtenerPerfil();
    setUsuario(perfil);
  }

  async function cerrarSesion(): Promise<void> {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUsuario(null);
    }
  }

  async function refrescarPerfil(): Promise<void> {
    try {
      const perfil = await obtenerPerfil();
      setUsuario(perfil);
    } catch {
      // Si falla obtener perfil, asumimos que la sesión expiró o es inválida
      localStorage.removeItem(TOKEN_KEY);
      setUsuario(null);
    }
  }

  const value: AuthContextValue = {
    usuario,
    cargando,
    esAdmin: usuario?.rol.nombre === 'administrador',
    iniciarSesion,
    cerrarSesion,
    refrescarPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
