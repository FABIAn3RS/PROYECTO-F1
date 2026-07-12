import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { listarPilotos } from '../../competencia/services/competenciaService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import { registrarResultadosOficiales } from '../services/adminService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';

interface FilaResultado {
  posicion: string;
  esPole: boolean;
  esVueltaRapida: boolean;
  puntos: string;
}

const FILA_VACIA: FilaResultado = { posicion: '', esPole: false, esVueltaRapida: false, puntos: '' };

export default function RegistrarResultados() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [gpSeleccionado, setGpSeleccionado] = useState('');
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [filas, setFilas] = useState<Record<string, FilaResultado>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarCalendario()
      .then((data) => {
        setGps(data);
        if (data.length > 0) setGpSeleccionado(data[0].id);
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar el calendario.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const gp = gps.find((item) => item.id === gpSeleccionado);
    if (!gp) return;

    listarPilotos(gp.temporada)
      .then((data) => {
        setPilotos(data);
        setFilas(Object.fromEntries(data.map((p) => [p.id, { ...FILA_VACIA }])));
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar los pilotos.')));
  }, [gpSeleccionado, gps]);

  function actualizarFila(pilotoId: string, cambios: Partial<FilaResultado>) {
    setFilas((prev) => ({ ...prev, [pilotoId]: { ...prev[pilotoId], ...cambios } }));
  }

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setExito(null);

    const posiciones = Object.entries(filas)
      .filter(([, fila]) => fila.posicion.trim() !== '')
      .map(([pilotoId, fila]) => ({
        piloto_id: pilotoId,
        posicion: Number(fila.posicion),
        es_pole: fila.esPole,
        es_vuelta_rapida: fila.esVueltaRapida,
        puntos_obtenidos: fila.puntos.trim() === '' ? 0 : Number(fila.puntos),
      }));

    if (posiciones.length === 0) {
      setError('Asigna al menos una posición antes de registrar el resultado.');
      return;
    }

    const posicionesUsadas = posiciones.map((p) => p.posicion);
    if (new Set(posicionesUsadas).size !== posicionesUsadas.length) {
      setError('Hay posiciones repetidas. Cada piloto debe tener una posición distinta.');
      return;
    }

    setEnviando(true);
    try {
      await registrarResultadosOficiales(gpSeleccionado, posiciones);
      setExito('Resultados registrados y pronósticos evaluados correctamente.');
      setFilas(Object.fromEntries(pilotos.map((p) => [p.id, { ...FILA_VACIA }])));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar el resultado.'));
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <Loader mensaje="Cargando calendario..." />;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Registrar resultados oficiales</h1>
        <p>Asigna la posición final de cada piloto para calificar el Gran Premio.</p>
      </div>

      <div className="form-group" style={{ maxWidth: 420 }}>
        <label htmlFor="gp">Gran Premio</label>
        <select id="gp" value={gpSeleccionado} onChange={(e) => setGpSeleccionado(e.target.value)}>
          {gps.map((gp) => (
            <option key={gp.id} value={gp.id}>
              {gp.nombre} — Ronda {gp.ronda} ({gp.temporada})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {exito && <p className="form-success">{exito}</p>}

      <Card>
        <form onSubmit={manejarSubmit}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Piloto</th>
                  <th>Posición</th>
                  <th>Pole</th>
                  <th>Vuelta rápida</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {pilotos.map((piloto) => {
                  const fila = filas[piloto.id] ?? FILA_VACIA;
                  return (
                    <tr key={piloto.id}>
                      <td>{piloto.nombre}</td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          style={{ width: '5rem' }}
                          value={fila.posicion}
                          onChange={(e) => actualizarFila(piloto.id, { posicion: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={fila.esPole}
                          onChange={(e) => actualizarFila(piloto.id, { esPole: e.target.checked })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={fila.esVueltaRapida}
                          onChange={(e) => actualizarFila(piloto.id, { esVueltaRapida: e.target.checked })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          style={{ width: '5rem' }}
                          value={fila.puntos}
                          onChange={(e) => actualizarFila(piloto.id, { puntos: e.target.value })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" disabled={enviando || pilotos.length === 0}>
              {enviando ? 'Registrando...' : 'Registrar resultado oficial'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
