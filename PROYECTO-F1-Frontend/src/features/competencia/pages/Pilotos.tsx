import { useEffect, useState } from 'react';
import { listarPilotos, type PilotoConEscuderia } from '../services/competenciaService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';

export default function Pilotos() {
  const [busquedaPiloto, setBusquedaPiloto] = useState('');
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    listarPilotos().then(setPilotos).catch((err: unknown) => setError(getErrorMessage(err, 'No se pudieron cargar los pilotos.'))).finally(() => setCargando(false));
  }, []);
  const visibles = pilotos.filter((p) => p.nombre.toLowerCase().includes(busquedaPiloto.trim().toLowerCase()));
  return <div className="stack">
    <div className="page-header"><h1>Pilotos</h1><p>Consulta los pilotos registrados para la temporada.</p></div>
    <div className="flex-between" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
      <input type="search" placeholder="Filtrar piloto (ej. Max Verstappen)" value={busquedaPiloto} onChange={(e) => setBusquedaPiloto(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
      <Button variante="secondary" tamano="sm" onClick={() => setBusquedaPiloto('')}>Limpiar</Button>
    </div>
    {cargando && <Loader mensaje="Cargando pilotos..." />}
    {error && <p className="form-error">{error}</p>}
    {!cargando && !error && visibles.length === 0 && <div className="empty-state">No se encontraron pilotos.</div>}
    {!cargando && !error && visibles.length > 0 && <div className="grid grid-2">{visibles.map((piloto) => <Card key={piloto.id}><h3>{piloto.nombre}</h3><p>{piloto.escuderia?.nombre ?? 'Sin escudería'}</p><p>{piloto.nacionalidad ?? '—'}{piloto.numero ? ` · #${piloto.numero}` : ''}</p></Card>)}</div>}
  </div>;
}
