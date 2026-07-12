import { useEffect, useState } from 'react';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { obtenerPrediccion } from '../services/prediccionesService';
import type { PrediccionGP } from '../services/prediccionesService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';

const ETIQUETA_CONFIANZA: Record<PrediccionGP['nivel_confianza'], string> = {
  bajo: 'Confianza baja',
  medio: 'Confianza media',
  alto: 'Confianza alta',
};

export default function Predicciones() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [gpSeleccionado, setGpSeleccionado] = useState<string>('');
  const [prediccion, setPrediccion] = useState<PrediccionGP | null>(null);
  const [cargandoGps, setCargandoGps] = useState(true);
  const [cargandoPrediccion, setCargandoPrediccion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarCalendario()
      .then((data) => {
        setGps(data);
        if (data.length > 0) setGpSeleccionado(data[0].id);
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar el calendario.')))
      .finally(() => setCargandoGps(false));
  }, []);

  useEffect(() => {
    const gp = gps.find((item) => item.id === gpSeleccionado);
    if (!gp) return;

    let cancelado = false;
    setCargandoPrediccion(true);
    setError(null);

    obtenerPrediccion(gp.id)
      .then((data) => {
        if (!cancelado) setPrediccion(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudo generar la predicción.'));
      })
      .finally(() => {
        if (!cancelado) setCargandoPrediccion(false);
      });

    return () => {
      cancelado = true;
    };
  }, [gpSeleccionado, gps]);

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Predicciones</h1>
        <p>Sistema de apoyo a la decisión para la próxima carrera.</p>
      </div>

      <div className="form-error" style={{ background: 'transparent', color: 'var(--gray-300)' }}>
        ⚠️ Estas predicciones se calculan con un algoritmo estadístico básico (clasificación
        actual, historial en el circuito y forma reciente), no con un modelo de Machine Learning.
      </div>

      {cargandoGps && <Loader mensaje="Cargando calendario..." />}

      {!cargandoGps && gps.length > 0 && (
        <div className="form-group" style={{ maxWidth: 420 }}>
          <label htmlFor="gp">Gran Premio</label>
          <select id="gp" value={gpSeleccionado} onChange={(e) => setGpSeleccionado(e.target.value)}>
            {gps.map((gp) => (
              <option key={gp.id} value={gp.id}>
                {gp.nombre} — Ronda {gp.ronda}
              </option>
            ))}
          </select>
        </div>
      )}

      {!cargandoGps && gps.length === 0 && (
        <div className="empty-state">No hay Grandes Premios registrados todavía.</div>
      )}

      {error && <p className="form-error">{error}</p>}
      {cargandoPrediccion && <Loader mensaje="Generando predicción..." />}

      {prediccion && !cargandoPrediccion && (
        <div className="stack">
          <div className="flex-between">
            <h2 style={{ margin: 0 }}>Podio probable</h2>
            <span className="badge badge-en_curso">{ETIQUETA_CONFIANZA[prediccion.nivel_confianza]}</span>
          </div>

          <div className="podio">
            {prediccion.podio_probable.map((p, index) => (
              <div key={p.piloto_id} className={`podio__puesto podio__puesto--${index + 1}`}>
                <div className="podio__medalla" aria-hidden="true">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <p style={{ fontWeight: 700 }}>{p.nombre}</p>
                <p className="text-muted">{p.escuderia ?? '—'}</p>
                <p className="text-muted">{p.probabilidad}%</p>
              </div>
            ))}
          </div>

          <Card>
            <h3>Ganador probable</h3>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{prediccion.ganador_probable.nombre}</p>
            <p className="text-muted">
              {prediccion.ganador_probable.escuderia ?? '—'} · {prediccion.ganador_probable.probabilidad}%
              de probabilidad estimada
            </p>
          </Card>

          <Card>
            <h3>Probabilidades estimadas</h3>
            <div className="stack">
              {prediccion.probabilidades.slice(0, 8).map((p) => (
                <div key={p.piloto_id}>
                  <div className="flex-between">
                    <span>{p.nombre}</span>
                    <span className="text-muted">{p.probabilidad}%</span>
                  </div>
                  <div className="confianza-bar">
                    <div className="confianza-bar__fill" style={{ width: `${p.probabilidad}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3>Observaciones del modelo</h3>
            <ul className="stack" style={{ paddingLeft: '1.1rem', margin: 0 }}>
              {prediccion.observaciones.map((obs) => (
                <li key={obs}>{obs}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
