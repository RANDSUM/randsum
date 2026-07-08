import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/fifth'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, formatSignedModifier, getInitialRolls } from './lib/index.js'
import type { ChatInputCommandInteraction } from '../utils/discord.js'
import type { Command } from '../types.js'

/**
 * Renders each initial d20 with the kept die(s) bold and the dropped die(s)
 * struck through. Kept values are matched against the roller's post-modifier
 * `rolls` (the dice it actually kept) and consumed one-by-one, so a tie — where
 * both d20s show the same face — still renders exactly one bold and one struck
 * die rather than bolding both.
 */
function markKeptRolls(initialRolls: readonly number[], keptRolls: readonly number[]): string {
  const remaining = [...keptRolls]
  return initialRolls
    .map(r => {
      const idx = remaining.indexOf(r)
      if (idx !== -1) {
        remaining.splice(idx, 1)
        return `**${r}**`
      }
      return `~~${r}~~`
    })
    .join(', ')
}

function buildFifthEmbed(interaction: ChatInputCommandInteraction): EmbedBuilder {
  const modifier = interaction.options.getInteger('modifier') ?? 0
  const rollingWith = interaction.options.getString('rolling_with') as
    | 'Advantage'
    | 'Disadvantage'
    | null

  const result = roll({
    modifier,
    crit: true,
    ...(rollingWith ? { rollingWith } : {})
  })

  const initialRolls = getInitialRolls(result)
  const keptRolls = result.rolls[0]?.rolls ?? []
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
