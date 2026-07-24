# Documentación Técnica, Arquitectura de Sistemas y Modelado Ágil: PronoStats

**Universidad Laica Eloy Alfaro de Manabí (ULEAM)** **Facultad de Ciencias de la Vida y Tecnologías - Carrera de Ingeniería en Software (Nivel 5)** **Asignatura:** Modelado Ágil del Software  
**Docente:** Ing. Israel Gomez  
**Período Académico:** 2026-1  

**Equipo de Desarrollo (Grupo C):**
* Balzeca Rezabala Fabian Andre
* Veliz Ponce Leandro Jesus
* Loor Muñoz Jose Andres
* Viles Lopez Johandry Andres
* Bravo Ponce Freddy Marcelo

---

## 1. Enlaces Oficiales, Despliegue y Entorno de Pruebas

El sistema ha sido desplegado utilizando contenedores serverless en la nube, garantizando alta disponibilidad y paridad total entre los entornos de desarrollo y producción.

* **Repositorio de Código Fuente (GitHub):** https://github.com/FABIAn3RS/PROYECTO-F1
* **Despliegue Producción (Google Cloud Run):** https://proyecto-f1-frontend-5czk4oasdq-uc.a.run.app

### 1.1. Credenciales para Demostración (Evaluación Académica)
Para facilitar la evaluación interactiva del flujo de seguridad transaccional y los bloqueos de estado del MVP, se habilitó el siguiente entorno de pruebas:
* **Usuario de prueba:** fremarbrapo@gmail.com
* **Contraseña:** Abc12345
* **Tarjeta de Crédito ficticia (Stripe Sandbox):** 4242 4242 4242 4242 (CVC: Cualquier número de tres digítos, Fecha de expiración: Cualquiera válida a futuro).

### 1.2. Referencias Oficiales de API de Terceros (Didit v3)
* Documentación API - Validación Registral de Cédula (Ecuador): https://docs.didit.me/api-reference/database-validation/ecuador/cedula
* Casos de Uso y Marco de Legalidad: https://didit.me/es/blog/ecuador-cedula-database-validation-de/

---

## 2. Resumen Ejecutivo y Diseño Arquitectónico (DDD-Lite)

PronoStats es una solución web orientada a la analítica predictiva descriptiva y la gamificación de pronósticos basados en el campeonato mundial de Fórmula 1. 

PronoStats es una solución web orientada a la analítica predictiva descriptiva y la gamificación de pronósticos basados en el campeonato mundial de Fórmula 1. 

La arquitectura cliente-servidor se estructuró aplicando principios de **Diseño Orientado al Dominio (DDD-Lite)** en el backend (FastAPI). La lógica de negocio no se centraliza en enrutadores planos, sino que se fragmenta en submódulos autónomos ubicados en el directorio `app/modules/`, alineados directamente con las Épicas del Product Backlog ágil:
* **`auth/` (EP-01):** Cifrado asimétrico (bcrypt), emisión de JWT y ciclo de sesiones de usuario.
* **`usuarios/` (EP-02):** Preferencias, mutación del perfil y asignación de escuderías/pilotos favoritos.
* **`calendario/` (EP-03):** Cronología y estado evolutivo de los Grandes Premios.
* **`pilotos/` y `escuderias/` (EP-04):** Entidades del dominio deportivo oficial.
* **`pronosticos/` (EP-05):** Core transaccional; gestiona los pronósticos de ganador, podio, pole y vuelta rápida, validando estrictamente las restricciones temporales de cierre.
* **`acceso/` y `admin/` (EP-08):** Orquestación de la pasarela de monetización segura y panel CRUD administrativo.

---

## 3. Modelo de Negocio, Mitigación Legal y Arquitectura Financiera (Stripe)

Uno de los desafíos de ingeniería más rigurosos fue estructurar un modelo comercial que cumpliera estrictamente con el marco legal ecuatoriano y las políticas de las pasarelas de pago internacionales sobre los juegos de azar.

