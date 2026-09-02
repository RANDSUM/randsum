/**
 * The `/notation` reference view — one container holding the reference text
 * and its own category selector.
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
import {
  ActionRowBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextDisplayBuilder
} from '../../utils/builders.js'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { NotationDoc } from '@randsum/roller/docs'
import { FOOTER_ATTRIBUTION } from '../../utils/constants.js'
import { BRAND } from '../../utils/palette.js'
import type { RollView } from '../../types.js'

/** Shared by the view and the dispatcher so a rename cannot desynchronise them. */
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

/**
 * `NotationDoc.color` is a CSS hex string; Discord wants an integer.
 * Falls back to the brand accent when a doc has no colour or an unusable one.
 */
function parseHex(color: string | undefined): number {
  if (color === undefined) return BRAND
  const parsed = Number.parseInt(color.replace('#', ''), 16)
  return Number.isNaN(parsed) ? BRAND : parsed
}

/**
 * One category page.
 *
 * `doc.color` is a per-category identity the notation site already uses and the
 * bot discarded, painting every page the same gold. It is the accent now, so
 * Filter and Scale are visually distinct pages rather than the same page with
 * different words.
 *
 * The old description read "**<category>** modifiers" for every page, including
 * Core and Special — which are dice *types*, not modifiers.
 */
function buildCategoryContainer(
  category: string,
  entries: readonly NotationDoc[],
  categories: readonly string[]
): ContainerBuilder {
  const container = new ContainerBuilder()
    .setAccentColor(parseHex(entries[0]?.color))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${category}\n[notation.randsum.dev](https://notation.randsum.dev)`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )

  for (const doc of entries) {
    const lines = [
      `**${doc.title}** \`${doc.displayBase}\``,
      doc.description,
      // `comparisons` — the operator cheat-sheet, and the hardest part of the
      // notation to remember — was fetched and dropped by the embed renderer.
      ...(doc.comparisons ?? []).map(
        comparison => `-# \`${comparison.operator}\` — ${comparison.note}`
      ),
      ...doc.examples.map(example => `\`${example.notation}\` — ${example.description}`)
    ]
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')))
  }

  container.addActionRowComponents(buildCategoryMenu(categories, category))

  const position = categories.indexOf(category) + 1
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Page ${position} of ${categories.length} · ${FOOTER_ATTRIBUTION}`
    )
  )

  return container
}

function buildCategoryMenu(
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

/**
 * Build the whole view for one category. Falls back to the first category when
 * given nothing or an unrecognised value — a stale menu from an old message
 * must not render an empty reference page.
 */
export function buildNotationView(category?: string | undefined): RollView {
  const grouped = groupByCategory()
  const categories = [...grouped.keys()]
  const fallback = categories[0] ?? 'Core'
  const selected = category !== undefined && grouped.has(category) ? category : fallback

  return [buildCategoryContainer(selected, grouped.get(selected) ?? [], categories)]
}
