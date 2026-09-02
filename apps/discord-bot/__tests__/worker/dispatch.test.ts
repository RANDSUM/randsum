/**
 * Covers the HTTP-interactions dispatcher against the REAL command barrel.
 *
 * Using the real commands rather than fixtures is the point: this is the test
 * that would catch a command whose renderer quietly depends on something a
 * Worker cannot provide. A dispatcher tested only against a stub command proves
 * the dispatcher works and says nothing about whether the bot does.
 */
import { describe, expect, test } from 'bun:test'
import { commands as commandList } from '../../src/commands/index.js'
import { ContainerBuilder, TextDisplayBuilder } from '../../src/utils/builders.js'
import { dispatchInteraction, InteractionResponseType } from '../../src/worker/dispatch.js'
import type { Command, RollView } from '../../src/types.js'

const commands: ReadonlyMap<string, Command> = new Map(
  commandList.map(command => [command.data.name, command])
)

interface Rendered {
  type: number
  data?: {
    allowed_mentions?: { parse: readonly string[] }
    embeds?: { title?: string; fields?: { name: string; value: string }[] }[]
    components?: readonly unknown[]
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

function characterCountOf(components: readonly unknown[]): number {
  const walk = (node: unknown): number => {
    if (node === null || typeof node !== 'object') return 0
    const own =
      'type' in node && node.type === 10 && 'content' in node ? String(node.content).length : 0
    return (
      own +
      Object.values(node).reduce<number>(
        (total, value) =>
          total +
          (Array.isArray(value) ? value.reduce<number>((a, v) => a + walk(v), 0) : walk(value)),
        0
      )
    )
  }

  return components.reduce<number>((total, component) => total + walk(component), 0)
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
    // `/roll` renders Components V2 now, so the payload carries a container
    // rather than an embed.
    expect(response.data?.components?.[0]).toMatchObject({ type: 17 })
  })

