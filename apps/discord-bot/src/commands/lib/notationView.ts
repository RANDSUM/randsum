/**
 * The `/notation` reference view — embed plus category selector.
 *
 * Extracted when there were two transports, so both rendered the identical
 * thing. Only the Worker remains: it builds this view and returns it, then
 * builds it again when Discord POSTs the next selection. Nothing is held open
 * between the two — each selection is an independent request.
 *
 * The state question turned out to be smaller than the migration plan assumed.
 * The plan said `/notation`'s pagination would need its state encoded into the
 * `custom_id`, because a Worker cannot hold a collector open. That is true of a
 * *button* carrying a page index — there is nowhere else to put it. But this is
 * a **select menu**, and Discord sends the chosen option back in
 * `data.values[0]`. The selection *is* the state, and it arrives with the
 * interaction. The existing static custom_id was never the problem.
 */
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from '../../utils/builders.js'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { NotationDoc } from '@randsum/roller/docs'
import { embedFooterDetails } from '../../utils/constants.js'

/** Shared by both transports so a rename cannot desynchronise them. */
export const NOTATION_SELECT_ID = 'notation-category'

export function groupByCategory(
  docs: Readonly<Record<string, NotationDoc>> = NOTATION_DOCS
): Map<string, NotationDoc[]> {
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

export function buildCategoryEmbed(
  category: string,
  entries: readonly NotationDoc[]
): EmbedBuilder {
  const fields = entries.map(doc => ({
    name: `${doc.title} (${doc.displayBase})`,
    value: [
      doc.description,
      ...doc.examples.map(example => `**\`${example.notation}\`** — ${example.description}`)
    ].join('\n'),
    inline: false
  }))

  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('notation.randsum.dev')
    .setURL('https://notation.randsum.dev')
    .setDescription(`**${category}** modifiers`)
    .addFields(fields)
    .setFooter(embedFooterDetails)
}

export function buildCategoryMenu(
  categories: readonly string[],
  selected: string
): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(NOTATION_SELECT_ID)
    .setPlaceholder('Select a category')
    .addOptions(
      categories.map(category => ({
        label: category,
        value: category,
        default: category === selected
      }))
    )

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)
}

export interface NotationView {
  readonly embed: EmbedBuilder
  readonly row: ActionRowBuilder<StringSelectMenuBuilder>
}

/**
 * Build the whole view for one category. Falls back to the first category when
 * given nothing or an unrecognised value — a stale menu from an old message
 * must not render an empty reference page.
 */
export function buildNotationView(category?: string | undefined): NotationView {
  const grouped = groupByCategory()
  const categories = [...grouped.keys()]
  const fallback = categories[0] ?? 'Core'
  const selected = category !== undefined && grouped.has(category) ? category : fallback

  return {
    embed: buildCategoryEmbed(selected, grouped.get(selected) ?? []),
    row: buildCategoryMenu(categories, selected)
  }
}
