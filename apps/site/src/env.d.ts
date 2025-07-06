/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Custom type declarations for the RANDSUM site
declare module '*.astro' {
  const Component: any;
  export default Component;
}

// Environment variables
interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SITE_TITLE?: string;
  readonly PUBLIC_SITE_DESCRIPTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
