import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { embedFooterDetails } from '../utils/constants.js'
import type { Command } from '../types.js'

const notationReference = [
  {
    label: 'Drop Highest',
    notation: 'H',
    description: 'Drops the highest die from the pool',
    example: '4d6H',
    exampleExplanation: 'Roll 4d6, drop the highest die'
  },
  {
    label: 'Drop Lowest',
    notation: 'L',
    description: 'Drops the lowest die from the pool',
    example: '4d6L',
    exampleExplanation: 'Roll 4d6, drop the lowest die'
  },
  {
    label: 'Cap',
    notation: 'C',
    description: 'Caps all dice at a maximum value',
    example: '3d10C5',
    exampleExplanation: 'Roll 3d10, cap each die at 5'
  },
  {
    label: 'Reroll',
    notation: 'R',
    description: 'Rerolls dice that match the specified value',
    example: '2d20R1',
    exampleExplanation: 'Roll 2d20, reroll any 1s once'
  },
  {
    label: 'Replace',
    notation: 'r',
    description: 'Replaces dice that match the first value with the second value',
    example: '3d6r1:6',
    exampleExplanation: 'Roll 3d6, replace any 1s with 6s'
  },
  {
    label: 'Unique',
    notation: 'U',
    description: 'Forces all dice to be unique values',
    example: '5d6U',
    exampleExplanation: 'Roll 5d6, reroll duplicates to ensure uniqueness'
  },
  {
    label: 'Exploding',
    notation: '!',
    description: 'Rerolls and adds when maximum value is rolled',
    example: '3d6!',
    exampleExplanation: 'Roll 3d6, reroll and add any 6s'
  },
  {
    label: 'Addition',
    notation: '+',
    description: 'Adds a modifier to the total',
    example: '2d6+3',
    exampleExplanation: 'Roll 2d6 and add 3 to the total'
  },
  {
    label: 'Subtraction',
    notation: '-',
    description: 'Subtracts a modifier from the total',
    example: '1d20-2',
    exampleExplanation: 'Roll 1d20 and subtract 2 from the total'
  },
  {
    label: 'Multiplication',
    notation: '*',
    description: 'Multiplies the total by a value',
    example: '1d6*10',
    exampleExplanation: 'Roll 1d6 and multiply the result by 10'
  }
]

export const notationCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('notation')
    .setDescription('Randsum Dice Notation Reference'),

  async execute(interaction) {
    await interaction.deferReply()

    const fields = notationReference.map(notation => ({
      name: `${notation.label} (${notation.notation})`,
      value: `${notation.description}\n**Example:** \`${notation.example}\` - ${notation.exampleExplanation}`,
      inline: false
    }))

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('RANDSUM.io')
      .setURL('https://github.com/RANDSUM/randsum/blob/main/packages/roller/GUIDE.md')
      .setDescription('Dice Notation Reference Guide')
      .addFields(fields)
      .setFooter(embedFooterDetails)

    await interaction.editReply({ embeds: [embed] })
  }
}
