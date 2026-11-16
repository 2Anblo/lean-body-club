/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (default): data lives in localStorage. "http": talk to the real backend. */
  readonly VITE_API_MODE?: 'mock' | 'http';
  /** Base URL of the REST API in http mode. Defaults to "/api". */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
