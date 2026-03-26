import React from 'react'
import { Box, Text } from 'ink'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { ModifierCategory, NotationDoc } from '@randsum/roller/docs'

export interface InkQuickReferenceGridProps {
  readonly notation: string
}

const CATEGORY_ORDER: readonly ModifierCategory[] = [
  'Core',
  'Special',
  'Filter',
  'Generate',
  'Accumulate',
  'Substitute',
  'Clamp',
  'Map',
  'Reinterpret',
  'Scale',
  'Order',
  'Dispatch'
]

function groupByCategory(): ReadonlyMap<ModifierCategory, readonly NotationDoc[]> {
  const groups = new Map<ModifierCategory, NotationDoc[]>()
  for (const doc of Object.values(NOTATION_DOCS)) {
    const existing = groups.get(doc.category as ModifierCategory)
    if (existing) {
      existing.push(doc)
    } else {
      groups.set(doc.category as ModifierCategory, [doc])
    }
  }
  return groups
}

const GROUPED_CATEGORIES = groupByCategory()

const ORDERED_CATEGORIES: readonly { category: ModifierCategory; docs: readonly NotationDoc[] }[] =
  CATEGORY_ORDER.flatMap(cat => {
    const docs = GROUPED_CATEGORIES.get(cat)
    return docs !== undefined && docs.length > 0 ? [{ category: cat, docs }] : []
  })

export function QuickReferenceGrid({
  notation: _notation
}: InkQuickReferenceGridProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      {ORDERED_CATEGORIES.map(({ category, docs }) => (
        <Box key={category} flexDirection="column">
          <Text bold color="cyan">
            {category}
          </Text>
          {docs.map(doc => (
            <Box key={doc.key} flexDirection="row" gap={1}>
              <Text bold>{doc.displayBase}</Text>
              <Text dimColor>{doc.title}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}
