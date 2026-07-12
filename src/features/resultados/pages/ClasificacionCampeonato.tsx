import { useEffect, useState } from 'react';
import {
  clasificacionEscuderias,
  clasificacionPilotos,
} from '../../competencia/services/competenciaService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import type { Escuderia } from '../../../models';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';

const TEMPORADA_ACTUAL = new Date().getFullYear();

export default function ClasificacionCampeonato() {
  const [temporada, setTemporada] = useState(TEMPORADA_ACTUAL);
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    Promise.all([clasificacionPilotos(temporada), clasificacionEscuderias(temporada)])
      .then(([pilotosData, escuderiasData]) => {
        if (cancelado) return;
        setPilotos(pilotosData);
        setEscuderias(escuderiasData);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudo cargar la clasificación.'));
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
          <h1>Clasificación del campeonato</h1>
          <p>Puntos acumulados en la temporada.</p>
        </div>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label htmlFor="temporada">Temporada</label>
          <input
            id="temporada"
            type="number"
            value={temporada}
            onChange={(e) => setTemporada(Number(e.target.value))}
          />
        </div>
      </div>

      {cargando && <Loader mensaje="Cargando clasificación..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && (
        <div className="grid grid-2">
          <Card>
            <h3>Pilotos</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Piloto</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {pilotos.map((piloto, index) => (
                    <tr key={piloto.id}>
                      <td>{index + 1}</td>
                      <td>{piloto.nombre}</td>
                      <td>{piloto.puntos_temporada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3>Constructores</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Escudería</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {escuderias.map((escuderia, index) => (
                    <tr key={escuderia.id}>
                      <td>{index + 1}</td>
                      <td>{escuderia.nombre}</td>
                      <td>{escuderia.puntos_temporada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
