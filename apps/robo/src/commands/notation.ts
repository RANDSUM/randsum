import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandResult, createCommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants'

export const config = createCommandConfig({
  description: 'Randsum Dice Notation Reference'
})

const notationReference = [
  {
    label: 'Drop Highest',
    notation: 'H',
    description: 'Drops the highest results from the pool.',
    example: '4d6H2',
    exampleDescription: 'Roll 4d6 and drop the highest two results.'
  },
  {
    label: 'Drop Lowest',
    notation: 'L',
    description: 'Drops the lowest results from the pool.',
    example: '4d6L3',
    exampleDescription: 'Roll 4d6 and drop the lowest three results.'
  },
  {
    label: 'Drop Specific',
    notation: 'D{N, <N, >N}',
    description: 'Drops rolls greater than, less than, or equal to the values of N.',
    example: '4d6D{<2, >5, 3}',
    exampleDescription: 'Roll 4d6 and drop any values lower than [2], greater than [5], or equal to [3].'
  },
  {
    label: 'Cap',
    notation: 'C{<N, >N}',
    description: 'Reduce all values above or below a certain value to that value',
    example: '4d6C{<2, >5}',
    exampleDescription: 'Roll 4d6 and cap any values lower than [2] to [2], and greater than [5] to [5].'
  },
  {
    label: 'Reroll',
    notation: 'R{N, <N, >N}F',
    description: 'Reroll resuls equal to, less than, or greater than the values of N (a maximum of F times).',
    example: '4d6R{<2, >5, 3}2',
    exampleDescription:
      'Roll 4d6 and reroll and results less than [2], greater than [5], or equal to [3], up to [2] times.'
  },
  {
    label: 'Replace',
    notation: 'V{N=R}',
    description: 'Replace rolls fitting the initial criteria with the second result',
    example: '4d6V{<2=6, >5=1}',
    exampleDescription:
      'Roll 4d6 and replace anything less than [2] with a [6], and anything greater than a [5] with a [1].'
  },
  {
    label: 'Unique',
    notation: 'U{N}',
    description: 'Enforce uniqueness of individual die rolls. Optionally can ignore values of [N].',
    example: '4d6U{3}',
    exampleDescription: 'Roll 4d6 and re-roll any duplicates (except for reuslts of [3])'
  },
  {
    label: 'Explode',
    notation: '!',
    description: 'Roll an additional die whenever you roll the max value of one of these dice.',
    example: '4d6!',
    exampleDescription: 'Roll 4d6 and Roll an additional die any time you roll a [6].'
  },
  {
    label: 'Plus',
    notation: '+',
    description: 'Adds a number to the end result',
    example: '4d6+2',
    exampleDescription: 'Roll 4d6 and add two to the overall total.'
  },
  {
    label: 'Minus',
    notation: '-',
    description: 'Subtracts a number from the end result',
    example: '4d6-2',
    exampleDescription: 'Roll 4d6 and subtract two from the overall total.'
  }
]

const fields = notationReference.map((ref) => ({
  name: `\n\n---\n\n**${ref.label}** - **${ref.notation}**`,
  value: `${ref.description}\n\n_Example:_ _${ref.example}_\n_${ref.exampleDescription}_\n\n`
}))

const baseEmbed = new EmbedBuilder()
  .setTitle('RANDSUM.io')
  .setDescription(
    [
      'For more information, check out the [Randsum Dice Notation](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md).'
    ].join('\n\n')
  )
  .addFields(fields)
  .setFooter(embedFooterDetails)
  .toJSON()

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
  await interaction.reply({ embeds: [baseEmbed] })
}
