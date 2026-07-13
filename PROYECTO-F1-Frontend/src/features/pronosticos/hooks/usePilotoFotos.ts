import { useEffect, useState } from 'react';
import type { PilotoConEscuderia } from '../../competencia/services/competenciaService';
import { obtenerFotoPilotoPorNombre } from '../../thesportsdb/services/theSportsDbService';

/** Resuelve la foto (cutout/thumb) de cada piloto desde TheSportsDB, por nombre. */
export function usePilotoFotos(pilotos: PilotoConEscuderia[]): Record<string, string | null> {
  const [fotos, setFotos] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelado = false;

    pilotos.forEach((piloto) => {
      obtenerFotoPilotoPorNombre(piloto.nombre).then((url) => {
        if (!cancelado) {
          setFotos((prev) => (piloto.id in prev ? prev : { ...prev, [piloto.id]: url }));
        }
      });
    });

    return () => {
      cancelado = true;
    };
  }, [pilotos]);

  return fotos;
}
