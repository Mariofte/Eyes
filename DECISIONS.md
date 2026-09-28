# DECISIONS.md — Eyes (frontend + orquestación)

Registro de decisiones de arquitectura (formato ADR corto).
Estados: **Aceptada** · **Pendiente** · **Reemplazada**.
Regla: toda decisión de diseño nueva se agrega aquí. Si una decisión cambia, no se borra: se marca como Reemplazada y se enlaza la nueva.

---

## D-001 — Contenedor de escritorio: Tauri v2
**Estado:** Aceptada
**Contexto:** Se busca una app ligera en recursos, con acceso al sistema operativo y un DOM web completo (sin pelear con componentes propios como en React Native).
**Decisión:** Tauri v2 (Rust) con frontend React + TypeScript.
**Consecuencias:** Usa el WebView del sistema (más liviano que Electron). Requiere Rust instalado. Permisos declarados explícitamente vía capabilities.

## D-002 — Backend de módulos en Python como proceso separado
**Estado:** Aceptada
**Contexto:** Se quiere aprovechar Selenium/Playwright (y herramientas de red) sin reescribirlos en Rust.
**Alternativas descartadas:** PyO3 embebido (frágil, mezcla runtimes, un crash de Python tumba toda la app); inyección de DLL desde PyInstaller (Python no se compila a una DLL ligera con funciones exportables).
**Decisión:** Backend Python independiente (FastAPI), comunicado por HTTP local.
**Consecuencias:** Aislamiento de fallos. Dos runtimes que empaquetar.

## D-003 — Comunicación: HTTP local, React directo al backend
**Estado:** Aceptada
**Decisión:** React hace `fetch` directo al backend local. Rust no reenvía peticiones; sus comandos se reservan para lo que requiere el sistema operativo.
**Consecuencias:** Menos capas. El CSP debe permitir el origen del backend.

## D-004 — El backend son "las manos": sin voluntad propia ni datos del usuario
**Estado:** Aceptada
**Contexto:** Riesgo de que otro proceso local o de la red acceda a datos sensibles vía la API.
**Decisión:** Mínimo privilegio. El backend solo ejecuta órdenes y devuelve resultados; no accede a la base de datos del usuario, configuración ni historial. Tauri es dueño del ciclo de vida del backend.
**Consecuencias:** Los datos permanentes los escribe el lado Tauri al recibir cada resultado. El backend solo conserva un búfer temporal de trabajo.

## D-005 — Blindaje de la API local
**Estado:** Parcialmente decidida (diseño del handshake pendiente)
**Decisión:** Enlace explícito a `127.0.0.1` (nunca `0.0.0.0`); CORS restrictivo; token de sesión aleatorio por arranque; puerto dinámico.
**Pendiente:** definir nombre del header, cómo Tauri entrega el token y el puerto al sidecar.

## D-006 — Sin IA/LLM dentro del producto
**Estado:** Aceptada
**Contexto:** Sin presupuesto de APIs; se quiere independencia; además es un proyecto de aprendizaje y el usuario debe entender lo que ocurre.
**Decisión:** Toda asistencia es heurística o basada en reglas escritas a mano, apoyada en bases de vulnerabilidades existentes para el eje de redes.
**Consecuencias:** Más trabajo de reglas manuales. Revisitable si cambian los recursos.

## D-007 — El sistema no decide por el usuario
**Estado:** Aceptada
**Decisión:** Principio rector: el sistema reduce la carga cognitiva (señales, contexto, explicaciones) pero el juicio final es del usuario. La cantidad de asistencia es proporcional al contexto simultáneo que el dominio exige (poca en scraping, más en redes).

## D-008 — Scraping: request crudo primero, filtro ligero, decisión del usuario
**Estado:** Aceptada
**Decisión:** Flujo en tres pasos: request crudo → filtro con heurísticas simples (tamaño, contenedores vacíos, scripts de bundler) que resalta señales → el usuario decide activar el modo navegador.
**Motivo:** El navegador headless consume recursos que no todos los usuarios tienen.
**Nota:** El "intérprete" es un filtro, no un sistema de comprensión.

## D-009 — Uso ético: solo software y redes propios
**Estado:** Aceptada
**Decisión:** La herramienta no se diseña para evadir protecciones de terceros ni atacar redes ajenas.

## D-010 — TypeScript 7 (compilador nativo)
**Estado:** Aceptada
**Decisión:** Usar `typescript@7.x`. El comando sigue siendo `tsc`. Zod para validación runtime en fronteras.
**Nota:** La API programática estable del compilador llega más tarde (7.1); tener cuidado con herramientas que dependan de ella.

## D-011 — Enrutado y librería de estilos
**Estado:** Pendiente
**Propuesta de estilos:** Tailwind CSS + shadcn/ui (componentes copiados al proyecto, sin dependencia pesada).
**Pendiente:** confirmar tras probarlo; elegir librería de enrutado (React Router o TanStack Router).

## D-012 — Persistencia de datos del usuario
**Estado:** Pendiente
**Opciones:** plugin SQL de Tauri (SQLite) en el lado Rust.
**Restricción ya decidida:** los datos del usuario viven solo en el lado Tauri (ver D-004).

## D-013 — Empaquetado del backend
**Estado:** Pendiente (pospuesta a propósito)
**Candidato:** Nuitka (compila a nativo; mejor arranque y protección del código) sobre PyInstaller. Distribución como sidecar de Tauri.
**Restricciones conocidas:** sin cross-compilation (compilar en cada SO); binarios con sufijo de target triple.

## D-014 — Metodología de trabajo
**Estado:** Aceptada
**Decisión:** Desarrollo por sprints, medidos por issues terminados y no por tiempo, con alcance definido por versión. Sprint 0 = cimientos y decisiones.

