import { roll } from '@randsum/games/daggerheart'
import { SlashCommandBuilder } from '../utils/builders.js'
import { DAGGERHEART, GLYPH } from '../utils/palette.js'
import {
  createGameCommand,
  encodeReroll,
  formatSignedModifier,
  rollContainer
} from './lib/index.js'
import type { CommandContext, ViewFact } from './lib/index.js'
import type { Command, RollView } from '../types.js'

/**
 * `/dh` — Daggerheart, which resolves on a **grid**, not a line.
 *
 * A Daggerheart roll produces two independent facts: whether you succeeded
 * (total vs Difficulty) and who gains metacurrency (Hope vs Fear). Without a
 * `difficulty` the bot can only ever render the second, so "Success with Fear"
 * — the result that most defines the game — looked identical to a plain
 * failure. `difficulty` is optional: absent it, the headline falls back to the
 * Hope/Fear axis alone.
 *
 * The old copy was also not the game's. "Critical Hope!" is not a Daggerheart
 * term; the game's outcomes are Critical Success, with Hope, and with Fear, and
 * the headline leads with the total ("17 with Fear"). And the consequence — you
 * gain a Hope, the GM gains a Fear, a crit also clears a Stress — was stated
 * nowhere.
 */
function buildDhView(context: CommandContext): RollView {
  const modifier = context.options.getInteger('modifier') ?? 0
  const difficulty = context.options.getInteger('difficulty')
  const rollingWith = context.options.getString('rolling_with') as
    | 'Advantage'
    | 'Disadvantage'
    | null
  const amplifyHope = context.options.getBoolean('amplify_hope') ?? false
  const amplifyFear = context.options.getBoolean('amplify_fear') ?? false

  const result = roll({
    modifier,
    ...(rollingWith ? { rollingWith } : {}),
    amplifyHope,
    amplifyFear
  })

  const isCritical = result.result === 'critical_hope'
  const withHope = result.result === 'hope'
  const accent = isCritical ? DAGGERHEART.critical : withHope ? DAGGERHEART.hope : DAGGERHEART.fear

  // The total is the number the table is waiting for, so every headline
  // leads with it — "19 with Hope", not "Rolled with Hope" with the 19 buried
  // in the facts below. No "Rolled": the glyph and the container already say
  // this is a roll, and the number reads faster without a verb in front of it.
  const headline = ((): string => {
    // A critical succeeds regardless of Difficulty, so it never shows a DC
    // comparison — "Critical Success!  ·  6 vs DC 14" would read as a failure.
    if (isCritical) return `${GLYPH.critical} Critical Success!  ·  ${result.total}`
    const duality = withHope ? 'with Hope' : 'with Fear'
    if (difficulty === null) {
      return `${withHope ? GLYPH.success : GLYPH.mixed} ${result.total} ${duality}`
    }
    const succeeded = result.total >= difficulty
    const glyph = succeeded ? GLYPH.success : GLYPH.failure
    return `${glyph} ${succeeded ? 'Success' : 'Failure'} ${duality}  ·  ${result.total} vs DC ${difficulty}`
  })()

  const consequence = ((): string => {
    if (isCritical) {
      return 'Matching Duality Dice. You succeed, you gain a Hope, and you clear a Stress.'
    }
    if (withHope) return 'You gain a Hope.'
    return 'The GM gains a Fear.'
  })()

  // `details.hope.amplified` / `details.fear.amplified` come from the engine
  // rather than being re-derived from the raw option flags.
  const hopeSides = result.details.hope.amplified ? 'd20' : 'd12'
  const fearSides = result.details.fear.amplified ? 'd20' : 'd12'

  // The dice themselves live in the body, as they do for every other command;
  // facts carry the modifiers and the total.
  const facts: ViewFact[] = []

  if (rollingWith && result.details.extraDie) {
    // A disadvantage die is SUBTRACTED by the engine, but the old embed printed
    // it unsigned — "Disadvantage Die (d6): 4" beside a total it had reduced.
    const extra =
      rollingWith === 'Advantage'
        ? result.details.extraDie.advantageRoll
        : -result.details.extraDie.disadvantageRoll
    facts.push({ label: `${rollingWith} (d6)`, value: formatSignedModifier(extra) })
  }

  if (modifier !== 0) facts.push({ label: 'Modifier', value: formatSignedModifier(modifier) })
  facts.push({ label: 'Total', value: String(result.total) })

  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('dh', {
    modifier,
    difficulty,
    rolling_with: rollingWith,
    amplify_hope: amplifyHope,
    amplify_fear: amplifyFear,
    hidden
  })

  return [
    rollContainer({
      accent,
      headline,
      consequence,
      facts,
      body: [
        `**Hope ${hopeSides}**  ${result.details.hope.roll}   **Fear ${fearSides}**  ${result.details.fear.roll}`
      ],
      derivation: `${hopeSides} ${result.details.hope.roll} / ${fearSides} ${result.details.fear.roll} ${formatSignedModifier(modifier)} = ${result.total}`,
      ...(rerollId !== undefined ? { rerollId } : {})
    })
  ]
}

export const dhCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('dh')
    .setDescription('Roll dice for Daggerheart')
    .addIntegerOption(option =>
      option
        .setName('modifier')
        .setDescription('Modifier to add to the roll (-30 to 30)')
        .setRequired(false)
        .setMinValue(-30)
        .setMaxValue(30)
    )
    .addStringOption(option =>
      option
        .setName('rolling_with')
        .setDescription('Roll with advantage or disadvantage')
        .setRequired(false)
        .addChoices(
          { name: 'Advantage', value: 'Advantage' },
          { name: 'Disadvantage', value: 'Disadvantage' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('amplify_hope')
        .setDescription('Amplify Hope die (use d20 instead of d12)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('amplify_fear')
        .setDescription('Amplify Fear die (use d20 instead of d12)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('difficulty')
        .setDescription('Difficulty to beat — resolves the roll into success or failure')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50)
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: buildDhView
})
