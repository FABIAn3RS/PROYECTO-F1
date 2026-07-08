const links = [
  { title: 'Documentación React', href: 'https://react.dev' },
  { title: 'React Router', href: 'https://reactrouter.com' },
  { title: 'Vite', href: 'https://vite.dev' },
  { title: 'TypeScript', href: 'https://www.typescriptlang.org/docs/' },
];

export default function Home() {
  return (
    <main className="main">
      <div className="content">
        <div className="left-side">
          <div className="logo" aria-hidden="true">
            <span className="logo-f1">F1</span>
          </div>
          <h1>PRJTF1</h1>
          <p>Plataforma de Pronósticos Deportivos — Fórmula 1</p>
          <p className="subtitle">Tu aplicación React está lista. 🏎️</p>
        </div>

        <div className="divider" role="separator" aria-label="Separador" />

        <div className="right-side">
          <div className="pill-group">
            {links.map((item) => (
              <a
                key={item.title}
                className="pill"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{item.title}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="14"
                  viewBox="0 -960 960 960"
                  width="14"
                  fill="currentColor"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
