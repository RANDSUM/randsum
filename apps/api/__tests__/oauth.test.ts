import { describe, expect, test } from 'bun:test'
import worker from '../src/index'
import { isAllowedRedirect } from '../src/oauth'

const BASE = 'https://api.randsum.dev'
const CALLBACK = 'https://claude.ai/api/mcp/auth_callback'

function call(path: string, init: RequestInit = {}): Promise<Response> {
  return worker.fetch(new Request(`${BASE}${path}`, init), {})
}

describe('oauth', () => {
  test('protected resource metadata points at this server', async () => {
    for (const path of [
      '/.well-known/oauth-protected-resource',
      '/.well-known/oauth-protected-resource/mcp'
    ]) {
      const response = await call(path)
      expect(response.status).toBe(200)
      const body = (await response.json()) as Record<string, unknown>
      expect(body['resource']).toBe(`${BASE}/mcp`)
      expect(body['authorization_servers']).toEqual([BASE])
    }
  })

  test('authorization server metadata names every endpoint', async () => {
    const response = await call('/.well-known/oauth-authorization-server')
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body['issuer']).toBe(BASE)
    expect(body['authorization_endpoint']).toBe(`${BASE}/authorize`)
    expect(body['token_endpoint']).toBe(`${BASE}/token`)
    expect(body['registration_endpoint']).toBe(`${BASE}/register`)
    expect(body['code_challenge_methods_supported']).toEqual(['S256'])
  })

  test('the full flow: register, authorize, token', async () => {
    const registered = await call('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'Claude', redirect_uris: [CALLBACK] })
    })
    expect(registered.status).toBe(201)
    const client = (await registered.json()) as Record<string, unknown>
    expect(typeof client['client_id']).toBe('string')
    expect(client['redirect_uris']).toEqual([CALLBACK])

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: String(client['client_id']),
      redirect_uri: CALLBACK,
      state: 'xyz',
      code_challenge: 'abc',
      code_challenge_method: 'S256'
    })
    const authorized = await call(`/authorize?${query}`)
    expect(authorized.status).toBe(302)
    const location = new URL(authorized.headers.get('Location') ?? '')
    expect(`${location.origin}${location.pathname}`).toBe(CALLBACK)
    expect(location.searchParams.get('state')).toBe('xyz')
    const code = location.searchParams.get('code')
    expect(code).not.toBeNull()

    const issued = await call('/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code ?? '',
        redirect_uri: CALLBACK,
        code_verifier: 'verifier'
      }).toString()
    })
    expect(issued.status).toBe(200)
    const tokens = (await issued.json()) as Record<string, unknown>
    expect(tokens['token_type']).toBe('Bearer')
    expect(typeof tokens['access_token']).toBe('string')
    expect(typeof tokens['refresh_token']).toBe('string')
  })

  test('refresh tokens are accepted and other grants are not', async () => {
    const refreshed = await call('/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=anything'
    })
    expect(refreshed.status).toBe(200)
    const rejected = await call('/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=password'
    })
    expect(rejected.status).toBe(400)
  })

  test('authorize never redirects off Claude or loopback', async () => {
    const response = await call(
      `/authorize?response_type=code&redirect_uri=${encodeURIComponent('https://evil.example/cb')}`
    )
    expect(response.status).toBe(400)
    const registered = await call('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uris: ['https://evil.example/cb'] })
    })
    expect(registered.status).toBe(400)
  })

  test('redirect allowlist', () => {
    expect(isAllowedRedirect(CALLBACK)).toBe(true)
    expect(isAllowedRedirect('https://claude.com/api/mcp/auth_callback')).toBe(true)
    expect(isAllowedRedirect('http://localhost:33418/callback')).toBe(true)
    expect(isAllowedRedirect('http://127.0.0.1:9000/cb')).toBe(true)
    expect(isAllowedRedirect('http://claude.ai/cb')).toBe(false)
    expect(isAllowedRedirect('https://claude.ai.evil.example/cb')).toBe(false)
    expect(isAllowedRedirect('https://user@claude.ai/cb')).toBe(false)
    expect(isAllowedRedirect('javascript:alert(1)')).toBe(false)
  })

  test('/mcp still works with no token at all', async () => {
    const response = await call('/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    })
    expect(response.status).toBe(200)
  })
})
