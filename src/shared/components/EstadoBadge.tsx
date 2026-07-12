import type { EstadoGP } from '../../models';

const etiquetas: Record<EstadoGP, string> = {
  proximo: 'Próximo',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
};

export default function EstadoBadge({ estado }: { estado: EstadoGP }) {
  return <span className={`badge badge-${estado}`}>{etiquetas[estado]}</span>;
}
