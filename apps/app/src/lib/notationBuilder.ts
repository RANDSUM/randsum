/**
 * If notation ends with NdX (same sides), increment N.
 * Otherwise append +1dX.
 */
export function appendDie(notation: string, sides: number): string {
  if (!notation) return `1d${sides}`
  // Match the last die group: digits + dX + optional modifier chars
  const pattern = new RegExp(`(\\d+)(d${sides})([A-Za-z!]*)$`)
  const match = notation.match(pattern)
  if (match) {
    const qty = parseInt(match[1]!, 10)
    const die = match[2]!
    const mods = match[3]!
    return `${notation.slice(0, notation.length - match[0].length)}${qty + 1}${die}${mods}`
  }
  return `${notation}+1d${sides}`
}

/**
 * Toggle a single-character modifier suffix on the notation.
 */
export function toggleSimpleModifier(notation: string, modifier: string): string {
  if (!notation) return notation
  if (notation.endsWith(modifier)) return notation.slice(0, -modifier.length)
  if (notation.includes(modifier)) return notation.replace(modifier, '')
  return `${notation}${modifier}`
}

/**
 * Append a value modifier suffix (e.g. "+5", "-2").
 */
export function appendValueModifier(notation: string, suffix: string): string {
  return `${notation}${suffix}`
}
