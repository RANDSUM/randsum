import { describe, expect, test } from 'bun:test'
import { handleMcpRequest } from '../src/remote'

function post(body: unknown): Promise<Response> {
  return handleMcpRequest(
    new Request('https://api.randsum.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify(body)
    })
  )
}

describe('handleMcpRequest', () => {
  test('answers initialize with JSON and no session id', async () => {
    const response = await post({
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0.0.0' }
      }
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Mcp-Session-Id')).toBeNull()
    expect(await response.json()).toMatchObject({
      result: { serverInfo: { name: '@randsum/mcp' } }
    })
  })

  test('serves a tool call without a prior initialize', async () => {
    const response = await post({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'validate', arguments: { notation: '4d6L' } }
    })
    expect(await response.json()).toMatchObject({
      result: { structuredContent: { notation: '4d6L', valid: true } }
    })
  })
})
