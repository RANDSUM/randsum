import type { RollTraceStep } from '@randsum/roller/trace'
import { formatAsMath } from '@randsum/roller/trace'

export function formatTraceSteps(steps: readonly RollTraceStep[]): string {
  return steps
    .map(step => {
      if (step.kind === 'rolls') {
        const unchangedPart = step.unchanged.map(n => String(n)).join(', ')
        const removedPart = step.removed.map(n => `~~${n}~~`).join(', ')
        const addedPart = step.added.map(n => `**${n}**`).join(', ')
        const parts = [unchangedPart, removedPart, addedPart].filter(p => p.length > 0)
        return `**${step.label}**: [${parts.join(', ')}]`
      }
      if (step.kind === 'arithmetic') {
        return `**${step.label}**: ${step.display}`
      }
      if (step.kind === 'finalRolls') {
        const math = formatAsMath(step.rolls, step.arithmeticDelta)
        return `**Final**: ${math}`
      }
      // divider
      return '─────────────────'
    })
    .join('\n')
}
