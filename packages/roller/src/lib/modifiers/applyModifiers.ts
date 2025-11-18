import type {
  CapModifierOptions,
  DropModifierOptions,
  ModifierLog,
  NumericRollBonus,
  ReplaceModifierOptions,
  ReplaceRule,
  RequiredNumericRollParameters,
  RerollModifierOptions,
  UniqueModifierOptions
} from '../../types'

type ModifierKind = ModifierLog['modifier']

type RollOne = () => number

function cloneBonus(bonus: NumericRollBonus): NumericRollBonus {
  return {
    rolls: [...bonus.rolls],
    simpleMathModifier: bonus.simpleMathModifier,
    logs: [...bonus.logs]
  }
}

function pushLog(
  bonus: NumericRollBonus,
  modifier: ModifierKind,
  options: unknown,
  removed: number[],
  added: number[]
): void {
  if (!removed.length && !added.length && modifier !== 'unique') return
  const log: ModifierLog = { modifier, options, removed, added }
  bonus.logs = [...bonus.logs, log]
}

export function applyModifiers(
  modifier: ModifierKind,
  options:
    | number
    | CapModifierOptions
    | DropModifierOptions
    | RerollModifierOptions
    | UniqueModifierOptions
    | ReplaceModifierOptions
    | boolean
    | undefined,
  bonus: NumericRollBonus,
  context?: RequiredNumericRollParameters,
  rollOne?: RollOne
): NumericRollBonus {
  if (options === undefined) return bonus

  switch (modifier) {
    case 'plus':
    case 'minus': {
      if (typeof options !== 'number') return bonus
      const next = cloneBonus(bonus)
      next.simpleMathModifier = modifier === 'plus' ? options : -options
      return next
    }

    case 'cap': {
      const opt = options as CapModifierOptions
      const removed: number[] = []
      const added: number[] = []
      const rolls = bonus.rolls.map(v => {
        let next = v
        if (opt.lessThan !== undefined && v < opt.lessThan) {
          removed.push(v)
          next = opt.lessThan
          added.push(next)
        }
        if (opt.greaterThan !== undefined && v > opt.greaterThan) {
          removed.push(v)
          next = opt.greaterThan
          added.push(next)
        }
        return next
      })
      const next: NumericRollBonus = { ...bonus, rolls }
      pushLog(next, 'cap', opt, removed, added)
      return next
    }

    case 'drop': {
      const opt = options as DropModifierOptions
      const removed: number[] = []

      let remaining = [...bonus.rolls]

      // First apply value-based filters
      if (opt.exact && opt.exact.length) {
        remaining = remaining.filter(v => {
          if (opt.exact!.includes(v)) {
            removed.push(v)
            return false
          }
          return true
        })
      }

      if (opt.greaterThan !== undefined) {
        remaining = remaining.filter(v => {
          if (v > opt.greaterThan!) {
            removed.push(v)
            return false
          }
          return true
        })
      }

      if (opt.lessThan !== undefined) {
        remaining = remaining.filter(v => {
          if (v < opt.lessThan!) {
            removed.push(v)
            return false
          }
          return true
        })
      }

      // Then apply lowest / highest trimming
      if (opt.lowest) {
        const sorted = [...remaining].sort((a, b) => a - b)
        const toDrop = sorted.slice(0, opt.lowest)
        remaining = remaining.filter(v => {
          const idx = toDrop.indexOf(v)
          if (idx !== -1) {
            removed.push(v)
            toDrop.splice(idx, 1)
            return false
          }
          return true
        })
      }

      if (opt.highest) {
        const sorted = [...remaining].sort((a, b) => a - b)
        const toDrop = sorted.slice(-opt.highest)
        remaining = remaining.filter(v => {
          const idx = toDrop.indexOf(v)
          if (idx !== -1) {
            removed.push(v)
            toDrop.splice(idx, 1)
            return false
          }
          return true
        })
      }

      // Sort remaining only when using highest/lowest semantics, to match
      // expectations in the tests for those modifiers.
      if (opt.highest || opt.lowest) {
        remaining.sort((a, b) => a - b)
      }

      removed.sort((a, b) => a - b)

      const next: NumericRollBonus = { ...bonus, rolls: remaining }
      pushLog(next, 'drop', opt, removed, [])
      return next
    }

    case 'reroll': {
      if (!context || !rollOne) {
        throw new Error('rollOne function required for reroll modifier')
      }
      const opt = options as RerollModifierOptions
      const removed: number[] = []
      const added: number[] = []

      const shouldReroll = (value: number): boolean => {
        if (opt.exact && opt.exact.includes(value)) return true
        if (opt.greaterThan !== undefined && value > opt.greaterThan) return true
        if (opt.lessThan !== undefined && value < opt.lessThan) return true
        return false
      }

      const hasMaxDice = opt.max !== undefined
      const maxDice = opt.max ?? 0
      let diceRerolled = 0

      const rolls = bonus.rolls.map(value => {
        if (!shouldReroll(value)) return value

        if (hasMaxDice && diceRerolled >= maxDice) {
          return value
        }

        const original = value
        let current = value
        let attempts = 0
        const perDieLimit = hasMaxDice ? 99 : opt.max ?? 99

        while (shouldReroll(current) && attempts < perDieLimit) {
          current = rollOne()
          attempts++
        }

        removed.push(original)
        added.push(current)
        if (hasMaxDice) diceRerolled++

        return current
      })

      const next: NumericRollBonus = { ...bonus, rolls }
      pushLog(next, 'reroll', opt, removed, added)
      return next
    }

    case 'explode': {
      if (!context || !rollOne) {
        throw new Error('rollOne and context required for explode modifier')
      }
      if (!options) return bonus
      const removed: number[] = []
      const added: number[] = []

      const rolls = [...bonus.rolls]
      for (const value of bonus.rolls) {
        if (value === context.sides) {
          const extra = rollOne()
          rolls.push(extra)
          added.push(extra)
        }
      }

      const next: NumericRollBonus = { ...bonus, rolls }
      pushLog(next, 'explode', true, removed, added)
      return next
    }

    case 'unique': {
      if (!context || !rollOne) {
        throw new Error('rollOne and context required for unique modifier')
      }

      const opt = options as UniqueModifierOptions
      const notUnique = opt === true ? [] : opt.notUnique
      const removed: number[] = []
      const added: number[] = []

      const seen = new Set<number>()
      const result: number[] = []

      const maxUnique = context.sides
      if (bonus.rolls.length > maxUnique && notUnique.length === 0) {
        throw new Error('Cannot have more rolls than sides when unique is enabled')
      }

      bonus.rolls.forEach(value => {
        if (notUnique.includes(value) || !seen.has(value)) {
          seen.add(value)
          result.push(value)
          return
        }

        // Need a new unique value
        if (seen.size >= maxUnique && !notUnique.length) {
          throw new Error('Cannot have more rolls than sides when unique is enabled')
        }

        let next = rollOne()
        let guard = 0
        while (seen.has(next) && !notUnique.includes(next) && guard < 1000) {
          removed.push(next)
          next = rollOne()
          guard++
        }
        seen.add(next)
        removed.push(value)
        added.push(next)
        result.push(next)
      })

      const next: NumericRollBonus = { ...bonus, rolls: result }
      pushLog(next, 'unique', options, removed, added)
      return next
    }

    case 'replace': {
      const rulesArray: ReplaceRule[] = Array.isArray(options)
        ? (options as ReplaceRule[])
        : [options as ReplaceRule]

      const removed: number[] = []
      const added: number[] = []

      const applyRule = (value: number): number => {
        for (const rule of rulesArray) {
          const from = rule.from
          if (typeof from === 'number') {
            if (value === from) {
              removed.push(value)
              added.push(rule.to)
              return rule.to
            }
          } else {
            const cmp = from as ReplaceComparison
            if (
              (cmp.greaterThan !== undefined && value > cmp.greaterThan) ||
              (cmp.lessThan !== undefined && value < cmp.lessThan)
            ) {
              removed.push(value)
              added.push(rule.to)
              return rule.to
            }
          }
        }
        return value
      }

      const rolls = bonus.rolls.map(applyRule)
      const next: NumericRollBonus = { ...bonus, rolls }
      pushLog(next, 'replace', options, removed, added)
      return next
    }

    default:
      return bonus
  }
}


