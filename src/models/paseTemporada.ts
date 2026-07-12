export type EstadoPase = 'pendiente' | 'activo' | 'fallido' | 'expirado';

export interface PaseTemporada {
  id: string;
  usuario_id: string;
  estado: EstadoPase;
  monto: number;
  moneda: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  fecha_pago: string | null;
  fecha_expiracion: string | null;
  created_at: string;
  updated_at: string;
}
