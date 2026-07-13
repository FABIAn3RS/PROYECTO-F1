import { useEffect, useMemo, useState } from 'react';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { listarPilotos } from '../../competencia/services/competenciaService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import { buscarPilotoF1 } from '../../thesportsdb/services/theSportsDbService';
import { getErrorMessage, getErrorStatus } from '../../../core/api/apiError';
import type { Pronostico } from '../../../models';
import AccesoRequerido from '../../../shared/components/AccesoRequerido';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Loader from '../../../shared/components/Loader';
import PilotoAvatar from '../components/PilotoAvatar';
import SeleccionarPilotoModal from '../components/SeleccionarPilotoModal';
import { usePilotoFotos } from '../hooks/usePilotoFotos';
import {
  actualizarPronostico,
  confirmarPronostico,
  crearPronostico,
  obtenerPronostico,
  obtenerPronosticosPopulares,
} from '../services/pronosticosService';
import type { CamposPronostico, OpcionPopular, PronosticosPopulares } from '../services/pronosticosService';
import { generarPronosticosPopularesSimulados } from '../data/pronosticosPopularesSimulados';

const CAMPOS_INICIALES: CamposPronostico = {
  piloto_p1_id: null,
  piloto_p2_id: null,
  piloto_p3_id: null,
  piloto_pole_id: null,
  piloto_vuelta_rapida_id: null,
};

interface Paso {
  titulo: string;
  descripcion: string;
  campos: (keyof CamposPronostico)[];
  etiquetas?: string[];
}

const PASOS: Paso[] = [
  {
    titulo: 'Podio',
    descripcion: 'Elige quién quedará 1.º, 2.º y 3.º en la carrera.',
    campos: ['piloto_p1_id', 'piloto_p2_id', 'piloto_p3_id'],
    etiquetas: ['1.º', '2.º', '3.º'],
  },
  {
    titulo: 'Pole position',
    descripcion: 'Elige quién logrará la pole position en la clasificación.',
    campos: ['piloto_pole_id'],
  },
  {
    titulo: 'Vuelta rápida',
    descripcion: 'Elige quién marcará la vuelta más rápida de la carrera.',
    campos: ['piloto_vuelta_rapida_id'],
  },
];

function aCampos(pronostico: Pronostico): CamposPronostico {
  return {
    piloto_p1_id: pronostico.piloto_p1_id,
    piloto_p2_id: pronostico.piloto_p2_id,
    piloto_p3_id: pronostico.piloto_p3_id,
    piloto_pole_id: pronostico.piloto_pole_id,
    piloto_vuelta_rapida_id: pronostico.piloto_vuelta_rapida_id,
  };
}

function pasoCompleto(paso: Paso, campos: CamposPronostico): boolean {
  return paso.campos.every((campo) => Boolean(campos[campo]));
}

function OpcionPopularItem({
  opcion,
  foto,
}: {
  opcion: OpcionPopular;
  foto?: string;
}) {
  return (
    <li className="pronosticos-popular-opcion">
      <div className="pronosticos-popular-opcion__row">
        {foto ? (
          <img src={foto} alt={opcion.piloto_nombre} className="pronosticos-popular-opcion__foto" />
        ) : (
          <div className="pronosticos-popular-opcion__foto pronosticos-popular-opcion__foto--placeholder" />
        )}
        <div className="pronosticos-popular-opcion__info">
          <span>{opcion.piloto_nombre}</span>
          <small>
            {opcion.porcentaje}% · {opcion.votos} voto{opcion.votos === 1 ? '' : 's'}
          </small>
        </div>
      </div>
      <div className="confianza-bar">
        <div className="confianza-bar__fill" style={{ width: `${opcion.porcentaje}%` }} />
      </div>
    </li>
  );
}

