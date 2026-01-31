import type { RollerRollResult } from '@randsum/roller'

export function formatRollResultJson(result: RollerRollResult): string {
  return JSON.stringify(
    {
      total: result.total,
      rolls: result.rolls.map(roll => ({
        notation: roll.parameters.notation,
        description: roll.description,
        rawRolls: roll.rolls,
        modifiedRolls: roll.modifierHistory.modifiedRolls,
        initialRolls: roll.modifierHistory.initialRolls,
        total: roll.total,
        appliedTotal: roll.appliedTotal,
        modifierHistory: {
          logs: roll.modifierHistory.logs,
          total: roll.modifierHistory.total
        },
        customResults: roll.customResults
      })),
      result: result.result
    },
    null,
    2
  )
}

export function formatRollResult(result: RollerRollResult): string {
  const { total, rolls } = result
  const firstRoll = rolls[0]
  if (!firstRoll) {
    throw new Error('No roll data available')
  }
  const {
    parameters,
    modifierHistory: { modifiedRolls, initialRolls }
  } = firstRoll

  const header = `🎲 RANDSUM Roll Result:`
  const separator = '─'.repeat(30)
  const totalLine = `Total: ${total}`

  const notation = parameters.notation
  const rawRollsStr = initialRolls.join(', ')
  const modifiedRollsStr = modifiedRolls.join(', ')

  let rollInfo = `Roll: ${notation}`
  rollInfo += `\n  Raw: [${rawRollsStr}]`

  if (rawRollsStr !== modifiedRollsStr) {
    rollInfo += `\n  Modified: [${modifiedRollsStr}]`
  }

  rollInfo += `\n  Total: ${total}`

  const rawResultsLine = `Raw Results: [${initialRolls.join(', ')}]`

  return [header, separator, totalLine, rawResultsLine, '', 'Roll Details:', rollInfo].join('\n')
}
