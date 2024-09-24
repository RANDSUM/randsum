import { isValidModifier } from '~guards'
import {
  GreaterLessOptions,
  DropOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions,
  RandsumRollOptions
} from '~types'

function formatHumanList(list: (string | number)[]) {
  return list
    .map((num, index, list) => {
      if (list.length === 1) return `[${num}]`

      if (index === list.length - 1) return `and [${num}]`

      return `[${num}] `
    })
    .join('')
}

function capString(cap: GreaterLessOptions) {
  return formatGreaterLess(cap).map((str) => `No Rolls ${str}`)
}

function dropString(drop: DropOptions) {
  const dropList = []

  if (drop.highest)
    dropList.push(`Drop highest${drop.highest > 1 ? ` ${drop.highest}` : ''}`)

  if (drop.lowest)
    dropList.push(`Drop lowest${drop.lowest > 1 ? ` ${drop.lowest}` : ''}`)

  if (drop.exact) {
    const exact = formatHumanList(drop.exact)
    dropList.push(`Drop ${exact}`)
  }

  formatGreaterLess(drop).forEach((str) => dropList.push(`Drop ${str}`))

  return dropList
}

function replaceString(replace: ReplaceOptions | ReplaceOptions[]) {
  if (Array.isArray(replace)) return replace.map(singleReplaceString)

  return [singleReplaceString(replace)]
}

function rerollString(reroll: RerollOptions) {
  const rerollList: string[] = []

  if (reroll.exact) {
    reroll.exact.forEach((roll) => {
      rerollList.push(String(roll))
    })
  }
  const greaterLess = `${formatGreaterLess(reroll).join(' and ')}`

  const maxString = reroll.maxReroll ? ` (up to ${reroll.maxReroll} times)` : ''
  const exactList = formatHumanList(rerollList)

  const exactString = [exactList, greaterLess]
    .filter((i) => i !== '')
    .join(', ')

  if (exactString === '') return []
  return [`Reroll ${exactString}${maxString}`]
}

function explodeString() {
  return 'Exploding Dice'
}

function plusString(plus: number) {
  return `Add ${plus}`
}

function minusString(minus: number) {
  return `Subtract ${minus}`
}

function uniqueString(unique: boolean | UniqueOptions) {
  if (typeof unique === 'boolean') return 'No Duplicate Rolls'
  return `No Duplicates (except ${formatHumanList(unique.notUnique)})`
}

function formatGreaterLess(options: GreaterLessOptions, list: string[] = []) {
  if (options.greaterThan) {
    list.push(`greater than [${options.greaterThan}]`)
  }
  if (options.lessThan) {
    list.push(`less than [${options.lessThan}]`)
  }

  return list
}

function extractFromValue(from: number | GreaterLessOptions) {
  if (typeof from === 'number') return `[${from}]`

  return formatGreaterLess(from).join(' and ')
}

function singleReplaceString(replace: ReplaceOptions) {
  return `Replace ${extractFromValue(replace.from)} with [${replace.to}]`
}

export function formatCoreDescriptions({
  sides,
  quantity
}: RandsumRollOptions<number | string>) {
  const base = `Roll ${quantity}`
  const descriptor = (quantity || 1) > 1 ? 'dice' : 'die'
  if (Array.isArray(sides)) {
    const formattedSides = `${descriptor} with the following sides: (${sides
      .map((s) => (s === '' ? ' ' : s))
      .join(',')})`
    return `${base} ${formattedSides}`
  }

  return `${base} ${sides}-sided ${descriptor}`
}

export function formatModifierDescriptions({
  modifiers
}: RandsumRollOptions<number | string>): string[] {
  if (!isValidModifier(modifiers)) return []

  const modifierStrings = []

  if (modifiers.cap)
    capString(modifiers.cap).forEach((str) => modifierStrings.push(str))
  if (modifiers.drop)
    dropString(modifiers.drop).forEach((str) => modifierStrings.push(str))
  if (modifiers.replace)
    replaceString(modifiers.replace).forEach((str) => modifierStrings.push(str))
  if (modifiers.reroll)
    rerollString(modifiers.reroll).forEach((str) => modifierStrings.push(str))
  if (modifiers.explode) modifierStrings.push(explodeString())
  if (modifiers.unique) modifierStrings.push(uniqueString(modifiers.unique))
  if (modifiers.plus) modifierStrings.push(plusString(modifiers.plus))
  if (modifiers.minus) modifierStrings.push(minusString(modifiers.minus))

  return modifierStrings
}
