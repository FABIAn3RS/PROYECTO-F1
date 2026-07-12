import { Link } from 'react-router-dom';
import { useState } from 'react';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';
import { getErrorMessage } from '../../../core/api/apiError';
import { sincronizarTheSportsDb } from '../services/adminService';

const secciones = [
  { to: '/admin/grandes-premios', titulo: 'Grandes Premios', desc: 'Crear, editar y eliminar Grandes Premios.' },
  { to: '/admin/pilotos', titulo: 'Pilotos', desc: 'Crear, editar y eliminar pilotos.' },
  { to: '/admin/escuderias', titulo: 'Escuderías', desc: 'Crear, editar y eliminar escuderías.' },
  { to: '/admin/resultados', titulo: 'Resultados oficiales', desc: 'Registrar el resultado oficial de un Gran Premio.' },
];

export default function AdminHome() {
  const [temporada, setTemporada] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sincronizar = async () => {
    setCargando(true); setError(null); setMensaje(null);
    try {
      const resultado = await sincronizarTheSportsDb(temporada);
      setMensaje(`${resultado.detail} ${resultado.grandes_premios} GP, ${resultado.escuderias} escuderías y ${resultado.pilotos} pilotos agregados.`);
    } catch (err: unknown) { setError(getErrorMessage(err, 'No se pudieron importar los datos.')); }
    finally { setCargando(false); }
  };
  return <div className="stack">
    <div className="page-header"><h1>Administración</h1><p>Gestión de datos maestros de la temporada.</p></div>
    <Card>
      <h2>Importar datos de Fórmula 1</h2>
      <p>Importa manualmente calendario, escuderías y pilotos desde TheSportsDB. Los datos existentes no se modifican.</p>
      <div className="flex-between" style={{ gap: '0.75rem', marginTop: '1rem' }}>
        <div className="form-group" style={{ minWidth: 150 }}><label htmlFor="temporada-sync">Temporada</label><input id="temporada-sync" type="number" value={temporada} onChange={(e) => setTemporada(Number(e.target.value))} /></div>
        <Button onClick={() => void sincronizar()} disabled={cargando}>Importar datos</Button>
      </div>
      {cargando && <Loader mensaje="Importando datos..." />}
      {mensaje && <p className="form-success">{mensaje}</p>}
      {error && <p className="form-error">{error}</p>}
    </Card>
    <div className="grid grid-2">{secciones.map((s) => <Link key={s.to} to={s.to} style={{ textDecoration: 'none' }}><Card><h3>{s.titulo}</h3><p>{s.desc}</p></Card></Link>)}</div>
  </div>;
}
