/**
 * Worker entry for notation.randsum.dev, which only redirects.
 *
 * The notation spec moved into this app at randsum.dev/spec. The old host must
 * keep answering, because the spec (v0.9.0, "Document Information") and every
 * conformance file's `$id` name it. This script is deployed to the existing
 * `randsum-rdn` Worker (wrangler.notation.jsonc), so the custom domain that
 * Worker already holds keeps its DNS record and the cutover is one deploy.
 */

const SITE = 'https://randsum.dev'

// Root-level files every site serves. They have no /spec equivalent, so they
// go to randsum.dev's own copy rather than a /spec 404.
const ROOT_FILES: ReadonlySet<string> = new Set([
  '/robots.txt',
  '/favicon.ico',
  '/sitemap-index.xml',
  '/sitemap-0.xml'
])

/** Where a notation.randsum.dev URL lives now. Keeps the query string. */
export function notationRedirectTarget(url: URL): string {
  const { pathname, search } = url
  // Conformance files keep their path: their `$id` is that URL.
  const keepsPath = pathname.startsWith('/conformance/') || ROOT_FILES.has(pathname)
  return `${SITE}${keepsPath ? '' : '/spec'}${pathname}${search}`
}

export default {
  fetch(request: Request): Response {
    return Response.redirect(notationRedirectTarget(new URL(request.url)), 301)
  }
}
