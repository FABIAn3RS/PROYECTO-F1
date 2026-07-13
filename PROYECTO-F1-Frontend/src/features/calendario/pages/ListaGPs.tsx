import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarCalendario } from '../services/calendarioService';
import type { GranPremioCalendario } from '../services/calendarioService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import EstadoBadge from '../../../shared/components/EstadoBadge';

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ListaGPs() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [temporada, setTemporada] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    const filtro = temporada ? Number(temporada) : undefined;
    listarCalendario(filtro)
      .then((data) => {
        if (!cancelado) setGps(data);
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
          <p>Grandes Premios de la temporada.</p>
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label htmlFor="temporada">Temporada</label>
          <input
            id="temporada"
            type="number"
            placeholder="ej. 2026"
            value={temporada}
            onChange={(e) => setTemporada(e.target.value)}
          />
        </div>
      </div>

      {cargando && <Loader mensaje="Cargando calendario..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && gps.length === 0 && (
        <div className="empty-state">No hay Grandes Premios para mostrar.</div>
      )}

      {!cargando && !error && gps.length > 0 && (
        <div className="grid grid-2">
          {gps.map((gp) => (
            <Link key={gp.id} to={`/calendario/${gp.id}`} style={{ textDecoration: 'none' }}>
              <Card>
                <div className="flex-between">
                  <h3>{gp.nombre}</h3>
                  <EstadoBadge estado={gp.estado} />
                </div>
                <p>
                  Ronda {gp.ronda} · {gp.circuito}, {gp.pais}
                </p>
                <p className="text-muted">Carrera: {formatearFecha(gp.fecha_carrera)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
