import { SchemaError } from './errors'

const RANGE_PATTERN = /^(-?\d+)(?:-(-?\d+))?$/

function toEntry(rawEntry: unknown): {
  readonly label?: string | undefined
  readonly value?: string | undefined
} {
  if (typeof rawEntry === 'object' && rawEntry !== null) {
    const obj = rawEntry as Record<string, unknown>
    return {
      label: typeof obj['label'] === 'string' ? obj['label'] : undefined,
      value: typeof obj['value'] === 'string' ? obj['value'] : undefined
    }
  }
  return {}
}

export function lookupByRange(
  table: Readonly<Record<string, unknown>>,
  value: number
): {
  readonly key: string
  readonly result: { readonly label?: string | undefined; readonly value?: string | undefined }
} {
  for (const [key, rawEntry] of Object.entries(table)) {
    const match = RANGE_PATTERN.exec(key)
    if (match === null) continue

    const minStr = match[1]
    const maxStr = match[2]
    if (minStr === undefined) continue

    const min = Number(minStr)
    if (maxStr === undefined) {
      if (min === value) return { key, result: toEntry(rawEntry) }
    } else {
      const max = Number(maxStr)
      if (value >= min && value <= max) return { key, result: toEntry(rawEntry) }
    }
  }
  throw new SchemaError('NO_TABLE_MATCH', `No range found for value ${value}`)
}
