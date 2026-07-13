import { useEffect, useState } from 'react';
import type { TheSportsDbPlayer, TheSportsDbTeam } from '../../../models/theSportsDb';
import {
  buscarEquipoF1,
  listarEquiposF1,
  listarPilotosEquipoF1,
} from '../services/theSportsDbService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';

export default function Equipos() {
  const [equipos, setEquipos] = useState<TheSportsDbTeam[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<TheSportsDbTeam | null>(null);
  const [pilotosEquipo, setPilotosEquipo] = useState<TheSportsDbPlayer[]>([]);
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<TheSportsDbTeam[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    listarEquiposF1()
      .then((data) => {
        if (!cancelado) setEquipos(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudieron cargar los equipos.'));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const seleccionarEquipo = async (equipo: TheSportsDbTeam) => {
    setEquipoSeleccionado(equipo);
    setCargandoDetalle(true);
    setPilotosEquipo([]);

    try {
      const pilotos = await listarPilotosEquipoF1(equipo.idTeam);
      setPilotosEquipo(pilotos);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudieron cargar los pilotos del equipo.'));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const buscarEquipos = async () => {
    if (!busquedaEquipo.trim()) return;
    setCargandoDetalle(true);
    setError(null);

    try {
      const resultados = await buscarEquipoF1(busquedaEquipo);
      setResultadosBusqueda(resultados);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo buscar el equipo.'));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const equiposVisibles = resultadosBusqueda.length > 0 ? resultadosBusqueda : equipos;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Equipos</h1>
        <p>Escuderías de Fórmula 1 y sus plantillas desde TheSportsDB.</p>
      </div>

      <div className="flex-between" style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="busqueda-equipo">Buscar equipo</label>
          <input
            id="busqueda-equipo"
            type="search"
            placeholder="Ej. Ferrari, Red Bull"
            value={busquedaEquipo}
            onChange={(e) => setBusquedaEquipo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void buscarEquipos()}
          />
        </div>
        <Button
          variante="secondary"
          tamano="sm"
          onClick={() => void buscarEquipos()}
          style={{ width: '70px', height: '40px' }}
        >
          Buscar
        </Button>
      </div>

      {cargando && <Loader mensaje="Cargando equipos..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && equiposVisibles.length === 0 && (
        <div className="empty-state">No se encontraron equipos de Fórmula 1.</div>
      )}

      {!cargando && !error && equiposVisibles.length > 0 && (
        <div className="grid grid-3">
          {equiposVisibles.map((equipo) => (
            <Card
              key={equipo.idTeam}
              className="f1-api-equipo"
              onClick={() => void seleccionarEquipo(equipo)}
              style={{ cursor: 'pointer' }}
            >
              {equipo.strBadge && (
                <img src={equipo.strBadge} alt={equipo.strTeam} className="f1-api-equipo__badge" />
              )}
              <h3 style={{ color: equipo.strColour1 ?? undefined }}>{equipo.strTeam}</h3>
              <p>{equipo.strCountry ?? '—'}</p>
              {equipo.intFormedYear && <p>Fundado: {equipo.intFormedYear}</p>}
            </Card>
          ))}
        </div>
      )}

      {equipoSeleccionado && (
        <Card>
          <h3>{equipoSeleccionado.strTeam}</h3>
          {equipoSeleccionado.strDescriptionEN && (
            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-line' }}>
              {equipoSeleccionado.strDescriptionEN.slice(0, 500)}
              {equipoSeleccionado.strDescriptionEN.length > 500 ? '…' : ''}
            </p>
          )}
          {cargandoDetalle && <Loader mensaje="Cargando pilotos..." />}
          {!cargandoDetalle && pilotosEquipo.length > 0 && (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Piloto</th>
                    <th>Número</th>
                    <th>Nacionalidad</th>
                    <th>Posición</th>
                  </tr>
                </thead>
                <tbody>
                  {pilotosEquipo.map((piloto) => (
                    <tr key={piloto.idPlayer}>
                      <td>{piloto.strPlayer}</td>
                      <td>{piloto.strNumber ?? '—'}</td>
                      <td>{piloto.strNationality ?? '—'}</td>
                      <td>{piloto.strPosition ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
