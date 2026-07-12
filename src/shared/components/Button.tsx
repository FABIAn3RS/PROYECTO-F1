import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: 'md' | 'sm';
}

export default function Button({
  variante = 'primary',
  tamano = 'md',
  className = '',
  ...rest
}: ButtonProps) {
  const clases = ['btn', `btn-${variante}`, tamano === 'sm' ? 'btn-sm' : '', className]
    .filter(Boolean)
    .join(' ');

  return <button className={clases} {...rest} />;
}
