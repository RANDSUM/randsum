import type { RollerRollResult } from '@randsum/roller'

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
