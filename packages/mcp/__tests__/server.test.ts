import { describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer } from '../src/server'

async function connect(): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '0.0.0' })
  await Promise.all([createServer().connect(serverTransport), client.connect(clientTransport)])
  return client
}

interface JsonSchema {
  readonly properties?: Readonly<Record<string, JsonSchema>>
  readonly anyOf?: readonly JsonSchema[]
  readonly description?: string
  readonly minimum?: number
  readonly maximum?: number
  readonly type?: string
}

describe('roll_game schema', () => {
  test('advertises each game params from its spec inputs', async () => {
    const client = await connect()
    const { tools } = await client.listTools()
    const tool = tools.find(t => t.name === 'roll_game')
    const properties = (tool?.inputSchema.properties ?? {}) as Readonly<Record<string, JsonSchema>>
    const params = properties['params']
    const games = params?.anyOf ?? []
    const blades = games.find(g => g.description === 'params when game is "blades"')
    const fifth = games.find(g => g.description === 'params when game is "fifth"')

    expect(games).toHaveLength(7)
    expect(blades?.properties?.['rating']).toMatchObject({
      type: 'integer',
      minimum: 0,
      maximum: 10
    })
    expect(fifth?.properties?.['crit']?.description).toBe(
      'When true, check for natural 1 and natural 20'
    )
    expect(fifth?.properties?.['modifier']).toMatchObject({ minimum: -30, maximum: 30 })
  })

  test('checks params against the chosen game', async () => {
    const client = await connect()
    const outOfRange = await client.callTool({
      name: 'roll_game',
      arguments: { game: 'fate', params: { modifier: 10 } }
    })
    const missing = await client.callTool({
      name: 'roll_game',
      arguments: { game: 'pbta', params: {} }
    })
    const fraction = await client.callTool({
      name: 'roll_game',
      arguments: { game: 'fifth', params: { modifier: 1.5 } }
    })

    expect(outOfRange.isError).toBe(true)
    expect(missing.isError).toBe(true)
    expect(fraction.isError).toBe(true)
  })

  test('rolls valid params and ignores keys the game does not declare', async () => {
    const client = await connect()
    const result = await client.callTool({
      name: 'roll_game',
      arguments: { game: 'blades', params: { rating: 10, rollingWith: 'Advantage' } }
    })

    expect(result.isError).toBeFalsy()
    expect(result.structuredContent).toMatchObject({ game: 'blades' })
  })
})
