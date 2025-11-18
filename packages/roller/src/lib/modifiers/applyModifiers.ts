import type { Modifiers, ModifierLog, NumericRollBonus } from '../../types'
import { matchesComparison, matchesExact, matchesReplaceFrom } from '../comparisonUtils'

type RollOneFunction = () => number

interface ModifierContext {
  sides: number
  quantity: number
}

export function applyModifiers(
  modifierType: keyof Modifiers,
  options: unknown,
  bonus: NumericRollBonus,
  context?: ModifierContext,
  rollOne?: RollOneFunction
): NumericRollBonus {
  if (options === undefined) {
    return bonus
  }

  // Work with modifiedRolls if it exists, otherwise work with rolls
  const workingRolls = bonus.modifiedRolls || [...bonus.rolls]
  const newBonus = { ...bonus, modifiedRolls: [...workingRolls] }

  switch (modifierType) {
    case 'plus':
      return {
        ...newBonus,
        simpleMathModifier: bonus.simpleMathModifier + (options as number)
      }

    case 'minus':
      return {
        ...newBonus,
        simpleMathModifier: bonus.simpleMathModifier - (options as number)
      }

    case 'cap':
      return applyCapModifier(options as { greaterThan?: number; lessThan?: number }, newBonus)

    case 'drop':
      return applyDropModifier(options as any, newBonus)

    case 'reroll':
      if (!rollOne || !context) {
        throw new Error('rollOne function required for reroll modifier')
      }
      return applyRerollModifier(options as any, newBonus, context, rollOne)

    case 'explode':
      if (!rollOne || !context) {
        throw new Error('rollOne and context required for explode modifier')
      }
      return applyExplodeModifier(newBonus, context, rollOne)

    case 'unique':
      if (!rollOne || !context) {
        throw new Error('rollOne and context required for unique modifier')
      }
      return applyUniqueModifier(options as boolean | { notUnique: number[] }, newBonus, context, rollOne)

    case 'replace':
      return applyReplaceModifier(options as any, newBonus)

    default:
      return bonus
  }
}

function applyCapModifier(
  cap: { greaterThan?: number; lessThan?: number },
  bonus: NumericRollBonus
): NumericRollBonus {
  const modifiedRolls = [...(bonus.modifiedRolls || bonus.rolls)]
  const removed: number[] = []
  const added: number[] = []

  for (let i = 0; i < modifiedRolls.length; i++) {
    const value = modifiedRolls[i]
    let newValue = value

    if (cap.greaterThan !== undefined && value > cap.greaterThan) {
      newValue = cap.greaterThan
    }
    if (cap.lessThan !== undefined && value < cap.lessThan) {
      newValue = cap.lessThan
    }

    if (newValue !== value) {
      removed.push(value)
      added.push(newValue)
      modifiedRolls[i] = newValue
    }
  }

  const logs: ModifierLog[] = []
  if (removed.length > 0) {
    logs.push({
      modifier: 'cap',
      options: cap,
      removed,
      added
    })
  }

  return {
    ...bonus,
    rolls: modifiedRolls,
    modifiedRolls,
    logs: [...bonus.logs, ...logs]
  }
}

function applyDropModifier(
  drop: {
    lowest?: number
    highest?: number
    exact?: number[]
    greaterThan?: number
    lessThan?: number
  },
  bonus: NumericRollBonus
): NumericRollBonus {
  const modifiedRolls = [...(bonus.modifiedRolls || bonus.rolls)]
  const removed: number[] = []
  const indicesToRemove = new Set<number>()

  // Collect indices to remove for lowest
  if (drop.lowest) {
    const sorted = modifiedRolls.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val)
    for (let i = 0; i < drop.lowest && i < sorted.length; i++) {
      indicesToRemove.add(sorted[i].idx)
    }
  }

  // Collect indices to remove for highest
  if (drop.highest) {
    const sorted = modifiedRolls.map((val, idx) => ({ val, idx })).sort((a, b) => b.val - a.val)
    for (let i = 0; i < drop.highest && i < sorted.length; i++) {
      indicesToRemove.add(sorted[i].idx)
    }
  }

  // Collect indices to remove for exact
  if (drop.exact) {
    for (let i = 0; i < modifiedRolls.length; i++) {
      if (drop.exact.includes(modifiedRolls[i])) {
        indicesToRemove.add(i)
      }
    }
  }

  // Collect indices to remove for greater than
  if (drop.greaterThan !== undefined) {
    for (let i = 0; i < modifiedRolls.length; i++) {
      if (modifiedRolls[i] > drop.greaterThan) {
        indicesToRemove.add(i)
      }
    }
  }

  // Collect indices to remove for less than
  if (drop.lessThan !== undefined) {
    for (let i = 0; i < modifiedRolls.length; i++) {
      if (modifiedRolls[i] < drop.lessThan) {
        indicesToRemove.add(i)
      }
    }
  }

  // Remove indices in reverse order to maintain correct indices
  const sortedIndices = Array.from(indicesToRemove).sort((a, b) => b - a)
  for (const idx of sortedIndices) {
    removed.push(modifiedRolls[idx])
    modifiedRolls.splice(idx, 1)
  }

  const logs: ModifierLog[] = []
  if (removed.length > 0) {
    logs.push({
      modifier: 'drop',
      options: drop,
      removed,
      added: []
    })
  }

  return {
    ...bonus,
    rolls: modifiedRolls,
    modifiedRolls,
    logs: [...bonus.logs, ...logs]
  }
}

