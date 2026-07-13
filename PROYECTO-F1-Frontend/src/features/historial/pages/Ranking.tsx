import { useEffect, useState } from 'react';
import { obtenerRanking } from '../services/historialService';
import type { RankingItem } from '../services/historialService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerRanking()
      .then(setRanking)
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar el ranking.')))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Ranking</h1>
        <p>Clasificación de usuarios por puntos acumulados en sus pronósticos.</p>
      </div>

      {cargando && <Loader mensaje="Cargando ranking..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && ranking.length === 0 && (
        <div className="empty-state">Todavía no hay pronósticos puntuados.</div>
      )}

      {!cargando && !error && ranking.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item) => (
                <tr key={`${item.posicion_ranking}-${item.nombre}`}>
                  <td>{item.posicion_ranking}</td>
                  <td>{item.nombre}</td>
                  <td>{item.puntos_totales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
