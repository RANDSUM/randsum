import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandResult, createCommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants'

export const config = createCommandConfig({
  description: 'Learn more about RANDSUM'
})

const fields = [
  {
    name: '/notation',
    value:
      'See the documentation for [Dice Notation](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md)',
    inline: true
  },
  {
    name: '/roll <notation>',
    value:
      'Pass in dice notation or use some of our built-in game commands. - i.e., 2d6 + 3 - to generate a roll result.',
    inline: true
  },
  {
    name: '/blades <dice>',
    value:
      "Make a roll in the Forged in the Dark system. Pass in the # of d6 to roll as <dice>, and we'll show you the results. If rolling zero, pass in zero!",
    inline: true
  },
  {
    name: '/root <modifier>',
    value: 'Make a roll in the Root RPG system. Roll 2d6 and add the <modifier> value.',
    inline: true
  },
  {
    name: '/su <table name>',
    value: 'Make a roll in the Salvage Union RPG system. Roll 1d20 and compare it to the provided <table>.',
    inline: true
  },
  {
    name: '/dh <modifier>',
    value: 'Make a roll in the Daggerheart RPG system. Roll 1d12 and add the <modifier> value.',
    inline: true
  }
]

const getInfoEmbed = new EmbedBuilder()
  .setTitle('RANDSUM.io')
  .setDescription(
    [
      "[**RANDSUM.io**](https://www.randsum.io) is the internet's premier randum number service. Generate your own rolls with our [Dice Notation](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md) or use some of our built-in game commands.",
      "You'll get the rolls you want - not always the results you need.",
      'Here are the available commands:'
    ].join('\n\n')
  )
  .setFields(fields)
  .setFooter(embedFooterDetails)
  .toJSON()

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
  await interaction.reply({ embeds: [getInfoEmbed] })
}
