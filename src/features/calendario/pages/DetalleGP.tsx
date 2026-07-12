import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenerDetalleGP } from '../services/calendarioService';
import type { GranPremioCalendario } from '../services/calendarioService';
import { getErrorMessage, getErrorStatus } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import EstadoBadge from '../../../shared/components/EstadoBadge';
import AccesoRequerido from '../../../shared/components/AccesoRequerido';

function formatearFechaHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export default function DetalleGP() {
  const { id } = useParams<{ id: string }>();
  const [gp, setGp] = useState<GranPremioCalendario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    setBloqueado(false);

    obtenerDetalleGP(id)
      .then((data) => {
        if (!cancelado) setGp(data);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        if (getErrorStatus(err) === 402) {
          setBloqueado(true);
        } else {
          setError(getErrorMessage(err, 'No se pudo cargar el Gran Premio.'));
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  if (cargando) return <Loader mensaje="Cargando Gran Premio..." />;
  if (bloqueado) return <AccesoRequerido />;
  if (error) return <p className="form-error">{error}</p>;
  if (!gp) return null;

  return (
    <div className="stack">
      <p className="text-muted">
        <Link to="/calendario">← Volver al calendario</Link>
      </p>

      <div className="page-header flex-between">
        <div>
          <h1>{gp.nombre}</h1>
          <p>
            Ronda {gp.ronda} · Temporada {gp.temporada}
          </p>
        </div>
        <EstadoBadge estado={gp.estado} />
      </div>

      <Card>
        <div className="grid grid-2">
          <div>
            <p className="text-muted">País</p>
            <p>{gp.pais}</p>
          </div>
          <div>
            <p className="text-muted">Circuito</p>
            <p>{gp.circuito}</p>
          </div>
          <div>
            <p className="text-muted">Inicio del fin de semana</p>
            <p>{formatearFechaHora(gp.fecha_inicio)}</p>
          </div>
          <div>
            <p className="text-muted">Carrera</p>
            <p>{formatearFechaHora(gp.fecha_carrera)}</p>
          </div>
        </div>
      </Card>

      <p className="text-muted">
        <Link to={`/resultados/${gp.id}`}>Ver resultados oficiales de este Gran Premio →</Link>
      </p>
    </div>
  );
}
