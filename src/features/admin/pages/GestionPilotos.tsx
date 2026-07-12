import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listarEscuderias, listarPilotos } from '../../competencia/services/competenciaService';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import type { Escuderia } from '../../../models';
import { actualizarPiloto, crearPiloto, eliminarPiloto } from '../services/adminService';
import type { PilotoPayload } from '../services/adminService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';

const VACIO: PilotoPayload = {
  nombre: '',
  nacionalidad: '',
  numero: null,
  escuderia_id: null,
  temporada: new Date().getFullYear(),
};

export default function GestionPilotos() {
  const [pilotos, setPilotos] = useState<PilotoConEscuderia[]>([]);
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<PilotoPayload>(VACIO);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    Promise.all([listarPilotos(), listarEscuderias()])
      .then(([pilotosData, escuderiasData]) => {
        setPilotos(pilotosData);
        setEscuderias(escuderiasData);
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar los pilotos.')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function editar(piloto: PilotoConEscuderia) {
    setEditandoId(piloto.id);
    setForm({
      nombre: piloto.nombre,
      nacionalidad: piloto.nacionalidad,
      numero: piloto.numero,
      escuderia_id: piloto.escuderia_id,
      temporada: piloto.temporada,
    });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(VACIO);
  }

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarPiloto(editandoId, form);
      } else {
        await crearPiloto(form);
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el piloto.'));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id: string) {
    if (!confirm('¿Eliminar este piloto?')) return;
    setError(null);
    try {
      await eliminarPiloto(id);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el piloto.'));
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Pilotos</h1>
        <p>Crear, editar y eliminar pilotos.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <h3>{editandoId ? 'Editar piloto' : 'Nuevo piloto'}</h3>
        <form className="form" style={{ maxWidth: 'none' }} onSubmit={manejarSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="nacionalidad">Nacionalidad</label>
              <input
                id="nacionalidad"
                value={form.nacionalidad ?? ''}
                onChange={(e) => setForm({ ...form, nacionalidad: e.target.value || null })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numero">Número</label>
              <input
                id="numero"
                type="number"
                value={form.numero ?? ''}
                onChange={(e) => setForm({ ...form, numero: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="temporada">Temporada</label>
              <input
                id="temporada"
                type="number"
                required
                value={form.temporada}
                onChange={(e) => setForm({ ...form, temporada: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="escuderia">Escudería</label>
            <select
              id="escuderia"
              value={form.escuderia_id ?? ''}
              onChange={(e) => setForm({ ...form, escuderia_id: e.target.value || null })}
            >
              <option value="">Sin escudería</option>
              {escuderias.map((escuderia) => (
                <option key={escuderia.id} value={escuderia.id}>
                  {escuderia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear piloto'}
            </Button>
            {editandoId && (
              <Button type="button" variante="secondary" onClick={cancelar}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {cargando && <Loader mensaje="Cargando pilotos..." />}

      {!cargando && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Número</th>
                <th>Escudería</th>
                <th>Temporada</th>
                <th>Puntos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pilotos.map((piloto) => (
                <tr key={piloto.id}>
                  <td>{piloto.nombre}</td>
                  <td>{piloto.numero ?? '—'}</td>
                  <td>{piloto.escuderia?.nombre ?? '—'}</td>
                  <td>{piloto.temporada}</td>
                  <td>{piloto.puntos_temporada}</td>
                  <td>
                    <div className="form-row">
                      <Button tamano="sm" variante="secondary" onClick={() => editar(piloto)}>
                        Editar
                      </Button>
                      <Button tamano="sm" variante="danger" onClick={() => void manejarEliminar(piloto.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
