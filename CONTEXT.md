# CONTEXT.md — Eyes (frontend + orquestación)

Contexto completo del proyecto para agentes de IA. Cubre este repo Y el repo hermano (`Eyes-Backend`).
Última actualización: 2026-09-27 (añadidos logs, eventos y heartbeat)

## Visión

**Eyes** es una herramienta de escritorio, de uso personal o de desarrollador, para dos cosas:

1. **Web scraping** con foco en páginas dinámicas (React/Angular, HTML inicial mínimo).
2. **Detección de vulnerabilidades en redes propias**, con foco en experiencia de usuario.

### Uso ético (importante)
La herramienta está pensada **exclusivamente para software y redes propios del usuario**. No se diseña para evadir defensas anti-bot de terceros ni para atacar redes ajenas. No proponer funcionalidades orientadas a eludir Cloudflare, CAPTCHAs u otras protecciones de sitios que no son del usuario.

### Problema que resuelve
Las herramientas actuales de scraping y ethical hacking son fragmentadas, engorrosas, requieren instalaciones pesadas y no guían al usuario. Eyes apuesta por ser ligera, fácil de entender y didáctica: el usuario debe **entender** lo que pasa, no que se lo den resuelto.

## Filosofía de diseño

- **El sistema nunca decide por el usuario, pero reduce la carga cognitiva** necesaria para que decida bien.
- **Sin IA/LLM en el producto.** Heurísticas y reglas escritas a mano. (La IA se usa solo como ayuda de desarrollo.)
- **Ligereza de recursos.** No asumir que el usuario tiene una máquina potente.
- **Proporcionalidad de la ayuda:** en scraping (un panorama a la vez) el sistema solo muestra señales; en redes (dominio plural y complejo) el sistema puede alertar y recomendar más, siempre con reglas y bases de vulnerabilidades conocidas (tipo CVE), sin sustituir el juicio del usuario.
- **Desarrollo por versiones con alcance definido,** sin deadline externo.

## Arquitectura: el cuerpo y las manos

```
┌──────────────────────────── Eyes (este repo) ───────────────────────────┐
│  React (WebView)  ── ojos y cara: UI, estado de pantalla, Zod           │
│  Rust / Tauri     ── sistema nervioso: ciclo de vida, permisos,         │
│                      datos del usuario, token de sesión                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │  HTTP local (127.0.0.1) + token
┌─────────────────────────────────▼───────────────────────────────────────┐
│  Eyes-Backend (repo hermano) — las manos                                 │
│  FastAPI + Playwright/Selenium (scraping) + Nmap/Wireshark (redes)      │
└──────────────────────────────────────────────────────────────────────────┘
```

Reglas de la relación:
- Tauri **lanza y mata** el backend (sidecar). El backend no existe fuera de la app.
- React llama al backend **directo por `fetch`**; no pasa por comandos Rust.
- El backend **no tiene voluntad propia**: ejecuta la orden recibida y devuelve el resultado.
- El backend **no accede a datos del usuario**. Mínimo privilegio.
- Los resultados recibidos los persiste el lado Tauri; el backend solo guarda un búfer temporal de trabajo.

## Flujo del eje de scraping

1. Request HTTP crudo (ligero, sin navegador).
2. Un **filtro ligero** (no un intérprete) resalta señales de página dinámica: tamaño del HTML, contenedores vacíos tipo `<div id="root">`/`<div id="app">`, scripts de bundler, ausencia de texto real.
3. **El usuario decide** si activar el modo navegador (Playwright/Selenium), por costo de recursos.
4. Se extraen los datos y se validan.

## Stack de este repo

| Pieza | Elección |
|---|---|
| Contenedor de escritorio | Tauri v2 |
| Frontend | React + TypeScript 7 |
| Bundler | Vite |
| Validación runtime | Zod |
| Estilos | Pendiente de decisión (propuesta: Tailwind + shadcn/ui) |
| Enrutado del frontend | Pendiente de decisión |
| Persistencia de datos del usuario | Pendiente (plugin de Tauri, p. ej. SQLite) |

## Contrato con el backend (borrador)

- Base: `http://127.0.0.1:<puerto>` (puerto dinámico objetivo; en desarrollo, 8000).
- Header de autenticación: token de sesión (por definir nombre del header).
- Endpoints iniciales: `GET /health`. Previstos: `/scrape`, `/scan`, `/status`, `/results`.
- Toda respuesta se valida con Zod en `src/types/`.
- Cualquier cambio de contrato se refleja en el `CONTEXT.md` de **ambos** repos.

