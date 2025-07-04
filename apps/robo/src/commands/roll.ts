import { NumericDiceNotation, roll } from '@randsum/dice'
import { validateNotation } from '@randsum/notation'
import { CommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants.js'

export const config: CommandConfig = {
	description: 'Test your luck with a roll of the dice',
	options: [
		{
			name: 'notation',
			description: 'A roll using dice notation - e.g. 2d6+3',
			type: 'string',
			required: true
		}
	]
}

const buildEmbed = (notationArg: string) => {
	const { valid, description } = validateNotation(notationArg)

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

	const result = roll(notationArg as NumericDiceNotation)
	const isStandard = result.type === 'numerical'

	const total = `**${isStandard ? result.total : result.result}**`
	const key = Object.keys(result.dicePools)[0]
	const dicePoolDescriptions = result.dicePools[key].description

	const rawResults = JSON.stringify(result.rawResult.flat())
	const results = JSON.stringify(result.result.flat())

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
	const fields = [{ name: 'Value', value: total }, ...rollFields, { name: 'Notation', value: notationArg }].filter(
		(x) => x
	)
	return new EmbedBuilder()
		.setTitle(`You rolled a ${total}`)
		.setDescription(dicePoolDescriptions.join(', '))
		.setFields(fields)
		.setFooter(embedFooterDetails)
		.toJSON()
}

export default (interaction: CommandInteraction) => {
	const notationArg = interaction.options.get('notation')?.value?.toString() || ''

	const embed = buildEmbed(notationArg)
	interaction.reply({ embeds: [embed] })
}
