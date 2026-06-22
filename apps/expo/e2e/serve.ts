// Minimal static file server for the exported Expo web build (apps/expo/dist).
// Used as Playwright's `webServer` so the smoke test runs against the real production
// web bundle, not a dev server. SPA-style fallback to index.html for unknown routes.
import { existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'

const distDir = join(import.meta.dir, '..', 'dist')
const port = Number(process.env['PORT'] ?? 8099)

function resolvePath(pathname: string): string {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(distDir, clean)
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate
  }
  return join(distDir, 'index.html')
}

Bun.serve({
  port,
  fetch(req): Response | Promise<Response> {
    const url = new URL(req.url)
    const filePath = url.pathname === '/' ? join(distDir, 'index.html') : resolvePath(url.pathname)
    return new Response(Bun.file(filePath))
  }
})

// eslint-disable-next-line no-console
console.log(`Serving ${distDir} on http://localhost:${port}`)
