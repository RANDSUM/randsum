import type { APIEmbed, ChatInputCommandInteraction } from 'discord.js'
import { Colors, EmbedBuilder } from 'discord.js'
import type { CommandConfig, CommandOptions, CommandResult } from 'robo.js'
import type {
  SalvageUnionHit,
  SalvageUnionTableName
} from '@randsum/salvageunion'
import { AllRollTables, rollTable } from '@randsum/salvageunion'
import { embedFooterDetails } from '../core/constants'

const suChoices = Object.keys(AllRollTables).map((table) => ({
  name: table,
  value: table
}))

export const config: CommandConfig = {
  description:
    'The Salvage Union is here to help you with your salvaging needs',
  options: [
    {
      name: 'table',
      description: 'What table are you rolling on?',
      type: 'string',
      choices: suChoices
    }
  ]
}

function getColor(type: SalvageUnionHit): number {
  switch (type) {
    case 'Nailed It':
      return Colors.Green
    case 'Success':
      return Colors.DarkGreen
    case 'Tough Choice':
      return Colors.Yellow
    case 'Failure':
      return Colors.Red
    case 'Cascade Failure':
      return Colors.DarkRed
  }
}

export function buildEmbed(table: SalvageUnionTableName): APIEmbed {
  const { result: hit, label, description, roll: total } = rollTable(table)

  return new EmbedBuilder()
    .setTitle(`${String(total)} - __**${label}**__`)
    .setColor(getColor(hit))
    .setDescription(description)
    .addFields({ name: 'Table', value: table, inline: true })
    .setFooter(embedFooterDetails)
    .toJSON()
}

export default async (
  interaction: ChatInputCommandInteraction,
  { table }: CommandOptions<typeof config>
): Promise<CommandResult> => {
  const tableName: SalvageUnionTableName = (table ??
    'Core Mechanic') as SalvageUnionTableName

  await interaction.reply({ embeds: [buildEmbed(tableName)] })
}
