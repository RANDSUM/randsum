/**
 * Worker entry for api.randsum.dev.
 *
 * Two surfaces share the host:
 * - `/v1/*`, the REST API (`v1.ts`): dice notation, game rolls, random integers.
 * - `/mcp`, the remote MCP server over Streamable HTTP. This is the URL a
 *   Claude custom connector points at. It is the same server `@randsum/mcp`
 *   runs over stdio, imported from its `./remote` subpath, so the two cannot
 *   drift apart.
 *
 * Everything is public and keyless. The rate limiter, when bound, is the only
 * gate, keyed by client IP.
 */
import { handleMcpRequest } from '@randsum/mcp/remote'
import { handleV1 } from './v1'

/** Cloudflare's Workers rate limiting binding (wrangler.jsonc `ratelimits`). */
interface RateLimiter {
  limit(options: { readonly key: string }): Promise<{ readonly success: boolean }>
}

export interface Env {
  readonly RATE_LIMITER?: RateLimiter
}

// A JSON body is a notation, a seed or a handful of game inputs. Anything
// bigger is not a request this API understands.
const MAX_BODY_LENGTH = 4096

const CORS_HEADERS: Readonly<Record<string, string>> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'Mcp-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400'
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value)
  return new Response(response.body, { status: response.status, headers })
}

function json(body: unknown, status: number, cacheable = false): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Rolls and random draws must never be served twice from a cache.
      'Cache-Control': cacheable ? 'public, max-age=300' : 'no-store'
    }
  })
}

/** Query parameters for a GET, or the top-level fields of a JSON POST body. */
async function readInput(
  request: Request,
  url: URL
): Promise<Readonly<Record<string, unknown>> | Response> {
  if (request.method !== 'POST') return Object.fromEntries(url.searchParams)
  const raw = await request.text()
  if (raw.length > MAX_BODY_LENGTH) return json({ error: 'Request body is too large.' }, 413)
  if (raw.trim() === '') return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Readonly<Record<string, unknown>>
    }
  } catch {
    // Falls through to the 400 below.
  }
  return json({ error: 'Request body must be a JSON object.' }, 400)
}

async function route(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname === '/mcp' || pathname === '/mcp/') {
    // Stateless: no session to resume over GET, nothing to end with DELETE.
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
    }
    return handleMcpRequest(request)
  }

  if (pathname === '/') return Response.redirect(`${url.origin}/v1`, 302)

  if (pathname === '/v1' || pathname.startsWith('/v1/')) {
    const input = await readInput(request, url)
    if (input instanceof Response) return input
    const result = handleV1({
      method: request.method,
      path: pathname,
      input,
      origin: url.origin
    })
    return json(result.body, result.status, result.cacheable === true)
  }

  return json(
    { error: `No route for ${request.method} ${pathname}.`, see: `${url.origin}/v1` },
    404
  )
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }))

    if (env.RATE_LIMITER !== undefined) {
      const key = request.headers.get('CF-Connecting-IP') ?? 'anonymous'
      const { success } = await env.RATE_LIMITER.limit({ key })
      if (!success) {
        const limited = json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429)
        limited.headers.set('Retry-After', '60')
        return withCors(limited)
      }
    }

    try {
      return withCors(await route(request))
    } catch (error) {
      console.error(error)
      return withCors(json({ error: 'Internal error.' }, 500))
    }
  }
}
