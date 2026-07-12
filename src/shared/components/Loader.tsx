interface LoaderProps {
  mensaje?: string;
}

export default function Loader({ mensaje = 'Cargando...' }: LoaderProps) {
  return (
    <div className="loader">
      <div className="loader__spinner" />
      <p>{mensaje}</p>
    </div>
  );
}
