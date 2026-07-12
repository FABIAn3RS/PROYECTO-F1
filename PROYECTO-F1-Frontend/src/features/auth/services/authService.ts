import axiosClient from '../../../core/api/axiosClient';
import type { Rol } from '../../../models';

export interface RegistroPayload {
  nombre: string;
  correo: string;
  password: string;
}

export interface UsuarioRegistrado {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  rol: Rol;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// HU-01
export async function registrar(datos: RegistroPayload): Promise<UsuarioRegistrado> {
  const { data } = await axiosClient.post<UsuarioRegistrado>('/auth/register', datos);
  return data;
}

// HU-02: /auth/login usa OAuth2PasswordRequestForm -> form-urlencoded, campo "username"
export async function login(correo: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set('username', correo);
  body.set('password', password);

  const { data } = await axiosClient.post<TokenResponse>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

// HU-04
export async function logout(): Promise<void> {
  await axiosClient.post('/auth/logout');
}

export async function verifyEmail(correo: string, codigo: string): Promise<void> {
  await axiosClient.post('/auth/verify-email', { correo, codigo });
}

export async function resendCode(correo: string): Promise<void> {
  await axiosClient.post('/auth/resend-code', { correo });
}

