import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../../shared/components/Loader';

export default function AdminRoute() {
  const { usuario, cargando, esAdmin } = useAuth();

  if (cargando) {
    return <Loader mensaje="Verificando permisos..." />;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
