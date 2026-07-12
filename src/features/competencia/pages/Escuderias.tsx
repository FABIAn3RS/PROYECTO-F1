import { useEffect, useState } from 'react';
import { clasificacionEscuderias, listarEscuderias } from '../services/competenciaService';
import type { Escuderia } from '../../../models';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';

type Vista = 'listado' | 'clasificacion';

const TEMPORADA_ACTUAL = new Date().getFullYear();

export default function Escuderias() {
  const [vista, setVista] = useState<Vista>('clasificacion');
  const [temporada, setTemporada] = useState<number>(TEMPORADA_ACTUAL);
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    const promesa =
      vista === 'clasificacion' ? clasificacionEscuderias(temporada) : listarEscuderias(temporada);

    promesa
      .then((data) => {
        if (!cancelado) setEscuderias(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudo cargar las escuderías.'));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [vista, temporada]);

  return (
    <div className="stack">
      <div className="page-header flex-between">
        <div>
          <h1>Escuderías</h1>
          <p>Listado y clasificación del campeonato de constructores.</p>
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

      <div className="flex-between">
        <Button
          variante={vista === 'clasificacion' ? 'primary' : 'secondary'}
          tamano="sm"
          onClick={() => setVista('clasificacion')}
        >
          Clasificación
        </Button>
        <Button
          variante={vista === 'listado' ? 'primary' : 'secondary'}
          tamano="sm"
          onClick={() => setVista('listado')}
        >
          Listado completo
        </Button>
      </div>

      {cargando && <Loader mensaje="Cargando escuderías..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && escuderias.length === 0 && (
        <div className="empty-state">No hay escuderías registradas para esta temporada.</div>
      )}

      {!cargando && !error && escuderias.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {vista === 'clasificacion' && <th>#</th>}
                <th>Escudería</th>
                <th>Nacionalidad</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {escuderias.map((escuderia, index) => (
                <tr key={escuderia.id}>
                  {vista === 'clasificacion' && <td>{index + 1}</td>}
                  <td style={{ color: escuderia.color ?? undefined }}>{escuderia.nombre}</td>
                  <td>{escuderia.nacionalidad ?? '—'}</td>
                  <td>{escuderia.puntos_temporada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
