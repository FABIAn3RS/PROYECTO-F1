import { Routes, Route } from 'react-router-dom';
import Layout from './shared/components/Layout';
import PrivateRoute from './core/guards/PrivateRoute';
import AdminRoute from './core/guards/AdminRoute';
import Home from './features/home/pages/Home';
import Login from './features/auth/pages/Login';
import Registro from './features/auth/pages/Registro';
import VerificarCorreo from './features/auth/pages/VerificarCorreo';
import ListaGPs from './features/calendario/pages/ListaGPs';
import DetalleGP from './features/calendario/pages/DetalleGP';
import Pilotos from './features/competencia/pages/Pilotos';
import Escuderias from './features/competencia/pages/Escuderias';
import ResultadosIndex from './features/resultados/pages/ResultadosIndex';
import ResultadosGP from './features/resultados/pages/ResultadosGP';
import ClasificacionCampeonato from './features/resultados/pages/ClasificacionCampeonato';
import Predicciones from './features/predicciones/pages/Predicciones';
import AdminHome from './features/admin/pages/AdminHome';
import GestionGPs from './features/admin/pages/GestionGPs';
import GestionPilotos from './features/admin/pages/GestionPilotos';
import GestionEscuderias from './features/admin/pages/GestionEscuderias';
import RegistrarResultados from './features/admin/pages/RegistrarResultados';
import Perfil from './features/perfil/pages/Perfil';
import Equipos from './features/thesportsdb/pages/Equipos';
import MiPronostico from './features/pronosticos/pages/MiPronostico';
import MisPronosticos from './features/historial/pages/MisPronosticos';
import Ranking from './features/historial/pages/Ranking';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/verificar-correo" element={<VerificarCorreo />} />
        <Route path="/calendario" element={<ListaGPs />} />
        <Route path="/calendario/:id" element={<DetalleGP />} />
        <Route path="/pilotos" element={<Pilotos />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/escuderias" element={<Escuderias />} />
        <Route path="/resultados" element={<ResultadosIndex />} />
        <Route path="/resultados/clasificacion" element={<ClasificacionCampeonato />} />
        <Route path="/resultados/:id" element={<ResultadosGP />} />
        <Route path="/predicciones" element={<Predicciones />} />
        <Route path="/ranking" element={<Ranking />} />

        <Route element={<PrivateRoute />}>
          <Route path="/pronosticos/:id" element={<MiPronostico />} />
          <Route path="/historial" element={<MisPronosticos />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/grandes-premios" element={<GestionGPs />} />
          <Route path="/admin/pilotos" element={<GestionPilotos />} />
          <Route path="/admin/escuderias" element={<GestionEscuderias />} />
          <Route path="/admin/resultados" element={<RegistrarResultados />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
