import { useEffect, useState } from 'react';
import { listarCalendario, type GranPremioCalendario } from '../services/calendarioService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';

const TEMPORADA_ACTUAL = new Date().getFullYear();

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

function estadoEvento(estado: GranPremioCalendario['estado']): string {
  if (estado === 'proximo') return 'Próximo';
  if (estado === 'en_curso') return 'En curso';
  return 'Finalizado';
}

export default function ListaGPs() {
  const [eventos, setEventos] = useState<GranPremioCalendario[]>([]);
  const [temporada, setTemporada] = useState(TEMPORADA_ACTUAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    listarCalendario(temporada)
      .then((data) => { if (!cancelado) setEventos(data); })
      .catch((err: unknown) => { if (!cancelado) setError(getErrorMessage(err, 'No se pudo cargar el calendario.')); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [temporada]);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div><h1>Calendario</h1><p>Grandes Premios registrados para la temporada.</p></div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label htmlFor="temporada">Temporada</label>
          <input id="temporada" type="number" value={temporada} onChange={(e) => setTemporada(Number(e.target.value))} />
        </div>
      </div>
      {cargando && <Loader mensaje="Cargando calendario..." />}
      {error && <p className="form-error">{error}</p>}
      {!cargando && !error && eventos.length === 0 && <div className="empty-state">No hay Grandes Premios para esta temporada.</div>}
      {!cargando && !error && eventos.length > 0 && (
        <div className="table-wrap"><table><thead><tr><th>Ronda</th><th>Gran Premio</th><th>Circuito</th><th>País</th><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>{eventos.map((evento) => <tr key={evento.id}><td>{evento.ronda}</td><td>{evento.nombre}</td><td>{evento.circuito}</td><td>{evento.pais}</td><td>{formatearFecha(evento.fecha_carrera)}</td><td>{estadoEvento(evento.estado)}</td></tr>)}</tbody>
        </table></div>
      )}
    </div>
  );
}
