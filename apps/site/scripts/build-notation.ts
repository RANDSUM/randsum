/**
 * Assembles dist-notation/, the static assets for notation.randsum.dev
 * (wrangler.notation.jsonc), the spec's own host.
 *
 * Astro builds the spec pages with the rest of the site, under /spec/
 * (src/pages/spec/). This lifts them to the root of dist-notation/ beside the
 * fingerprinted /_astro/ assets and favicons they load, writes the host's
 * robots.txt, sitemap.xml and _headers, then deletes /spec/ from dist/ so randsum.dev
 * never serves a second copy: its _redirects send /spec/* there instead. The
 * pages already link by their paths on this host (src/spec/urls.ts). Runs as
 * the last step of `bun run build`.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { join, relative } from 'node:path'
import { NOTATION_ORIGIN } from '../src/spec/urls'

const root = join(import.meta.dir, '..')
const dist = join(root, 'dist')
const spec = join(dist, 'spec')
const out = join(root, 'dist-notation')

if (!existsSync(join(spec, 'index.html'))) {
  console.error(`build-notation: ${spec}/index.html is missing; run astro build first`)
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(spec, out, { recursive: true })
cpSync(join(dist, '_astro'), join(out, '_astro'), { recursive: true })
for (const file of ['favicon.ico', 'favicon.svg']) cpSync(join(dist, file), join(out, file))

/** Every page's path on the host: a directory with an index.html. */
function pages(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (name === '_astro' || !statSync(path).isDirectory()) return []
    return [...(existsSync(join(path, 'index.html')) ? [path] : []), ...pages(path)]
  })
}

// /v/<latest>/ repeats / and names it as canonical, so only / is listed.
const versions = readdirSync(join(out, 'v')).sort((a, b) =>
  a.localeCompare(b, 'en', { numeric: true })
)
const latest = `/v/${versions.at(-1)}/`
const urls = ['/', ...pages(out).map(dir => `/${relative(out, dir)}/`)].filter(p => p !== latest)
writeFileSync(
  join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(p => `  <url><loc>${NOTATION_ORIGIN}${p}</loc></url>`)
    .join('\n')}\n</urlset>\n`
)
// Astro fingerprints every file under /_astro/, so it can be cached forever,
// as randsum.dev (public/_headers) and app.randsum.dev (app-public/_headers) do.
writeFileSync(
  join(out, '_headers'),
  '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n'
)
writeFileSync(
  join(out, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${NOTATION_ORIGIN}/sitemap.xml\n`
)

rmSync(spec, { recursive: true, force: true })
console.log(`build-notation: wrote dist-notation/ for notation.randsum.dev (${urls.length} pages)`)
