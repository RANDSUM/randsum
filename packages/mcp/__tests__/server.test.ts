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

describe('output schemas', () => {
  test('every tool advertises an output schema', async () => {
    const client = await connect()
    const { tools } = await client.listTools()

    expect(tools.map(t => [t.name, t.outputSchema?.type])).toEqual([
      ['roll', 'object'],
      ['validate', 'object'],
      ['roll_game', 'object']
    ])
  })

  // The client checks structured content against the advertised output schema
  // and throws on a mismatch, so a successful call proves the two agree.
  test('structured content matches each output schema', async () => {
    const client = await connect()
    const rolled = await client.callTool({
      name: 'roll',
      arguments: { notation: '4d6L+2', seed: 7 }
    })
    const valid = await client.callTool({ name: 'validate', arguments: { notation: '4d6L' } })
    const invalid = await client.callTool({ name: 'validate', arguments: { notation: '4x6' } })
    const game = await client.callTool({
      name: 'roll_game',
      arguments: { game: 'fifth', params: { modifier: 3 } }
    })

    expect(rolled.structuredContent).toMatchObject({ notation: '4d6L+2' })
    expect(valid.structuredContent).toMatchObject({ valid: true })
    expect(invalid.structuredContent).toMatchObject({ valid: false })
    expect(game.structuredContent).toMatchObject({ game: 'fifth' })
  })

  test('a RandsumError reports its code', async () => {
    const client = await connect()
    const result = await client.callTool({ name: 'roll', arguments: { notation: '1d6L' } })
    const content = result.content as readonly { readonly type: string; readonly text: string }[]

    expect(result.isError).toBe(true)
    expect(result.structuredContent).toBeUndefined()
    expect(JSON.parse(content[1]?.text ?? '{}')).toEqual({ code: 'MODIFIER_ERROR' })
  })
})

describe('agent guidance', () => {
  test('sends server instructions that forbid invented results', async () => {
    const client = await connect()

    expect(client.getInstructions()).toContain('never invent dice results')
  })

  test('annotates every tool as a closed, read-only computation', async () => {
    const client = await connect()
    const { tools } = await client.listTools()
    const hints = Object.fromEntries(tools.map(t => [t.name, t.annotations]))

    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      })
    }
    expect(hints['validate']?.idempotentHint).toBe(true)
    expect(hints['roll']?.idempotentHint).toBe(false)
    expect(hints['roll_game']?.idempotentHint).toBe(false)
  })
})
