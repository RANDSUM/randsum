import {
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder
} from 'discord.js'
import type { StringSelectMenuInteraction } from 'discord.js'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { NotationDoc } from '@randsum/roller/docs'
import { embedFooterDetails } from '../utils/constants.js'
import { replyWithError } from '../utils/replyWithError.js'
import type { Command } from '../types.js'

const COLLECTOR_TIMEOUT = 5 * 60 * 1000

function groupByCategory(docs: Readonly<Record<string, NotationDoc>>): Map<string, NotationDoc[]> {
  const groups = new Map<string, NotationDoc[]>()
  for (const doc of Object.values(docs)) {
    const existing = groups.get(doc.category)
    if (existing !== undefined) {
      existing.push(doc)
    } else {
      groups.set(doc.category, [doc])
    }
  }
  return groups
}

function buildCategoryEmbed(category: string, entries: NotationDoc[]): EmbedBuilder {
  const fields = entries.map(doc => ({
    name: `${doc.title} (${doc.displayBase})`,
    value: [
      doc.description,
      ...doc.examples.map(ex => `**\`${ex.notation}\`** — ${ex.description}`)
    ].join('\n'),
    inline: false
  }))

  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('notation.randsum.dev')
    .setURL('https://notation.randsum.dev')
    .setDescription(`**${category}** modifiers`)
    .addFields(fields)
    .setFooter(embedFooterDetails)
}

export const notationCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('notation')
    .setDescription('RANDSUM Dice Notation Reference'),

  async execute(interaction) {
    await interaction.deferReply()

    try {
      const grouped = groupByCategory(NOTATION_DOCS)
      const categories = Array.from(grouped.keys())
      const firstCategory = categories[0] ?? 'Core'
      const firstEntries = grouped.get(firstCategory) ?? []

      const embed = buildCategoryEmbed(firstCategory, firstEntries)

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('notation-category')
        .setPlaceholder('Select a category')
        .addOptions(
          categories.map(cat => ({
            label: cat,
            value: cat,
            default: cat === firstCategory
          }))
        )

      const row = new ActionRowBuilder().addComponents(selectMenu)

      const message = await interaction.editReply({
        embeds: [embed],
        components: [row as never]
      })

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: COLLECTOR_TIMEOUT
      })

      collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
        const selected = selectInteraction.values[0]
        if (selected === undefined) return

        const entries = grouped.get(selected) ?? []
        const categoryEmbed = buildCategoryEmbed(selected, entries)

        const updatedMenu = new StringSelectMenuBuilder()
          .setCustomId('notation-category')
          .setPlaceholder('Select a category')
          .addOptions(
            categories.map(cat => ({
              label: cat,
              value: cat,
              default: cat === selected
            }))
          )

        const updatedRow = new ActionRowBuilder().addComponents(updatedMenu)

        await selectInteraction.update({
          embeds: [categoryEmbed],
          components: [updatedRow as never]
        })
      })

      collector.on('end', async () => {
        const disabledMenu = new StringSelectMenuBuilder()
          .setCustomId('notation-category')
          .setPlaceholder('Select a category')
          .addOptions(
            categories.map(cat => ({
              label: cat,
              value: cat,
              default: cat === firstCategory
            }))
          )
          .setDisabled(true)

        const disabledRow = new ActionRowBuilder().addComponents(disabledMenu)

        await message.edit({
          components: [disabledRow as never]
        })
      })
    } catch (e) {
      await replyWithError(
        interaction,
        'Error',
        e instanceof Error ? e.message : 'An unknown error occurred'
      )
    }
  }
}
