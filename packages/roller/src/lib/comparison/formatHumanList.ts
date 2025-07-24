export function formatHumanList(values: number[]): string {
  if (values.length === 0) return ''
  if (values.length === 1) return `[${values[0]}]`

  const formattedItems = values.map(item => `[${item}]`)
  const lastItem = formattedItems.pop()

  return `${formattedItems.join(' ')} and ${lastItem}`
}
