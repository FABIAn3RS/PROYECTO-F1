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
  { to: '/pilotos', titulo: 'Pilotos', desc: 'Busca y consulta pilotos de Formula 1.' },
  { to: '/equipos', titulo: 'Equipos', desc: 'Escuderias y plantillas desde TheSportsDB.' },
  { to: '/escuderias', titulo: 'Escuderias', desc: 'Listado y clasificacion del campeonato de constructores.' },
  { to: '/resultados', titulo: 'Resultados', desc: 'Resultados oficiales registrados por Gran Premio.' },
  { to: '/pronosticos', titulo: 'Pronosticos', desc: 'Crea y confirma tus pronosticos para cada Gran Premio.' },
];

export default function Home() {
  const { usuario } = useAuth();
  const [liga, setLiga] = useState<TheSportsDbLeague | null>(null);
  const [cargandoLiga, setCargandoLiga] = useState(true);
  const [errorLiga, setErrorLiga] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerLigaF1()
      .then((data) => !cancelado && setLiga(data))
      .catch((err: unknown) => !cancelado && setErrorLiga(getErrorMessage(err, 'No se pudo cargar la informacion de la liga.')))
      .finally(() => !cancelado && setCargandoLiga(false));
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Pronosticos F4</h1>
        <p>{usuario ? `Bienvenido, ${usuario.nombre}. Explora la temporada y crea tus pronosticos.` : 'Plataforma para seguir la temporada de Formula 1.'}</p>
      </div>

      {cargandoLiga && <Loader mensaje="Cargando informacion de la liga..." />}
      {errorLiga && <p className="form-error">{errorLiga}</p>}

      {!cargandoLiga && !errorLiga && liga && (
        <Card>
          <div className="f1-api-liga">
            {liga.strBadge && <img src={liga.strBadge} alt={liga.strLeague} className="f1-api-liga__badge" />}
            <div>
              <h2>{liga.strLeague}</h2>
              <p>{liga.strSport}{liga.strCountry ? ` · ${liga.strCountry}` : ''}{liga.intFormedYear ? ` · Desde ${liga.intFormedYear}` : ''}</p>
              {liga.strDescriptionEN && <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-line' }}>{liga.strDescriptionEN.slice(0, 600)}{liga.strDescriptionEN.length > 600 ? '…' : ''}</p>}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-2" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
        {accesos.map((item) => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <Card><h3>{item.titulo}</h3><p>{item.desc}</p></Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
