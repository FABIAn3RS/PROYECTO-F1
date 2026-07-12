import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import type { TheSportsDbLeague } from '../../../models/theSportsDb';
import { obtenerLigaF1 } from '../../thesportsdb/services/theSportsDbService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';

const accesos = [
  { to: '/calendario', titulo: 'Calendario', desc: 'Grandes Premios de la temporada desde TheSportsDB.' },
  { to: '/pilotos', titulo: 'Pilotos', desc: 'Busca y consulta pilotos de Fórmula 1.' },
  { to: '/equipos', titulo: 'Equipos', desc: 'Escuderías y plantillas desde TheSportsDB.' },
  { to: '/escuderias', titulo: 'Escuderías', desc: 'Listado y clasificación del campeonato de constructores.' },
  { to: '/resultados', titulo: 'Resultados', desc: 'Resultados oficiales registrados por Gran Premio.' },
  { to: '/predicciones', titulo: 'Predicciones', desc: 'Predicciones simuladas de apoyo a la decisión.' },
];

export default function Home() {
  const { usuario } = useAuth();
  const [liga, setLiga] = useState<TheSportsDbLeague | null>(null);
  const [cargandoLiga, setCargandoLiga] = useState(true);
  const [errorLiga, setErrorLiga] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargandoLiga(true);
    setErrorLiga(null);

    obtenerLigaF1()
      .then((data) => {
        if (!cancelado) setLiga(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setErrorLiga(getErrorMessage(err, 'No se pudo cargar la información de la liga.'));
      })
      .finally(() => {
        if (!cancelado) setCargandoLiga(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Pronósticos F1</h1>
        <p>
          {usuario
            ? `Bienvenido, ${usuario.nombre}. Explora la temporada y las predicciones simuladas.`
            : 'Plataforma de apoyo a la decisión para la temporada de Fórmula 1.'}
        </p>
      </div>

      {cargandoLiga && <Loader mensaje="Cargando información de la liga..." />}
      {errorLiga && <p className="form-error">{errorLiga}</p>}

      {!cargandoLiga && !errorLiga && liga && (
        <Card>
          <div className="f1-api-liga">
            {liga.strBadge && (
              <img src={liga.strBadge} alt={liga.strLeague} className="f1-api-liga__badge" />
            )}
            <div>
              <h2>{liga.strLeague}</h2>
              <p>
                {liga.strSport}
                {liga.strCountry ? ` · ${liga.strCountry}` : ''}
                {liga.intFormedYear ? ` · Desde ${liga.intFormedYear}` : ''}
              </p>
              {liga.strDescriptionEN && (
                <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-line' }}>
                  {liga.strDescriptionEN.slice(0, 600)}
                  {liga.strDescriptionEN.length > 600 ? '…' : ''}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-2" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
        {accesos.map((item) => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <Card>
              <h3>{item.titulo}</h3>
              <p>{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
