export function calculateDieType(
  sides: number | string[]
): 'custom' | 'numeric' {
  if (Array.isArray(sides)) {
    return 'custom'
  }
  return 'numeric'
}
