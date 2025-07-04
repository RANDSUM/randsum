import { AdvantageDisadvantageDH, rollDH } from '@randsum/daggerheart'
import { Colors, CommandInteraction, EmbedBuilder } from 'discord.js'
import { CommandConfig } from 'robo.js'
import { embedFooterDetails } from '../core/constants.js'

export const config: CommandConfig = {
    description: 'What moves you - Hope, or Fear?',
    options: [
        {
            name: 'modifier',
            description: 'Additional Modifier to be added to the roll',
            type: 'number',
            required: false
        },
        {
            name: 'advDis',
            description: 'Roll with advantage or disadvantage',
            type: 'string',
            required: false,
        }
    ]
}

const buildEmbed = (rollModifier: number, rollingWith: AdvantageDisadvantageDH | undefined) => {
    const { total, type, rolls: { hope, fear, modifier, advantage } } = rollDH({ modifier: rollModifier, rollingWith })

    const hopeFearFields = [
        { name: 'Hope', value: hope.toString(), inline: true },
        { name: 'Fear', value: fear.toString(), inline: true }
    ].sort((a, b) => Number(a.value) - Number(b.value))

    const fields = [
        ...hopeFearFields,
        { name: 'Modifier', value: modifier.toString() },
        advantage && rollingWith && { name: `Rolled with ${rollingWith}`, value: advantage.toString() }
    ].filter(r => !!r)
    return new EmbedBuilder()
        .setTitle(`You rolled a ${total} with ${type}`)
        .setFields(fields)
        .setColor(getColor(type))
        .setFooter(embedFooterDetails)
        .toJSON()
}

function getColor(type: 'hope' | 'fear' | 'critical hope') {
    switch (type) {
        case 'hope':
            return Colors.White
        case 'fear':
            return Colors.NotQuiteBlack
        case 'critical hope':
            return Colors.Gold
    }
}

export default (interaction: CommandInteraction) => {
    const modifierAg = Number(interaction.options.get('modifier')?.value) || 0
    const advantageDisadvantage = interaction.options.get('advDis')?.value as AdvantageDisadvantageDH | undefined

    const embed = buildEmbed(modifierAg, advantageDisadvantage)
    interaction.reply({ embeds: [embed] })
}
