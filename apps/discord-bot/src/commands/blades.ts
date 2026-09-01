import { EmbedBuilder, SlashCommandBuilder } from '../utils/builders.js'
import { roll } from '@randsum/games/blades'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, getInitialRolls, getKeptRolls, markKeptRolls } from './lib/index.js'
import type { CommandContext } from './lib/index.js'
import type { Command } from '../types.js'

function buildBladesEmbed(context: CommandContext): EmbedBuilder {
  const dice = context.options.getInteger('dice', true)
  const result = roll({ rating: dice })

  const initialRolls = getInitialRolls(result)
  // The die the engine kept, not a locally recomputed maximum. At rating 0 the
  // roller keeps the *lowest* of two dice, so `Math.max` named — and bolded —
  // the die that was thrown away, directly contradicting the outcome title.
  const keptRolls = getKeptRolls(result)
  const decidingDie = keptRolls[0] ?? result.total

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
    name: 'Deciding Die',
    value: String(decidingDie),
    inline: true
  })

  const rollsText = markKeptRolls(initialRolls, keptRolls)

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
