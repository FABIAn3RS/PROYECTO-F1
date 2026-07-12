import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import EstadoBadge from '../../../shared/components/EstadoBadge';

export default function ResultadosIndex() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarCalendario()
      .then(setGps)
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar el calendario.')))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div>
          <h1>Resultados</h1>
          <p>Resultados oficiales por Gran Premio.</p>
        </div>
        <Link to="/resultados/clasificacion" className="btn btn-secondary btn-sm">
          Ver clasificación del campeonato
        </Link>
      </div>

      {cargando && <Loader mensaje="Cargando Grandes Premios..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && (
        <div className="grid grid-2">
          {gps.map((gp) => (
            <Link key={gp.id} to={`/resultados/${gp.id}`} style={{ textDecoration: 'none' }}>
              <Card>
                <div className="flex-between">
                  <h3>{gp.nombre}</h3>
                  <EstadoBadge estado={gp.estado} />
                </div>
                <p className="text-muted">
                  Ronda {gp.ronda} · Temporada {gp.temporada}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
