import { inputs, roll } from '@randsum/games/pbta'
import { SlashCommandBuilder } from '../utils/builders.js'
import { GLYPH, PBTA } from '../utils/palette.js'
import {
  encodeReroll,
  formatSignedModifier,
  getInitialRolls,
  getKeptRolls,
  markKeptRolls,
  rollContainer,
  specRange,
  withSpecChoices,
  withSpecRange
} from './lib/index.js'
import type { CommandContext, ViewFact } from './lib/index.js'
import type { Command, RollView } from '../types.js'

/** Spec values stay `Advantage`/`Disadvantage`; Discord shows what they do. */
const ROLLING_WITH_LABELS = { Advantage: 'Best 2 of 3', Disadvantage: 'Worst 2 of 3' } as const

/**
 * The band leads, its name follows.
 *
 * PbtA is a family, not a game: Apocalypse World says "10+", Dungeon World says
 * "strong hit", Masks says something else again. The numeric band is the part
 * that travels to every table running any of them.
 */
const OUTCOMES = {
  strong_hit: {
    accent: PBTA.strongHit,
    headline: `${GLYPH.success} 10+  ·  Strong Hit`,
    consequence: "You do it. Take the move's full effect."
  },
  weak_hit: {
    accent: PBTA.weakHit,
    headline: `${GLYPH.mixed} 7-9  ·  Weak Hit`,
    consequence: 'You do it, but the MC picks a complication or a cost.'
  },
  miss: {
    accent: PBTA.miss,
    headline: `${GLYPH.failure} 6-  ·  Miss`,
    consequence: 'The MC makes a move. In most PbtA games, mark experience.'
  }
} as const

function buildPbtaView(context: CommandContext): RollView {
  const stat = context.options.getInteger('stat', true)
  const forward = context.options.getInteger('forward') ?? 0
  const ongoing = context.options.getInteger('ongoing') ?? 0
  const rollingWith = context.options.getString('rolling_with') as
    | 'Advantage'
    | 'Disadvantage'
    | null

  const result = roll({
    stat,
    ...(forward !== 0 ? { forward } : {}),
    ...(ongoing !== 0 ? { ongoing } : {}),
    ...(rollingWith ? { rollingWith } : {})
  })

  const initialRolls = getInitialRolls(result)
  const keptRolls = getKeptRolls(result)
  const outcome = OUTCOMES[result.result]

  const facts: ViewFact[] = [{ label: 'Stat', value: formatSignedModifier(stat) }]
  if (forward !== 0) facts.push({ label: 'Forward', value: formatSignedModifier(forward) })
  if (ongoing !== 0) facts.push({ label: 'Ongoing', value: formatSignedModifier(ongoing) })
  // `details.diceTotal` is the dice-only subtotal the engine computes and the
  // embed renderer never showed — exactly the number a PbtA player wants beside
  // their modifiers.
  facts.push({ label: 'Dice', value: String(result.details.diceTotal) })
  facts.push({ label: 'Total', value: String(result.total) })

  const dropped = initialRolls.length > keptRolls.length
  const dice = dropped ? markKeptRolls(initialRolls, keptRolls) : initialRolls.join(', ')

  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('pbta', {
    stat,
    forward,
    ongoing,
    rolling_with: rollingWith,
    hidden
  })

  return [
    rollContainer({
      accent: outcome.accent,
      headline: outcome.headline,
      consequence: outcome.consequence,
      facts,
      body: [
        // Naming the mechanic in the label is what makes the strikethrough
        // self-explaining rather than something to decode.
        dropped
          ? `**3d6, keep ${rollingWith === 'Disadvantage' ? 'worst' : 'best'} 2**  ${dice}`
          : `**2d6**  ${dice}`
      ],
      derivation: `${result.details.diceTotal} ${formatSignedModifier(result.total - result.details.diceTotal)} = ${result.total}`,
      ...(rerollId !== undefined ? { rerollId } : {})
    })
  ]
}

export const pbtaCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pbta')
    .setDescription('Roll dice for Powered by the Apocalypse games')
    .addIntegerOption(option =>
      withSpecRange(option, inputs.stat)
        .setName('stat')
        .setDescription(`The stat modifier for this move (${specRange(inputs.stat)})`)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      withSpecRange(option, inputs.forward)
        .setName('forward')
        .setDescription(`Bonus taken forward (${specRange(inputs.forward)})`)
        .setRequired(false)
    )
    .addIntegerOption(option =>
      withSpecRange(option, inputs.ongoing)
        .setName('ongoing')
        .setDescription(`Ongoing bonus (${specRange(inputs.ongoing)})`)
        .setRequired(false)
    )
    .addStringOption(option =>
      withSpecChoices(option, inputs.rollingWith, ROLLING_WITH_LABELS)
        .setName('rolling_with')
        .setDescription('Roll 3d6 and keep the best or worst two')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: buildPbtaView
}
