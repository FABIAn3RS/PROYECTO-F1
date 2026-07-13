# Plan de Reconciliación y Cierre del MVP — Pronósticos Deportivos F1

> Elaborado a partir de: `DocPronósticosDeportivosF1.pdf` (backlog original), `HistoriasYEpicas.pdf` (backlog simplificado), el `README.md` (plan de verificación KYC), y el estado **real** actual del código en `PROYECTO-F1-Backend` y `PROYECTO-F1-Frontend`.

---

## 1. Resumen ejecutivo — qué es realmente el producto

- Los usuarios **crean sus propios pronósticos manuales** (ganador, pole, podio, vuelta rápida) **ya existe y funciona en el backend** (`/pronosticos`), pero **no tiene ninguna pantalla en el frontend todavía**.
- El acceso a crear pronósticos está limitado por un **Pase de Temporada de pago** (freemium) **Ya existe en el backend** (`/acceso`) y el frontend de Perfil ya lo integra (checkout, KYC, teléfono).
- La pantalla de "Predicciones" **ya fue reemplazada** por un motor real en el backend (`app/modules/predicciones/motor.py`): un algoritmo estadístico determinista (no IA) que combina puntos de campeonato, rendimiento histórico en el circuito y forma reciente. Es contenido informativo público, separado de los pronósticos que el usuario apuesta.
- Se agregó verificación de correo (Resend), teléfono (Firebase, simulado en `.env`) y KYC (Didit, simulado) como requisito para poder comprar el Pase de Temporada — esto no estaba en ninguno de los dos backlogs originales, es una decisión posterior documentada solo en el README.

**Conclusión:** hay dos productos coexistiendo en los documentos que enviaste — el backend ya implementó una síntesis propia de ambos (pronósticos manuales + suscripción + predicción informativa algorítmica + KYC). El frontend se quedó atrás en una sola pieza: **no hay pantalla para que el usuario cree/edite/confirme su pronóstico**, que es el corazón del producto.

---

## 2. Backlog unificado, con estado real

| Épica | HU origen | Descripción | Estado |
|---|---|---|---|
| EP-01 Usuarios | HU-01 a HU-04 | Registro, login, recuperar contraseña, logout | ✅ Backend + Frontend (+ verificación de correo, no prevista en ningún backlog) |
| EP-02 Perfil | HU-05 a HU-07 | Editar perfil, piloto/escudería favorita | ⚠️ Backend listo (`PUT /users/me`); Frontend de Perfil actual está enfocado en KYC/pase, **no expone edición de nombre/correo ni favoritos** |
| EP-03 Calendario | HU-08 a HU-10 | Calendario, detalle de GP, estado del evento | ✅ Backend + Frontend. Nota: ya **no** requiere pase para ver el detalle (antes sí, con `gp_gratis_id`) |
| EP-04 Pilotos/Escuderías | HU-11 a HU-14 | Listado y clasificación | ✅ Backend + Frontend |
| EP-05 Pronósticos (manual, del doc original) | HU-15 a HU-20 | Pronosticar ganador/pole/podio/vuelta rápida, editar, confirmar | ⚠️ **Backend 100% listo, Frontend inexistente** — no hay carpeta `features/pronosticos` |
| EP-06 Resultados y clasificación | HU-21, HU-22 | Resultados oficiales, clasificación del campeonato | ✅ Backend + Frontend (ya público, sin pase) |
| EP-07 Historial y estadísticas | HU-23 a HU-26 | Mis pronósticos, aciertos/fallos, puntuación, ranking | ⚠️ **Backend 100% listo (`/users/me/pronosticos`, `/users/me/estadisticas`, `/ranking`), Frontend inexistente** |
| EP-08 Admin | HU-27 a HU-31 | CRUD GP/pilotos/escuderías, registrar resultados, abrir/cerrar pronósticos | ✅ CRUD completo en Backend + Frontend. HU-31 (abrir/cerrar manualmente) **no existe**: el cierre es automático al llegar `fecha_inicio` del GP (decisión de diseño ya tomada, no es una brecha) |
| EP-07 (HistoriasYEpicas) Suscripción y límites | HU-21/32 a HU-25/36 | Pronóstico gratis limitado, suscripción premium, cancelar, gestionar | 🔀 **Parcial y con una contradicción real** — ver §4.1 |
| — (nuevo, no está en ningún backlog) | — | Predicciones algorítmicas informativas | ✅ Backend + Frontend, público |
| — (nuevo, no está en ningún backlog) | — | Verificación de correo / teléfono / KYC | ✅ Backend + Frontend (Perfil) |

