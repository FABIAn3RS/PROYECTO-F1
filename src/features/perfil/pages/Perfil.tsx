import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  async function manejarLogout() {
    await cerrarSesion();
    navigate('/login', { replace: true });
  }

  return (
    <div className="stack" style={{ maxWidth: 480 }}>
      <div className="page-header">
        <h1>Mi perfil</h1>
        <p>Información de tu cuenta.</p>
      </div>

      <Card>
        <div className="stack">
          <div>
            <p className="text-muted">Nombre</p>
            <p>{usuario.nombre}</p>
          </div>
          <div>
            <p className="text-muted">Correo</p>
            <p>{usuario.correo}</p>
          </div>
          <div>
            <p className="text-muted">Rol</p>
            <p style={{ textTransform: 'capitalize' }}>{usuario.rol.nombre}</p>
          </div>
          <div>
            <p className="text-muted">Estado de la cuenta</p>
            <p>{usuario.activo ? 'Activa' : 'Inactiva'}</p>
          </div>
        </div>
      </Card>

      <Button variante="secondary" onClick={() => void manejarLogout()}>
        Cerrar sesión
      </Button>
    </div>
  );
}