## D-015 — Analogía guía de capas
**Estado:** Aceptada
**Decisión:** React = cara y ojos (percibir) · Rust/Tauri = sistema nervioso y esqueleto (coordinar, guardar memoria) · Python = manos (ejecutar). Para cada funcionalidad nueva: ¿es percibir, coordinar o ejecutar? La respuesta indica la capa.

## D-016 — Registro de eventos: los logs son memoria y viven en el cuerpo
**Estado:** Aceptada
**Contexto:** Se quiere un registro de todo lo que hace el usuario y la app, consultable solo por él, con posible dashboard.
**Decisión:** Cada cosa que ocurre es un evento, y cada evento es una línea de log. Tres fuentes (React, Rust/Tauri, Python) y un solo destino: el almacén de logs que administra Tauri. El backend Python solo reporta lo que hizo; no guarda nada.
**Consecuencias:** Consistente con D-004 (mínimo privilegio): las manos hacen y reportan, el cuerpo recuerda.

## D-017 — Canal de eventos del backend: salida estándar del sidecar
**Estado:** Aceptada (implementación pendiente)
**Contexto:** Había dos opciones: (A) eventos dentro de la respuesta HTTP; (B) el sidecar escribe cada evento como línea JSON en stdout y Tauri la captura.
**Decisión:** Opción B, combinable con A para el resultado final de cada operación.
**Motivos:** Los eventos llegan mientras ocurren, aunque Python falle después (evita perder datos). No abre puertos ni endpoints adicionales, así que no amplía la superficie de ataque. Se descartó un webhook/socket dedicado por innecesario.
**Consecuencias:** Requiere que Tauri lance el sidecar (ya es el plan).

## D-018 — Formato de evento
**Estado:** Aceptada
**Decisión:** Una línea JSON por evento, con campos estables: `ts`, `nivel` (info/warning/error), `modulo`, `evento` (nombre corto y fijo, para que el código filtre y reaccione) y `mensaje` (texto legible para el usuario). Campo opcional `detalle` (JSON).
**Distinción:** Eventos de **estado** (`backend_listo`, `backend_caido`, `app_cerrada`: describen si algo está vivo y la app reacciona) y eventos de **trabajo** (`peticion_completada`, `error`: solo se registran y se muestran).
**Reglas de contenido:** El evento dice qué se hizo, no el contenido obtenido (URL sí, cuerpo de la página no; servicio detectado sí, credenciales nunca). El token de sesión jamás aparece en un evento.

## D-019 — Almacenamiento de logs
**Estado:** Aceptada (dashboard pendiente)
**Decisión:** Un archivo `.log` por sesión de uso (`sesiones/AAAA-MM-DD_HH-MM.log`) en la **carpeta de datos de la aplicación** del sistema operativo (en Windows, dentro de `AppData`), escrito **solo por el lado Tauri**. Opcionalmente SQLite para el dashboard con filtros; se puede empezar solo con archivos.
**Alternativa descartada:** guardar los logs dentro de la carpeta del backend compilado. Contradice D-004 (las manos tendrían acceso al registro), la carpeta de instalación suele ser de solo lectura y se sobrescribe al actualizar, y en modo one-file cambia en cada ejecución.

## D-020 — Visor de logs en vivo (no una terminal real)
**Estado:** Aceptada (implementación pendiente)
**Decisión:** Un panel en React que muestra los eventos en tiempo real, alimentado por eventos de Tauri hacia el frontend. Es de **solo lectura**.
**Motivo:** Una terminal real daría ejecución arbitraria a quien controle la app. El visor es más seguro y además cumple el objetivo didáctico: ver paso a paso lo que hacen las manos.

## D-021 — Heartbeat y detección de caída del backend
**Estado:** Aceptada
**Decisión:** Dos mecanismos complementarios. (1) **Por proceso:** Rust, como proceso padre, detecta al instante cuando el sidecar termina. (2) **Por heartbeat:** la app hace ping periódico a `/health` (orden de 5 a 10 s) y declara "sin respuesta" tras varios fallos seguidos, para evitar falsas alarmas; cubre el caso de un proceso vivo pero colgado.
**Señal de arranque:** el evento `backend_listo` que emite Python indica que ya se puede llamar a la API, para que React no lance un `fetch` antes de que el servidor escuche.
**Requisito:** `/health` debe ser ligero y no depender de nada pesado (ni navegador ni red), para que un backend ocupado pueda seguir respondiéndolo.
**UI:** indicador de estado (conectado / sin respuesta / caído) y un botón de reiniciar backend controlado por el usuario. Cada cambio de estado es un evento en el log.

## D-022 — Ante una caída del backend, el usuario decide
**Estado:** Aceptada, **a revisar con escenarios reales**
**Decisión:** Si la app detecta que el backend cayó, solo avisa al usuario y espera su decisión. No reintenta ni reinicia por su cuenta.
**Motivo:** Coherente con D-007 (el sistema no decide por el usuario). Además, reiniciar en silencio no recupera una operación a medias y podría ocultar el error.
**Alternativas consideradas:** reintentar una o dos veces y luego avisar; reiniciar siempre de forma automática.
**Nota:** Se revisará cuando existan escenarios de uso reales.

## D-013 (actualización) — Empaquetado: preferencia por one-dir
**Estado:** Pendiente, con inclinación registrada
**Nota:** Para un sidecar que se lanza en cada apertura de la app, one-dir arranca más rápido que one-file (no descomprime en cada arranque), en línea con la filosofía de ahorrar recursos. Contrapartida: hay que empaquetar una carpeta en vez de un único archivo, lo que complica un poco la configuración del sidecar. Se decide al empaquetar.
