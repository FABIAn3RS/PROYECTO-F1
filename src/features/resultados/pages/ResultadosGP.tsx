import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenerResultadosGP } from '../services/resultadosService';
import type { ResultadoOficialConPosiciones } from '../services/resultadosService';
import { getErrorMessage, getErrorStatus } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';
import AccesoRequerido from '../../../shared/components/AccesoRequerido';

export default function ResultadosGP() {
  const { id } = useParams<{ id: string }>();
  const [resultado, setResultado] = useState<ResultadoOficialConPosiciones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [sinRegistrar, setSinRegistrar] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    setBloqueado(false);
    setSinRegistrar(false);

    obtenerResultadosGP(id)
      .then((data) => {
        if (!cancelado) setResultado(data);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const status = getErrorStatus(err);
        if (status === 402) {
          setBloqueado(true);
        } else if (status === 404) {
          setSinRegistrar(true);
        } else {
          setError(getErrorMessage(err, 'No se pudo cargar los resultados.'));
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  if (cargando) return <Loader mensaje="Cargando resultados..." />;
  if (bloqueado) return <AccesoRequerido />;
  if (error) return <p className="form-error">{error}</p>;

  const posicionesOrdenadas = resultado
    ? [...resultado.posiciones].sort((a, b) => a.posicion - b.posicion)
    : [];
  const podio = posicionesOrdenadas.slice(0, 3);
  const resto = posicionesOrdenadas.slice(3);

  return (
    <div className="stack">
      <p className="text-muted">
        <Link to={`/calendario/${id}`}>← Volver al Gran Premio</Link>
      </p>

      <div className="page-header">
        <h1>Resultados oficiales</h1>
      </div>

      {sinRegistrar && (
        <div className="empty-state">Los resultados oficiales para este Gran Premio aún no han sido registrados.</div>
      )}

      {resultado && (
        <>
          {podio.length > 0 && (
            <div className="podio">
              {podio.map((pos) => (
                <div key={pos.id} className={`podio__puesto podio__puesto--${pos.posicion}`}>
                  <div className="podio__medalla" aria-hidden="true">
                    {pos.posicion === 1 ? '🥇' : pos.posicion === 2 ? '🥈' : '🥉'}
                  </div>
                  <p style={{ fontWeight: 700 }}>{pos.piloto?.nombre ?? 'Desconocido'}</p>
                  <p className="text-muted">
                    {pos.es_pole && 'Pole · '}
                    {pos.es_vuelta_rapida && 'Vuelta rápida · '}
                    {pos.puntos_obtenidos} pts
                  </p>
                </div>
              ))}
            </div>
          )}

          {resto.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Piloto</th>
                    <th>Escudería</th>
                    <th>Detalles</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {resto.map((pos) => (
                    <tr key={pos.id}>
                      <td>{pos.posicion}</td>
                      <td>{pos.piloto?.nombre ?? 'Desconocido'}</td>
                      <td>{pos.piloto?.escuderia?.nombre ?? '—'}</td>
                      <td>
                        {pos.es_pole && <span className="badge badge-proximo">Pole</span>}{' '}
                        {pos.es_vuelta_rapida && <span className="badge badge-en_curso">V. rápida</span>}
                      </td>
                      <td>{pos.puntos_obtenidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
