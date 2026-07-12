import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

interface LocationState {
  from?: { pathname: string };
  mensaje?: string;
}

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(correo, password);
      const destino = state?.from?.pathname ?? '/';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="page-header">
        <h1>Iniciar sesión</h1>
        <p>Accede a tu cuenta para ver el calendario, resultados y predicciones.</p>
      </div>

      <Card>
        {state?.mensaje && <p className="form-success" style={{ marginBottom: '1rem' }}>{state.mensaje}</p>}

        <form className="form" onSubmit={manejarSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </Card>

      <p className="text-muted">
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </div>
  );
}
