import type { RollerRollResult } from '@randsum/roller'

export function formatCompact(result: RollerRollResult): string {
  if (result.error) {
    return `Error: ${result.error.message}`
  }

  const parts: string[] = [String(result.total)]

  for (const record of result.rolls) {
    const rolls = record.modifierHistory.modifiedRolls
    parts.push(`[${rolls.join(', ')}]`)

    const description = record.description.slice(1)
    if (description.length > 0) {
      parts.push(description.join(', '))
    }
  }

  return parts.join('  ')
}

export function formatVerbose(result: RollerRollResult): string {
  if (result.error) {
    return `Error: ${result.error.message}`
  }

  const lines: string[] = []

  for (const record of result.rolls) {
    lines.push(`Roll:  ${record.description.join(', ')}`)
    lines.push(`Raw:   [${record.modifierHistory.initialRolls.join(', ')}]`)

    if (record.modifierHistory.logs.length > 0) {
      lines.push(`Kept:  [${record.modifierHistory.modifiedRolls.join(', ')}]`)
    }
  }

  lines.push(`Total: ${result.total}`)

  return lines.join('\n')
}

export function formatJson(result: RollerRollResult): string {
  if (result.error) {
    return JSON.stringify({ error: result.error.message })
  }

  return JSON.stringify({
    total: result.total,
    rolls: result.rolls.map(record => ({
      description: record.description,
      raw: record.modifierHistory.initialRolls,
      kept: record.modifierHistory.modifiedRolls,
      total: record.total
    }))
  })
}