## Estado actual

- ✅ Scaffold Tauri + React + TypeScript creado (Windows, `C:\Users\DELL\Dev\Eyes`).
- ✅ TypeScript 7.0.x funcionando sin errores; Zod instalado.
- ✅ Backend FastAPI levanta de forma independiente (repo hermano).
- 🔧 En curso: aplicar configuración base (Vite, `tauri.conf.json`, capabilities, `Cargo.toml`). Error conocido: falta `tauri-plugin-opener` en `Cargo.toml`.
- ⬜ Sprint 0 (ver abajo).

## Sprint 0 — Cimientos (épica)

A. Frontend: compilar limpio · configuración base · alias y estructura · librería de estilos · enrutado · layout base.
B. Backend: estructura modular con registro por decorador · endpoints mínimos.
C. Comunicación: conexión punta a punta con Zod · blindaje (127.0.0.1, CORS, token, puerto dinámico).
D. Proceso: `DECISIONS.md`.

Fuera del Sprint 0 a propósito: lanzamiento automático del sidecar desde Rust y empaquetado final.

## Registro de eventos, logs y heartbeat

**Principio:** los logs son memoria, y la memoria vive en el cuerpo (Tauri), no en las manos. Las manos reportan lo que hicieron; el cuerpo lo registra.

- **Cada cosa que ocurre es un evento y cada evento es una línea de log**, incluido el arranque de la app.
- **Tres fuentes, un destino:** React (acciones del usuario), Rust/Tauri (ciclo de vida) y Python (trabajo de las manos) terminan en el almacén de logs que administra Tauri.
- **Canal desde Python:** salida estándar del sidecar, una línea JSON por evento. Tauri la captura línea por línea. No se abre ningún puerto adicional.
- **Formato:** `ts`, `nivel`, `modulo`, `evento` (nombre fijo para filtrar), `mensaje` (legible), `detalle` opcional.
- **Estado vs. trabajo:** los eventos de estado (`backend_listo`, `backend_caido`) hacen que la app reaccione; los de trabajo (`peticion_completada`, `error`) solo se registran y se muestran.
- **Reglas de contenido:** se registra qué se hizo, no el contenido obtenido; el token de sesión nunca aparece.
- **Almacenamiento:** un archivo `.log` por sesión en la carpeta de datos de la aplicación del sistema operativo (no dentro del backend compilado), escrito solo por Tauri. SQLite opcional después para un dashboard con filtros.
- **Visor en vivo:** panel de solo lectura en React alimentado por eventos de Tauri. No es una terminal real.
- **Heartbeat:** ping periódico a `/health` (orden de 5 a 10 s) con varios fallos seguidos para declarar "sin respuesta", más detección inmediata por proceso desde Rust. El evento `backend_listo` marca que se puede empezar a llamar a la API.
- **Ante una caída:** la app solo avisa y el usuario decide (indicador de estado + botón de reiniciar). A revisar con escenarios reales.

Implementación prevista después del Sprint 0 (Sprint 1 o 2). Lo único que se fija desde ya es el formato de evento.

## Empaquetado futuro

- Backend Python empaquetado (candidato: Nuitka; alternativa: PyInstaller) y distribuido como **sidecar** de Tauri vía `bundle.externalBin`.
- El binario debe nombrarse con sufijo de target triple por plataforma.
- No hay cross-compilation: se compila en cada SO destino. Decisión pospuesta hasta tener algo que empaquetar.
- Inclinación registrada: modo one-dir (arranca más rápido que one-file, que descomprime en cada arranque).

## Glosario rápido

- **Sidecar:** binario externo empaquetado dentro de la app Tauri y lanzado como subproceso.
- **Capabilities:** sistema de permisos de Tauri v2.
- **Cuerpo / manos:** metáfora del proyecto para Tauri+React vs. backend Python.

## Preferencias del desarrollador (para tus respuestas)

- Idioma: español.
- Prefiere explicaciones que enseñen el porqué, no solo el resultado.
- Prefiere que se le planteen las decisiones para pensarlas él antes de recibir una recomendación cerrada.
- Es autodidacta en redes: explicar conceptos de red con claridad, sin asumir conocimiento previo.
