import { roll } from '@randsum/games/fifth'
import { SlashCommandBuilder } from '../utils/builders.js'
import { FIFTH, GLYPH } from '../utils/palette.js'
import {
  createGameCommand,
  encodeReroll,
  formatSignedModifier,
  getInitialRolls,
  getKeptRolls,
  markKeptRolls,
  rollContainer
} from './lib/index.js'
import type { CommandContext, ViewFact } from './lib/index.js'
import type { Command, RollView } from '../types.js'

function buildFifthView(context: CommandContext): RollView {
  const modifier = context.options.getInteger('modifier') ?? 0
  const dc = context.options.getInteger('dc')
  const rollingWith = context.options.getString('rolling_with') as
    | 'Advantage'
    | 'Disadvantage'
    | null

  const result = roll({
    modifier,
    crit: true,
    ...(rollingWith ? { rollingWith } : {})
  })

  const initialRolls = getInitialRolls(result)
  const keptRolls = getKeptRolls(result)
  const criticals = result.details.criticals
  const isNat20 = criticals?.isNatural20 === true
  const isNat1 = criticals?.isNatural1 === true

  // 5e is the one game where the raw total genuinely is the headline — bounded
  // accuracy means the whole resolution is "compare this number to a DC or AC".
  // So the number leads, and the system name (which the player just typed) does
  // not appear at all.
  // A natural and a DC verdict are independent axes, and a d20 can roll a 1 on
  // a +30 modifier that still clears a DC 10. Rendering the fumble glyph and
  // the fumble accent over the word "Success" said the opposite of the line
  // below it — the same two-axis mistake as labelling a kept-lowest die
  // "Highest Roll". When a DC is supplied it decides both; the natural is still
  // announced in words, because it changes what the roll means at the table.
  const passed = dc !== null ? result.total >= dc : null
  const accent =
    passed === true
      ? FIFTH.natural20
      : passed === false
        ? FIFTH.natural1
        : isNat20
          ? FIFTH.natural20
          : isNat1
            ? FIFTH.natural1
            : FIFTH.standard

  const naturalGlyph = isNat20 ? GLYPH.critical : isNat1 ? GLYPH.fumble : null
  const verdictGlyph = passed === true ? GLYPH.success : passed === false ? GLYPH.failure : null
  const glyph = verdictGlyph ?? naturalGlyph

  const marker = isNat20 ? 'Natural 20' : isNat1 ? 'Natural 1' : null

  // The glyph binds to the marker it qualifies — `✸ Natural 20` — and the
  // separator only ever divides that prefix from the total.
  const prefix = [glyph, marker].filter(part => part !== null).join(' ')
  const headline = prefix.length > 0 ? `${prefix}  ·  ${result.total}` : String(result.total)

  // A natural 20 is an automatic hit on ATTACK ROLLS under the 2014 rules — not
  // on ability checks or saving throws. The 2024 rules changed that. This
  // wording is true under both, where a bare "automatic success" would not be.
  const critLine = isNat20
    ? 'Critical hit on an attack roll.'
    : isNat1
      ? 'Critical miss on an attack roll.'
      : null

  const dcLine = dc !== null ? `${result.total >= dc ? 'Success' : 'Failure'} vs DC ${dc}` : null

  const consequence = [dcLine, critLine].filter(line => line !== null).join(' — ')

  const facts: ViewFact[] = []
  if (modifier !== 0) facts.push({ label: 'Modifier', value: formatSignedModifier(modifier) })
  facts.push({ label: 'Total', value: String(result.total) })

  const dropped = initialRolls.length > keptRolls.length
  const dice = dropped ? markKeptRolls(initialRolls, keptRolls) : initialRolls.join(', ')
  const label = rollingWith !== null ? `2d20, ${rollingWith}` : '1d20'

  const hidden = context.options.getBoolean('hidden') ?? false
  const rerollId = encodeReroll('fifth', { modifier, dc, rolling_with: rollingWith, hidden })

  return [
    rollContainer({
      accent,
      headline,
      ...(consequence.length > 0 ? { consequence } : {}),
      facts,
      body: [`**${label}**  ${dice}`],
      derivation: `${label} ${formatSignedModifier(modifier)} = ${result.total}`,
      ...(rerollId !== undefined ? { rerollId } : {})
    })
  ]
}

export const fifthCommand: Command = createGameCommand({
  data: new SlashCommandBuilder()
    .setName('fifth')
    .setDescription('Roll dice for D&D 5th Edition (1d20 + modifier)')
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
    .addIntegerOption(option =>
      option
        .setName('dc')
        .setDescription('Difficulty Class to beat — shows success or failure')
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
  buildView: buildFifthView
})
