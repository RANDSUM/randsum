/**
 * Worker entry for randsum.dev.
 *
 * The site itself is plain static Astro output served from the assets binding.
 * `assets.run_worker_first` in wrangler.jsonc sends only `/api/*` here; every
 * other request is answered by Workers Static Assets without invoking this
 * script, so pages stay free and unbilled.
 */
import { handleRoll } from './roll'

interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/roll' || pathname === '/api/roll/') return handleRoll(request)
    // Unknown /api/* paths fall through to assets, which serves the 404 page.
    return env.ASSETS.fetch(request)
  }
}
