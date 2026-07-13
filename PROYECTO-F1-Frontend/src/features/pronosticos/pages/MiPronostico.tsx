import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obtenerDetalleGP } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { listarPilotos } from '../../competencia/services/competenciaService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import { obtenerPase } from '../../perfil/services/perfilService';
import type { PaseTemporadaInfo } from '../../perfil/services/perfilService';
import {
  actualizarPronostico,
  confirmarPronostico,
  crearPronostico,
  obtenerPronosticoDeGP,
} from '../services/pronosticosService';
import type { PronosticoPayload } from '../services/pronosticosService';
import type { Pronostico } from '../../../models';
import { useAuth } from '../../../core/hooks/useAuth';
import { getErrorMessage, getErrorStatus } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';

interface Form {
  p1: string;
  p2: string;
  p3: string;
  pole: string;
  vueltaRapida: string;
}

const FORM_VACIO: Form = { p1: '', p2: '', p3: '', pole: '', vueltaRapida: '' };

function formularioDesdePronostico(p: Pronostico): Form {
  return {
    p1: p.piloto_p1_id ?? '',
    p2: p.piloto_p2_id ?? '',
    p3: p.piloto_p3_id ?? '',
    pole: p.piloto_pole_id ?? '',
    vueltaRapida: p.piloto_vuelta_rapida_id ?? '',
  };
}

function formularioCompleto(f: Form): boolean {
  return Boolean(f.p1 && f.p2 && f.p3 && f.pole && f.vueltaRapida);
}

