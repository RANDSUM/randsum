import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/roller/roll'
import { notation as createNotation } from '@randsum/roller/validate'
import { suggestNotationFix } from '@randsum/roller'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, defaultErrorMessage } from './lib/index.js'
import type { ChatInputCommandInteraction } from '../utils/discord.js'
import type { Command } from '../types.js'

function buildRollEmbed(interaction: ChatInputCommandInteraction): EmbedBuilder {
  const notationString = interaction.options.getString('notation', true)
  const validNotation = createNotation(notationString)
  const result = roll(validNotation)

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`You rolled a ${result.total}`)
    .setDescription(`Rolling: ${notationString}`)
    .setFooter(embedFooterDetails)

  if (result.rolls.length > 0) {
    const rollRecord = result.rolls[0]
    if (rollRecord) {
      const initialRolls = rollRecord.initialRolls
      if (initialRolls.length > 0) {
        embed.addFields({
          name: 'Initial Rolls',
          value: initialRolls.join(', '),
          inline: true
        })
      }
      const modifiedRolls = rollRecord.rolls
      if (
        modifiedRolls.length > 0 &&
        JSON.stringify(modifiedRolls) !== JSON.stringify(initialRolls)
      ) {
        embed.addFields({
          name: 'Modified Rolls',
          value: modifiedRolls.join(', '),
          inline: true
        })
      }
    }
  }

  return embed
}

function describeRollError(error: unknown, interaction: ChatInputCommandInteraction): string {
  const notationString = interaction.options.getString('notation', true)
  const baseMessage = defaultErrorMessage(error)
  const suggestion = suggestNotationFix(notationString)
  return suggestion ? `${baseMessage}\n\nDid you mean \`${suggestion}\`?` : baseMessage
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
  buildEmbed: buildRollEmbed,
  describeError: describeRollError
})