function applyRerollModifier(
  reroll: {
    exact?: number[]
    greaterThan?: number
    lessThan?: number
    max?: number
  },
  bonus: NumericRollBonus,
  context: ModifierContext,
  rollOne: RollOneFunction
): NumericRollBonus {
  const modifiedRolls = [...(bonus.modifiedRolls || bonus.rolls)]
  const removed: number[] = []
  const added: number[] = []
  let rerollCount = 0
  const maxRerolls = reroll.max ?? 99

  for (let i = 0; i < modifiedRolls.length; i++) {
    const value = modifiedRolls[i]
    let shouldReroll = false

    if (reroll.exact && matchesExact(value, reroll.exact)) {
      shouldReroll = true
    } else if (reroll.greaterThan !== undefined && value > reroll.greaterThan) {
      shouldReroll = true
    } else if (reroll.lessThan !== undefined && value < reroll.lessThan) {
      shouldReroll = true
    }

    if (shouldReroll && rerollCount < maxRerolls) {
      removed.push(value)
      const newValue = rollOne()
      added.push(newValue)
      modifiedRolls[i] = newValue
      rerollCount++
    }
  }

  const logs: ModifierLog[] = []
  if (removed.length > 0) {
    logs.push({
      modifier: 'reroll',
      options: reroll,
      removed,
      added
    })
  }

  return {
    ...bonus,
    rolls: modifiedRolls,
    modifiedRolls,
    logs: [...bonus.logs, ...logs]
  }
}

function applyExplodeModifier(
  bonus: NumericRollBonus,
  context: ModifierContext,
  rollOne: RollOneFunction
): NumericRollBonus {
  const modifiedRolls = [...(bonus.modifiedRolls || bonus.rolls)]
  const added: number[] = []

  for (const value of modifiedRolls) {
    if (value === context.sides) {
      const newRoll = rollOne()
      added.push(newRoll)
      modifiedRolls.push(newRoll)
    }
  }

  const logs: ModifierLog[] = []
  if (added.length > 0) {
    logs.push({
      modifier: 'explode',
      options: true,
      removed: [],
      added
    })
  }

  return {
    ...bonus,
    rolls: modifiedRolls,
    modifiedRolls,
    logs: [...bonus.logs, ...logs]
  }
}

function applyUniqueModifier(
  unique: boolean | { notUnique: number[] },
  bonus: NumericRollBonus,
  context: ModifierContext,
  rollOne: RollOneFunction
): NumericRollBonus {
  const modifiedRolls = [...(bonus.modifiedRolls || bonus.rolls)]
  const notUnique = typeof unique === 'object' ? unique.notUnique : []

  if (modifiedRolls.length > context.sides && notUnique.length === 0) {
    throw new Error('Cannot have more rolls than sides when unique is enabled')
  }

  const seen = new Set<number>()
  const removed: number[] = []
  const added: number[] = []

  for (let i = 0; i < modifiedRolls.length; i++) {
    const value = modifiedRolls[i]
    const isAllowedDuplicate = notUnique.includes(value)

    if (seen.has(value) && !isAllowedDuplicate) {
      removed.push(value)
      let newValue: number
      let attempts = 0
      do {
        newValue = rollOne()
        attempts++
        if (attempts > 100) {
          throw new Error('Failed to generate unique value after 100 attempts')
        }
      } while (seen.has(newValue) && !notUnique.includes(newValue))

      added.push(newValue)
      modifiedRolls[i] = newValue
      seen.add(newValue)
    } else {
      seen.add(value)
    }
  }

  const logs: ModifierLog[] = []
  if (removed.length > 0) {
    logs.push({
      modifier: 'unique',
      options: unique,
      removed,
      added
    })
  } else {
    logs.push({
      modifier: 'unique',
      options: unique,
      removed: [],
      added: []
    })
  }

  return {
    ...bonus,
    modifiedRolls,
    logs: [...bonus.logs, ...logs]
  }
}

function applyReplaceModifier(
  replace: { from: number | { greaterThan?: number; lessThan?: number }; to: number } | Array<{ from: number | { greaterThan?: number; lessThan?: number }; to: number }>,
  bonus: NumericRollBonus
): NumericRollBonus {
  const modifiedRolls = [...(bonus.modifiedRolls || bonus.rolls)]
  const removed: number[] = []
  const added: number[] = []
  const rules = Array.isArray(replace) ? replace : [replace]

  for (let i = 0; i < modifiedRolls.length; i++) {
    const value = modifiedRolls[i]
    for (const rule of rules) {
      if (matchesReplaceFrom(value, rule.from)) {
        removed.push(value)
        added.push(rule.to)
        modifiedRolls[i] = rule.to
        break
      }
    }
  }

  const logs: ModifierLog[] = []
  if (removed.length > 0) {
    logs.push({
      modifier: 'replace',
      options: replace,
      removed,
      added
    })
  }

  return {
    ...bonus,
    rolls: modifiedRolls,
    modifiedRolls,
    logs: [...bonus.logs, ...logs]
  }
}

