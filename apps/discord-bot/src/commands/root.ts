import { roll } from '@randsum/games/root-rpg'
import { SlashCommandBuilder } from '../utils/builders.js'
import { GLYPH, ROOT } from '../utils/palette.js'
import {
  createGameCommand,
  formatSignedModifier,
  getInitialRolls,
  getKeptRolls,
  markKeptRolls,
  rollContainer
} from './lib/index.js'
import type { CommandContext, ViewFact } from './lib/index.js'
import type { Command, RollView } from '../types.js'

const OUTCOMES = {
  strong_hit: {
    accent: ROOT.strongHit,
    headline: `${GLYPH.success} 10+  ·  Strong Hit`,
    consequence: 'You pull it off cleanly.'
  },
  weak_hit: {
    accent: ROOT.weakHit,
    headline: `${GLYPH.mixed} 7-9  ·  Weak Hit`,
    consequence: 'You do it, but it costs you something.'
  },
  miss: {
    accent: ROOT.miss,
    headline: `${GLYPH.failure} 6-  ·  Miss`,
    consequence: 'The GM says how the Woodland pushes back.'
  }
} as const

/**
 * Root's stats have names, and a player reads their sheet by name rather than
 * by integer. Naming the stat is what lets the roll read back as the thing they
 * actually said out loud: "Cunning, strong hit".
 */
const STATS = ['Charm', 'Cunning', 'Finesse', 'Luck', 'Might'] as const

function buildRootView(context: CommandContext): RollView {
  const bonus = context.options.getInteger('modifier') ?? 0
  const stat = context.options.getString('stat')
  const rollingWith = context.options.getString('rolling_with') as
    | 'Advantage'
    | 'Disadvantage'
    | null

  const result = roll({ bonus, ...(rollingWith ? { rollingWith } : {}) })

  const initialRolls = getInitialRolls(result)
  const keptRolls = getKeptRolls(result)
  const outcome = OUTCOMES[result.result]

  const facts: ViewFact[] = []
  if (stat !== null) facts.push({ label: stat, value: formatSignedModifier(bonus) })
  else if (bonus !== 0) facts.push({ label: 'Modifier', value: formatSignedModifier(bonus) })
  facts.push({ label: 'Total', value: String(result.total) })

  const dropped = initialRolls.length > keptRolls.length
  const dice = dropped ? markKeptRolls(initialRolls, keptRolls) : initialRolls.join(', ')

  // The invoking user is NOT named here. Discord already renders
  // "<username> used /root" directly above every response, so the old
  // "Alex rolled a Weak Hit" title repeated it — and made this the one command
  // whose title shape differed from its nine siblings.
  return [
    rollContainer({
      accent: outcome.accent,
      headline: stat !== null ? `${outcome.headline}  ·  ${stat}` : outcome.headline,
      consequence: outcome.consequence,
      facts,
      body: [dropped ? `**3d6, keep 2**  ${dice}` : `**2d6**  ${dice}`],
      derivation: `2d6 ${formatSignedModifier(bonus)} = ${result.total}`,
      rerollId: `r:root:${bonus}:${stat ?? ''}:${rollingWith ?? ''}`
    })
  ]
}

export const rootCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('root')
    .setDescription('Roll dice for Root RPG')
    .addIntegerOption(option =>
      option
        .setName('modifier')
        .setDescription('Stat bonus for this move (-3 to 5)')
        .setRequired(false)
        .setMinValue(-3)
        .setMaxValue(5)
    )
    .addStringOption(option =>
      option
        .setName('stat')
        .setDescription('Which stat this move uses')
        .setRequired(false)
        .addChoices(...STATS.map(name => ({ name, value: name })))
    )
    .addStringOption(option =>
      option
        .setName('rolling_with')
        .setDescription('Roll 3d6 and keep the best or worst two')
        .setRequired(false)
        .addChoices(
          { name: 'Best 2 of 3', value: 'Advantage' },
          { name: 'Worst 2 of 3', value: 'Disadvantage' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildView: buildRootView
})
