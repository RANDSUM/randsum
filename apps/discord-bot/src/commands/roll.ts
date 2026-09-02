import { roll } from '@randsum/roller/roll'
import type { TraceableRollRecord } from '@randsum/roller/trace'
import { notation as createNotation } from '@randsum/roller/validate'
import { SlashCommandBuilder } from '../utils/builders.js'
import { BRAND } from '../utils/palette.js'
import { createGameCommand, encodeReroll, renderTrace, rollContainer } from './lib/index.js'
import type { CommandContext } from './lib/index.js'
import type { Command, RollView } from '../types.js'

/**
 * Containers rendered before the rest are summarised away.
 *
 * A message caps at 40 components, and the cost was measured rather than
 * guessed: a `rollContainer` is **6** components (container, headline,
 * consequence, separator, body, derivation) and the first is **8**, because the
 * reroll button turns its body into Section + TextDisplay + Button. So the
 * total is 11 for the first pool plus its summary container, then 6 each.
 *
 * At the previous value of 8 this shipped a broken command: `4d6Lx6` sent 41
 * components and Discord rejected the message outright — "This interaction
 * failed" — for the six-ability-score idiom the docs advertise. The 8 was
 * inherited from the embed era's 25-*field* cap and was never re-derived for
 * Components V2.
 *
 * Five gives 35 inclusive, which is under 40 whether or not the `Container`
 * wrapper itself counts toward the limit.
 */
const MAX_POOLS = 5

/**
 * Every Text Display in a message shares roughly a 4000-character budget.
 *
 * Unlike the component count this is not bounded by `MAX_POOLS`: the roller
 * allows up to 1000 dice per pool, so `300d100x8` measured at 7850 characters.
 * Pools are dropped until the rendered view fits.
 */
const MAX_CHARACTERS = 4000

/**
 * `/roll` — the generic notation roller, and the bot's flagship command.
 *
 * Note that the command takes a *single* notation string, so several pools can
 * only arise from the repeat operator (`4d6Lx6`) — not from separate arguments,
 * which `roll()` supports but this command has no way to express.
 *
 * Two things changed with the move off embeds. It renders **every** pool rather
 * than `rolls[0]`, so a repeat like `4d6Lx6` finally shows all its dice. And
 * the body is `traceRoll` output rather than two parallel plain lists, so a
 * dropped or rerolled die is marked in place instead of the reader diffing
 * "Initial Rolls" against "Modified Rolls" by eye.
 */
/**
 * Drop trailing pools until the rendered dice fit the character budget.
 *
 * Counts only what this view actually renders — the trace lines — plus a fixed
 * allowance for the headline, description and derivation each container adds.
 * A single pool is never dropped: one over-long pool is still the answer to
 * what the user asked, and `rollContainer` is the wrong place to silently
 * discard it.
 */
function fitPools<T extends TraceableRollRecord>(
  pools: readonly T[],
  multiple: boolean
): readonly T[] {
  const PER_CONTAINER_OVERHEAD = 160
  const budget = MAX_CHARACTERS - (multiple ? PER_CONTAINER_OVERHEAD : 0)

  // `stopped` rather than filtering: once a pool does not fit, every later pool
  // is dropped too. Skipping one and keeping the next would renumber
  // "Pool 3 of 6" against pools the reader never saw.
  return pools.reduce<{
    readonly fitted: readonly T[]
    readonly used: number
    readonly stopped: boolean
  }>(
    (accumulator, record) => {
      if (accumulator.stopped) return accumulator

      const cost = renderTrace(record).join('\n').length + PER_CONTAINER_OVERHEAD
      const fits = accumulator.fitted.length === 0 || accumulator.used + cost <= budget

      return fits
        ? { fitted: [...accumulator.fitted, record], used: accumulator.used + cost, stopped: false }
        : { ...accumulator, stopped: true }
    },
    { fitted: [], used: 0, stopped: false }
  ).fitted
}

function buildRollView(context: CommandContext): RollView {
  const notationString = context.options.getString('notation', true)
  const validNotation = createNotation(notationString)
  const result = roll(validNotation)

  const multiple = result.rolls.length > 1
  const pools = fitPools(result.rolls.slice(0, MAX_POOLS), multiple)

  // The whole roll re-rolls, not one pool, so the button belongs on the first
  // container only. Long notation simply gets no button — see `encodeReroll`.
  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('roll', { notation: notationString, hidden })

  const containers = pools.map((record, index) => {
    const description = (record.description ?? []).join(' · ')

    return rollContainer({
      accent: BRAND,
      // A single pool leads with the number, because that is the answer. Several
      // pools lead with which pool this is, and the grand total gets its own
      // line below.
      headline: multiple ? `${record.notation}  ·  ${record.total}` : String(result.total),
      ...(description.length > 0 ? { consequence: description } : {}),
      body: renderTrace(record),
      derivation: multiple ? `Pool ${index + 1} of ${result.rolls.length}` : notationString,
      ...(index === 0 && rerollId !== undefined ? { rerollId } : {})
    })
  })

  if (multiple) {
    const omitted = result.rolls.length - pools.length
    containers.push(
      rollContainer({
        accent: BRAND,
        headline: `Total  ${result.total}`,
        ...(omitted > 0
          ? { consequence: `${omitted} further pool${omitted === 1 ? '' : 's'} not shown.` }
          : {}),
        derivation: notationString
      })
    )
  }

  return containers
}

export const rollCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Test your luck with a roll of the dice')
    .addStringOption(option =>
      option
        .setName('notation')
        .setDescription('Dice notation (e.g., 2d6+3, d%, 4dF)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: buildRollView
})
