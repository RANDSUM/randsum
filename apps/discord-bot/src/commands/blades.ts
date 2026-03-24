import { ComponentType, EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/blades'
import { D6_IMAGES, embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import { createRollButton } from '../utils/rollButton.js'
import type { Command } from '../types.js'

function buildBladesEmbed(dice: number): EmbedBuilder {
  const result = roll({ rating: dice })

  const initialRolls = result.rolls[0]?.initialRolls ?? []
  const highestDie = initialRolls.length > 0 ? Math.max(...initialRolls) : 1

  const resultConfig = {
    critical: {
      color: 0xffd700,
      resultTitle: 'Critical Success!',
      resultDescription: 'Things go better than expected',
      thumbnail: D6_IMAGES.double6
    },
    success: {
      color: 0x00ff00,
      resultTitle: 'Success!',
      resultDescription: 'You succeed at your goal',
      thumbnail: D6_IMAGES[6]
    },
    partial: {
      color: 0xffff00,
      resultTitle: 'Partial Success',
      resultDescription: 'You succeed, but with a consequence',
      thumbnail: D6_IMAGES[highestDie as keyof typeof D6_IMAGES]
    },
    failure: {
      color: 0xff0000,
      resultTitle: 'Failure',
      resultDescription: "Things don't go your way",
      thumbnail: D6_IMAGES[highestDie as keyof typeof D6_IMAGES]
    }
  }

  const { color, resultTitle, resultDescription, thumbnail } = resultConfig[result.result]

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(resultTitle)
    .setDescription(resultDescription)
    .setThumbnail(thumbnail)
    .setFooter(embedFooterDetails)

  embed.addFields({
    name: 'Dice Pool',
    value: dice === 0 ? '0 dice (rolled 2, taking lowest)' : `${dice} dice`,
    inline: true
  })

  embed.addFields({
    name: 'Highest Roll',
    value: String(highestDie),
    inline: true
  })

  const rollsText = initialRolls.map(r => (r === highestDie ? `**${r}**` : `~~${r}~~`)).join(', ')

  embed.addFields({
    name: 'All Rolls',
    value: rollsText || 'None',
    inline: false
  })

  return embed
}

export const bladesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('blades')
    .setDescription('Roll dice for Blades in the Dark')
    .addIntegerOption(option =>
      option
        .setName('dice')
        .setDescription('Number of dice to roll (0-10)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const dice = interaction.options.getInteger('dice', true)

    await interaction.deferReply()

    try {
      const paramsStr = String(dice)
      const embed = buildBladesEmbed(dice)
      const row = createRollButton('blades', paramsStr)
      const response = await interaction.editReply({ embeds: [embed], components: [row] })

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.customId === `reroll:blades:${paramsStr}`,
        time: 300_000
      })

      collector.on('collect', i => {
        void (async () => {
          await i.deferUpdate()
          try {
            const reEmbed = buildBladesEmbed(dice)
            await i.editReply({
              embeds: [reEmbed],
              components: [createRollButton('blades', paramsStr)]
            })
          } catch {
            await i.editReply({ content: 'An error occurred while re-rolling.' })
          }
        })()
      })

      collector.on('end', () => {
        void (async () => {
          try {
            await interaction.editReply({
              components: [createRollButton('blades', paramsStr, true)]
            })
          } catch {
            // Message may have been deleted
          }
        })()
      })
    } catch (e) {
      await replyWithError(
        interaction,
        'Error',
        e instanceof Error ? e.message : 'An unknown error occurred'
      )
    }
  }
}
