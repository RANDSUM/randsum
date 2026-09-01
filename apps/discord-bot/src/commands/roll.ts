import { EmbedBuilder, SlashCommandBuilder } from '../utils/builders.js'
import { roll } from '@randsum/roller/roll'
import { notation as createNotation } from '@randsum/roller/validate'
import { embedFooterDetails } from '../utils/constants.js'
import { createGameCommand, markKeptRolls } from './lib/index.js'
import type { CommandContext } from './lib/index.js'
import type { Command } from '../types.js'

/**
 * Renders one pool's dice, marking dropped dice when the roller modified them.
 *
 * `markKeptRolls` already renders an unmodified pool correctly — every die
 * matches, so every die comes back bold — but bolding a pool where nothing was
 * dropped is noise, so the plain join is used when the two lists agree.
 */
function renderPool(initialRolls: readonly number[], keptRolls: readonly number[]): string {
  const unchanged =
    initialRolls.length === keptRolls.length &&
    initialRolls.every((value, index) => value === keptRolls[index])

  return unchanged ? initialRolls.join(', ') : markKeptRolls(initialRolls, keptRolls)
}

function buildRollEmbed(context: CommandContext): EmbedBuilder {
  const notationString = context.options.getString('notation', true)
  const validNotation = createNotation(notationString)
  const result = roll(validNotation)

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle(`You rolled a ${result.total}`)
    .setDescription(`Rolling: ${notationString}`)
    .setFooter(embedFooterDetails)

  // Every pool, not just `rolls[0]`. A multi-pool roll (`2d6 1d8`) or a repeat
  // (`4d6Lx6`) produces one record per pool, and the title already reports the
  // combined total — rendering only the first left the rest invisible.
  for (const [index, record] of result.rolls.entries()) {
    const value = renderPool(record.initialRolls, record.rolls)
    if (value.length === 0) continue

    embed.addFields({
      name: result.rolls.length > 1 ? `${record.notation} (${record.total})` : 'Rolls',
      value,
      inline: true
    })

    // Discord caps an embed at 25 fields; a large repeat would otherwise throw.
    if (index >= 23) {
      embed.addFields({
        name: '…',
        value: `${result.rolls.length - index - 1} more pools not shown`,
        inline: true
      })
      break
    }
  }

  return embed
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
  buildEmbed: buildRollEmbed
})
