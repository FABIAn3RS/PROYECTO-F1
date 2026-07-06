# Estructura del Proyecto — Pronósticos Deportivos F1

Arquitectura **cliente-servidor**:

- **Servidor (backend):** FastAPI + PostgreSQL, expone una API REST.
- **Cliente (frontend):** Angular, consume la API vía HTTP.

Ambos lados se organizan **por módulo de negocio**, alineados 1 a 1 con las épicas del backlog (EP-01 a EP-08). Esto facilita que cada módulo se desarrolle, pruebe y despliegue de forma independiente a medida que avanza el backlog.

---

## 1. Backend (FastAPI) — `proyecto_f1_bcknd/`

```
proyecto_f1_bcknd/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── init.sql
├── .env.example
│
└── app/
    ├── main.py                    # Punto de entrada, registra todos los routers
    ├── database.py                # Conexión a PostgreSQL (SessionLocal, Base, get_db)
    ├── config.py                  # Variables de entorno centralizadas (a crear)
    │
    ├── core/                      # (a crear) utilidades transversales
    │   ├── security.py            # JWT, hash de passwords, dependencias de auth
    │   └── exceptions.py          # Excepciones HTTP reutilizables
    │
    └── modules/                   # Un paquete por épica del backlog
        │
        ├── auth/                  # EP-01 Gestión de usuarios
        │   ├── models.py          # Usuario, PasswordResetToken
        │   ├── schemas.py         # UsuarioCreate, LoginRequest, Token...
        │   ├── crud.py
        │   └── router.py          # /auth/register, /login, /logout, /forgot-password
        │
        ├── usuarios/               # EP-02 Gestión del perfil
        │   ├── models.py           # (extiende Usuario: piloto/escudería favorita)
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py           # /users/me (GET, PUT)
        │
        ├── calendario/              # EP-03 Calendario de Grandes Premios
        │   ├── models.py            # GranPremio
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py            # /grandes-premios
        │
        ├── pilotos/                 # EP-04 (parte 1) Información de pilotos
        │   ├── models.py            # Piloto
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py            # /pilotos, /pilotos/clasificacion
        │
        ├── escuderias/               # EP-04 (parte 2) Información de escuderías
        │   ├── models.py             # Escuderia
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py             # /escuderias, /escuderias/clasificacion
        │
        ├── pronosticos/               # EP-05 Pronósticos de carreras
        │   ├── models.py              # Pronostico
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py              # /pronosticos (CRUD + confirmar)
        │
        ├── resultados/                 # EP-06 Resultados y clasificación
        │   ├── models.py                # ResultadoOficial
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py                # /grandes-premios/{id}/resultados
        │
        └── admin/                        # EP-08 Panel de administración
            ├── schemas.py
            └── router.py                  # CRUD protegido de GPs, pilotos, escuderías,
                                            # resultados oficiales, apertura/cierre de pronósticos
```

> **Nota:** EP-07 (Historial y estadísticas, HU-23 a HU-26) no es un módulo con tablas propias — son *consultas agregadas* sobre `pronosticos` + `resultados_oficiales`. Vive como endpoints extra dentro de `usuarios/router.py` (ej. `/users/me/pronosticos`, `/users/me/estadisticas`) y `resultados/router.py` (`/ranking`).

### Por qué reorganizar así (vs. la estructura plana actual)

Ahora mismo el backend tiene todo en `app/models.py`, `app/schemas.py`, `app/crud.py` planos. Funciona bien para EP-01 (4 HUs), pero con 31 HUs y 8 épicas esos archivos se vuelven inmanejables. La estructura modular:

- Permite que cada épica avance sin pisar el código de otra.
- Facilita el testing por módulo.
- Es más fácil de repartir si en algún punto trabajan varias personas.

---

## 2. Frontend (React) — `proyecto_f1_frontend/` (por crear)

