// The spec's own host. Astro builds the spec pages under /spec/ with the rest of
// the site, and scripts/build-notation.ts lifts them to the root of
// dist-notation/, which notation.randsum.dev serves (wrangler.notation.jsonc).
// randsum.dev/spec/* 301s there. So a spec page links within the spec by its
// path on that host, and to the rest of the site by randsum.dev's full URL.

export const NOTATION_ORIGIN = 'https://notation.randsum.dev'
export const SITE_ORIGIN = 'https://randsum.dev'

// `astro dev` serves the pages where Astro builds them, under /spec/.
const DEV_BASE = import.meta.env?.DEV === true ? '/spec' : ''

/** A spec-host path (`/`, `/v/0.9.0/`, `/conformance/`) as a link on a spec page. */
export function specPath(path: string): string {
  return `${DEV_BASE}${path}`
}

/** A spec-host path as a full notation.randsum.dev URL. */
export function specUrl(path: string): string {
  return new URL(path, NOTATION_ORIGIN).href
}

/** The path Astro builds a spec-host path at, under /spec/. */
export function builtPath(path: string): string {
  return `/spec${path}`
}