export default function Pronosticos() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [gpId, setGpId] = useState('');
  const [pronostico, setPronostico] = useState<Pronostico | null>(null);
  const [campos, setCampos] = useState<CamposPronostico>(CAMPOS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [cargandoPronostico, setCargandoPronostico] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [populares, setPopulares] = useState<PronosticosPopulares | null>(null);
  const [cargandoPopulares, setCargandoPopulares] = useState(false);
  const [fotosPilotos, setFotosPilotos] = useState<Record<string, string>>({});
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({});
  const [pasoActual, setPasoActual] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    Promise.all([listarCalendario(), listarPilotos()])
      .then(([calendario, listaPilotos]) => {
        setGps(calendario);
        setPilotos(listaPilotos);
        const proximo = calendario.find((gp) => gp.estado === 'proximo');
        setGpId((proximo ?? calendario[0])?.id ?? '');
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudieron cargar los datos.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!gpId) return;
    let cancelado = false;
    setCargandoPronostico(true);
    setBloqueado(false);
    setError(null);
    setExito(null);

    obtenerPronostico(gpId)
      .then((data) => {
        if (!cancelado) {
          setPronostico(data);
          setCampos(aCampos(data));
        }
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const status = getErrorStatus(err);
        if (status === 404) {
          setPronostico(null);
          setCampos(CAMPOS_INICIALES);
        } else if (status === 402) {
          setBloqueado(true);
        } else {
          setError(getErrorMessage(err, 'No se pudo cargar tu pronóstico.'));
        }
      })
      .finally(() => !cancelado && setCargandoPronostico(false));

    return () => {
      cancelado = true;
    };
  }, [gpId]);

  useEffect(() => {
    setCategoriasExpandidas({});
    setPasoActual(0);
  }, [gpId]);

  useEffect(() => {
    if (!gpId) return;
    let cancelado = false;
    setCargandoPopulares(true);

    obtenerPronosticosPopulares(gpId)
      .then((data) => {
        if (!cancelado) setPopulares(data);
      })
      .catch(() => {
        if (!cancelado) setPopulares(null);
      })
      .finally(() => !cancelado && setCargandoPopulares(false));

    return () => {
      cancelado = true;
    };
  }, [gpId]);

  const gpSeleccionado = useMemo(() => gps.find((gp) => gp.id === gpId), [gps, gpId]);
  const popularesVisibles = useMemo(() => {
    if (populares && populares.total_confirmados > 0) {
      return { datos: populares, simulado: false };
    }
    if (!gpId || pilotos.length === 0) return null;
    return { datos: generarPronosticosPopularesSimulados(gpId, pilotos), simulado: true };
  }, [populares, gpId, pilotos]);

  useEffect(() => {
    if (!popularesVisibles) {
      setFotosPilotos({});
      return;
    }

    let cancelado = false;
    const nombres = [
      ...new Set(
        popularesVisibles.datos.categorias.flatMap((categoria) =>
          categoria.opciones.map((opcion) => opcion.piloto_nombre),
        ),
      ),
    ];

    Promise.all(
      nombres.map(async (nombre) => {
        try {
          const resultados = await buscarPilotoF1(nombre);
          const coincidencia =
            resultados.find((piloto) => piloto.strPlayer.toLowerCase() === nombre.toLowerCase()) ??
            resultados[0];
          const foto = coincidencia?.strCutout ?? coincidencia?.strThumb ?? '';
          return [nombre, foto] as const;
        } catch {
          return [nombre, ''] as const;
        }
      }),
    ).then((entradas) => {
      if (cancelado) return;
      setFotosPilotos(
        Object.fromEntries(entradas.filter(([, foto]) => Boolean(foto))),
      );
    });

    return () => {
      cancelado = true;
    };
  }, [popularesVisibles]);

  const fotos = usePilotoFotos(pilotos);

  const plazoFinalizado = gpSeleccionado ? new Date(gpSeleccionado.fecha_inicio) <= new Date() : true;
  const podio = [campos.piloto_p1_id, campos.piloto_p2_id, campos.piloto_p3_id].filter(Boolean);
  const podioRepetido = new Set(podio).size !== podio.length;
  const completo = Object.values(campos).every(Boolean);
  const noEditable = plazoFinalizado || pronostico?.confirmado === true;
  const paso = PASOS[pasoActual];

  function piloto(pilotoId: string | null): PilotoConEscuderia | undefined {
    return pilotoId ? pilotos.find((p) => p.id === pilotoId) : undefined;
  }

  function guardarSeleccionPaso(nuevaSeleccion: (string | null)[]) {
    setCampos((prev) => {
      const copia = { ...prev };
      paso.campos.forEach((campo, i) => {
        copia[campo] = nuevaSeleccion[i] ?? null;
      });
      return copia;
    });
    setModalAbierto(false);
    setExito(null);
  }

  const guardar = async (confirmar: boolean) => {
    if (!gpId || noEditable || podioRepetido) return;
    if (confirmar && !completo) {
      setError('Completa los cinco pronósticos antes de confirmarlos.');
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const guardado = pronostico
        ? await actualizarPronostico(pronostico.id, campos)
        : await crearPronostico(gpId, campos);
      const resultado = confirmar ? await confirmarPronostico(guardado.id) : guardado;
      setPronostico(resultado);
      setCampos(aCampos(resultado));
      setExito(confirmar ? 'Pronóstico confirmado. Ya no podrá modificarse.' : 'Borrador guardado.');
      if (confirmar) {
        const data = await obtenerPronosticosPopulares(gpId);
        setPopulares(data);
      }
    } catch (err: unknown) {
      if (getErrorStatus(err) === 402) setBloqueado(true);
      else setError(getErrorMessage(err, 'No se pudo guardar el pronóstico.'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Loader mensaje="Preparando pronósticos..." />;
  if (bloqueado) return <AccesoRequerido mensaje="Necesitas un pase de temporada activo para crear y consultar tus pronósticos." />;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Mis pronósticos</h1>
        <p>Elige el podio, la pole position y la vuelta rápida antes de que comience el Gran Premio.</p>
      </div>

      {gps.length === 0 ? (
        <div className="empty-state">No hay Grandes Premios disponibles para pronosticar.</div>
      ) : (
        <div className="pronosticos-layout">
          <Card className="pronosticos-card">
            <div className="form-group">
              <label htmlFor="gran-premio">Gran Premio</label>
              <select id="gran-premio" value={gpId} onChange={(e) => setGpId(e.target.value)}>
                {gps.map((gp) => (
                  <option key={gp.id} value={gp.id}>
                    {gp.nombre} — Ronda {gp.ronda}
                  </option>
                ))}
              </select>
            </div>

            {gpSeleccionado && (
              <p className="text-muted">
                Cierra el {new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(gpSeleccionado.fecha_inicio))}.
              </p>
            )}

            {plazoFinalizado && <p className="form-error">El plazo de este Gran Premio ya finalizó.</p>}
            {pronostico?.confirmado && <p className="form-success">Este pronóstico está confirmado.</p>}
            {error && <p className="form-error">{error}</p>}
            {exito && <p className="form-success">{exito}</p>}
            {cargandoPronostico && <Loader mensaje="Cargando tu pronóstico..." />}

            {!cargandoPronostico && (
              <>
                <div>
                  <h3>{paso.titulo}</h3>
                  <p className="text-muted">{paso.descripcion}</p>

                  <div className="piloto-slots">
                    {paso.campos.map((campo, i) => {
                      const p = piloto(campos[campo]);
                      return (
                        <button
                          key={campo}
                          type="button"
                          className="piloto-slot"
                          disabled={noEditable || guardando}
                          onClick={() => setModalAbierto(true)}
                        >
                          <div className="piloto-slot__avatar-wrap">
                            {p ? (
                              <PilotoAvatar
                                nombre={p.nombre}
                                color={p.escuderia?.color}
                                fotoUrl={fotos[p.id]}
                                tamano="lg"
                              />
                            ) : (
                              <div className="piloto-slot__vacio">+</div>
                            )}
                            {p && !noEditable && (
                              <span className="piloto-slot__editar" aria-hidden="true">
                                ✎
                              </span>
                            )}
                          </div>
                          {paso.etiquetas?.[i] && (
                            <span className="piloto-slot__posicion">{paso.etiquetas[i]}</span>
                          )}
                          <span className="piloto-slot__nombre">{p ? p.nombre : 'Elegir piloto'}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="wizard-dots">
                    {PASOS.map((p, i) => (
                      <button
                        key={p.titulo}
                        type="button"
                        className={[
                          'wizard-dot',
                          i === pasoActual ? 'wizard-dot--activo' : '',
                          pasoCompleto(p, campos) ? 'wizard-dot--completo' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setPasoActual(i)}
                        aria-label={p.titulo}
                      />
                    ))}
                  </div>

                  <div className="wizard-nav">
                    <Button
                      variante="secondary"
                      onClick={() => setPasoActual((prev) => Math.max(0, prev - 1))}
                      disabled={pasoActual === 0}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      onClick={() => setPasoActual((prev) => Math.min(PASOS.length - 1, prev + 1))}
                      disabled={pasoActual === PASOS.length - 1}
                    >
                      Siguiente →
                    </Button>
                  </div>
                </div>

                {podioRepetido && <p className="form-error">Un piloto no puede ocupar más de una posición del podio.</p>}

                {!noEditable && (
                  <div className="pronosticos-actions">
                    <Button variante="secondary" onClick={() => void guardar(false)} disabled={guardando || podioRepetido}>
                      Guardar borrador
                    </Button>
                    <Button onClick={() => void guardar(true)} disabled={guardando || podioRepetido || !completo}>
                      Confirmar pronóstico
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>

          <Card className="pronosticos-populares-card">
            <h3>Pronósticos populares</h3>

            {cargandoPopulares && <Loader mensaje="Cargando tendencias..." />}

            {!cargandoPopulares && !popularesVisibles && (
              <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                No hay datos de pronósticos populares disponibles.
              </div>
            )}

            {!cargandoPopulares && popularesVisibles && (
              <div className="pronosticos-populares-list">
                {popularesVisibles.datos.categorias.map((categoria) => {
                  const expandida = categoriasExpandidas[categoria.categoria] ?? false;
                  const opcionesVisibles = expandida
                    ? categoria.opciones
                    : categoria.opciones.slice(0, 1);
                  const restantes = categoria.opciones.length - 1;

                  return (
                  <div key={categoria.categoria} className="pronosticos-popular-categoria">
                    <h4>{categoria.etiqueta}</h4>
                    {categoria.opciones.length === 0 ? (
                      <p className="text-muted">Sin datos</p>
                    ) : (
                      <>
                        <ul className="pronosticos-popular-opciones">
                          {opcionesVisibles.map((opcion) => (
                            <OpcionPopularItem
                              key={`${categoria.categoria}-${opcion.piloto_id}`}
                              opcion={opcion}
                              foto={fotosPilotos[opcion.piloto_nombre]}
                            />
                          ))}
                        </ul>
                        {restantes > 0 && (
                          <button
                            type="button"
                            className="pronosticos-popular-ver-mas"
                            onClick={() =>
                              setCategoriasExpandidas((actual) => ({
                                ...actual,
                                [categoria.categoria]: !expandida,
                              }))
                            }
                          >
                            {expandida ? 'Ver menos' : `Ver más (${restantes})`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {modalAbierto && (
        <SeleccionarPilotoModal
          titulo={paso.titulo}
          pilotos={pilotos}
          seleccion={paso.campos.map((campo) => campos[campo])}
          etiquetas={paso.etiquetas}
          fotos={fotos}
          onGuardar={guardarSeleccionPaso}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