```
proyecto_f1_frontend/
├── package.json
├── vite.config.ts                  # (o next.config.js si usan Next.js)
├── tsconfig.json
│
└── src/
    ├── main.tsx                    # Punto de entrada, monta <App />
    ├── App.tsx                     # Define las rutas (React Router)
    │
    ├── core/                       # Servicios transversales, hooks y contexto
    │   ├── api/
    │   │   └── axiosClient.ts      # Instancia de Axios con baseURL de la API
    │   ├── context/
    │   │   └── AuthContext.tsx     # Estado global de sesión (usuario, token)
    │   ├── hooks/
    │   │   ├── useAuth.ts          # Acceso al AuthContext
    │   │   └── useFetch.ts         # Hook genérico de consumo de API
    │   └── guards/
    │       ├── PrivateRoute.tsx    # Protege rutas privadas
    │       └── AdminRoute.tsx      # Protege rutas de EP-08
    │
    ├── shared/                     # Componentes reutilizables (Navbar, Card, Button, etc.)
    │   └── components/
    │
    └── features/                   # Una carpeta por épica
        │
        ├── auth/                   # EP-01
        │   ├── pages/
        │   │   ├── Login.tsx
        │   │   ├── Registro.tsx
        │   │   └── RecuperarPassword.tsx
        │   └── services/
        │       └── authService.ts  # Llamadas a /auth/*
        │
        ├── perfil/                  # EP-02
        │   ├── pages/
        │   │   └── EditarPerfil.tsx
        │   └── services/
        │       └── perfilService.ts
        │
        ├── calendario/               # EP-03
        │   ├── pages/
        │   │   ├── ListaGPs.tsx
        │   │   └── DetalleGP.tsx
        │   └── services/
        │       └── calendarioService.ts
        │
        ├── competencia/               # EP-04
        │   ├── pages/
        │   │   ├── Pilotos.tsx
        │   │   └── Escuderias.tsx
        │   └── services/
        │       └── competenciaService.ts
        │
        ├── pronosticos/                # EP-05
        │   ├── pages/
        │   │   ├── FormularioPronostico.tsx
        │   │   └── ConfirmarPronostico.tsx
        │   └── services/
        │       └── pronosticosService.ts
        │
        ├── resultados/                  # EP-06
        │   ├── pages/
        │   │   └── Clasificacion.tsx
        │   └── services/
        │       └── resultadosService.ts
        │
        ├── historial/                    # EP-07
        │   ├── pages/
        │   │   ├── MisPronosticos.tsx
        │   │   └── Ranking.tsx
        │   └── services/
        │       └── historialService.ts
        │
        └── admin/                         # EP-08
            ├── pages/
            │   ├── GestionGPs.tsx
            │   ├── GestionPilotos.tsx
            │   ├── GestionEscuderias.tsx
            │   └── RegistrarResultados.tsx
            └── services/
                └── adminService.ts
```

### Convenciones clave en esta estructura React

- **Cada `feature/` es autocontenido:** sus propias `pages/` (vistas) y `services/` (llamadas HTTP a su módulo del backend). No hay lógica de negocio suelta en componentes de `shared/`.
- **`core/context/AuthContext.tsx`** reemplaza el `AuthService` + guards de Angular: expone `usuario`, `token`, `login()`, `logout()` vía Context API (o Redux/Zustand si el proyecto crece).
- **`PrivateRoute` / `AdminRoute`** son wrappers de `<Route>` que verifican el `AuthContext` antes de renderizar, equivalentes a los guards de Angular.
- **`axiosClient.ts`** centraliza el interceptor que adjunta el JWT a cada request (equivalente al `jwt.interceptor.ts` de Angular).

---

## 3. Mapeo Épica → Módulo backend → Módulo frontend

| Épica | Módulo backend | Módulo frontend (React) |
|---|---|---|
| EP-01 | `modules/auth` | `features/auth` |
| EP-02 | `modules/usuarios` | `features/perfil` |
| EP-03 | `modules/calendario` | `features/calendario` |
| EP-04 | `modules/pilotos` + `modules/escuderias` | `features/competencia` |
| EP-05 | `modules/pronosticos` | `features/pronosticos` |
| EP-06 | `modules/resultados` | `features/resultados` |
| EP-07 | consultas en `usuarios` + `resultados` | `features/historial` |
| EP-08 | `modules/admin` | `features/admin` |

---

## 4. Próximo paso sugerido

1. Migrar el código actual (`app/models.py`, `app/schemas.py`, `app/routers/auth.py`) a `app/modules/auth/` respetando esta estructura, sin romper lo que ya funciona.
2. Crear el proyecto React con `npm create vite@latest proyecto_f1_frontend -- --template react-ts` y armar los `features/` vacíos como scaffolding.
3. A partir de ahí, cada Sprint (según tu tablero TSK-XX) cae naturalmente dentro de un módulo ya existente.
