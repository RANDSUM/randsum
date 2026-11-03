import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DiceNotation } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { applyHostContext, MCP_APPS_PROTOCOL, McpHost } from '../src/internal/mcp-host'
import type { HostContext, HostFrame, HostHandlers, ToolResult } from '../src/internal/mcp-host'
import { RECORDS_META_KEY, toRollResult } from '../src/mcp-app'
import type { RandsumMcpApp } from '../src/mcp-app'

type Message = Readonly<Record<string, unknown>>

/** A host frame: records what the view posts and answers its requests. */
function fakeHost(answer: (message: Message) => unknown = () => ({})) {
  const sent: Message[] = []
  const frame: HostFrame = {
    postMessage(message: Message) {
      sent.push(message)
      if (typeof message['method'] === 'string' && message['id'] !== undefined) {
        queueMicrotask(() =>
          deliver({ jsonrpc: '2.0', id: message['id'], result: answer(message) })
        )
      }
    }
  }
  const deliver = (data: Message): void => {
    window.dispatchEvent(new MessageEvent('message', { data, source: frame as never }))
  }
  return { frame, sent, deliver }
}

function handlers(overrides: Partial<HostHandlers> = {}): HostHandlers {
  return {
    context: () => {},
    input: () => {},
    result: () => {},
    cancelled: () => {},
    ...overrides
  }
}

function rollToolResult(notation: DiceNotation): ToolResult {
  const result = roll(notation)
  return {
    content: [{ type: 'text', text: '{}' }],
    structuredContent: {
      notation,
      total: result.total,
      pools: [],
      description: result.rolls.map(record => record.description.join(', ')).join('; ')
    },
    _meta: { [RECORDS_META_KEY]: result.rolls }
  }
}

describe('McpHost', () => {
  test('connect sends ui/initialize, reports the context, then ui/notifications/initialized', async () => {
    const context: HostContext = { theme: 'dark' }
    const host = fakeHost(message =>
      message['method'] === 'ui/initialize'
        ? {
            protocolVersion: MCP_APPS_PROTOCOL,
            hostInfo: {},
            hostCapabilities: {},
            hostContext: context
          }
        : {}
    )
    const seen: HostContext[] = []
    await new McpHost(host.frame, handlers({ context: c => seen.push(c) })).connect()
    const methods = host.sent.map(message => message['method'])
    expect(methods.slice(0, 2)).toEqual(['ui/initialize', 'ui/notifications/initialized'])
    const init = host.sent[0]?.['params'] as Message
    expect(init['protocolVersion']).toBe(MCP_APPS_PROTOCOL)
    expect(seen).toEqual([context])
  })

  test('routes the tool input and result notifications', () => {
    const host = fakeHost()
    const inputs: unknown[] = []
    const results: unknown[] = []
    new McpHost(
      host.frame,
      handlers({ input: args => inputs.push(args), result: result => results.push(result) })
    )
    host.deliver({
      jsonrpc: '2.0',
      method: 'ui/notifications/tool-input',
      params: { arguments: { notation: '4d6L' } }
    })
    host.deliver({
      jsonrpc: '2.0',
      method: 'ui/notifications/tool-result',
      params: { structuredContent: { total: 12 } }
    })
    expect(inputs).toEqual([{ notation: '4d6L' }])
    expect(results).toEqual([{ structuredContent: { total: 12 } }])
  })

  test('answers teardown, and ignores messages from any other window', async () => {
    const host = fakeHost()
    const results: unknown[] = []
    new McpHost(host.frame, handlers({ result: result => results.push(result) }))
    host.deliver({ jsonrpc: '2.0', id: 7, method: 'ui/resource-teardown', params: {} })
    expect(host.sent).toContainEqual({ jsonrpc: '2.0', id: 7, result: {} })
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: {} }
      })
    )
    expect(results).toEqual([])
  })

  test('callTool asks the host for tools/call and resolves with its result', async () => {
    const host = fakeHost(message => (message['method'] === 'tools/call' ? { isError: false } : {}))
    const result = await new McpHost(host.frame, handlers()).callTool('roll', { notation: 'd20' })
    expect(host.sent[0]).toMatchObject({
      method: 'tools/call',
      params: { name: 'roll', arguments: { notation: 'd20' } }
    })
    expect(result).toEqual({ isError: false })
  })
})

