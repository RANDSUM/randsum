import { roll, validateNotation } from '@randsum/roller'
import type { APIEmbed, ChatInputCommandInteraction } from 'discord.js'
import { EmbedBuilder } from 'discord.js'
import type { CommandConfig, CommandOptions, CommandResult } from 'robo.js'
import { createCommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants'

export const config: CommandConfig = createCommandConfig({
  description: 'Test your luck with a roll of the dice',
  options: [
    {
      name: 'notation',
      description: 'A roll using dice notation - e.g. 2d6+3',
      type: 'string',
      required: true
    }
  ]
})

const buildEmbed = (notationArg: string): APIEmbed => {
  const validation = validateNotation(notationArg)

  if (!validation.valid) {
    return new EmbedBuilder()
      .setTitle('Error')
      .setDescription(`"**${notationArg}**" is not valid dice notation.`)
      .addFields({
        name: 'Learn More',
        value:
          'See the [Dice Notation Guide](https://github.com/RANDSUM/randsum/blob/main/RANDSUM_DICE_NOTATION.md) for more information.'
      })
      .setFooter(embedFooterDetails)
      .toJSON()
  }

  const result = roll(...validation.options)

  const total = `**${String(result.total)}**`

  const rawResults = JSON.stringify(result.rolls[0]?.modifierHistory.initialRolls)
  const results = JSON.stringify(result.rolls[0]?.modifierHistory.modifiedRolls)

  const simpleField = [{ name: 'Rolls', value: results, inline: true }]
  const complexField = [
    { name: 'Rolls (before modifiers)', value: rawResults, inline: true },
    {
      name: 'Rolls (after modifiers)',
      value: results,
      inline: true
    }
  ]
  const rollFields = rawResults === results ? simpleField : complexField

  const fields = [
    { name: 'Value', value: total },
    ...rollFields,
    { name: 'Notation', value: notationArg }
  ]
  const firstRoll = result.rolls[0]
  return new EmbedBuilder()
    .setTitle(`You rolled a ${total}`)
    .setDescription(firstRoll?.parameters.description.join(', ') ?? null)
    .setFields(fields)
    .setFooter(embedFooterDetails)
    .toJSON()
}

export default async (
  interaction: ChatInputCommandInteraction,
  { notation }: CommandOptions<typeof config>
): Promise<CommandResult> => {
  await interaction.deferReply()
  if (!notation || typeof notation !== 'string') {
    throw new Error('Notation is required and must be a string')
  }
  await interaction.editReply({ embeds: [buildEmbed(notation)] })
}
