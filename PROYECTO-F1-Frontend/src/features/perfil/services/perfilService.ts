import axiosClient from '../../../core/api/axiosClient';
import type { Rol } from '../../../models';

/** DTO devuelto por GET/PUT /users/me (UsuarioPerfilOut). */
export interface UsuarioPerfil {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  correo_verificado: boolean;
  telefono: string | null;
  telefono_verificado: boolean;
  kyc_estado: string; // 'pendiente' | 'en_progreso' | 'aprobado' | 'rechazado'
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

export async function verificarTelefono(telefono: string, firebaseToken: string): Promise<UsuarioPerfil> {
  const { data } = await axiosClient.post<UsuarioPerfil>('/users/me/verificar-telefono', {
    telefono,
    firebase_token: firebaseToken,
  });
  return data;
}

export interface KycSession {
  session_id: string;
  session_url: string;
  token: string;
}

export async function iniciarKycSession(): Promise<KycSession> {
  const { data } = await axiosClient.post<KycSession>('/users/me/kyc/session');
  return data;
}

export interface CheckoutSession {
  session_id: string;
  checkout_url: string;
}

export async function crearCheckoutSession(successUrl: string, cancelUrl: string): Promise<CheckoutSession> {
  const { data } = await axiosClient.post<CheckoutSession>('/acceso/checkout', {
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return data;
}

export async function simularPagoExitoso(sessionId: string): Promise<{ detail: string; estado: string }> {
  const { data } = await axiosClient.post<{ detail: string; estado: string }>(`/acceso/mock-payment-success/${sessionId}`);
  return data;
}

export async function simularWebhookKyc(userId: string): Promise<{ status: string; kyc_estado: string }> {
  // Call the public webhook directly from frontend to simulate Didit verification approval
  const { data } = await axiosClient.post<{ status: string; kyc_estado: string }>('/users/webhooks/didit', {
    vendor_session_id: userId,
    status: 'approved',
  });
  return data;
}

export interface PaseTemporadaInfo {
  id: string;
  usuario_id: string;
  estado: string; // 'pendiente' | 'activo' | 'fallido' | 'expirado'
  monto: number;
  moneda: string;
  fecha_pago: string | null;
  fecha_expiracion: string | null;
}

export async function obtenerPase(): Promise<PaseTemporadaInfo | null> {
  const { data } = await axiosClient.get<PaseTemporadaInfo | null>('/acceso/pase');
  return data;
}

export async function eliminarCuenta(): Promise<void> {
  await axiosClient.delete('/users/me');
}



