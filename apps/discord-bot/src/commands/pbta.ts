import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { roll } from '@randsum/games/pbta'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

export const pbtaCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pbta')
    .setDescription('Roll dice for Powered by the Apocalypse games')
    .addIntegerOption(option =>
      option
        .setName('stat')
        .setDescription('Your stat modifier (-3 to 5)')
        .setRequired(true)
        .setMinValue(-3)
        .setMaxValue(5)
    )
    .addIntegerOption(option =>
      option.setName('forward').setDescription('One-time forward bonus').setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('ongoing').setDescription('Persistent ongoing bonus').setRequired(false)
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
    const stat = interaction.options.getInteger('stat', true)
    const forward = interaction.options.getInteger('forward') ?? 0
    const ongoing = interaction.options.getInteger('ongoing') ?? 0
    const rollingWith = interaction.options.getString('rolling_with') as
      | 'Advantage'
      | 'Disadvantage'
      | null

    await interaction.deferReply()

    try {
      const result = roll({
        stat,
        ...(forward !== 0 ? { forward } : {}),
        ...(ongoing !== 0 ? { ongoing } : {}),
        ...(rollingWith === 'Advantage' ? { advantage: true } : {}),
        ...(rollingWith === 'Disadvantage' ? { disadvantage: true } : {})
      })

      const initialRolls = result.rolls[0]?.initialRolls ?? []

      const resultConfig = {
        strong_hit: {
          color: 0xffd700, // Gold
          resultTitle: 'Strong Hit!'
        },
        weak_hit: {
          color: 0xffff00, // Yellow
          resultTitle: 'Weak Hit'
        },
        miss: {
          color: 0xff0000, // Red
          resultTitle: 'Miss'
        }
      } as const

      const { color, resultTitle } = resultConfig[result.result]

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(resultTitle)
        .setDescription(`Total: ${result.total}`)
        .setFooter(embedFooterDetails)

      embed.addFields({
        name: 'Dice Rolled',
        value: initialRolls.join(', ') || 'None',
        inline: true
      })

      embed.addFields({
        name: 'Stat',
        value: stat >= 0 ? `+${stat}` : String(stat),
        inline: true
      })

      embed.addFields({
        name: 'Total',
        value: String(result.total),
        inline: true
      })

      if (forward !== 0) {
        embed.addFields({
          name: 'Forward',
          value: forward > 0 ? `+${forward}` : String(forward),
          inline: true
        })
      }

      if (ongoing !== 0) {
        embed.addFields({
          name: 'Ongoing',
          value: ongoing > 0 ? `+${ongoing}` : String(ongoing),
          inline: true
        })
      }

      if (rollingWith) {
        embed.addFields({
          name: 'Rolling With',
          value: rollingWith,
          inline: true
        })
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
