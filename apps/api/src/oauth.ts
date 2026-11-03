/**
 * A no-op OAuth 2.1 authorization server for `/mcp`.
 *
 * `/mcp` is public and keyless, and it still accepts requests with no token at
 * all. This exists only for clients that insist on signing in first: a
 * directory listing that declares OAuth makes Claude run discovery, dynamic
 * client registration (RFC 7591) and the authorization-code flow before it
 * connects, and a 404 at any step ends in "Couldn't register with RANDSUM's
 * sign-in service". Every step here succeeds without asking anything:
 *
 * - discovery: protected resource metadata (RFC 9728) and authorization
 *   server metadata (RFC 8414)
 * - `/register` hands any client an id
 * - `/authorize` redirects straight back with a code, no consent screen
 * - `/token` trades any code or refresh token for a bearer token
 *
 * Nothing is stored and no token means anything: `/mcp` never reads the
 * `Authorization` header. The one real check is the redirect: `/authorize`
 * only sends codes to Claude's callback hosts and to loopback, so it cannot be
 * used as an open redirect.
 */

/** Hosts whose https callbacks `/authorize` may redirect to. */
const CALLBACK_HOSTS: ReadonlySet<string> = new Set(['claude.ai', 'claude.com'])
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 365

export const OAUTH_PATHS: ReadonlySet<string> = new Set([
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-protected-resource/mcp',
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-authorization-server/mcp',
  '/.well-known/openid-configuration',
  '/register',
  '/authorize',
  '/token'
])

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  })
}

function oauthError(error: string, description: string, status = 400): Response {
  return json({ error, error_description: description }, status)
}

function randomToken(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return `${prefix}_${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`
}

/** Whether `/authorize` may send a code to this redirect URI. */
export function isAllowedRedirect(uri: string): boolean {
  if (!URL.canParse(uri)) return false
  const url = new URL(uri)
  if (url.username !== '' || url.password !== '') return false
  if (url.protocol === 'https:') return CALLBACK_HOSTS.has(url.hostname)
  if (url.protocol === 'http:') return LOOPBACK_HOSTS.has(url.hostname)
  return false
}

function protectedResource(origin: string): Response {
  return json({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    resource_name: 'RANDSUM',
    resource_documentation: 'https://randsum.dev/tools/mcp/'
  })
}

function authorizationServer(origin: string): Response {
  return json({
    issuer: origin,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/token`,
    registration_endpoint: `${origin}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['mcp'],
    service_documentation: 'https://randsum.dev/tools/mcp/'
  })
}

async function readObject(request: Request): Promise<Readonly<Record<string, unknown>>> {
  const raw = await request.text()
  if (raw.length > 8192) return {}
  const type = request.headers.get('Content-Type') ?? ''
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw))
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Readonly<Record<string, unknown>>)
      : {}
  } catch {
    return Object.fromEntries(new URLSearchParams(raw))
  }
}

async function register(request: Request): Promise<Response> {
  const metadata = await readObject(request)
  const redirectUris = Array.isArray(metadata['redirect_uris'])
    ? metadata['redirect_uris'].filter((uri): uri is string => typeof uri === 'string')
    : []
  const rejected = redirectUris.find(uri => !isAllowedRedirect(uri))
  if (rejected !== undefined) {
    return oauthError('invalid_redirect_uri', `Redirect URI not allowed: ${rejected}`)
  }
  return json(
    {
      ...metadata,
      client_id: randomToken('randsum_client'),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none'
    },
    201
  )
}

function authorize(url: URL): Response {
  const redirectUri = url.searchParams.get('redirect_uri') ?? ''
  if (!isAllowedRedirect(redirectUri)) {
    return oauthError('invalid_request', 'Missing or disallowed redirect_uri.')
  }
  const target = new URL(redirectUri)
  if (url.searchParams.get('response_type') !== 'code') {
    target.searchParams.set('error', 'unsupported_response_type')
  } else {
    target.searchParams.set('code', randomToken('randsum_code'))
  }
  const state = url.searchParams.get('state')
  if (state !== null) target.searchParams.set('state', state)
  return Response.redirect(target.toString(), 302)
}

async function token(request: Request): Promise<Response> {
  const body = await readObject(request)
  const grant = body['grant_type']
  if (grant !== 'authorization_code' && grant !== 'refresh_token') {
    return oauthError('unsupported_grant_type', 'Use authorization_code or refresh_token.')
  }
  return json({
    access_token: randomToken('randsum_access'),
    token_type: 'Bearer',
    expires_in: TOKEN_LIFETIME_SECONDS,
    refresh_token: randomToken('randsum_refresh'),
    scope: 'mcp'
  })
}

/** Handles a request whose path is in `OAUTH_PATHS`. */
export async function handleOAuth(request: Request, url: URL): Promise<Response> {
  const { pathname } = url
  if (pathname.startsWith('/.well-known/oauth-protected-resource')) {
    return protectedResource(url.origin)
  }
  if (pathname.startsWith('/.well-known/')) return authorizationServer(url.origin)
  if (pathname === '/authorize') {
    return request.method === 'GET' || request.method === 'HEAD'
      ? authorize(url)
      : new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } })
  }
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
  }
  return pathname === '/register' ? register(request) : token(request)
}
