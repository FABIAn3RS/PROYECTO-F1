import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrar } from '../services/authService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

function validarPassword(password: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula.';
  if (!/[0-9]/.test(password)) return 'La contraseña debe tener al menos un número.';
  return null;
}

export default function Registro() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const errorPassword = validarPassword(password);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      await registrar({ nombre, correo, password });
      navigate('/login', { state: { mensaje: 'Cuenta creada correctamente. Ya puedes iniciar sesión.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar el registro.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="page-header">
        <h1>Crear cuenta</h1>
        <p>Regístrate para acceder al calendario, resultados y predicciones de la temporada.</p>
      </div>

      <Card>
        <form className="form" onSubmit={manejarSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-muted">Mínimo 8 caracteres, una mayúscula y un número.</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar contraseña</label>
            <input
              id="confirmarPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
      </Card>

      <p className="text-muted">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
