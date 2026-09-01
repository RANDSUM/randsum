import { EmbedBuilder, SlashCommandBuilder } from '../utils/builders.js'
import { roll } from '@randsum/games/fifth'
import { embedFooterDetails } from '../utils/constants.js'
import {
  createGameCommand,
  formatSignedModifier,
  getInitialRolls,
  getKeptRolls,
  markKeptRolls
} from './lib/index.js'
import type { CommandContext } from './lib/index.js'
import type { Command } from '../types.js'

function buildFifthEmbed(context: CommandContext): EmbedBuilder {
  const modifier = context.options.getInteger('modifier') ?? 0
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

  const embedColor = isNat20 ? 0xffd700 : isNat1 ? 0xdc143c : 0x1e90ff
  const titlePrefix = isNat20 ? 'Natural 20! ' : isNat1 ? 'Natural 1! ' : ''

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`${titlePrefix}D&D 5e Roll: ${result.total}`)
    .setDescription(rollingWith ? `Rolled with ${rollingWith}` : 'Standard roll')
    .setFooter(embedFooterDetails)

  const rollsText =
    rollingWith && initialRolls.length > 1
      ? markKeptRolls(initialRolls, keptRolls)
      : initialRolls.join(', ')

  embed.addFields({
    name: rollingWith ? 'Dice Rolled (2d20)' : 'Die Rolled (1d20)',
    value: rollsText || 'None',
    inline: true
  })

  if (modifier !== 0) {
    embed.addFields({
      name: 'Modifier',
      value: formatSignedModifier(modifier),
      inline: true
    })
  }

  embed.addFields({ name: 'Total', value: String(result.total), inline: true })

  return embed
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
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildEmbed: buildFifthEmbed
})