export default function MiPronostico() {
  const { id: gpId } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [gp, setGp] = useState<GranPremioCalendario | null>(null);
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [pase, setPase] = useState<PaseTemporadaInfo | null>(null);
  const [pronostico, setPronostico] = useState<Pronostico | null>(null);
  const [form, setForm] = useState<Form>(FORM_VACIO);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    if (!gpId) return;
    let cancelado = false;
    setCargando(true);
    setError(null);

    obtenerDetalleGP(gpId)
      .then(async (gpData) => {
        if (cancelado) return;
        setGp(gpData);

        const [pilotosData, paseData] = await Promise.all([
          listarPilotos(gpData.temporada),
          obtenerPase().catch(() => null),
        ]);
        if (cancelado) return;
        setPilotos(pilotosData);
        setPase(paseData);

        try {
          const existente = await obtenerPronosticoDeGP(gpId);
          if (cancelado) return;
          setPronostico(existente);
          setForm(formularioDesdePronostico(existente));
        } catch (err) {
          if (getErrorStatus(err) !== 404) throw err;
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getErrorMessage(err, 'No se pudo cargar el Gran Premio.'));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [gpId]);

  if (cargando) return <Loader mensaje="Cargando tu pronóstico..." />;
  if (error) return <p className="form-error">{error}</p>;
  if (!gp || !gpId) return null;

  const plazoAbierto = gp.estado === 'proximo';
  const tienePase = pase?.estado === 'activo';
  const esGpGratis = usuario?.gp_gratis_id === gp.id;
  const yaUsoGratisEnOtroGp = Boolean(usuario?.gp_gratis_id) && !esGpGratis && !tienePase;

  function nombrePiloto(pilotoId: string): string {
    return pilotos.find((p) => p.id === pilotoId)?.nombre ?? 'Desconocido';
  }

  function actualizarCampo(campo: keyof Form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setMostrarResumen(false);
    setExito(null);
  }

  function validarPodio(): string | null {
    const seleccionados = [form.p1, form.p2, form.p3].filter(Boolean);
    if (new Set(seleccionados).size !== seleccionados.length) {
      return 'No puedes seleccionar el mismo piloto para más de una posición del podio.';
    }
    return null;
  }

  async function guardarBorrador() {
    setError(null);
    setExito(null);

    const errorPodio = validarPodio();
    if (errorPodio) {
      setError(errorPodio);
      return;
    }

    const datos: PronosticoPayload = {
      gran_premio_id: gpId!,
      piloto_p1_id: form.p1 || null,
      piloto_p2_id: form.p2 || null,
      piloto_p3_id: form.p3 || null,
      piloto_pole_id: form.pole || null,
      piloto_vuelta_rapida_id: form.vueltaRapida || null,
    };

    setGuardando(true);
    try {
      const guardado = pronostico
        ? await actualizarPronostico(pronostico.id, {
            piloto_p1_id: datos.piloto_p1_id,
            piloto_p2_id: datos.piloto_p2_id,
            piloto_p3_id: datos.piloto_p3_id,
            piloto_pole_id: datos.piloto_pole_id,
            piloto_vuelta_rapida_id: datos.piloto_vuelta_rapida_id,
          })
        : await crearPronostico(datos);
      setPronostico(guardado);
      setExito('Pronóstico guardado. Puedes seguir editándolo hasta confirmarlo.');
      if (formularioCompleto(form)) setMostrarResumen(true);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el pronóstico.'));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmar() {
    if (!pronostico) return;
    setError(null);
    setConfirmando(true);
    try {
      const confirmado = await confirmarPronostico(pronostico.id);
      setPronostico(confirmado);
      setExito('¡Pronóstico confirmado! Ya quedó registrado para este Gran Premio.');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo confirmar el pronóstico.'));
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="stack">
      <p className="text-muted">
        <Link to={`/calendario/${gpId}`}>← Volver al Gran Premio</Link>
      </p>

      <div className="page-header">
        <h1>Mi pronóstico</h1>
        <p>{gp.nombre} — Ronda {gp.ronda}</p>
      </div>

      {tienePase && (
        <p className="form-success">Tienes tu pase de temporada activo: pronósticos ilimitados.</p>
      )}
      {!tienePase && esGpGratis && (
        <p className="form-success">Este es tu Gran Premio gratuito.</p>
      )}
      {yaUsoGratisEnOtroGp && (
        <p className="form-error">
          Ya usaste tu pronóstico gratuito en otro Gran Premio. Necesitas un pase de temporada para
          pronosticar aquí. <Link to="/perfil">Comprar pase de temporada →</Link>
        </p>
      )}
      {!tienePase && !usuario?.gp_gratis_id && (
        <p className="text-muted">
          Aún no se te ha asignado tu pronóstico gratuito; se activará automáticamente la primera vez
          que guardes un pronóstico, en tu próximo Gran Premio disponible.
        </p>
      )}

      {!plazoAbierto && (
        <div className="empty-state">
          El plazo para crear o modificar pronósticos de este Gran Premio ya cerró.
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {exito && <p className="form-success">{exito}</p>}

      {pronostico?.confirmado ? (
        <Card>
          <h3>Pronóstico confirmado ✓</h3>
          <div className="grid grid-2">
            <div>
              <p className="text-muted">Ganador (P1)</p>
              <p>{nombrePiloto(pronostico.piloto_p1_id!)}</p>
            </div>
            <div>
              <p className="text-muted">P2</p>
              <p>{nombrePiloto(pronostico.piloto_p2_id!)}</p>
            </div>
            <div>
              <p className="text-muted">P3</p>
              <p>{nombrePiloto(pronostico.piloto_p3_id!)}</p>
            </div>
            <div>
              <p className="text-muted">Pole position</p>
              <p>{nombrePiloto(pronostico.piloto_pole_id!)}</p>
            </div>
            <div>
              <p className="text-muted">Vuelta rápida</p>
              <p>{nombrePiloto(pronostico.piloto_vuelta_rapida_id!)}</p>
            </div>
            <div>
              <p className="text-muted">Puntos obtenidos</p>
              <p>{pronostico.puntos_obtenidos}</p>
            </div>
          </div>
        </Card>
      ) : (
        plazoAbierto && (
          <Card>
            <form
              className="form"
              style={{ maxWidth: 'none' }}
              onSubmit={(e) => {
                e.preventDefault();
                void guardarBorrador();
              }}
            >
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="p1">Ganador (P1)</label>
                  <select id="p1" value={form.p1} onChange={(e) => actualizarCampo('p1', e.target.value)}>
                    <option value="">Selecciona un piloto</option>
                    {pilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="p2">P2</label>
                  <select id="p2" value={form.p2} onChange={(e) => actualizarCampo('p2', e.target.value)}>
                    <option value="">Selecciona un piloto</option>
                    {pilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="p3">P3</label>
                  <select id="p3" value={form.p3} onChange={(e) => actualizarCampo('p3', e.target.value)}>
                    <option value="">Selecciona un piloto</option>
                    {pilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="pole">Pole position</label>
                  <select id="pole" value={form.pole} onChange={(e) => actualizarCampo('pole', e.target.value)}>
                    <option value="">Selecciona un piloto</option>
                    {pilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="vr">Vuelta rápida</label>
                  <select id="vr" value={form.vueltaRapida} onChange={(e) => actualizarCampo('vueltaRapida', e.target.value)}>
                    <option value="">Selecciona un piloto</option>
                    {pilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : pronostico ? 'Guardar cambios' : 'Guardar pronóstico'}
              </Button>
            </form>
          </Card>
        )
      )}

      {mostrarResumen && pronostico && !pronostico.confirmado && (
        <Card>
          <h3>Resumen antes de confirmar</h3>
          <p className="text-muted">
            Una vez confirmado, no podrás modificar este pronóstico. Revisa tu selección:
          </p>
          <ul className="stack" style={{ paddingLeft: '1.1rem' }}>
            <li>Ganador: {nombrePiloto(form.p1)}</li>
            <li>P2: {nombrePiloto(form.p2)}</li>
            <li>P3: {nombrePiloto(form.p3)}</li>
            <li>Pole position: {nombrePiloto(form.pole)}</li>
            <li>Vuelta rápida: {nombrePiloto(form.vueltaRapida)}</li>
          </ul>
          <Button onClick={() => void confirmar()} disabled={confirmando}>
            {confirmando ? 'Confirmando...' : 'Confirmar pronóstico'}
          </Button>
        </Card>
      )}

      {pronostico?.confirmado && (
        <Button variante="secondary" onClick={() => navigate('/historial')}>
          Ver mi historial de pronósticos
        </Button>
      )}
    </div>
  );
}
