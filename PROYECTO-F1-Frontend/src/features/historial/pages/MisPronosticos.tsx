import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerMisEstadisticas, obtenerMisPronosticos } from '../services/historialService';
import type { Estadisticas } from '../services/historialService';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import type { Pronostico } from '../../../models';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';

export default function MisPronosticos() {
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [gps, setGps] = useState<Record<string, GranPremioCalendario>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([obtenerMisPronosticos(), obtenerMisEstadisticas(), listarCalendario()])
      .then(([pronosticosData, estadisticasData, gpsData]) => {
        setPronosticos(pronosticosData);
        setEstadisticas(estadisticasData);
        setGps(Object.fromEntries(gpsData.map((gp) => [gp.id, gp])));
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar tu historial.')))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Loader mensaje="Cargando tu historial..." />;
  if (error) return <p className="form-error">{error}</p>;

  const gpsConPronostico = new Set(pronosticos.map((p) => p.gran_premio_id));
  const proximoGpDisponible = Object.values(gps).find(
    (gp) => gp.estado === 'proximo' && !gpsConPronostico.has(gp.id),
  );

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div>
          <h1>Mis pronósticos</h1>
          <p>Historial, aciertos y puntuación acumulada.</p>
        </div>
        <Link
          to={proximoGpDisponible ? `/pronosticos/${proximoGpDisponible.id}` : '/calendario'}
          className="btn btn-primary"
        >
          + Nuevo pronóstico
        </Link>
      </div>

      {estadisticas && (
        <div className="grid grid-3">
          <Card>
            <p className="text-muted">Puntos totales</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>{estadisticas.puntos_totales}</p>
          </Card>
          <Card>
            <p className="text-muted">Pronósticos confirmados</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {estadisticas.pronosticos_confirmados} / {estadisticas.pronosticos_totales}
            </p>
          </Card>
          <Card>
            <p className="text-muted">Aciertos (podio / pole / vuelta rápida)</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {estadisticas.aciertos_podio} / {estadisticas.aciertos_pole} / {estadisticas.aciertos_vuelta_rapida}
            </p>
          </Card>
        </div>
      )}

      {pronosticos.length === 0 ? (
        <div className="empty-state">Todavía no has creado ningún pronóstico.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Gran Premio</th>
                <th>Estado</th>
                <th>Puntos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pronosticos.map((p) => {
                const gp = gps[p.gran_premio_id];
                return (
                  <tr key={p.id}>
                    <td>{gp ? `${gp.nombre} (Ronda ${gp.ronda})` : p.gran_premio_id}</td>
                    <td>{p.confirmado ? 'Confirmado' : 'Borrador'}</td>
                    <td>{p.puntos_obtenidos}</td>
                    <td>
                      <Link to={`/pronosticos/${p.gran_premio_id}`}>Ver</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
