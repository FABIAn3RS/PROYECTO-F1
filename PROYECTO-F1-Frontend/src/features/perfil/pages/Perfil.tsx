import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { auth } from '../../../core/firebase/firebaseConfig';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import type { PaseTemporadaInfo } from '../services/perfilService';
import {
  verificarTelefono,
  iniciarKycSession,
  crearCheckoutSession,
  simularPagoExitoso,
  simularWebhookKyc,
  obtenerPase,
  eliminarCuenta
} from '../services/perfilService';

export default function Perfil() {
  const { usuario, cerrarSesion, refrescarPerfil } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Firebase Auth states
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Estados de carga e interfaz
  const [telefono, setTelefono] = useState('');
  const [codigoSMS, setCodigoSMS] = useState('');
  const [smsEnviado, setSmsEnviado] = useState(false);
  const [cargandoTelefono, setCargandoTelefono] = useState(false);
  const [cargandoKyc, setCargandoKyc] = useState(false);
  const [cargandoCheckout, setCargandoCheckout] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Datos del Pase de Temporada
  const [pase, setPase] = useState<PaseTemporadaInfo | null>(null);
  const [cargandoPase, setCargandoPase] = useState(true);

  // Inicializar Recaptcha invisible de Firebase
  useEffect(() => {
    if (!usuario) return;
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solucionado
        }
      });
      setRecaptchaVerifier(verifier);

      return () => {
        verifier.clear();
      };
    } catch (err) {
      console.error('Error initializing recaptcha verifier:', err);
    }
  }, [usuario]);

  // Cargar estado de Pase de Temporada
  useEffect(() => {
    if (!usuario) return;
    obtenerPase()
      .then(setPase)
      .catch(console.error)
      .finally(() => setCargandoPase(false));
  }, [usuario]);

  // Manejar Callback de Pago
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && usuario) {
      setSuccessMsg('Procesando confirmación de pago...');
      simularPagoExitoso(sessionId)
        .then(() => {
          setSuccessMsg('¡Pago completado con éxito! Tu Pase de Temporada ahora está activo.');
          refrescarPerfil();
          return obtenerPase();
        })
        .then(setPase)
        .catch((err) => {
          setErrorMsg('No se pudo verificar el pago. Contacta a soporte.');
          console.error(err);
        })
        .finally(() => {
          setSearchParams({});
        });
    }
  }, [searchParams, usuario]);

  if (!usuario) return null;

  async function manejarLogout() {
    await cerrarSesion();
    navigate('/login', { replace: true });
  }

  // Flujo 1: Enviar Código SMS Real con Firebase
  async function enviarCodigoSMS() {
    if (!telefono || telefono.length < 7) {
      setErrorMsg('Por favor, ingresa un número de teléfono válido.');
      return;
    }
    if (!recaptchaVerifier) {
      setErrorMsg('El sistema de verificación (reCAPTCHA) no está listo. Recarga la página.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoTelefono(true);

    try {
      // Normalizar formato E.164 (ej: +573001234567 o +34600000000)
      const formatPhone = telefono.startsWith('+') ? telefono.trim() : `+${telefono.replace(/[\s()-]+/g, '')}`;
      const result = await signInWithPhoneNumber(auth, formatPhone, recaptchaVerifier);
      setConfirmationResult(result);
      setSmsEnviado(true);
      setSuccessMsg('Código de verificación SMS enviado por Firebase.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        'Error al enviar el SMS. Asegúrate de incluir el código de país (ejemplo: +573001234567).'
      );
    } finally {
      setCargandoTelefono(false);
    }
  }

  // Flujo 2: Validar Código SMS Real con Firebase
  async function confirmarSMS() {
    if (!codigoSMS || codigoSMS.length !== 6) {
      setErrorMsg('Por favor, ingresa el código de 6 dígitos.');
      return;
    }
    if (!confirmationResult) {
      setErrorMsg('Sesión de verificación no encontrada. Intenta enviar el SMS nuevamente.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoTelefono(true);

    try {
      // Confirmar el código SMS en Firebase
      const result = await confirmationResult.confirm(codigoSMS);
      const firebaseToken = await result.user.getIdToken();

      // Enviar el token y el teléfono al backend
      await verificarTelefono(telefono, firebaseToken);
      setSuccessMsg('¡Teléfono verificado correctamente con Firebase!');
      setSmsEnviado(false);
      setTelefono('');
      setCodigoSMS('');
      setConfirmationResult(null);
      await refrescarPerfil();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Código de verificación SMS incorrecto o expirado.');
    } finally {
      setCargandoTelefono(false);
    }
  }

  // Flujo 3: Iniciar KYC Real con Didit
  async function iniciarKyc() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoKyc(true);

    try {
      const session = await iniciarKycSession();
      setSuccessMsg('Abriendo pestaña externa de validación de identidad (Didit)...');
      window.open(session.session_url, '_blank');
      // Refrescar perfil para ver si el webhook ya resolvió en paralelo
      setTimeout(() => {
        refrescarPerfil().catch(console.error);
      }, 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al iniciar KYC.');
    } finally {
      setCargandoKyc(false);
    }
  }

  // Flujo 4: Simular webhook Didit (Para pruebas / testing rápido en sandbox)
  async function simularWebhookAprobacion() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoKyc(true);

    try {
      await simularWebhookKyc(usuario!.id);
      setSuccessMsg('¡Simulación de Webhook Didit enviada! Identidad aprobada.');
      await refrescarPerfil();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al simular webhook.');
    } finally {
      setCargandoKyc(false);
    }
  }

  // Flujo 5: Checkout del Pase de Temporada (Depósito)
  async function comprarPase() {
    if (!usuario!.telefono_verificado || usuario!.kyc_estado !== 'aprobado') {
      setErrorMsg('Debes verificar tu teléfono y tu identidad (KYC) para poder realizar depósitos.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoCheckout(true);

    const successUrl = window.location.origin + '/perfil';
    const cancelUrl = window.location.origin + '/perfil';

    try {
      const sesion = await crearCheckoutSession(successUrl, cancelUrl);
      setSuccessMsg('Redirigiendo a la pasarela de pago de Stripe...');
      window.location.href = sesion.checkout_url;
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al crear la sesión de pago.');
    } finally {
      setCargandoCheckout(false);
    }
  }

  // Eliminar mi cuenta (Para facilitar pruebas de registro)
  async function manejarEliminarCuenta() {
    if (!window.confirm('¿Estás seguro de que deseas eliminar tu cuenta permanentemente para volver a probar desde el registro?')) {
      return;
    }
    setEliminando(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await eliminarCuenta();
      alert('Tu cuenta ha sido eliminada con éxito. Serás redirigido.');
      await cerrarSesion();
      navigate('/registro', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al eliminar cuenta.');
      setEliminando(false);
    }
  }

  // Badges y Clases para KYC
  const kycConfig: Record<string, { label: string; color: string }> = {
    pendiente: { label: 'Pendiente ⚠️', color: '#b45309' },
    en_progreso: { label: 'En progreso ⏳', color: '#3b82f6' },
    aprobado: { label: 'Aprobado ✓', color: '#1f9d55' },
    rechazado: { label: 'Rechazado ❌', color: '#ef4444' },
  };

  const currentKyc = kycConfig[usuario.kyc_estado] || { label: usuario.kyc_estado, color: '#6b7280' };

  return (
    <div className="stack" style={{ maxWidth: 800, margin: '1.5rem auto' }}>
      {/* Contenedor invisible para recaptcha de Firebase */}
      <div id="recaptcha-container"></div>

      <div className="page-header">
        <h1>Mi perfil de Usuario</h1>
        <p>Gestiona tu información de cuenta, verificación de seguridad y compras.</p>
      </div>

      {errorMsg && <p className="form-error">{errorMsg}</p>}
      {successMsg && <p className="form-success">{successMsg}</p>}

      <div className="grid grid-2">
        {/* Columna 1: Info Cuenta */}
        <div className="stack">
          <Card>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-700)', paddingBottom: '0.5rem' }}>
              Información Personal
            </h2>
            <div className="stack" style={{ gap: '0.85rem' }}>
              <div>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Nombre</p>
                <p style={{ fontWeight: '500' }}>{usuario.nombre}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Correo electrónico</p>
                <p style={{ fontWeight: '500' }}>{usuario.correo} <span style={{ color: '#1f9d55', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Verificado ✓)</span></p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Rol en plataforma</p>
                <p style={{ textTransform: 'capitalize', fontWeight: '500' }}>{usuario.rol.nombre}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Miembro desde</p>
                <p style={{ fontWeight: '500' }}>{new Date(usuario.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variante="secondary" onClick={() => void manejarLogout()} style={{ flex: 1 }}>
              Cerrar sesión
            </Button>
            <Button
              onClick={() => void manejarEliminarCuenta()}
              disabled={eliminando}
              style={{
                backgroundColor: 'transparent',
                borderColor: '#ef4444',
                color: '#ef4444',
                flex: 1
              }}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar cuenta'}
            </Button>
          </div>
        </div>

        {/* Columna 2: Seguridad y KYC */}
        <div className="stack">
          <Card>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-700)', paddingBottom: '0.5rem' }}>
              Verificaciones de Seguridad
            </h2>
            <div className="stack" style={{ gap: '1.25rem' }}>
              
              {/* Teléfono */}
              <div style={{ borderBottom: '1px solid #2a2e3a', paddingBottom: '1rem' }}>
                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <p style={{ fontWeight: '600' }}>1. Verificación Telefónica</p>
                  {usuario.telefono_verificado ? (
                    <span style={{ color: '#1f9d55', fontSize: '0.9rem', fontWeight: 'bold' }}>Verificado ✓</span>
                  ) : (
                    <span style={{ color: '#b45309', fontSize: '0.9rem', fontWeight: 'bold' }}>Requerido ⚠️</span>
                  )}
                </div>

                {usuario.telefono_verificado ? (
                  <p className="text-muted">Teléfono asociado: <strong>{usuario.telefono}</strong></p>
                ) : (
                  <div className="stack" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem' }} className="text-muted">
                      Ingresa tu número (ej: +573001234567) para recibir un código de confirmación SMS real.
                    </p>
                    {!smsEnviado ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="tel"
                          placeholder="+573001234567"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Button onClick={() => void enviarCodigoSMS()} disabled={cargandoTelefono} style={{ padding: '0.4rem 0.8rem' }}>
                          {cargandoTelefono ? 'Enviando...' : 'Enviar SMS'}
                        </Button>
                      </div>
                    ) : (
                      <div className="stack" style={{ gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Introduce el código de 6 dígitos"
                            value={codigoSMS}
                            onChange={(e) => setCodigoSMS(e.target.value)}
                            style={{ flex: 1, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                          />
                          <Button onClick={() => void confirmarSMS()} disabled={cargandoTelefono}>
                            Confirmar
                          </Button>
                        </div>
                        <button
                          onClick={() => {
                            setSmsEnviado(false);
                            setConfirmationResult(null);
                          }}
                          style={{ background: 'none', border: 'none', color: '#e10600', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}
                        >
                          Cambiar número de teléfono
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* KYC */}
              <div>
                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <p style={{ fontWeight: '600' }}>2. Verificación de Identidad (KYC)</p>
                  <span style={{
                    backgroundColor: currentKyc.color + '20',
                    color: currentKyc.color,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    border: `1px solid ${currentKyc.color}40`
                  }}>
                    {currentKyc.label}
                  </span>
                </div>

                {usuario.kyc_estado === 'aprobado' ? (
                  <p className="text-muted">Tu identidad ha sido verificada satisfactoriamente con Didit.</p>
                ) : (
                  <div className="stack" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem' }} className="text-muted">
                      Completa tu KYC (cédula y selfie biométrica) usando el protocolo Didit de manera segura.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button onClick={() => void iniciarKyc()} disabled={cargandoKyc}>
                        {cargandoKyc ? 'Iniciando...' : 'Verificar con Didit'}
                      </Button>
                      
                      {/* Botón de simulación para acelerar pruebas sandbox en desarrollo */}
                      <Button
                        variante="secondary"
                        onClick={() => void simularWebhookAprobacion()}
                        disabled={cargandoKyc}
                        style={{ borderStyle: 'dashed', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                      >
                        Simular Webhook Didit
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </Card>
        </div>
      </div>

      {/* Tarjeta de Depósito / Pase de Temporada */}
      <Card style={{ marginTop: '1.5rem', border: '1px solid #e1060040', position: 'relative', overflow: 'hidden' }}>
        {/* Decoración premium estilo F1 */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'linear-gradient(135deg, transparent 40%, #e10600 100%)',
          width: '120px',
          height: '120px',
          opacity: 0.15,
          pointerEvents: 'none'
        }} />

        <div className="stack" style={{ gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#e10600', fontWeight: 'bold' }}>Pase de Temporada (Depósitos)</h2>
            <p>El Pase de Temporada te otorga acceso total e ilimitado a todos los Grandes Premios, pronósticos y estadísticas exclusivas.</p>
          </div>

          {cargandoPase ? (
            <p className="text-muted">Cargando estado de pase...</p>
          ) : pase && pase.estado === 'activo' ? (
            <div style={{
              backgroundColor: '#1f9d5515',
              border: '1px solid #1f9d5540',
              borderRadius: '6px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '2rem' }}>🎟️</div>
              <div>
                <p style={{ color: '#1f9d55', fontWeight: 'bold', fontSize: '1.1rem' }}>¡Tienes el Pase de Temporada Activo!</p>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Vence el: {pase.fecha_expiracion ? new Date(pase.fecha_expiracion).toLocaleDateString() : 'N/A'} (Pago: {pase.monto} {pase.moneda.toUpperCase()})
                </p>
              </div>
            </div>
          ) : (
            <div className="stack" style={{ gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem' }}>
                    Precio: <strong style={{ fontSize: '1.2rem', color: 'white' }}>$20.00 USD</strong>
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Vigencia: 1 año completo desde la fecha de compra.
                  </p>
                </div>

                <div>
                  {(!usuario.telefono_verificado || usuario.kyc_estado !== 'aprobado') ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <Button disabled={true}>
                        💳 Comprar Pase (Bloqueado)
                      </Button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: '500' }}>
                        * Requiere teléfono y KYC verificado
                      </span>
                    </div>
                  ) : (
                    <Button onClick={() => void comprarPase()} disabled={cargandoCheckout} style={{ background: '#e10600', color: 'white', minWidth: '180px' }}>
                      {cargandoCheckout ? 'Cargando Pago...' : '💳 Comprar con Stripe'}
                    </Button>
                  )}
                </div>
              </div>

              {(!usuario.telefono_verificado || usuario.kyc_estado !== 'aprobado') && (
                <div style={{
                  backgroundColor: 'rgba(180, 83, 9, 0.08)',
                  border: '1px dotted rgba(180, 83, 9, 0.4)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#d97706'
                }}>
                  🔒 <strong>Restricción de Cumplimiento:</strong> De acuerdo con las normas de seguridad del prototipo F1, debes completar las verificaciones del bloque superior para habilitar el flujo de compras y depósitos.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
