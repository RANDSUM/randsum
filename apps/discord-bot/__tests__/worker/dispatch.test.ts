/**
 * Covers the HTTP-interactions dispatcher against the REAL command barrel.
 *
 * Using the real commands rather than fixtures is the point: this is the test
 * that would catch a command whose `buildEmbed` quietly depends on something a
 * Worker cannot provide. A dispatcher tested only against a stub command proves
 * the dispatcher works and says nothing about whether the bot does.
 */
import { describe, expect, test } from 'bun:test'
import { commands as commandList } from '../../src/commands/index.js'
import { dispatchInteraction, InteractionResponseType } from '../../src/worker/dispatch.js'
import type { Command } from '../../src/types.js'

const commands: ReadonlyMap<string, Command> = new Map(
  commandList.map(command => [command.data.name, command])
)

interface Rendered {
  type: number
  data?: {
    embeds?: { title?: string; fields?: { name: string; value: string }[] }[]
    flags?: number
  }
}

function invoke(name: string, options: { name: string; value: unknown }[] = []): Rendered {
  return dispatchInteraction(
    {
      type: 2,
      data: { name, options },
      member: { user: { global_name: 'Tester', username: 'tester' } }
    },
    commands
  ) as Rendered
}

describe('dispatchInteraction', () => {
  test('answers a PING with a PONG', () => {
    const response = dispatchInteraction({ type: 1 }, commands) as Rendered
    expect(response.type).toBe(InteractionResponseType.Pong)
  })

  test('renders a real roll without deferring', () => {
    const response = invoke('roll', [{ name: 'notation', value: '4d6L' }])

    // Type 4 — an immediate message. The whole simplification of this transport
    // is that a dice roll does not need a deferral and a follow-up webhook.
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
    expect(response.data?.embeds?.[0]).toBeDefined()
  })

  test('renders every factory-backed command', () => {
    // Guards the seam wholesale: if any command's buildEmbed reaches for
    // something only a gateway can supply, it fails here rather than in prod.
    const cases: [string, { name: string; value: unknown }[]][] = [
      ['roll', [{ name: 'notation', value: '2d20' }]],
      ['blades', [{ name: 'dice', value: 3 }]],
      ['fate', []],
      ['fifth', []],
      ['dh', []],
      ['pbta', [{ name: 'stat', value: 1 }]],
      ['root', [{ name: 'stat', value: 2 }]]
    ]

    for (const [name, options] of cases) {
      const response = invoke(name, options)
      expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
      expect(response.data?.embeds?.[0]).toBeDefined()
    }
  })

  test('honours the hidden option as an ephemeral flag', () => {
    const visible = invoke('roll', [{ name: 'notation', value: '1d20' }])
    const hidden = invoke('roll', [
      { name: 'notation', value: '1d20' },
      { name: 'hidden', value: true }
    ])

    expect(visible.data?.flags).toBeUndefined()
    expect(hidden.data?.flags).toBeDefined()
  })

  test('answers an unknown command instead of timing out', () => {
    const response = invoke('nonexistent')
    // Matches the gateway bot's behaviour: a stale registry entry says so.
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
    expect(response.data?.embeds?.[0]?.title).toBe('Error')
  })

  test('turns a bad roll into an error embed, not a throw', () => {
    const response = invoke('roll', [{ name: 'notation', value: 'not-notation' }])
    expect(response.data?.embeds?.[0]?.title).toBe('Error')
  })

  test('renders /help from the barrel, not from a gateway client', () => {
    const response = invoke('help')
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)

    // The real proof it reads the registry: a Worker has no client, so an
    // empty field list here would mean /help silently renders nothing.
    const names = (response.data?.embeds?.[0]?.fields ?? []).map(field => field.name)
    expect(names).toContain('/roll')
    expect(names).not.toContain('/help')
  })

  test('renders /salvageunion', () => {
    const response = invoke('salvageunion')
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
    expect(response.data?.embeds?.[0]?.title).toBe('Salvage Union has moved')
  })

  test('reports commands that have no Worker renderer yet', () => {
    // /notation is the last holdout — its pagination uses a gateway-only
    // component collector. It must say so rather than silently do nothing.
    const response = invoke('notation')
    expect(response.data?.embeds?.[0]?.title).toBe('Error')
  })

  test('returns undefined for interaction types it does not handle', () => {
    // Lets the caller choose the HTTP status rather than inventing one here.
    expect(dispatchInteraction({ type: 5 }, commands)).toBeUndefined()
  })

  test('falls back sensibly when the user has no global_name', () => {
    const response = dispatchInteraction(
      {
        type: 2,
        data: { name: 'root', options: [{ name: 'stat', value: 1 }] },
        member: { user: { username: 'legacyuser' } }
      },
      commands
    ) as Rendered
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
  })
})
