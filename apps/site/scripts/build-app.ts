/**
 * Assembles dist-app/, the static assets for app.randsum.dev (wrangler.app.jsonc).
 *
 * Astro builds the Roller's shell with the rest of the site, at /app-shell/.
 * This lifts it to dist-app/index.html beside the app's own files from
 * app-public/ (manifest, service worker, icons, _headers) and the fingerprinted
 * /_astro/ assets it loads, then deletes /app-shell/ from dist/ so randsum.dev
 * never serves a second copy. Runs as the second half of `bun run build`.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const dist = join(root, 'dist')
const out = join(root, 'dist-app')
const shell = join(dist, 'app-shell', 'index.html')

if (!existsSync(shell)) {
  console.error(`build-app: ${shell} is missing; run astro build first`)
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(join(root, 'app-public'), out, { recursive: true })
cpSync(shell, join(out, 'index.html'))
cpSync(join(dist, '_astro'), join(out, '_astro'), { recursive: true })
cpSync(join(dist, 'favicon.ico'), join(out, 'favicon.ico'))
rmSync(join(dist, 'app-shell'), { recursive: true, force: true })

console.log('build-app: wrote dist-app/ for app.randsum.dev')
