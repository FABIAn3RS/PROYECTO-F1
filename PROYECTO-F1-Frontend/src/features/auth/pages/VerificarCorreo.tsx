import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail, resendCode } from '../services/authService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

interface LocationState {
  mensaje?: string;
}

export default function VerificarCorreo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const state = location.state as LocationState | null;

  const [correo, setCorreo] = useState(emailParam);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(state?.mensaje ?? null);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [contadorResend, setContadorResend] = useState(0);

  useEffect(() => {
    if (contadorResend > 0) {
      const timer = setTimeout(() => setContadorResend(contadorResend - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [contadorResend]);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensajeExito(null);
    setEnviando(true);

    try {
      await verifyEmail(correo, codigo);
      navigate('/login', {
        state: { mensaje: '¡Correo verificado con éxito! Ya puedes iniciar sesión con tu cuenta.' },
        replace: true
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido, expirado o ya utilizado.'));
    } finally {
      setEnviando(false);
    }
  }

  async function manejarReenvio() {
    if (contadorResend > 0) return;
    setError(null);
    setMensajeExito(null);
    setReenviando(true);

    try {
      await resendCode(correo);
      setMensajeExito('Se ha enviado un nuevo código de verificación a tu correo.');
      setContadorResend(60); // 1 minute cooldown
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo reenviar el código. Inténtalo más tarde.'));
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#e10600', fontWeight: 'bold' }}>Verifica tu correo</h1>
        <p>Introduce el código de 6 dígitos enviado a tu dirección de correo electrónico.</p>
      </div>

      <Card>
        <form className="form" onSubmit={manejarSubmit}>
          {error && <p className="form-error">{error}</p>}
          {mensajeExito && <p className="form-success">{mensajeExito}</p>}

          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              required
              disabled={!!emailParam}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="codigo">Código de 6 dígitos</label>
            <input
              id="codigo"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              style={{
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                fontWeight: 'bold'
              }}
            />
          </div>

          <Button type="submit" disabled={enviando || codigo.length !== 6}>
            {enviando ? 'Verificando...' : 'Verificar código'}
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            ¿No recibiste el correo?{' '}
            <button
              onClick={manejarReenvio}
              disabled={reenviando || contadorResend > 0}
              style={{
                background: 'none',
                border: 'none',
                color: contadorResend > 0 ? '#888' : '#e10600',
                textDecoration: contadorResend > 0 ? 'none' : 'underline',
                cursor: contadorResend > 0 ? 'default' : 'pointer',
                padding: 0,
                font: 'inherit',
                fontWeight: 'bold'
              }}
            >
              {reenviando
                ? 'Reenviando...'
                : contadorResend > 0
                ? `Reenviar en ${contadorResend}s`
                : 'Reenviar código'}
            </button>
          </p>
        </div>
      </Card>

      <p className="text-muted" style={{ textAlign: 'center' }}>
        ¿Quieres regresar? <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </div>
  );
}
