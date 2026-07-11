import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import Card from '../../../shared/components/Card';

const accesos = [
  { to: '/calendario', titulo: 'Calendario', desc: 'Grandes Premios de la temporada.' },
  { to: '/pilotos', titulo: 'Pilotos', desc: 'Consulta los pilotos de Fórmula 1.' },
  { to: '/escuderias', titulo: 'Escuderías', desc: 'Listado y clasificación del campeonato de constructores.' },
  { to: '/resultados', titulo: 'Resultados', desc: 'Resultados oficiales registrados por Gran Premio.' },
  { to: '/predicciones', titulo: 'Predicciones', desc: 'Predicciones simuladas de apoyo a la decisión.' },
];

export default function Home() {
  const { usuario } = useAuth();
  return <div className="stack">
    <div className="page-header"><h1>Pronósticos F1</h1><p>{usuario ? `Bienvenido, ${usuario.nombre}. Explora la temporada y las predicciones simuladas.` : 'Plataforma de apoyo a la decisión para la temporada de Fórmula 1.'}</p></div>
    <div className="grid grid-2" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
      {accesos.map((item) => <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}><Card><h3>{item.titulo}</h3><p>{item.desc}</p></Card></Link>)}
    </div>
  </div>;
}
