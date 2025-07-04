import { Colors, CommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandConfig } from 'robo.js'
import { SalvageUnion, SalvageUnionTypes } from 'ttrpg-ts'
import { embedFooterDetails } from '../core/constants.js'

const suChoices = Object.values(SalvageUnionTypes.TableName).map((table) => ({
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

function getColor(type: SalvageUnionTypes.Hit): number {
	switch (type) {
		case SalvageUnionTypes.Hit.nailedIt:
			return Colors.Green
		case SalvageUnionTypes.Hit.success:
			return Colors.DarkGreen
		case SalvageUnionTypes.Hit.toughChoice:
			return Colors.Yellow
		case SalvageUnionTypes.Hit.failure:
			return Colors.Red
		case SalvageUnionTypes.Hit.cascadeFailure:
			return Colors.DarkRed
	}
}

export function handleRollSalvageUnion(table: SalvageUnionTypes.TableName) {
	const [{ label, description, hit }, total] = SalvageUnion.roll(table)

	return new EmbedBuilder()
		.setTitle(`${total} - __**${label}**__`)
		.setColor(getColor(hit))
		.setDescription(description)
		.addFields({ name: 'Table', value: `${table}`, inline: true })
		.setFooter(embedFooterDetails)
		.toJSON()
}

export default (interaction: CommandInteraction) => {
	const modifierArg =
		(interaction.options.get('table')?.value?.toString() as SalvageUnionTypes.TableName) ||
		SalvageUnionTypes.TableName.coreMechanic

	interaction.reply({ embeds: [handleRollSalvageUnion(modifierArg)] })
}