### 3.1. Pivote Arquitectónico: Modelo Tipster / Fantasy League
El equipo ejecutó un pivote/cambio estratégico y documentado: **PronoStats NO opera como una casa de apuestas**. El sistema bloquea explícitamente los depósitos recargables de dinero (billeteras virtuales) y no efectúa retornos monetarios líquidos por aciertos. Opera bajo un esquema de *Fantasy League* o plataforma de *Tipsters*, donde la única métrica de valor es la acumulación de puntos en un Ranking Global público.
* **Nivel Freemium:** Los usuarios verificados obtienen acceso limitado a un único pronóstico gratuito, vinculado a la entidad `gp_gratis_id` en la base de datos.
* **Pase de Temporada (Premium):** Se modeló la entidad transaccional `PaseTemporada`. Su adquisición mediante un pago único de $20.00 USD desbloquea la participación ilimitada en todas las rondas del campeonato por el período exacto de un año.

### 3.2. Bloqueos de Estado en React y Checkout Seguro (Stripe + Didit)
La ejecución financiera se delegó en la infraestructura de **Stripe**. Sin embargo, la interfaz cliente (vía `Perfil.tsx`) implementa un bloqueo multicapa estricto evaluando el estado del JWT: `(!usuario.telefono_verificado || usuario.kyc_estado !== 'aprobado')`, de manera que se requiere la autentificación de estos dos factores previo al acceso de la pasarela de pago.

Para habilitar la redirección al *Stripe Checkout*, el usuario debe superar tres barreras de seguridad perimetral de identidad:
1. **Verificación de Correo:** Validación asíncrona mediante la plataforma *Resend*, mitigando cuentas bot.
2. **Verificación Telefónica (2FA):** Integración con Firebase/SMS, exigiendo la confirmación de un código de 6 dígitos OTP.
3. **Identidad Biométrica KYC (Didit):** Validación registral contra la base de datos de cédulas de identidad. El estado de la plataforma transita de `Pendiente` a `Aprobado` únicamente cuando el backend procesa con éxito el *webhook* criptográfico firmado por Didit.

Una vez superadas las verificaciones, el usuario es redirigido al entorno seguro de Stripe. El backend captura el evento `checkout.session.completed` y activa el pase actualizando la entidad relacional.

---

## 4. Ingeniería de Datos: Esquema Relacional y Topología de Enrutamiento

La integridad del ecosistema recae en un diseño de base de datos fuertemente tipado y un árbol de navegación de frontend protegido.

### 4.1. Esquema de Base de Datos PostgreSQL (`init.sql`)
La persistencia se modeló en PostgreSQL 16 utilizando UUIDs (`uuid-ossp`) como llaves primarias para prevenir ataques de enumeración (Insecure Direct Object Reference). El modelo entidad-relación abarca:
* **Entidades de Identidad y Seguridad:** `usuarios`, `roles`, `password_reset_tokens` y `codigos_verificacion`. El esquema incluye constraints únicas para correos y control de borrado en cascada (ON DELETE CASCADE) para tokens efímeros.
* **Entidades de Dominio Deportivo:** `grandes_premios` (con llaves únicas por `temporada` y `ronda`), `escuderias` y `pilotos`.
* **Entidades Transaccionales:** `resultados_oficiales` y `resultado_posiciones` aseguran la atomicidad de los resultados (1 ganador, 1 pole, 1 vuelta rápida).
* **Entidades de Monetización y Gamificación:** `pases_temporada` documenta el ID de sesión de Stripe y su vigencia exacta; `pronosticos` unifica las predicciones (P1, P2, P3, Pole, Vuelta Rápida) vinculando las llaves foráneas a la tabla `pilotos` e integrando un flag de inmutabilidad (`confirmado = BOOLEAN`).

Adicionalmente, se programaron Triggers SQL (`set_updated_at()`) que actualizan automáticamente las marcas de tiempo en todas las mutaciones de fila a nivel de motor de base de datos.

