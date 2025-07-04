import { BladesResult, rollBlades } from '@randsum/blades'
import { NumericRollResult } from '@randsum/dice'
import { Colors, CommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants.js'

export const config: CommandConfig = {
	description: 'Crew up.  Get in. Get out. Get Paid',
	options: [
		{
			name: 'dice',
			description: 'The number of dice to roll',
			type: 'number',
			min: 0,
			max: 10,
			required: true
		}
	]
}

const getColor = (type: BladesResult): number => {
	switch (type) {
		case 'critical':
			return Colors.Gold
		case 'success':
			return Colors.Green
		case 'partial':
			return Colors.Yellow
		case 'failure':
			return Colors.Red
	}
}

const getExplanation = (quantity: number, username: string): string[] => {
	const isZero = quantity === 0
	return [`${username} rolled ${isZero ? 2 : quantity} D6`, `and took the ${isZero ? 'lowest' : 'highest'} result`]
}

const getThumbnail = (total: number, type: BladesResult): string => {
	const root = 'https://raw.githubusercontent.com/RANDSUM/DiscordBot/main/supabase/functions/_shared/assets/d6/'
	switch (total) {
		case 1:
			return `${root}one.png`
		case 2:
			return `${root}two.png`
		case 3:
			return `${root}three.png`
		case 4:
			return `${root}four.png`
		case 5:
			return `${root}five.png`
		case 6:
			if (type === 'critical') {
				return `${root}double6.png`
			}
			return `${root}six.png`
	}
	throw new Error('Invalid total')
}

const parseRolls = (result: NumericRollResult, bladesSuccess: BladesResult): string => {
	return result.result
		.flat()
		.map((roll, index, array) => {
			const isCritical = bladesSuccess === 'critical'
			const firstInstaceOfRoll = array.indexOf(roll) === index
			return roll === result.total && (isCritical || firstInstaceOfRoll) ? `**${roll}**` : `~~${roll}~~`
		})
		.join(', ')
}

const getSuccessString = (type: BladesResult): string[] => {
	const responseArray = []
	switch (type) {
		case 'critical':
			responseArray.push('__**Critical Success**__')
			responseArray.push('*Things go better than expected*')
			break
		case 'success':
			responseArray.push('__**Success**__')
			responseArray.push('*Things go well*')
			break
		case 'partial':
			responseArray.push('__**Partial Success**__')
			responseArray.push('*Things go well, but not perfectly*')
			break
		case 'failure':
			responseArray.push('__**Failure**__')
			responseArray.push('*Things go poorly*')
			break
	}

	return responseArray
}

function buildEmbed(diceArg: number, memberNick: string) {
	const quantity = diceArg === 0 ? 0 : diceArg || 1
	const [explanationTitle, explanationValue] = getExplanation(quantity, memberNick || 'User')

	const [hit, result] = rollBlades(quantity)
	const [successTitle, successValue] = getSuccessString(hit)

	return new EmbedBuilder()
		.setTitle(successTitle)
		.setDescription(successValue)
		.setThumbnail(getThumbnail(result.total, hit))
		.addFields({ name: '\u200B', value: '\u200B' })
		.addFields({
			name: explanationTitle,
			value: explanationValue
		})
		.addFields({
			name: 'Rolls',
			value: `[${parseRolls(result, hit)}]`,
			inline: true
		})
		.addFields({
			name: 'Total',
			value: `** ${result.total} **`,
			inline: true
		})
		.setColor(getColor(hit))
		.setFooter(embedFooterDetails)
		.toJSON()
}

export default (interaction: CommandInteraction) => {
	const diceArg = Number(interaction.options.get('dice')?.value)
	const memberNick = interaction.user.displayName
	const embed = buildEmbed(diceArg, memberNick)

	interaction.reply({ embeds: [embed] })
}
