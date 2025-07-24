export function formatHumanList(values: number[]): string {
  if (!values.length) return ''
  if (values.length === 1) return `[${values[0]}]`

  const items = values.map(item => `[${item}]`)
  const last = items.pop()
  return `${items.join(' ')} and ${last}`
}
