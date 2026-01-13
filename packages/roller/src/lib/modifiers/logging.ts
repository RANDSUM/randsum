import type { ModifierConfig, ModifierLog } from '../../types'

export function createFrequencyMap(values: number[]): Map<number, number> {
  const freq = new Map<number, number>()

  for (const value of values) {
    freq.set(value, (freq.get(value) ?? 0) + 1)
  }

  return freq
}

export function createArithmeticLog(
  modifier: string,
  options: ModifierConfig | undefined
): ModifierLog {
  return {
    modifier,
    options,
    added: [],
    removed: []
  }
}

export function createModifierLog(
  modifier: string,
  options: ModifierConfig | undefined,
  initialRolls: number[],
  newRolls: number[]
): ModifierLog {
  const baseLog = { modifier, options }

  if (initialRolls === newRolls) {
    return { ...baseLog, added: [], removed: [] }
  }

  if (initialRolls.length === 0) {
    return { ...baseLog, added: [...newRolls], removed: [] }
  }

  if (newRolls.length === 0) {
    return { ...baseLog, added: [], removed: [...initialRolls] }
  }

  const initialFreq = createFrequencyMap(initialRolls)
  const newFreq = createFrequencyMap(newRolls)

  const added: number[] = []
  const removed: number[] = []

  const allValues = new Set([...initialRolls, ...newRolls])

  for (const value of allValues) {
    const initialCount = initialFreq.get(value) ?? 0
    const newCount = newFreq.get(value) ?? 0
    const diff = newCount - initialCount

    if (diff > 0) {
      // More of this value in new array - it was added
      for (let i = 0; i < diff; i++) {
        added.push(value)
      }
    } else if (diff < 0) {
      // Fewer of this value in new array - it was removed
      for (let i = 0; i < Math.abs(diff); i++) {
        removed.push(value)
      }
    }
  }

  return { ...baseLog, added, removed }
}

export function mergeLogs(existingLogs: ModifierLog[], newLog: ModifierLog): ModifierLog[] {
  return [...existingLogs, newLog]
}