### 4.2. Topología de Enrutamiento SPA (`App.tsx`)
El cliente React implementa un árbol de navegación semántico soportado por React Router v7. Las rutas están categorizadas por niveles de autorización mediante componentes envolventes (*Guards*):
* **Rutas Públicas:** Acceso irrestricto a vistas informativas como `/calendario`, `/pilotos`, `/escuderias`, `/resultados/clasificacion`, y los flujos de `/login` y `/registro`.
* **Rutas Privadas (`<PrivateRoute>`):** Protegen la lógica transaccional. Requieren un JWT válido en el *Context API* para renderizar `/perfil`, `/pronosticos` y el `/ranking`.
* **Rutas Administrativas (`<AdminRoute>`):** Verifica la correspondencia del `rol_id` (Administrador) para exponer el panel de control de mantenimientos en `/admin/grandes-premios` y `/admin/resultados`.

---

## 5. Subsistemas Core y Algoritmia Computacional

### 5.1. Motor Analítico Determinista (`motor.py`)
Para ofrecer analítica predictiva de alto valor sin incurrir en la latencia o los costos computacionales de modelos de Machine Learning, el backend inyecta predicciones públicas mediante un algoritmo determinista de suma ponderada. El motor procesa un rating iterativo por piloto basado en:
* Puntos actuales del piloto (Peso: 1.0)
* Puntos de la escudería (Peso: 0.3)
* Rendimiento histórico en el circuito actual (Peso: 2.5)
* Racha/Forma reciente en las últimas carreras (Peso: 2.0)

El sistema normaliza estas puntuaciones a base porcentual 100. Posteriormente, evalúa la varianza entre el 1.º y 2.º lugar. Si la diferencia excede los 8 puntos porcentuales, cataloga la predicción con un nivel de confianza `ALTO`, inyectando dinámicamente un resumen textual autogenerado (ej. *"Combina buen historial en este circuito con buena forma reciente"*).

### 5.2. Webhooks Criptográficos (HMAC-SHA256)
Para autenticar de manera segura la integridad de las notificaciones de éxito KYC enviadas por la pasarela de Didit, el script `didit.py` ejecuta ingeniería inversa sobre el payload JSON. El algoritmo trunca los valores numéricos flotantes que terminan en cero (convirtiéndolos a enteros), genera un JSON canónico minimizado y computa un hash criptográfico **HMAC-SHA256**. Finalmente, implementa protección contra *Replay Attacks* rechazando cualquier petición cuyo timestamp en cabecera supere los 300 segundos de discrepancia con el servidor.

### 5.3. Pipeline ETL Automatizado (`thesportsdb_sync.py`)
Para mantener el calendario y las estadísticas vivas sin depender de entradas manuales de datos (*Data Entry*), el sistema implementa una canalización ETL (Extract, Transform, Load) que consume el identificador de liga 4370 desde la API TheSportsDB. El proceso extrae la metadata, descarta eventos secundarios (como sesiones de prácticas) y ejecuta instrucciones `upsert` atómicas en las sesiones de SQLAlchemy, actualizando silenciosamente a los pilotos y constructores.

---

## 6. Infraestructura DevOps, Multi-stage Builds y CI/CD

El proyecto cumple con las normativas avanzadas de Ecosistemas DevOps de la asignatura.

* **Dockerización del Backend:** Empaquetado sobre `python:3.12-slim`, instalando dependencias estáticas y exponiéndose mediante Uvicorn en el puerto 8000.
* **Dockerización del Frontend (Multi-stage):** Se aplicó un patrón de construcción por etapas. La fase de Build (`node:20-alpine`) inyecta las variables de entorno de Vite de manera segura. La fase Deploy traslada únicamente los binarios estáticos minificados a una imagen extremadamente ligera de Nginx (`nginx:1.27-alpine`).
* **Optimización Proxy Inverso (`nginx.conf.template`):** Se sobrescribió la configuración por defecto de Nginx para inyectar *SPA fallback* (`try_files`) garantizando la fluidez de React Router, sumado a compresión `gzip` y políticas de caché inmutable (`Cache-Control public, immutable`) sobre los activos transpilados.
* **Integración y Despliegue Continuo (Google Cloud Build):** La automatización CI/CD está gobernada por `cloudbuild.yaml`. Cada *push* a la rama principal empaqueta la imagen Docker, la sube al Google Artifact Registry versionada con el `$COMMIT_SHA` y ejecuta un redespliegue de servicio progresivo (*Zero-downtime*) en Google Cloud Run.

