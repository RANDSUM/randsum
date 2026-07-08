import { EmbedBuilder, SlashCommandBuilder } from '../utils/discord.js'
import { roll } from '@randsum/games/blades'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, getInitialRolls } from './lib/index.js'
import type { ChatInputCommandInteraction } from '../utils/discord.js'
import type { Command } from '../types.js'

function buildBladesEmbed(interaction: ChatInputCommandInteraction): EmbedBuilder {
  const dice = interaction.options.getInteger('dice', true)
  const result = roll({ rating: dice })

  const initialRolls = getInitialRolls(result)
  const highestDie = initialRolls.length > 0 ? Math.max(...initialRolls) : 1

  const resultConfig = {
    critical: {
      color: 0xffd700,
      resultTitle: 'Critical Success!',
      resultDescription: 'Things go better than expected'
    },
    success: {
      color: 0x00ff00,
      resultTitle: 'Success!',
      resultDescription: 'You succeed at your goal'
    },
    partial: {
      color: 0xffff00,
      resultTitle: 'Partial Success',
      resultDescription: 'You succeed, but with a consequence'
    },
    failure: {
      color: 0xff0000,
      resultTitle: 'Failure',
      resultDescription: "Things don't go your way"
    }
  }

  const { color, resultTitle, resultDescription } = resultConfig[result.result]

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(resultTitle)
    .setDescription(resultDescription)
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

export const bladesCommand: Command = createGameCommand({
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
    )
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),
  buildEmbed: buildBladesEmbed
})
