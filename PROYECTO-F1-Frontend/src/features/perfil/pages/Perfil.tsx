import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import type { PaseTemporadaInfo } from '../services/perfilService';
import {
  verificarTelefono,
  iniciarKycSession,
  crearCheckoutSession,
  simularPagoExitoso,
  simularWebhookKyc,
  obtenerPase
} from '../services/perfilService';

export default function Perfil() {
  const { usuario, cerrarSesion, refrescarPerfil } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de carga e interfaz
  const [telefono, setTelefono] = useState('');
  const [codigoSMS, setCodigoSMS] = useState('');
  const [smsEnviado, setSmsEnviado] = useState(false);
  const [cargandoTelefono, setCargandoTelefono] = useState(false);
  const [cargandoKyc, setCargandoKyc] = useState(false);
  const [cargandoCheckout, setCargandoCheckout] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Datos del Pase de Temporada
  const [pase, setPase] = useState<PaseTemporadaInfo | null>(null);
  const [cargandoPase, setCargandoPase] = useState(true);

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
          // Limpiar parámetros de búsqueda de la URL
          setSearchParams({});
        });
    }
  }, [searchParams, usuario]);

  if (!usuario) return null;

  async function manejarLogout() {
    await cerrarSesion();
    navigate('/login', { replace: true });
  }

  // Flujo 1: Enviar Código SMS de Prueba
  function enviarCodigoSMS() {
    if (!telefono || telefono.length < 7) {
      setErrorMsg('Por favor, ingresa un número de teléfono válido.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoTelefono(true);

    // Simulamos el envío de SMS por Firebase
    setTimeout(() => {
      setSmsEnviado(true);
      setSuccessMsg('Código de verificación SMS enviado (Código simulación: 123456).');
      setCargandoTelefono(false);
    }, 1000);
  }

  // Flujo 2: Validar Código SMS
  async function confirmarSMS() {
    if (codigoSMS !== '123456') {
      setErrorMsg('Código SMS inválido. Intenta con "123456".');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoTelefono(true);

    try {
      await verificarTelefono(telefono, 'firebase_mock_token_123456');
      setSuccessMsg('¡Teléfono verificado correctamente!');
      setSmsEnviado(false);
      setTelefono('');
      setCodigoSMS('');
      await refrescarPerfil();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al verificar teléfono.');
    } finally {
      setCargandoTelefono(false);
    }
  }

  // Flujo 3: Iniciar KYC con Didit
  async function iniciarKyc() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCargandoKyc(true);

    try {
      const session = await iniciarKycSession();
      setSuccessMsg('Abriendo pantalla de verificación KYC...');
      // En producción esto abre la pasarela de Didit, en sandbox la mockeamos.
      window.open(session.session_url, '_blank');
      // Simulamos que el webhook está en progreso
      await refrescarPerfil();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al iniciar KYC.');
    } finally {
      setCargandoKyc(false);
    }
  }

  // Flujo 4: Simular webhook Didit (Sólo para desarrollo / testing)
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
      setSuccessMsg('Redirigiendo a la pasarela de pago...');
      // Redirigir a Stripe (o URL de simulación en sandbox)
      window.location.href = sesion.checkout_url;
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail ?? 'Error al crear la sesión de pago.');
    } finally {
      setCargandoCheckout(false);
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
      <div className="page-header">
        <h1>Mi perfil de Usuario</h1>
        <p>Gestiona tu información de cuenta, verficación de seguridad y compras.</p>
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

          <Button variante="secondary" onClick={() => void manejarLogout()}>
            Cerrar sesión
          </Button>
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
                      Ingresa tu número de teléfono para recibir un SMS de prueba con Firebase Auth.
                    </p>
                    {!smsEnviado ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="tel"
                          placeholder="+57 300 123 4567"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Button onClick={enviarCodigoSMS} disabled={cargandoTelefono} style={{ padding: '0.4rem 0.8rem' }}>
                          Enviar SMS
                        </Button>
                      </div>
                    ) : (
                      <div className="stack" style={{ gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Código SMS (123456)"
                            value={codigoSMS}
                            onChange={(e) => setCodigoSMS(e.target.value)}
                            style={{ flex: 1, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                          />
                          <Button onClick={() => void confirmarSMS()} disabled={cargandoTelefono}>
                            Confirmar
                          </Button>
                        </div>
                        <button
                          onClick={() => setSmsEnviado(false)}
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
                      
                      {/* Botón de simulación sólo visible en desarrollo/sandbox */}
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
