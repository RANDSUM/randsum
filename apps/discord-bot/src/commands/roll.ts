import { roll } from '@randsum/roller/roll'
import { suggestNotationFix } from '@randsum/roller'
import { notation as createNotation } from '@randsum/roller/validate'
import { SlashCommandBuilder } from '../utils/builders.js'
import { BRAND } from '../utils/palette.js'
import {
  TEXT_DISPLAY_LIMIT,
  createGameCommand,
  defaultErrorMessage,
  encodeReroll,
  measureContainer,
  renderTrace,
  rollContainer
} from './lib/index.js'
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
 * How much of the notation the headline and derivation echo back.
 *
 * The notation is already on screen in the user's own command, so echoing all
 * of it buys nothing — and `roll()` accepts notation far longer than a whole
 * message may be. `1d6+1d6+…` repeated a few hundred times parses fine and
 * produced a derivation line that alone blew the budget, which is how a valid
 * roll reached the user as "Something went wrong".
 */
const NOTATION_ECHO_LIMIT = 200

/** Shortens a value for inline display, with an ellipsis rather than a notice. */
function truncateInline(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`
}

/** Everything the rendered view spends against the message character budget. */
function measureView(view: RollView): number {
  return view.reduce<number>((total, container) => total + measureContainer(container), 0)
}

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
 *
 * Fitting the character budget is done by **building and measuring**, not by
 * estimating. The estimate this replaces charged a flat 160 characters per
 * container for headline, description and derivation; the real figure reaches
 * 685 when the headline echoes a long pool notation and the consequence echoes
 * a long description, and `4d1000R{=1..=200}x6` shipped 8416 characters — more
 * than twice the cap — straight into a rejected message.
 */
function buildRollView(context: CommandContext): RollView {
  const notationString = context.options.getString('notation', true)
  const validNotation = createNotation(notationString)
  const result = roll(validNotation)

  const multiple = result.rolls.length > 1
  const capped = result.rolls.slice(0, MAX_POOLS)
  const notationEcho = truncateInline(notationString, NOTATION_ECHO_LIMIT)

  // The whole roll re-rolls, not one pool, so the button belongs on the first
  // container only. Long notation simply gets no button — see `encodeReroll`.
  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('roll', { notation: notationString, hidden })

  const render = (count: number, bodyBudget?: number): RollView => {
    const pools = capped.slice(0, count)

    const containers = pools.map((record, index) => {
      const description = truncateInline(
        (record.description ?? []).join(' · '),
        NOTATION_ECHO_LIMIT
      )

      return rollContainer({
        accent: BRAND,
        // A single pool leads with the number, because that is the answer. Several
        // pools lead with which pool this is, and the grand total gets its own
        // line below.
        headline: multiple
          ? `${truncateInline(record.notation, NOTATION_ECHO_LIMIT)}  ·  ${record.total}`
          : String(result.total),
        ...(description.length > 0 ? { consequence: description } : {}),
        body: renderTrace(record),
        derivation: multiple ? `Pool ${index + 1} of ${result.rolls.length}` : notationEcho,
        ...(index === 0 && rerollId !== undefined ? { rerollId } : {}),
        ...(bodyBudget !== undefined ? { bodyBudget } : {})
      })
    })

    if (!multiple) return containers

    const omitted = result.rolls.length - pools.length
    return [
      ...containers,
      rollContainer({
        accent: BRAND,
        headline: `Total  ${result.total}`,
        ...(omitted > 0
          ? { consequence: `${omitted} further pool${omitted === 1 ? '' : 's'} not shown.` }
          : {}),
        derivation: notationEcho
      })
    ]
  }

  // Widest view first: keep every pool that fits, drop trailing pools until one
  // does. Dropping from the end rather than skipping a single fat pool keeps
  // "Pool 3 of 6" honest — a reader never sees a gap in the numbering.
  const fitted = Array.from({ length: capped.length }, (_, index) => capped.length - index)
    .map(count => render(count))
    .find(view => measureView(view) <= MAX_CHARACTERS)

  if (fitted !== undefined) return fitted

  // A single pool is never dropped: one over-long pool is still the answer to
  // what the user asked. The only lever left is its body, so give it whatever
  // the headline, consequence and derivation are not already using.
  const single = render(1)
  const first = capped[0]
  const bodyLength = first === undefined ? 0 : renderTrace(first).join('\n').length
  const overhead = measureView(single) - Math.min(bodyLength, TEXT_DISPLAY_LIMIT)

  return render(1, Math.max(1, MAX_CHARACTERS - overhead))
}

/**
 * Restates a near-miss notation as "Did you mean `2d6`?" on its own line.
 *
 * The base message says what is wrong; this says what to type instead, which is
 * the useful half when someone types `26` for `2d6`. Reads the option off the
 * context rather than the error because not every error carries the notation.
 *
 * The strip is not cosmetic. `NotationParseError` already ends its message with
 * a `Did you mean "2d6"?` of its own, so appending blindly says it twice — which
 * is what the gateway bot did, since the roller gained that suffix (#1160)
 * before anyone re-read this function. Removing the roller's copy first leaves
 * one suggestion, on its own line, in backticks that Discord renders as code.
 *
 * Matched against the exact suffix the roller would have built from this same
 * suggestion, so a message ending some other way is left alone rather than
 * having its tail guessed at.
 */
function describeRollError(error: unknown, context: CommandContext): string {
  const notationString = context.options.getString('notation', true)
  const baseMessage = defaultErrorMessage(error)
  const suggestion = suggestNotationFix(notationString)
  if (!suggestion) return baseMessage

  const rollerSuffix = ` Did you mean "${suggestion}"?`
  const trimmed = baseMessage.endsWith(rollerSuffix)
    ? baseMessage.slice(0, -rollerSuffix.length)
    : baseMessage

  return `${trimmed}\n\nDid you mean \`${suggestion}\`?`
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
  buildView: buildRollView,
  describeError: describeRollError
})
