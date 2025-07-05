import { roll, validateNotation } from '@randsum/roller'
import { APIEmbed, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandOptions, CommandResult, createCommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants'

export const config = createCommandConfig({
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
  const { valid, description, digested } = validateNotation(notationArg)

  if (!valid) {
    return new EmbedBuilder()
      .setTitle('Error')
      .setDescription(`"**${notationArg}**" is not valid dice notation.`)
      .addFields(description.map((d) => ({ name: '', value: d, inline: true })))
      .addFields({
        name: 'Learn More',
        value:
          'See the [Dice Notation Guide](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md) for more information.'
      })
      .setFooter(embedFooterDetails)
      .toJSON()
  }

  const result = roll(digested)

  const total = `**${String(result.total)}**`
  const dicePoolDescriptions = result.rolls[0].parameters.description

  const rawResults = JSON.stringify(result.rawResults)
  const results = JSON.stringify(result.rolls.map((roll) => roll.modifiedRolls.rolls).flat())

  const noChanges = rawResults === results

  const rollFields = noChanges
    ? [{ name: 'Rolls', value: results, inline: true }]
    : [
      { name: 'Rolls (before modifiers)', value: rawResults, inline: true },
      {
        name: 'Rolls (after modifiers)',
        value: results,
        inline: true
      }
    ]
  const fields = [{ name: 'Value', value: total }, ...rollFields, { name: 'Notation', value: notationArg }]
  return new EmbedBuilder()
    .setTitle(`You rolled a ${total}`)
    .setDescription(dicePoolDescriptions.join(', '))
    .setFields(fields)
    .setFooter(embedFooterDetails)
    .toJSON()
}

export default async (interaction: ChatInputCommandInteraction, { notation }: CommandOptions<typeof config>): Promise<CommandResult> => {
  await interaction.reply({ embeds: [buildEmbed(String(notation))] })
}
