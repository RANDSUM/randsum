export function formatSides(sides: string): number | string[] {
  if (sides.includes('{')) {
    return [...sides.replaceAll(/{|}/g, '')]
  }
  return Number(sides)
}
