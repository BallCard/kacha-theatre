/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_IMAGE_MODEL?: string;
  readonly VITE_CHAT_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
