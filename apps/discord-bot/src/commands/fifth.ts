import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { roll } from '@randsum/games/fifth'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

export const fifthCommand: Command = {
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
    ),

  async execute(interaction) {
    const modifier = interaction.options.getInteger('modifier') ?? 0
    const rollingWith = interaction.options.getString('rolling_with') as
      | 'Advantage'
      | 'Disadvantage'
      | null

    await interaction.deferReply()

    try {
      const result = roll({
        modifier,
        ...(rollingWith ? { rollingWith } : {})
      })

      const initialRolls = result.rolls[0]?.initialRolls ?? []

      const embed = new EmbedBuilder()
        .setColor(0x1e90ff) // D&D blue
        .setTitle(`D&D 5e Roll: ${result.total}`)
        .setDescription(rollingWith ? `Rolled with ${rollingWith}` : 'Standard roll')
        .setFooter(embedFooterDetails)

      // Show the d20 roll(s)
      const rollsText =
        rollingWith && initialRolls.length > 1
          ? initialRolls
              .map(r => {
                const kept =
                  rollingWith === 'Advantage'
                    ? r === Math.max(...initialRolls)
                    : r === Math.min(...initialRolls)
                return kept ? `**${r}**` : `~~${r}~~`
              })
              .join(', ')
          : initialRolls.join(', ')

      embed.addFields({
        name: rollingWith ? 'Dice Rolled (2d20)' : 'Die Rolled (1d20)',
        value: rollsText || 'None',
        inline: true
      })

      // Add modifier if present
      if (modifier !== 0) {
        embed.addFields({
          name: 'Modifier',
          value: modifier > 0 ? `+${modifier}` : String(modifier),
          inline: true
        })
      }

      // Add total
      embed.addFields({
        name: 'Total',
        value: String(result.total),
        inline: true
      })

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
