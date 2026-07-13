import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { TheSportsDbPlayer } from '../../../models/theSportsDb';
import { buscarPilotoF1 } from '../../thesportsdb/services/theSportsDbService';
import { getErrorMessage } from '../../../core/api/apiError';
import Loader from '../../../shared/components/Loader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';

export default function Pilotos() {
  const [busquedaPiloto, setBusquedaPiloto] = useState('');
  const [resultados, setResultados] = useState<TheSportsDbPlayer[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscado, setBuscado] = useState(false);

  const buscarPilotos = async () => {
    if (!busquedaPiloto.trim()) return;
    setCargando(true);
    setError(null);
    setBuscado(true);

    try {
      const data = await buscarPilotoF1(busquedaPiloto);
      setResultados(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo buscar el piloto.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Pilotos</h1>
        <p>Busca pilotos de Fórmula 1 desde TheSportsDB.</p>
      </div>

      <div className="flex-between" style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="busqueda-piloto">Buscar piloto</label>
          <input
            id="busqueda-piloto"
            type="search"
            placeholder="Ej. Max Verstappen"
            value={busquedaPiloto}
            onChange={(e) => setBusquedaPiloto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void buscarPilotos()}
          />
        </div>
        <Button
          variante="secondary"
          tamano="sm"
          onClick={() => void buscarPilotos()}
          style={{ width: '70px', height: '40px' }}
        >
          Buscar
        </Button>
      </div>

      {cargando && <Loader mensaje="Buscando pilotos..." />}
      {error && <p className="form-error">{error}</p>}

      {!cargando && !error && buscado && resultados.length === 0 && (
        <div className="empty-state">
          No se encontraron pilotos. Prueba con otro nombre o consulta los equipos en{' '}
          <Link to="/equipos">Equipos</Link>.
        </div>
      )}

      {!cargando && !error && !buscado && (
        <div className="empty-state">
          Busca un piloto por nombre o consulta la plantilla en la página de Equipos.
        </div>
      )}

      {!cargando && !error && resultados.length > 0 && (
        <div className="grid grid-2">
          {resultados.map((piloto) => (
            <Card key={piloto.idPlayer} className="f1-api-piloto">
              <div className="f1-api-piloto__contenido">
                {(piloto.strThumb || piloto.strCutout) && (
                  <img
                    src={piloto.strCutout ?? piloto.strThumb ?? ''}
                    alt={piloto.strPlayer}
                    className="f1-api-piloto__foto"
                  />
                )}
                <div>
                  <h3>{piloto.strPlayer}</h3>
                  <p>{piloto.strTeam ?? 'Sin equipo'}</p>
                  <p>
                    {piloto.strNationality ?? '—'}
                    {piloto.strNumber ? ` · #${piloto.strNumber}` : ''}
                  </p>
                  {piloto.dateBorn && <p>Nacimiento: {piloto.dateBorn}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
