/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_THESPORTSDB_API_KEY?: string;
  readonly VITE_THESPORTSDB_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
