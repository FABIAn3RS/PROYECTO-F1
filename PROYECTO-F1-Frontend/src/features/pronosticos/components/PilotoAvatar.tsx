import { useState } from 'react';

interface PilotoAvatarProps {
  nombre: string;
  color?: string | null;
  fotoUrl?: string | null;
  tamano?: 'sm' | 'md' | 'lg';
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

export default function PilotoAvatar({ nombre, color, fotoUrl, tamano = 'md' }: PilotoAvatarProps) {
  const [errorImagen, setErrorImagen] = useState(false);
  const mostrarFoto = Boolean(fotoUrl) && !errorImagen;

  return (
    <div
      className={`piloto-avatar piloto-avatar--${tamano}`}
      style={{ background: color ?? 'var(--gray-700)' }}
    >
      {mostrarFoto ? (
        <img
          src={fotoUrl!}
          alt={nombre}
          className="piloto-avatar__img"
          onError={() => setErrorImagen(true)}
        />
      ) : (
        iniciales(nombre)
      )}
    </div>
  );
}
