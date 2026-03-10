import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { notation as createNotation, roll } from '@randsum/roller'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

export const rollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Test your luck with a roll of the dice')
    .addStringOption(option =>
      option.setName('notation').setDescription('Dice notation (e.g., 2d6+3)').setRequired(true)
    ),

  async execute(interaction) {
    const notationString = interaction.options.getString('notation', true)
    await interaction.deferReply()

    try {
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

      await interaction.editReply({ embeds: [embed] })
    } catch (e) {
      await replyWithError(
        interaction,
        'Error',
        e instanceof Error ? e.message : 'An unknown error occurred'
      )
    }
  }
}
