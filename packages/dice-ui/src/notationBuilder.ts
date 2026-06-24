// Presentation-agnostic notation-builder logic for the QuickReferenceGrid implementation.
// This module MUST stay free of any React imports so the component and the bun:test unit
// suite can both consume it directly. Only the rendering/styling lives in the component.

import type { ModifierCategory, NotationDoc } from '@randsum/roller/docs'

// ---- Builder type system ----

export type BuilderType =
  | { readonly kind: 'dice' }
  | { readonly kind: 'no-arg'; readonly fragment: string }
  | { readonly kind: 'number'; readonly prefix: string; readonly actual: string }
  | { readonly kind: 'condition'; readonly prefix: string; readonly actual: string }

export const NUMBER_KEYS: ReadonlySet<string> = new Set([
  'K',
  'KL',
  'KM',
  '+',
  '-',
  '*',
  '//',
  '%',
  '**',
  'ms{..}'
])

export const CONDITION_KEYS: ReadonlySet<string> = new Set([
  'R{..}',
  'ro{..}',
  'C{..}',
  'V{..}',
  'D{..}',
  '#{..}',
  'S{..}',
  'F{..}',
  '!s{..}'
])

export const DICE_SIDES_KEYS: ReadonlySet<string> = new Set(['gN', 'DDN', 'zN'])

export const OPERATORS: readonly ['<', '>', '=', '<=', '>='] = ['<', '>', '=', '<=', '>=']

export function getBuilderType(doc: NotationDoc): BuilderType {
  if (doc.key === 'xDN') return { kind: 'dice' }
  if (DICE_SIDES_KEYS.has(doc.key)) {
    const prefix = doc.displayBase.replace('N', '')
    return { kind: 'number', prefix, actual: prefix }
  }
  if (NUMBER_KEYS.has(doc.key)) {
    const actual = doc.key === '-' ? '-' : doc.key === 'ms{..}' ? 'ms' : doc.key
    return { kind: 'number', prefix: doc.displayBase, actual }
  }
  if (CONDITION_KEYS.has(doc.key)) {
    const actual = doc.key.replace('{..}', '')
    return { kind: 'condition', prefix: doc.displayBase.replace('{..}', ''), actual }
  }
  return { kind: 'no-arg', fragment: doc.key === 'sort' ? 'sa' : doc.key }
}

// A modifier can only be appended when the current notation already contains a dice
// expression (e.g. `2d6`). Core/Special dice types are always addable. `notation` may be
// undefined (the optional prop is passed straight through).
export function canAddModifier(notation: string | undefined, doc: NotationDoc): boolean {
  if (doc.category === 'Core' || doc.category === 'Special') return true
  if (notation === undefined || notation.length === 0) return false
  // Detect a dice expression (a `d` followed by a die spec). The leading digit
  // count is irrelevant to this boolean test, so it is intentionally omitted —
  // a `\d*d` prefix backtracks polynomially on long digit runs (CodeQL
  // js/polynomial-redos). `d[\d%F{]` matches the exact same set, linearly.
  return /d[\d%F{]/i.test(notation)
}

// ---- Category grouping ----

export const CATEGORY_ORDER: readonly ModifierCategory[] = [
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

export function groupByCategory(
  docs: Readonly<Record<string, NotationDoc>>
): ReadonlyMap<ModifierCategory, readonly NotationDoc[]> {
  const groups = new Map<ModifierCategory, NotationDoc[]>()
  for (const doc of Object.values(docs)) {
    const existing = groups.get(doc.category)
    if (existing) {
      existing.push(doc)
    } else {
      groups.set(doc.category, [doc])
    }
  }
  return groups
}