describe('applyHostContext', () => {
  test('sets the theme, each style variable, and the host fonts once', () => {
    const fonts = '@font-face { font-family: Host; }'
    applyHostContext({
      theme: 'dark',
      styles: { variables: { '--color-text-primary': 'red' }, css: { fonts } }
    })
    applyHostContext({ styles: { css: { fonts } } })
    const root = document.documentElement
    expect(root.dataset['theme']).toBe('dark')
    expect(root.style.getPropertyValue('--color-text-primary')).toBe('red')
    expect(document.querySelectorAll('#rsui-host-fonts').length).toBe(1)
  })
})

describe('toRollResult', () => {
  test('reads a roll: total, notation, description and the records', () => {
    const result = toRollResult(rollToolResult('4d6L'))
    expect(result?.notation).toBe('4d6L')
    expect(result?.records.length).toBe(1)
    expect(result?.description).toContain('Drop lowest')
  })

  test('names the game and its outcome for roll_game', () => {
    const result = toRollResult({
      structuredContent: { game: 'blades', total: 4, result: 'partial', rolls: [4] }
    })
    expect(result?.description).toBe('Blades in the Dark: Partial')
    expect(result?.notation).toBe('Blades in the Dark')
  })

  test('names labelled game pools by their labels', () => {
    const records = [
      ...roll({ sides: 12, quantity: 1, label: 'Hope' }).rolls,
      ...roll({ sides: 12, quantity: 1, label: 'Fear' }).rolls
    ]
    const result = toRollResult({
      structuredContent: { game: 'daggerheart', total: 9, result: 'hope' },
      _meta: { [RECORDS_META_KEY]: records }
    })
    expect(result?.notation).toBe('Hope + Fear')
  })

  test('uses a table row label as the outcome', () => {
    const result = toRollResult({
      structuredContent: { game: 'salvageunion', total: 5, result: { label: 'Failure' } }
    })
    expect(result?.description).toBe('Salvage Union: Failure')
  })

  test('is null when the result is not a roll', () => {
    expect(toRollResult({ structuredContent: { valid: true } })).toBeNull()
  })
})

describe('<randsum-mcp-app>', () => {
  test('shows the server roll in the readout, and the error when there is none', async () => {
    await import('../src/mcp-app')
    const el = document.createElement('randsum-mcp-app') as RandsumMcpApp
    document.body.append(el)
    await el.updateComplete
    expect(el.shadowRoot?.textContent).toContain('Rolling')

    const shown = rollToolResult('2d6+3')
    el.show(shown)
    await el.updateComplete
    const total = el.shadowRoot?.querySelector('.rsui-total')
    expect(total?.textContent?.trim()).toBe(String(shown.structuredContent?.['total']))
    expect(el.shadowRoot?.querySelector('.rsui-result-notation')?.textContent).toBe('2d6+3')

    el.show({ isError: true, content: [{ type: 'text', text: 'Invalid dice notation' }] })
    await el.updateComplete
    expect(el.shadowRoot?.textContent).toContain('Invalid dice notation')
    el.remove()
  })

  test('applies the host tokens on its own host, leaving the accent alone', async () => {
    const { RandsumMcpApp } = await import('../src/mcp-app')
    const css = [RandsumMcpApp.styles].flat(2).map(String).join('\n')
    expect(css).toContain('--rsui-ink: var(--color-text-primary)')
    expect(css).not.toContain('--rsui-accent: var(')
  })
})

describe('dist/mcp-app.html', () => {
  const page = join(import.meta.dir, '..', 'dist', 'mcp-app.html')

  test.if(existsSync(page))('is one self-contained page with the element and its script', () => {
    const html = readFileSync(page, 'utf8')
    expect(html).toContain('<randsum-mcp-app></randsum-mcp-app>')
    expect(html).toContain('<meta name="color-scheme" content="light dark">')
    expect(html).not.toMatch(/<script[^>]+src=/)
    expect(html.match(/<\/script>/g)?.length).toBe(1)
  })
})
