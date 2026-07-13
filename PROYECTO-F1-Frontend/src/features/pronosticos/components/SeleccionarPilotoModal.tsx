import { useState } from 'react';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import PilotoAvatar from './PilotoAvatar';
import Button from '../../../shared/components/Button';

interface SeleccionarPilotoModalProps {
  titulo: string;
  pilotos: PilotoConEscuderia[];
  seleccion: (string | null)[];
  etiquetas?: string[];
  fotos: Record<string, string | null>;
  onGuardar: (nuevaSeleccion: (string | null)[]) => void;
  onCerrar: () => void;
}

export default function SeleccionarPilotoModal({
  titulo,
  pilotos,
  seleccion,
  etiquetas,
  fotos,
  onGuardar,
  onCerrar,
}: SeleccionarPilotoModalProps) {
  const [seleccionLocal, setSeleccionLocal] = useState<(string | null)[]>([...seleccion]);
  const maxSeleccion = seleccion.length;

  function piloto(id: string | null): PilotoConEscuderia | undefined {
    return id ? pilotos.find((p) => p.id === id) : undefined;
  }

  function agregar(pilotoId: string) {
    if (maxSeleccion === 1) {
      setSeleccionLocal([pilotoId]);
      return;
    }
    setSeleccionLocal((prev) => {
      const indiceVacio = prev.findIndex((v) => !v);
      if (indiceVacio === -1) return prev;
      const copia = [...prev];
      copia[indiceVacio] = pilotoId;
      return copia;
    });
  }

  function quitar(pilotoId: string) {
    setSeleccionLocal((prev) => prev.map((v) => (v === pilotoId ? null : v)));
  }

  function limpiar() {
    setSeleccionLocal(seleccionLocal.map(() => null));
  }

  const seleccionLlena = seleccionLocal.every(Boolean);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal__seleccionados">
          {seleccionLocal.map((id, indice) => {
            const p = piloto(id);
            return (
              <div key={indice} className="stack" style={{ alignItems: 'center', gap: '0.35rem' }}>
                {p ? (
                  <div className="modal__seleccionado">
                    <PilotoAvatar
                      nombre={p.nombre}
                      color={p.escuderia?.color}
                      fotoUrl={fotos[p.id]}
                      tamano="lg"
                    />
                    <button
                      type="button"
                      className="modal__quitar"
                      onClick={() => quitar(p.id)}
                      aria-label={`Quitar ${p.nombre}`}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="piloto-slot__vacio">+</div>
                )}
                {etiquetas?.[indice] && <span className="piloto-slot__posicion">{etiquetas[indice]}</span>}
              </div>
            );
          })}
        </div>

        <div className="modal__lista">
          {pilotos.map((p) => {
            const seleccionado = seleccionLocal.includes(p.id);
            return (
              <div key={p.id} className="modal__fila">
                <PilotoAvatar
                  nombre={p.nombre}
                  color={p.escuderia?.color}
                  fotoUrl={fotos[p.id]}
                  tamano="sm"
                />
                <div className="modal__fila-info">
                  <div className="modal__fila-nombre">{p.nombre}</div>
                  <div className="modal__fila-equipo">{p.escuderia?.nombre ?? 'Sin escudería'}</div>
                </div>
                <span className="modal__fila-puntos">{p.puntos_temporada} pts</span>
                {seleccionado ? (
                  <button
                    type="button"
                    className="modal__fila-toggle modal__fila-toggle--quitar"
                    onClick={() => quitar(p.id)}
                    aria-label={`Quitar ${p.nombre}`}
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    type="button"
                    className="modal__fila-toggle modal__fila-toggle--agregar"
                    onClick={() => agregar(p.id)}
                    disabled={seleccionLlena}
                    aria-label={`Agregar ${p.nombre}`}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal__footer">
          <Button onClick={() => onGuardar(seleccionLocal)}>Guardar selección</Button>
          <button type="button" className="modal__limpiar" onClick={limpiar}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
