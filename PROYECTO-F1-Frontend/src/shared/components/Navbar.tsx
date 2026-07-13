import { NavLink } from 'react-router-dom';
import { useAuth } from '../../core/hooks/useAuth';
import Button from './Button';

const linksPublicos = [
  { to: '/calendario', label: 'Calendario' },
  { to: '/pilotos', label: 'Pilotos' },
  { to: '/equipos', label: 'Equipos' },
  { to: '/escuderias', label: 'Escuderías' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/predicciones', label: 'Predicciones' },
  { to: '/ranking', label: 'Ranking' },
];

function claseLink({ isActive }: { isActive: boolean }): string {
  return `navbar__link${isActive ? ' navbar__link--active' : ''}`;
}

export default function Navbar() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        <span className="navbar__logo">F1</span>
        F1Cast
      </NavLink>

      <div className="navbar__links">
        {linksPublicos.map((link) => (
          <NavLink key={link.to} to={link.to} className={claseLink}>
            {link.label}
          </NavLink>
        ))}

        {usuario && (
          <NavLink to="/historial" className={claseLink}>
            Mis pronósticos
          </NavLink>
        )}

        {esAdmin && (
          <NavLink to="/admin" className={claseLink}>
            Administración
          </NavLink>
        )}
      </div>

      <div className="navbar__user">
        {usuario ? (
          <>
            <NavLink to="/perfil" className={claseLink}>
              {usuario.nombre}
            </NavLink>
            <Button variante="secondary" tamano="sm" onClick={() => void cerrarSesion()}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="navbar__link">
              Ingresar
            </NavLink>
            <NavLink to="/registro" className="navbar__link">
              Registrarse
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