---

## 3. Investigación: cómo funcionan los sitios de pronósticos reales

Resumen aplicado a este proyecto (fuentes al final):

1. **Nunca se presentan como casas de apuestas.** Los sitios de "tipsters" (ProTipster, Tipstrr, TipMaster, Betting Gods) se posicionan como *contenido informativo/de entretenimiento*, no como operadores de juego. Muestran un disclaimer visible: uso informativo, sin garantías, 18+, "juega responsablemente". **Recomendación:** agregar un disclaimer fijo (footer o banner) en toda la plataforma. No hace falta cumplimiento regulatorio de casino (self-exclusion, licencias estatales) porque el producto no procesa apuestas con dinero real de terceros ni paga premios en efectivo — es un juego de puntos con pase de acceso, más parecido a una fantasy league que a una casa de apuestas. Aun así, el disclaimer de "entretenimiento, no es asesoría financiera/de apuestas" es barato de implementar y evita malentendidos (importante para un proyecto universitario evaluado por terceros).
2. **La transparencia del historial es lo que genera confianza.** Plataformas serias (Tipstrr, Betting Gods) verifican y bloquean la edición de picks después de publicados, y muestran el récord histórico real (aciertos/fallos) de cada usuario o tipster de forma pública. Esto mapea **exactamente** con lo que ya modela el backend: `pronostico.confirmado` (no editable tras confirmar) + `puntos_obtenidos` + `/ranking`. **La brecha no es de backend, es que el frontend no muestra nada de esto todavía.**
3. **Indicador de confianza simple, no un número pseudo-científico.** Los sitios usan etiquetas como "Bet of the Day" o 1-5 estrellas, no "73.42% de probabilidad". El motor de predicciones del backend ya devuelve `nivel_confianza: bajo/medio/alto` — es el patrón correcto, hay que asegurarse de que el frontend lo use como elemento central y no lo entierre.
4. **Freemium con límite claro, no todo-o-nada.** El patrón estándar (y el que describe `HistoriasYEpicas.pdf` con HU-21/HU-32 "pronóstico gratuito") es dejar probar el producto gratis de forma limitada antes de pedir pago. El backend actual **no** implementa eso (ver §4.1) — es la brecha de producto más importante a decidir.
5. **Mobile-first y formularios simples.** El formulario de "hacer mi pronóstico" debe ser un solo paso claro (elegir P1/P2/P3/pole/vuelta rápida desde selects o tarjetas de piloto), con un resumen antes de confirmar — igual que HU-20 ("debe mostrar un resumen antes de confirmar").