  test('renders every factory-backed command', () => {
    // Guards the seam wholesale: if any command's renderer reaches for
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
      expect(response.data?.components?.[0]).toMatchObject({ type: 17 })
    }
  })

  test('honours the hidden option as an ephemeral flag', () => {
    const visible = invoke('roll', [{ name: 'notation', value: '1d20' }])
    const hidden = invoke('roll', [
      { name: 'notation', value: '1d20' },
      { name: 'hidden', value: true }
    ])

    // `/roll` is on Components V2, so its flag word always carries 32768 and
    // gains 64 when hidden — the ephemeral bit composes rather than replaces.
    expect(visible.data?.flags).toBe(32768)
    expect(hidden.data?.flags).toBe(32768 | 64)
  })

  test('answers an unknown command instead of timing out', () => {
    const response = invoke('nonexistent')
    // Matches the gateway bot's behaviour: a stale registry entry says so.
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
    expect(JSON.stringify(response.data?.components)).toContain('Something went wrong')
  })

  test('turns a bad roll into an error response, not a throw', () => {
    const response = invoke('roll', [{ name: 'notation', value: 'not-notation' }])
    expect(JSON.stringify(response.data?.components)).toContain('Something went wrong')
  })

  test('an error is ephemeral and carries the V2 flag', () => {
    const response = invoke('roll', [{ name: 'notation', value: 'not-notation' }])
    expect(response.data?.flags).toBe(32768 | 64)
  })

  test('an error accent is distinct from every failure accent', () => {
    // The embed version used 0xff0000, byte-identical to the failure colour of
    // /blades, /pbta and /root — so a missed roll and a crash looked the same.
    const response = invoke('roll', [{ name: 'notation', value: 'not-notation' }])
    expect(JSON.stringify(response.data?.components)).toContain(String(0x992d22))
  })

  test('renders /help from the barrel, not from a gateway client', () => {
    const response = invoke('help')
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)

    // The real proof it reads the registry: a Worker has no client, so an
    // empty list here would mean /help silently renders nothing.
    const text = JSON.stringify(response.data?.components)
    expect(text).toContain('/roll')
    expect(text).not.toContain('**/help')
  })

  test('renders /salvageunion', () => {
    const response = invoke('salvageunion')
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
    expect(JSON.stringify(response.data?.components)).toContain('Salvage Union has moved')
  })

  test('renders /notation with its category selector attached', () => {
    const response = invoke('notation')
    // The selector now lives inside the container rather than in a detached row,
    // so a missing menu would be a reference page with no way to change
    // category — working, but silently missing the entire interaction.
    const payload = JSON.stringify(response.data?.components)
    expect(payload).toContain('notation.randsum.dev')
    expect(payload).toContain('notation-category')
  })

  test('every command has a Worker renderer', () => {
    // The parity gate. A new command added without a renderer would answer "not
    // available on this deployment" in production, which is the kind of gap
    // that only surfaces when someone tries the command.
    for (const command of commandList) {
      expect(command.buildView).toBeDefined()
    }
  })

  test('a category selection re-renders in place', () => {
    // The gateway keeps a collector open on a socket; a Worker gets an
    // independent POST. This works because a select menu sends its chosen
    // value back — the selection carries its own state.
    const response = dispatchInteraction(
      { type: 3, data: { custom_id: 'notation-category', values: ['Arithmetic'] } },
      commands
    ) as Rendered

    // Type 7 edits the existing message rather than posting a new one, matching
    // the gateway path's `.update()`.
    expect(response.type).toBe(7)
    // The V2 flag has to be set on the edit too: it cannot be removed once a
    // message carries it, and omitting it makes Discord read the container as a
    // malformed action row.
    expect(response.data?.flags).toBe(32768)
    expect(JSON.stringify(response.data?.components)).toContain('notation.randsum.dev')
  })

  test('an unrecognised category falls back rather than rendering empty', () => {
    // A stale menu from an old message must not produce a blank reference page.
    const response = dispatchInteraction(
      { type: 3, data: { custom_id: 'notation-category', values: ['NoSuchCategory'] } },
      commands
    ) as Rendered

    expect(response.type).toBe(7)
    expect(JSON.stringify(response.data?.components).length).toBeGreaterThan(100)
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

  describe('the Components V2 seam', () => {
    const buildView = (): RollView => [
      new ContainerBuilder()
        .setAccentColor(0x4fb3a5)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('## rendered by buildView'))
    ]

    const viewCommand: Command = { data: commandList[0]!.data, buildView }

    function invokeView(options: { name: string; value: unknown }[] = []): Rendered {
      return dispatchInteraction(
        { type: 2, data: { name: 'probe', options } },
        new Map([['probe', viewCommand]])
      ) as Rendered
    }

    test('a command defining buildView is rendered as components, not embeds', () => {
      const response = invokeView()
      expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
      expect(response.data?.embeds).toBeUndefined()
      // Container is component type 17.
      expect(response.data?.components?.[0]).toMatchObject({ type: 17 })
    })

    test('the IsComponentsV2 flag is always set on a view response', () => {
      // Without it Discord reads `components` as legacy action rows and rejects
      // the container outright, so this flag is load-bearing, not cosmetic.
      expect(invokeView().data?.flags).toBe(32768)
    })

    test('hidden composes with the V2 flag rather than replacing it', () => {
      expect(invokeView([{ name: 'hidden', value: true }]).data?.flags).toBe(32768 | 64)
    })

    test('a command with no renderer still reports itself unavailable', () => {
      const response = dispatchInteraction(
        { type: 2, data: { name: 'probe' } },
        new Map([['probe', { data: commandList[0]!.data }]])
      ) as Rendered
      expect(JSON.stringify(response.data?.components)).toContain('Something went wrong')
    })
  })

  describe('error rendering', () => {
    test('an over-long error message is clamped rather than thrown', () => {
      // The regression this guards. `roll()` reports invalid notation by
      // quoting it back, so a 3937-character argument produced an error message
      // past the 4000-character Text Display cap — and `setContent` throws
      // rather than truncating. The throw escaped the dispatcher, and
      // Cloudflare answered Discord with a 500.
      const response = invoke('roll', [{ name: 'notation', value: 'z'.repeat(3937) }])
      expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
      expect(JSON.stringify(response.data?.components)).toContain('Something went wrong')
    })

    test('a long valid notation renders a roll, within the character budget', () => {
      // End to end against the real roller, no fixtures: a 900-character reroll
      // set is valid notation, and every pool echoes it in the headline while
      // echoing a 726-character description below it. The guard this replaced
      // charged a flat 160 per container and let 8416 characters through.
      const long = `4d1000R{${Array.from({ length: 200 }, (_, index) => `=${index + 1}`).join(',')}}x6`
      const response = invoke('roll', [{ name: 'notation', value: long }])

      const rendered = JSON.stringify(response.data?.components)
      expect(rendered).not.toContain('Something went wrong')
      expect(characterCountOf(response.data?.components ?? [])).toBeLessThanOrEqual(4000)
    })
  })

  describe('reroll buttons', () => {
    test('a reroll re-runs the command from its encoded state', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:roll:notation=4d6L' } },
        commands
      ) as Rendered
      expect(response.data?.components?.[0]).toMatchObject({ type: 17 })
    })

    test('a reroll posts a NEW message rather than editing the original', () => {
      // Type 7 would let a bystander's click silently overwrite someone else's
      // result, since a stateless Worker cannot tell who is clicking without
      // spending ~19 of the 100 custom_id characters on a user id.
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:roll:notation=1d20' } },
        commands
      ) as Rendered
      expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
      expect(response.type).not.toBe(InteractionResponseType.UpdateMessage)
    })

    test('a reroll of a hidden roll stays hidden', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:blades:dice=3&hidden=true' } },
        commands
      ) as Rendered
      expect(response.data?.flags).toBe(32768 | 64)
    })

    test('a reroll of a public roll stays public', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:blades:dice=3' } },
        commands
      ) as Rendered
      expect(response.data?.flags).toBe(32768)
    })

    test('a button for a removed command says so instead of failing silently', () => {
      // Buttons outlive deployments: nothing expires them, so a months-old
      // message can still be clicked.
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:noSuchCommand:x=1' } },
        commands
      ) as Rendered
      expect(JSON.stringify(response.data?.components)).toContain('no longer available')
    })

    test('a roll that throws on reroll renders the error, not a crash', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:blades:dice=99' } },
        commands
      ) as Rendered
      expect(JSON.stringify(response.data?.components)).toContain('Something went wrong')
    })

    test('a malformed reroll id is left to the caller, as before', () => {
      expect(dispatchInteraction({ type: 3, data: { custom_id: 'r:' } }, commands)).toBeUndefined()
    })

    test('the notation selector still works alongside reroll ids', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'notation-category', values: ['Filter'] } },
        commands
      ) as Rendered
      expect(response.type).toBe(InteractionResponseType.UpdateMessage)
    })
  })

  describe('mention suppression', () => {
    // Components V2 TextDisplay content is mention-parsed like message content,
    // and `/roll`'s annotation is free user text that lands verbatim in a public
    // line. Without allowed_mentions, any user could make the bot ping a role.
    const cases: [string, { name: string; value: unknown }[]][] = [
      ['roll', [{ name: 'notation', value: '1d20[@everyone]' }]],
      ['help', []],
      ['notation', []]
    ]

    test.each(cases)('every command response suppresses mentions (/%s)', (name, options) => {
      expect(invoke(name, options).data?.allowed_mentions).toEqual({ parse: [] })
    })

    test('an error response suppresses mentions too', () => {
      const response = invoke('roll', [{ name: 'notation', value: 'not-notation' }])
      expect(response.data?.allowed_mentions).toEqual({ parse: [] })
    })

    test('a reroll response suppresses mentions', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'r:roll:notation=1d20' } },
        commands
      ) as Rendered
      expect(response.data?.allowed_mentions).toEqual({ parse: [] })
    })

    test('a component update suppresses mentions', () => {
      const response = dispatchInteraction(
        { type: 3, data: { custom_id: 'notation-category', values: ['Filter'] } },
        commands
      ) as Rendered
      expect(response.data?.allowed_mentions).toEqual({ parse: [] })
    })

    test('the annotation still renders — it is neutered, not stripped', () => {
      const payload = JSON.stringify(
        invoke('roll', [{ name: 'notation', value: '1d20[@everyone]' }])
      )
      expect(payload).toContain('@everyone')
    })
  })
})
