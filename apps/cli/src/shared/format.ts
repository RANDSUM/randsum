import type { RollerRollResult } from '@randsum/roller'

export function formatCompact(result: RollerRollResult): string {
  const parts: string[] = [String(result.total)]

  for (const record of result.rolls) {
    const rolls = record.rolls
    parts.push(`[${rolls.join(', ')}]`)

    const description = record.description.slice(1)
    if (description.length > 0) {
      parts.push(description.join(', '))
    }
  }

  return parts.join('  ')
}

export function formatVerbose(result: RollerRollResult): string {
  const lines: string[] = []

  for (const record of result.rolls) {
    lines.push(`Roll:  ${record.description.join(', ')}`)
    lines.push(`Raw:   [${record.initialRolls.join(', ')}]`)

    if (record.modifierLogs.length > 0) {
      lines.push(`Kept:  [${record.rolls.join(', ')}]`)
    }
  }

  lines.push(`Total: ${result.total}`)

  return lines.join('\n')
}

export function formatJson(result: RollerRollResult): string {
  return JSON.stringify({
    total: result.total,
    rolls: result.rolls.map(record => ({
      description: record.description,
      raw: record.initialRolls,
      kept: record.rolls,
      total: record.total
    }))
  })
}
