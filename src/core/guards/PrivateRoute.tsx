import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../../shared/components/Loader';

export default function PrivateRoute() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <Loader mensaje="Verificando sesión..." />;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
