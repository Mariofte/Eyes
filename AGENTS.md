# AGENTS.md — Eyes (frontend + orquestación)

Instrucciones para agentes de IA (OpenCode, Antigravity, etc.) que trabajen en este repo.
Lee primero `CONTEXT.md` y `DECISIONS.md`. Este archivo dice CÓMO trabajar; los otros dicen QUÉ es el proyecto y POR QUÉ.

## Qué es este repo

Aplicación de escritorio **Eyes**: Tauri v2 (Rust) + React + TypeScript. Es el "cuerpo" de la app.
El backend Python (scraping y redes) vive en otro repo: `Eyes-Backend`. Ver `CONTEXT.md`.

## Stack y versiones

- Tauri v2 (Rust, edition 2021)
- React + TypeScript 7.x (compilador nativo; el comando sigue siendo `tsc`)
- Vite (bundler)
- Zod para validar en runtime todo dato que cruce una frontera (respuestas del backend, entrada de usuario)
- Gestor de paquetes: npm
- Sistema de desarrollo: Windows

## Comandos

```bash
npm install
npm run tauri dev        # app completa en desarrollo (arranca Vite + Rust)
npx tsc --noEmit         # type-check
npm run build            # build del frontend
npm run tauri build      # build de producción
```

## Reglas de arquitectura (no negociables)

1. **Separación de roles.** React percibe (UI), Rust coordina (ciclo de vida, datos del usuario, permisos), Python ejecuta (scraping/redes). Si algo no encaja en su capa, se mueve, no se fuerza.
2. **Los datos del usuario viven solo en el lado Tauri/Rust.** El backend Python NUNCA accede a la base de datos del usuario, configuración ni historial.
3. **React habla con el backend Python directo por `fetch` a localhost.** No se crean comandos Rust que solo reenvíen un fetch.
4. **Los comandos Rust (`#[tauri::command]`) son solo para lo que necesita el sistema operativo:** lanzar/matar el sidecar, generar el token de sesión, persistencia local, archivos.
5. **Todo dato que llegue del backend se valida con Zod** antes de usarse.
6. **Sin IA/LLM dentro del producto.** Toda lógica de asistencia es heurística o reglas escritas a mano.
7. **El sistema nunca decide por el usuario;** reduce la carga cognitiva dándole contexto.
8. **Recursos primero.** Preferir soluciones ligeras. No añadir dependencias pesadas sin justificarlo en `DECISIONS.md`.

## Convenciones de código

### TypeScript / React
- `strict: true`; sin `any` salvo justificación en comentario.
- Alias de import: `@/*` → `src/*`.
- Estructura: `src/components/`, `src/hooks/`, `src/types/` (esquemas Zod + tipos), `src/lib/` (cliente HTTP hacia el backend).
- Hooks personalizados en `src/hooks/`, prefijo `use`.
- Tipos derivados de los esquemas Zod (`z.infer`), no duplicados a mano.

### Rust
- Comandos separados por módulo en `src-tauri/src/commands/` (`sidecar.rs`, `storage.rs`, `system.rs`).
- `generate_handler!` se llama **una sola vez**, en `lib.rs`; todos los comandos van en esa misma lista.
- Cada comando nuevo requiere revisar `src-tauri/capabilities/default.json`.
- Perfil release optimizado para tamaño (`lto`, `opt-level = "s"`, `strip`).

## Seguridad (obligatorio al tocar comunicación con el backend)

- El backend solo se enlaza a `127.0.0.1`, nunca `0.0.0.0`.
- Cada arranque genera un token de sesión aleatorio; todo request al backend lo lleva en un header.
- Puerto dinámico elegido por Tauri (objetivo; ver `DECISIONS.md`).
- CSP en `tauri.conf.json` debe permitir explícitamente solo el origen del backend local.

## Qué NO hacer

- No mover lógica de scraping o análisis de red a Rust.
- No guardar datos del usuario en el backend Python.
- No hacer que el backend corra como servicio independiente fuera del ciclo de vida de la app.
- No introducir llamadas a APIs de IA externas.
- No usar `localStorage` como base de datos de datos importantes.
- No añadir librerías de UI sin registrar la decisión.

## Antes de dar por terminada una tarea

1. `npx tsc --noEmit` sin errores.
2. `npm run tauri dev` abre la app sin errores en consola.
3. Si se tomó una decisión de diseño, registrarla en `DECISIONS.md`.
4. Si cambió la interfaz con el backend, actualizar `CONTEXT.md` en AMBOS repos.

## Estado del proyecto

Ver la sección "Estado actual" de `CONTEXT.md`.
