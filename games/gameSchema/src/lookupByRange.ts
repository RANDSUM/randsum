export function lookupByRange(
  table: Record<string, { label?: string; value?: string }>,
  value: number
): { readonly key: string; readonly result: { readonly label?: string; readonly value?: string } } {
  for (const [key, entry] of Object.entries(table)) {
    const parts = key.split('-')
    if (parts.length === 1) {
      if (Number(parts[0]) === value) return { key, result: entry }
    } else {
      const minPart = parts[0]
      const maxPart = parts[1]
      if (minPart !== undefined && maxPart !== undefined) {
        const min = Number(minPart)
        const max = Number(maxPart)
        if (value >= min && value <= max) return { key, result: entry }
      }
    }
  }
  throw new Error(`No range found for value ${value}`)
}
