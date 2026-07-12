import { useEffect, useState } from 'react';
import type { TheSportsDbEvent } from '../../../models/theSportsDb';
import { filtrarGrandesPremios, listarEventosTemporadaF1 } from '../../thesportsdb/services/theSportsDbService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';

const TEMPORADA_ACTUAL = new Date().getFullYear();

function formatearFecha(fecha: string, hora?: string | null): string {
  const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const texto = new Date(fecha).toLocaleDateString('es-ES', opciones);
  return hora ? `${texto} · ${hora.slice(0, 5)}` : texto;
}

function estadoEvento(estado: string | null): string {
  if (estado === 'FT') return 'Finalizado';
  if (estado === 'NS') return 'Próximo';
  return estado ?? '—';
}

export default function ListaGPs() {
  const [eventos, setEventos] = useState<TheSportsDbEvent[]>([]);
  const [temporada, setTemporada] = useState(TEMPORADA_ACTUAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    listarEventosTemporadaF1(temporada)
      .then((data) => {
        if (!cancelado) setEventos(filtrarGrandesPremios(data));
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudo cargar el calendario.'));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [temporada]);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div>
          <h1>Calendario</h1>
          <p>Grandes Premios de la temporada desde TheSportsDB.</p>
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label htmlFor="temporada">Temporada</label>
          <input
            id="temporada"
            type="number"
            value={temporada}
            onChange={(e) => setTemporada(Number(e.target.value))}
          />
        </div>
      </div>

      {cargando && <Loader mensaje="Cargando calendario..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && eventos.length === 0 && (
        <div className="empty-state">No hay Grandes Premios para esta temporada.</div>
      )}

      {!cargando && !error && eventos.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ronda</th>
                <th>Gran Premio</th>
                <th>Circuito</th>
                <th>País</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.idEvent}>
                  <td>{evento.intRound ?? '—'}</td>
                  <td>{evento.strEvent}</td>
                  <td>{evento.strVenue ?? '—'}</td>
                  <td>{evento.strCountry ?? '—'}</td>
                  <td>{formatearFecha(evento.dateEvent, evento.strTime)}</td>
                  <td>{estadoEvento(evento.strStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
