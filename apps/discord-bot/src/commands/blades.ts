import { roll } from '@randsum/games/blades'
import { SlashCommandBuilder } from '../utils/builders.js'
import { BLADES, GLYPH } from '../utils/palette.js'
import {
  createGameCommand,
  encodeReroll,
  getInitialRolls,
  getKeptRolls,
  markKeptRolls,
  rollContainer
} from './lib/index.js'
import type { CommandContext } from './lib/index.js'
import type { Command, RollView } from '../types.js'

/**
 * Outcome copy in Blades' own register.
 *
 * The old strings were generic — "Success!", "You succeed at your goal" — where
 * the book is blunt and specific. A 6 is "you do it"; a 4-5 is "you do it, but";
 * a 1-3 is "things go badly".
 */
const OUTCOMES = {
  critical: {
    accent: BLADES.critical,
    headline: `${GLYPH.critical} Critical`,
    consequence: 'You do it, and you get increased effect.'
  },
  success: {
    accent: BLADES.success,
    headline: `${GLYPH.success} Full Success`,
    consequence: 'You do it.'
  },
  partial: {
    accent: BLADES.partial,
    headline: `${GLYPH.mixed} Partial Success`,
    consequence: "You do it, but there's a consequence."
  },
  failure: {
    accent: BLADES.failure,
    headline: `${GLYPH.failure} Bad Outcome`,
    consequence: 'Things go badly. The GM says how it gets worse.'
  }
} as const

function buildBladesView(context: CommandContext): RollView {
  const dice = context.options.getInteger('dice', true)
  const result = roll({ rating: dice })

  const initialRolls = getInitialRolls(result)
  const keptRolls = getKeptRolls(result)
  const decidingDie = keptRolls[0] ?? result.total
  const outcome = OUTCOMES[result.result]

  // At rating 0 the roller keeps the *lowest* of two dice. "Deciding Die" is
  // correct in both branches, where "Highest Roll" was wrong in one of them.
  const pool =
    dice === 0 ? '0 dice — roll two, take the worst' : `${dice} ${dice === 1 ? 'die' : 'dice'}`

  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('blades', { dice, hidden })

  return [
    rollContainer({
      accent: outcome.accent,
      headline: outcome.headline,
      consequence: outcome.consequence,
      facts: [
        { label: 'Pool', value: pool },
        { label: 'Deciding Die', value: String(decidingDie) }
      ],
      body: [markKeptRolls(initialRolls, keptRolls)],
      derivation: `${initialRolls.length}d6 → ${decidingDie}`,
      ...(rerollId !== undefined ? { rerollId } : {})
    })
  ]
}

export const bladesCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('blades')
    .setDescription('Roll dice for Blades in the Dark')
    .addIntegerOption(option =>
      option
        .setName('dice')
        .setDescription('Dice pool size (0 = roll two, take the worst)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10)
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: buildBladesView
})
