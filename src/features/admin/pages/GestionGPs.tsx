import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listarCalendario } from '../../calendario/services/calendarioService';
import type { GranPremioCalendario } from '../../calendario/services/calendarioService';
import { actualizarGP, crearGP, eliminarGP } from '../services/adminService';
import type { GranPremioPayload } from '../services/adminService';
import { getErrorMessage } from '../../../core/api/apiError';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Loader from '../../../shared/components/Loader';

const VACIO: GranPremioPayload = {
  nombre: '',
  pais: '',
  circuito: '',
  temporada: new Date().getFullYear(),
  ronda: 1,
  fecha_inicio: '',
  fecha_carrera: '',
};

function aInputDatetime(iso: string): string {
  return iso ? iso.slice(0, 16) : '';
}

export default function GestionGPs() {
  const [gps, setGps] = useState<GranPremioCalendario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<GranPremioPayload>(VACIO);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    listarCalendario()
      .then(setGps)
      .catch((err: unknown) => setError(getErrorMessage(err, 'No se pudo cargar el calendario.')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function editar(gp: GranPremioCalendario) {
    setEditandoId(gp.id);
    setForm({
      nombre: gp.nombre,
      pais: gp.pais,
      circuito: gp.circuito,
      temporada: gp.temporada,
      ronda: gp.ronda,
      fecha_inicio: aInputDatetime(gp.fecha_inicio),
      fecha_carrera: aInputDatetime(gp.fecha_carrera),
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
        await actualizarGP(editandoId, form);
      } else {
        await crearGP(form);
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el Gran Premio.'));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id: string) {
    if (!confirm('¿Eliminar este Gran Premio? Esta acción no se puede deshacer.')) return;
    setError(null);
    try {
      await eliminarGP(id);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el Gran Premio.'));
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Grandes Premios</h1>
        <p>Crear, editar y eliminar Grandes Premios del calendario.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <Card>
        <h3>{editandoId ? 'Editar Gran Premio' : 'Nuevo Gran Premio'}</h3>
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
              <label htmlFor="pais">País</label>
              <input
                id="pais"
                required
                value={form.pais}
                onChange={(e) => setForm({ ...form, pais: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="circuito">Circuito</label>
            <input
              id="circuito"
              required
              value={form.circuito}
              onChange={(e) => setForm({ ...form, circuito: e.target.value })}
            />
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label htmlFor="ronda">Ronda</label>
              <input
                id="ronda"
                type="number"
                required
                value={form.ronda}
                onChange={(e) => setForm({ ...form, ronda: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fecha_inicio">Inicio del fin de semana</label>
              <input
                id="fecha_inicio"
                type="datetime-local"
                required
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fecha_carrera">Carrera</label>
              <input
                id="fecha_carrera"
                type="datetime-local"
                required
                value={form.fecha_carrera}
                onChange={(e) => setForm({ ...form, fecha_carrera: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear Gran Premio'}
            </Button>
            {editandoId && (
              <Button type="button" variante="secondary" onClick={cancelar}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {cargando && <Loader mensaje="Cargando calendario..." />}

      {!cargando && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ronda</th>
                <th>Nombre</th>
                <th>Temporada</th>
                <th>Carrera</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gps.map((gp) => (
                <tr key={gp.id}>
                  <td>{gp.ronda}</td>
                  <td>{gp.nombre}</td>
                  <td>{gp.temporada}</td>
                  <td>{new Date(gp.fecha_carrera).toLocaleDateString('es')}</td>
                  <td>
                    <div className="form-row">
                      <Button tamano="sm" variante="secondary" onClick={() => editar(gp)}>
                        Editar
                      </Button>
                      <Button tamano="sm" variante="danger" onClick={() => void manejarEliminar(gp.id)}>
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
