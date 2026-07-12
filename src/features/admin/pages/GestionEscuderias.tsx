import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listarEscuderias } from '../../competencia/services/competenciaService';
import type { Escuderia } from '../../../models';
import { actualizarEscuderia, crearEscuderia, eliminarEscuderia } from '../services/adminService';
import type { EscuderiaPayload } from '../services/adminService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';

const VACIO: EscuderiaPayload = {
  nombre: '',
  nacionalidad: '',
  color: '#e10600',
  temporada: new Date().getFullYear(),
};

export default function GestionEscuderias() {
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<EscuderiaPayload>(VACIO);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    listarEscuderias()
      .then(setEscuderias)
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar las escuderías.')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function editar(escuderia: Escuderia) {
    setEditandoId(escuderia.id);
    setForm({
      nombre: escuderia.nombre,
      nacionalidad: escuderia.nacionalidad,
      color: escuderia.color,
      temporada: escuderia.temporada,
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
        await actualizarEscuderia(editandoId, form);
      } else {
        await crearEscuderia(form);
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la escudería.'));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id: string) {
    if (!confirm('¿Eliminar esta escudería?')) return;
    setError(null);
    try {
      await eliminarEscuderia(id);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar la escudería.'));
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Escuderías</h1>
        <p>Crear, editar y eliminar escuderías.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <h3>{editandoId ? 'Editar escudería' : 'Nueva escudería'}</h3>
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
              <label htmlFor="color">Color</label>
              <input
                id="color"
                type="color"
                value={form.color ?? '#e10600'}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
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

          <div className="form-row">
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear escudería'}
            </Button>
            {editandoId && (
              <Button type="button" variante="secondary" onClick={cancelar}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {cargando && <Loader mensaje="Cargando escuderías..." />}

      {!cargando && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Nacionalidad</th>
                <th>Temporada</th>
                <th>Puntos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {escuderias.map((escuderia) => (
                <tr key={escuderia.id}>
                  <td style={{ color: escuderia.color ?? undefined }}>{escuderia.nombre}</td>
                  <td>{escuderia.nacionalidad ?? '—'}</td>
                  <td>{escuderia.temporada}</td>
                  <td>{escuderia.puntos_temporada}</td>
                  <td>
                    <div className="form-row">
                      <Button tamano="sm" variante="secondary" onClick={() => editar(escuderia)}>
                        Editar
                      </Button>
                      <Button
                        tamano="sm"
                        variante="danger"
                        onClick={() => void manejarEliminar(escuderia.id)}
                      >
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
