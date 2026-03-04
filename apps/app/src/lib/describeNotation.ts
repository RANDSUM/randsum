import { validateNotation } from '@randsum/roller'

export function describeNotation(notation: string): string {
  if (!notation) return ''
  const result = validateNotation(notation)
  if (!result.valid) return notation
  return result.description
    .map(group => group.filter(Boolean).join(', '))
    .join('; ')
}