**Fuentes:**
- [Sports Betting UI/UX: Strategic Guide for Sportsbooks](https://www.gammastack.com/blog/sports-betting-ui-ux-guide/)
- [Free Betting Tips, Predictions & Best Bet Offers | ProTipster](https://www.protipster.com/)
- [Tipster Prediction - Free Football Prediction Site](https://www.tipsterspredict.com/)
- [Tipstrr - Betting tips from professional tipsters](https://tipstrr.com/)
- [Compare Verified Betting Tipsters | Betting Gods](https://bettinggods.com/tipsters/)
- [TipMaster - Verified Sports Tipping Platform](https://tipmaster.ai/)
- [Responsible Gaming Regulations and Statutes Guide - AGA](https://www.americangaming.org/resources/responsible-gaming-regulations-and-statutes-guide/)

---

## 4. Decisiones de producto que hay que tomar antes de programar

### 4.1 — Contradicción real: ¿existe el "pronóstico gratis" o no?

- `HistoriasYEpicas.pdf` (HU-21, HU-32) y el "Cambio 3" del doc original dicen: *"sin suscripción, el usuario puede realizar únicamente un pronóstico en una sola carrera"*.
- El backend actual (`verificar_pase_pronosticos`) **no implementa esto**: sin pase activo, un usuario no-admin no puede crear **ningún** pronóstico (402 directo). El campo `gp_gratis_id` sigue en la tabla `usuarios` pero ya no lo usa ninguna dependencia — quedó huérfano de la refactorización anterior.
- **Investigación de mercado (confirmada):** este es un patrón real y muy común en sitios de pronósticos/tipsters — PickDawgz, Ftipster, WagerTalk, ProTipster y Pickswise ofrecen todos algún pick gratis limitado (por día, o "el pick del día") junto con una suscripción de pago para acceso ilimitado. No es una idea forzada del backlog académico, es el modelo freemium estándar de la industria.
- **Decisión tomada: SÍ, implementarlo.** Reenganchar `gp_gratis_id` en `verificar_pase_pronosticos` (backend) y reflejar el estado "pronóstico gratis disponible / usado / necesitas el pase" en el frontend.

### 4.2 — ¿La pantalla de Predicciones (algorítmica) debe requerir login? — ✅ Resuelto

Decisión tomada: **pública**. Ya aplicado:
- `App.tsx`: `/predicciones` se movió fuera de `<PrivateRoute />`.
- `Navbar.tsx`: el link "Predicciones" se movió a `linksPublicos`, visible para cualquier visitante.
- Verificado: `npm run build` y `tsc -b` sin errores tras el cambio.

---

## 5. Brechas a cerrar para que el MVP funcione como una plataforma real

Ordenadas por impacto en la "sensación de producto real":

1. **`features/pronosticos` (crítico, es el corazón del producto).** Falta por completo:
   - `pronosticosService.ts` → `POST /pronosticos`, `PUT /pronosticos/{id}`, `POST /pronosticos/{id}/confirmar`, `GET /pronosticos/gp/{gp_id}`.
   - `MiPronostico.tsx` (en la página de detalle del GP o accesible desde ahí): selección de P1/P2/P3/pole/vuelta rápida, validación de podio sin repetidos (ya la valida el backend, pero conviene repetirla en cliente para UX), resumen antes de confirmar (HU-20), bloqueo de edición si `confirmado = true` o si ya pasó `fecha_inicio`.
   - Manejo del 402 (`verificar_pase_pronosticos`) reutilizando el patrón que ya existe en Perfil para dirigir al usuario a comprar el pase.
2. **`features/historial` (EP-07, ya tiene 100% del backend listo).**
   - `MisPronosticos.tsx` → `GET /users/me/pronosticos`, cruzada con el nombre del GP y de los pilotos elegidos.
   - `MisEstadisticas.tsx` o una sección dentro de Perfil → `GET /users/me/estadisticas` (aciertos de pole, vuelta rápida, podio, puntos totales).
   - `Ranking.tsx` → `GET /ranking`, tabla pública ordenada por puntos — esto es exactamente el elemento de "transparencia/track record" que la investigación (§3.2) identifica como el que genera confianza en un sitio de pronósticos real.
3. **Enlazar todo desde la navegación y desde el detalle del GP.** Hoy `DetalleGP.tsx` solo enlaza a resultados; debe enlazar también a "Mi pronóstico para este GP" cuando el GP está en estado `proximo`.
4. **Resolver 4.1 y 4.2** antes de tocar código, para no construir la pantalla de pronósticos con el supuesto equivocado.
5. **Disclaimer de juego responsable / uso informativo** (barato, alto valor percibido) — un banner fijo o bloque en el Footer: *"Pronósticos F1 es un juego de predicción con fines de entretenimiento. No constituye una casa de apuestas ni asesoría financiera. Uso para mayores de 18 años."*
6. **Perfil (EP-02) incompleto** — falta edición de nombre/correo y selección de piloto/escudería favorita (`PUT /users/me` ya soporta ambos campos), la pantalla actual de Perfil solo cubre KYC/teléfono/pase.

---

## 6. Plan de verificación y seguridad (del README, + una adición)

El README ya documenta el plan vigente y **se mantiene sin cambios**:

1. **Correo** (Resend, 3,000/mes gratis): código de 6 dígitos, expira en 15 min, bloquea login hasta verificar. *(Implementado)*
2. **Teléfono** (Firebase Phone Auth, 10,000 SMS/mes gratis): captcha invisible + SMS, token de confirmación se valida en backend. *(Implementado, en modo simulado en `.env`)*
3. **KYC** (Didit, 500 verificaciones/mes gratis): sesión de verificación de cédula + selfie, veredicto por webhook (`kyc_estado`). *(Implementado, en modo simulado)*
4. Solo con teléfono y KYC aprobados se habilita la compra del Pase de Temporada (`/acceso/checkout`).

**Adición recomendada, no estaba en el README:** dado que ahora los pronósticos SÍ tienen consecuencia de puntos/ranking públicos ligados a la identidad del usuario, conviene:
- Agregar el disclaimer de juego responsable del punto 5 anterior.
- Confirmar que el checkbox de mayoría de edad (18+) se pida explícitamente en el registro o antes del primer pronóstico — hoy no se pide en ningún punto del flujo.

---

## 8. Requisitos del enunciado del curso (MVP genérico) — mapeo a F1

Este es el checklist de funcionalidades núcleo que compartiste, redactado en términos genéricos ("liga/equipo/partido/localía"). Es el mismo enunciado base del curso adaptado a cualquier deporte; aquí se traduce explícitamente al dominio F1 y se cruza con el estado real del código, para que quede documentado de una sola vez con todo lo demás.

| # | Requisito del enunciado (genérico) | Traducción al dominio F1 | Estado |
|---|---|---|---|
| 1 | Registro y perfil de usuario con ligas/equipos favoritos | Registro/login (EP-01) + `piloto_favorito_id` / `escuderia_favorita_id` en el perfil (EP-02) | ✅ Backend listo · ⚠️ Frontend no expone la selección de favoritos todavía (mismo gap que §5.6) |
| 2 | Catálogo de partidos próximos por liga, con datos básicos (equipos, fecha, localía) | Calendario de Grandes Premios: nombre, país, circuito, temporada, ronda, fecha de inicio/carrera | ✅ Backend + Frontend. "Localía" no existe como concepto en F1 (no hay local/visitante); su equivalente conceptual es el circuito/país, que ya se muestra |
| 3 | Motor de pronóstico simple basado en reglas/estadísticas históricas (forma reciente, promedio de goles, localía) que devuelve probabilidad estimada | `app/modules/predicciones/motor.py`: combina puntos de piloto y escudería, rendimiento histórico en el circuito y forma reciente en una suma ponderada normalizada a probabilidades | ✅ Backend implementado y alineado 1:1 con este requisito · ⚠️ Ver brecha nueva abajo (no se persiste) |
| 4 | Tabla de posiciones y resultados recientes desde una fuente de datos (API pública o dataset propio) | Clasificación de pilotos/escuderías + resultados oficiales, con sincronización real desde **TheSportsDB** (`/admin/sincronizaciones/thesportsdb`) | ✅ Backend + Frontend (admin) |
| 5 | Panel de "aciertos vs. fallos" **del modelo** a lo largo del tiempo | Comparar la predicción algorítmica generada por el motor contra el resultado oficial real de cada GP, y trackear esa métrica en el tiempo | ❌ **No existe. Es una brecha nueva, distinta a la del §5.2** (esa es "aciertos del usuario"; esta es "aciertos del modelo/algoritmo") |
| 6 | Dashboard administrativo para cargar/actualizar partidos y resultados | `GestionGPs`, `RegistrarResultados`, sincronización TheSportsDB | ✅ Backend + Frontend |
| 7 | Modelado de dominio (partido, equipo, predicción, resultado), manejo de incertidumbre, métricas de evaluación del pronóstico | Ver análisis abajo | ⚠️ Parcial — falta persistir la "Predicción" como entidad |

### 8.1 — Brecha nueva y estructural: la Predicción algorítmica no se persiste

Este es el hallazgo más importante de este checklist. Hoy `GET /predicciones/{gp_id}` **calcula la predicción al vuelo en cada request** y la devuelve, pero **nunca la guarda en base de datos**. No existe una tabla `predicciones` ni modelo `PrediccionGP` persistido — es un valor 100% derivado, no una entidad.

Esto es suficiente para el requisito #3 (mostrar una predicción), pero **no alcanza** para el #5 y el #7:

- No se puede construir un "panel de aciertos vs. fallos del modelo a través del tiempo" si no queda un registro histórico de qué predijo el modelo *en el momento en que cerró el pronóstico* (antes de saber el resultado real). Recalcular la predicción después de la carrera con los mismos datos ya no es honesto — hay que congelar el snapshot.
- El "manejo de incertidumbre" que pide el enunciado ya está parcialmente resuelto (`nivel_confianza`, `probabilidad` por piloto), pero sin persistencia no hay forma de evaluar retrospectivamente si un `nivel_confianza: alto` efectivamente acertó más que uno `bajo` — que es literalmente la métrica de evaluación que el enunciado pide.

**Recomendación de modelado (para decidir, no implementado aún):**
1. Nueva tabla `predicciones_historial` (o similar): `id`, `gran_premio_id` (FK, único por GP), `ganador_probable_id`, `podio_probable` (los 3 piloto_id en orden), `nivel_confianza`, `probabilidades` (JSON con el detalle completo), `generado_en`.
2. Se genera y congela automáticamente en el mismo momento en que se cierra el pronóstico del GP (`fecha_inicio`), o la primera vez que se registra el resultado oficial — lo importante es que sea **antes** de conocer el resultado real, para que la comparación sea honesta.
3. Al registrar resultados oficiales (`POST /admin/grandes-premios/{id}/resultados`), además de calificar los pronósticos de usuarios (ya lo hace), comparar `predicciones_historial` del GP contra `resultado_posiciones`: ¿acertó el ganador? ¿acertó el podio completo/parcial?
4. Nuevo endpoint informativo (público, coherente con que predicciones ya es pública): `GET /predicciones/metricas` → aciertos totales, % de acierto de ganador, % de acierto de podio, desglosado opcionalmente por `nivel_confianza` (para poder mostrar algo como *"cuando el modelo dijo confianza alta, acertó el ganador el 80% de las veces"* — esto es exactamente el tipo de métrica de evaluación que un sitio de pronósticos real muestra para generar confianza, ver §3.2).
5. Frontend: `PanelMetricasModelo.tsx` (podría vivir dentro de `features/predicciones` ya que es la contraparte de evaluación de esa misma feature), con una tabla/gráfico simple de aciertos por GP y el desglose por nivel de confianza.

---

## 9. Próximos pasos

1. ~~Resolver las decisiones §4.1 y §4.2~~ ✅ Ambas resueltas: predicciones públicas, pronóstico gratis SÍ se implementa.
2. ~~**Backend:** reenganchar `gp_gratis_id` en `verificar_pase_pronosticos`~~ ✅ Implementado en `app/modules/acceso/dependencies.py`, llamado manualmente (no como `Depends`) desde `pronosticos/router.py` en crear/editar/confirmar, porque necesita el `gran_premio_id` del cuerpo o del pronóstico ya existente.
3. ~~Construir `features/pronosticos` (crear/editar/confirmar)~~ ✅ `pronosticosService.ts` + `MiPronostico.tsx`, con resumen antes de confirmar (HU-20) y bloqueo de edición tras confirmar.
4. ~~Construir `features/historial` (mis pronósticos, estadísticas, ranking)~~ ✅ `MisPronosticos.tsx` (historial + estadísticas) y `Ranking.tsx` (público).
5. Completar EP-02 (perfil/favoritos) y el disclaimer de juego responsable. **Pendiente.**
6. **Persistir la Predicción algorítmica** (§8.1) y construir el panel de aciertos/fallos del modelo. **Pendiente** — sigue siendo el requisito del enunciado del curso con más peso académico y el más lejos de cumplirse.
7. ~~Verificar end-to-end en navegador~~ ✅ Probado con Playwright contra el backend real: login admin → pronóstico → confirmar → historial; registro → verificar correo (código real extraído de logs) → pronóstico gratis en el GP asignado automáticamente → intento en otro GP → bloqueado con 402 correctamente.

### 9.1 — Bugs reales encontrados y corregidos durante la verificación

Al levantar el entorno para probar, aparecieron tres problemas que **ya existían en el repo** (no introducidos en esta sesión) y que habrían roto el MVP en cualquier máquina nueva:

1. **`initdb/init.sql` (el que realmente usa Docker) estaba desincronizado del `init.sql` de la raíz** — le faltaban las columnas `correo_verificado`, `telefono`, `telefono_verificado`, `kyc_estado` y la tabla `codigos_verificacion`. Provocaba un 500 en `/auth/login` apenas se levantaba el contenedor desde cero. Corregido sincronizando ambos archivos.
2. **El seed de usuarios de prueba (`seed_grandes_premios.sql`) no marcaba `correo_verificado = TRUE`**, así que ni siquiera el admin sembrado podía iniciar sesión con el nuevo flujo de verificación de correo. Corregido en ambas copias (raíz e `initdb/`).
3. **`obtener_proximo_gran_premio` (usada para asignar el pronóstico gratis) ordenaba por `fecha_carrera` en vez de `fecha_inicio`.** Si el GP con `fecha_carrera` más próxima ya estaba "en curso" (plazo de pronósticos ya cerrado), un usuario nuevo recibía como pronóstico gratis un GP en el que ya no podía pronosticar — quedaba bloqueado para siempre. Corregido para filtrar/ordenar por `fecha_inicio`.
4. **`ListaGPs.tsx` había sido reescrita (fuera de esta sesión) para leer el calendario en vivo desde TheSportsDB**, con IDs externos incompatibles con los UUID de `GranPremio` que usa el resto de la app (detalle, pronósticos, resultados, admin). Rompía la navegación calendario → detalle → pronóstico. Revertida a `calendarioService.listarCalendario()` por decisión del usuario.
5. **El `.env` del backend no existía** en el checkout actual (sin `.gitignore` que lo explique ni `.env.example` de reemplazo) y el `.env` del frontend apuntaba a un túnel de Cloudflare ya caído. Recreados ambos con valores de desarrollo local (`VITE_API_URL=http://localhost:8001`, acorde al nuevo mapeo de puerto del `docker-compose.yaml` actual).