---

## 7. Gestión Ágil, Retrospectiva y Adaptabilidad

El equipo adoptó un marco de gestión ágil soportado por la herramienta **GitHub Projects** (@FABIAn3RS's F1 PRJT), organizando el Product Backlog en un tablero Kanban interactivo estructurado en columnas de estado (`Todo`, `In Progress`, `Done`).

### 7.1. Estimaciones (T-Shirt Sizing) y Evolución por Sprints
El esfuerzo de desarrollo se desglosó en tareas técnicas (TSK) asociadas a las Historias de Usuario (HU). Se aplicó la técnica de **T-Shirt Sizing** (XS, S, M, L, XL) para dimensionar la complejidad, orquestando el trabajo a través de 5 Sprints:

* **Sprint 1 (Fundaciones):**
  * `[TSK-01]` Configuración del repositorio y estructura de carpetas (Talla: `XS`).
  * `[TSK-02]` Diseño del esquema de Base de Datos para Usuarios y Roles (Talla: `S`).
* **Sprint 2 (Autenticación):**
  * `[TSK-04]` Frontend: Maquetado de pantalla de Inicio de Sesión (HU-02) (Talla: `S`).
  * `[TSK-05]` Frontend: Maquetado del formulario de Registro (HU-01) (Talla: `S`).
* **Sprint 3 (Datos de Competencia):**
  * `[TSK-03]` Script de inserción de datos iniciales para el Calendario (Talla: `S`).
  * `[TSK-06]` Frontend: Vista del Calendario con datos quemados (HU-08) (Talla: `S`).
  * `[TSK-07]` Backend: Lógica de encriptación de contraseñas (Talla: `S`).
  * `[TSK-08]` Backend: Endpoint para recuperar contraseña (HU-03) (Talla: `S`).
  * `[TSK-09]` Frontend: Componente de cierre de sesión (HU-04) (Talla: `XS`).
  * `[TSK-10]` Base de Datos: Creación de tablas para Pilotos y Escuderías (Talla: `S`).
  * `[TSK-11]` Frontend: Tarjetas visuales de Pilotos (HU-11) (Talla: `S`).
  * `[TSK-12]` Frontend: Tablas de clasificación (HU-14) (Talla: `M`).
* **Sprint 4 (Core Transaccional de Pronósticos):**
  * `[TSK-13]` Backend: Endpoint para registrar pronóstico (HU-15) (Talla: `M`).
  * `[TSK-14]` Frontend: Formulario para seleccionar Pole Position (HU-16) (Talla: `S`).
  * `[TSK-15]` Backend: Validación relacional para evitar pilotos repetidos (HU-17) (Talla: `M`).
  * `[TSK-16]` Frontend: Pantalla de resumen y confirmación (HU-20) (Talla: `S`).
* **Sprint 5 (Administración y Cierres):**
  * `[TSK-17]` Backend: Bloqueo de seguridad para cerrar pronósticos fuera de tiempo (HU-31) (Talla: `M`).
  * `[TSK-18]` Frontend: Panel administrativo de resultados (HU-30) (Talla: `L`).

### 7.2. Adaptabilidad (El Pivote Central y Nuevos Requisitos)
La evidencia definitiva del pensamiento ágil ocurrió durante la revisión iterativa del producto, donde el equipo demostró capacidad de adaptación reflejada directamente en el tablero Kanban:
1. **Pivote Comercial Legal:** Se documentó el retiro de la antigua épica de pronósticos totalmente libres, pivotando hacia un modelo *Freemium* para evadir riesgos normativos. Este cambio redireccionó los esfuerzos para implementar integraciones seguras (Stripe/Didit KYC) antes de lanzar el producto a producción.
2. **Identificación de Cuellos de Botella:** Durante el Sprint 5, se identificó que el mantenimiento manual del campeonato era insostenible. Se priorizó y ejecutó una historia no contemplada originalmente: **`HU-32 (nueva)` Como administrador quiero sincronizar el calendario, pilotos, escuderías y resultados desde una fuente externa... (Talla: `XL`)**, resultando en la construcción del pipeline ETL automatizado.

---

## 8. Matriz de Contribución Individual en Ingeniería de Software

La madurez tecnológica del MVP de PronoStats se alcanzó mediante una estricta segregación de responsabilidades de ingeniería, comprobable a través del registro histórico de control de versiones (Git):

| Ingeniero / Especialista | Resumen de Aportes de Ingeniería Demostrados en Código |
| :--- | :--- |
| **Balzeca Rezabala Fabian Andre** | **Ingeniero Cloud DevOps y Operaciones Frontend.** Artífice absoluto de la infraestructura en la nube. Redactó los *Dockerfiles* optimizados de producción (Multi-stage), reescribió las directivas del proxy Nginx para *SPA fallback* y caché inmutable, y programó el canal de despliegue automatizado CI/CD en Google Cloud Build. En el desarrollo frontend (React), implementó los componentes de interfaz para la pasarela de pagos de Stripe y lideró la visualización de la tabla del ranking global de usuarios. |
| **Veliz Ponce Leandro Jesus** | **Ingeniero de UI/UX e Integración de Interfaces React.** Encargado de materializar las lógicas y reglas de negocio del servidor en la *Single Page Application* interactiva. Programó la arquitectura base del cliente bajo React 19 y TypeScript, diseñando componentes altamente reutilizables como los modales de selección de avatares de pilotos y barras de navegación. Orquestó la gestión segura de las rutas del navegador usando los *guards* `<PrivateRoute>` y `<AdminRoute>` de React Router DOM, y acopló eficazmente las interacciones asíncronas con la API. |
| **Loor Muñoz Jose Andres** | **Arquitecto de Software y Líder de Modelado Ágil.** Estructuró la topología lógica (DDD-Lite) del servidor y lideró la auditoría y conciliación del Product Backlog, diseñando técnica y documentalmente el pivote comercial del MVP hacia el modelo *Freemium* para evadir los riesgos normativos. Diseñó los diagramas semánticos de arquitectura de componentes (Mermaid.js y C4) y consolidó íntegramente la documentación técnica y de integración DevOps, certificando y fundamentando el rigor ingenieril del proyecto ante los lineamientos académicos de la asignatura. |
| **Viles Lopez Johandry Andres** | **Desarrollador de Integración de Datos y Lógica Matemática.** Conceptualizó y codificó el determinismo del Motor Analítico de Predicciones (`motor.py`), ponderando estadísticamente las métricas de los equipos y pilotos. Construyó desde cero el pipeline de operaciones ETL (`thesportsdb_sync.py`) que garantiza la sincronización desatendida y persistente de los datos de la Fórmula 1 desde la API remota TheSportsDB. Lideró además el desarrollo lógico de los flujos de "Pronósticos Populares" y la recuperación segura de contraseñas de los usuarios. |
| **Bravo Ponce Freddy Marcelo** | **Arquitecto Backend y Experto en Ciberseguridad.** Desarrolló la API RESTful central asíncrona empleando FastAPI y definió el esquema de persistencia relacional íntegro en PostgreSQL. Resolvió el reto criptográfico más avanzado del proyecto: la ingeniería inversa y el procesamiento de firmas HMAC-SHA256 para autenticar los webhooks del sistema de verificación de identidad KYC (Didit). Configuró el proveedor Resend para correos transaccionales y blindó las rutas críticas de compra del Pase de Temporada contra ataques informáticos y suplantaciones de estado. |
