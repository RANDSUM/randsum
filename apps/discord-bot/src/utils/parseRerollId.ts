export function parseRerollId(customId: string): { command: string; params: string } | null {
  if (!customId.startsWith('reroll:')) return null
  const withoutPrefix = customId.slice('reroll:'.length)
  const colonIndex = withoutPrefix.indexOf(':')
  if (colonIndex === -1) return null
  const command = withoutPrefix.slice(0, colonIndex)
  const params = withoutPrefix.slice(colonIndex + 1)
  return { command, params }
}
