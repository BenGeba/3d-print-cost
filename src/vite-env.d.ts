/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string;
  const __BUILD_DATE__: string;
  const __BUILD_TIMESTAMP__: number;
}

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_BUILD_DATE: string;
  readonly VITE_GIT_SHA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}