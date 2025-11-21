import type { APIEmbed, ChatInputCommandInteraction } from 'discord.js'
import { Colors, EmbedBuilder } from 'discord.js'
import type { CommandConfig, CommandOptions, CommandResult } from 'robo.js'
import { SALVAGE_UNION_TABLE_NAMES, rollTable } from '@randsum/salvageunion'
import type { SalvageUnionTableName } from '@randsum/salvageunion'

const suChoices = SALVAGE_UNION_TABLE_NAMES.map(table => ({
  name: table,
  value: table
}))

export const config: CommandConfig = {
  description: 'The Salvage Union is here to help you with your salvaging needs',
  options: [
    {
      name: 'table',
      description: 'What table are you rolling on?',
      type: 'string',
      choices: suChoices
    }
  ]
}

function getColor(type: number): number {
  switch (type) {
    case 20:
      return Colors.Green
    case 19:
    case 18:
    case 17:
    case 16:
    case 15:
    case 14:
    case 13:
    case 12:
    case 11:
      return Colors.DarkGreen
    case 10:
    case 9:
    case 8:
    case 7:
    case 6:
      return Colors.Yellow
    case 5:
    case 4:
    case 3:
    case 2:
      return Colors.Red
    case 1:
      return Colors.DarkRed
    default:
      return Colors.Greyple
  }
}

export function buildEmbed(table: SalvageUnionTableName): APIEmbed {
  const {
    result: { label, description, roll: total }
  } = rollTable(table)

  const embed = new EmbedBuilder()
    .setTitle(`${total} - ${label}`)
    .setColor(getColor(total))
    .addFields([
      { name: 'Table', value: table, inline: true },
      { name: 'Roll', value: String(total), inline: true }
    ])
    .setFooter({
      text: 'Rolled with 👹 by RANDSUM.dev • Join the union - SalvageUnion.io'
    })

  if (description !== '') {
    embed.setDescription(description)
  }

  return embed.toJSON()
}

export default async (
  interaction: ChatInputCommandInteraction,
  { table }: CommandOptions<typeof config>
): Promise<CommandResult> => {
  const tableName: SalvageUnionTableName = (table ?? 'Core Mechanic') as SalvageUnionTableName

  await interaction.deferReply()
  await interaction.editReply({ embeds: [buildEmbed(tableName)] })
}
