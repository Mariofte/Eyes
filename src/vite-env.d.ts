/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly TAURI_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}