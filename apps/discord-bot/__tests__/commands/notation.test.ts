import { describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext } from './lib/context.js'

// Mock NOTATION_DOCS with a controlled fixture so tests are deterministic
const mockNotationDocs = {
  L: {
    key: 'L',
    category: 'Filter',
    title: 'Drop Lowest',
    description: 'Drops the lowest die from the pool',
    color: '#abc123',
    colorLight: '#123abc',
    displayBase: 'L',
    forms: [{ notation: 'NdSL', note: 'Drop lowest die' }],
    examples: [{ notation: '4d6L', description: 'Roll 4d6, drop lowest' }]
  },
  H: {
    key: 'H',
    category: 'Filter',
    title: 'Drop Highest',
    description: 'Drops the highest die from the pool',
    color: '#abc123',
    colorLight: '#123abc',
    displayBase: 'H',
    forms: [{ notation: 'NdSH', note: 'Drop highest die' }],
    examples: [{ notation: '4d6H', description: 'Roll 4d6, drop highest' }]
  },
  'C{..}': {
    key: 'C{..}',
    category: 'Clamp',
    title: 'Cap',
    description: 'Clamps dice to a range',
    color: '#def456',
    colorLight: '#456def',
    displayBase: 'C{..}',
    forms: [{ notation: 'NdSC{..}', note: 'Cap dice' }],
    examples: [{ notation: '4d6C{>5}', description: 'Cap at 5' }]
  }
}

void mock.module('@randsum/roller/docs', () => ({
  NOTATION_DOCS: mockNotationDocs
}))

const { notationCommand } = await import('../../src/commands/notation.js')

/** The select menu as it reaches Discord — `buildComponents` returns raw API JSON. */
interface ApiActionRow {
  readonly components: readonly {
    readonly custom_id?: string
    readonly options?: readonly { readonly label: string }[]
  }[]
}

function renderEmbed(): APIEmbed {
  return notationCommand.buildEmbed!(makeContext()).toJSON()
}

function renderComponents(): readonly ApiActionRow[] {
  return notationCommand.buildComponents!(makeContext()) as readonly ApiActionRow[]
}

describe('notationCommand', () => {
  test('embed title links to notation.randsum.dev', () => {
    const embed = renderEmbed()
    expect(embed.title).toBe('notation.randsum.dev')
    expect(embed.url).toBe('https://notation.randsum.dev')
  })

  test('embed shows fields for first category entries', () => {
    expect((renderEmbed().fields ?? []).length).toBeGreaterThan(0)
  })

  test('components include a select menu with category options', () => {
    const labels = (renderComponents()[0]?.components[0]?.options ?? []).map(o => o.label)
    expect(labels).toContain('Filter')
    expect(labels).toContain('Clamp')
  })

  test('components are plain JSON, not builders', () => {
    // The dispatcher spreads these straight into the interaction response body,
    // so the raw API fields must already be there. A builder keeps its fields
    // under `.data` and would serialize to something Discord rejects, leaving a
    // reference page with no way to change category.
    const [row] = renderComponents()
    expect(row).toBeDefined()
    expect(row?.components[0]?.custom_id).toBe('notation-category')
    expect(row).not.toHaveProperty('data')
  })
})
