import { isValidModifier } from '../../guards'
import type {
  GreaterLessOptions,
  DropOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions,
  RollConfig,
  DiceNotation
} from '../../types'

function capNotation(cap: GreaterLessOptions) {
  const capList = formatGreaterLess(cap)
  return `C{${capList.join(',')}}`
}

function dropNotation(drop: DropOptions) {
  const dropList: string[] = []
  const greaterLess = formatGreaterLess(drop)
  greaterLess.forEach((str) => dropList.push(str))
  if (drop.exact) {
    drop.exact.forEach((roll) => {
      dropList.push(String(roll))
    })
  }

  const finalList = []

  if (drop.highest) {
    finalList.push(`H${drop.highest > 1 ? drop.highest : ''}`)
  }

  if (drop.lowest) {
    finalList.push(`L${drop.lowest > 1 ? drop.lowest : ''}`)
  }

  if (dropList.length > 0) {
    finalList.push(`D{${dropList.map((str) => str).join(',')}}`)
  }

  return finalList.join('')
}

function replaceNotation(replace: ReplaceOptions | ReplaceOptions[]) {
  const args = (
    Array.isArray(replace)
      ? replace.map(singleReplaceNotation).flat()
      : [singleReplaceNotation(replace)]
  ).join(',')
  return `V{${args}}`
}

function rerollNotation(reroll: RerollOptions) {
  const rerollList = []

  if (reroll.exact) {
    reroll.exact.forEach((roll) => {
      rerollList.push(String(roll))
    })
  }
  const greaterLess = formatGreaterLess(reroll)
  if (greaterLess.length > 0) {
    rerollList.push(greaterLess.join(','))
  }

  const maxNotation = reroll.maxReroll ? reroll.maxReroll : ''

  if (rerollList.length === 0) return ''
  return `R{${rerollList.join(',')}}${maxNotation}`
}

function explodeNotation() {
  return '!'
}
function addNotation(plus: number) {
  return `+${plus}`
}

function minusNotation(minus: number) {
  return `-${minus}`
}

function uniqueNotation(unique: boolean | UniqueOptions) {
  if (typeof unique === 'boolean') return 'U'
  return `U{${unique.notUnique.join(',')}}`
}

function formatGreaterLess(options: GreaterLessOptions, list: string[] = []) {
  if (options.greaterThan) {
    list.push(`>${options.greaterThan}`)
  }
  if (options.lessThan) {
    list.push(`<${options.lessThan}`)
  }

  return list
}

function singleReplaceNotation(replace: ReplaceOptions) {
  const fromValue =
    typeof replace.from === 'number'
      ? replace.from
      : formatGreaterLess(replace.from).join(',')
  return `${fromValue}=${replace.to}`
}

export function formatModifierNotation({ modifiers }: RollConfig): string {
  if (!isValidModifier(modifiers)) return ''

  const modifierStrings = []

  if (modifiers.cap) modifierStrings.push(capNotation(modifiers.cap))
  if (modifiers.drop) modifierStrings.push(dropNotation(modifiers.drop))
  if (modifiers.replace)
    modifierStrings.push(replaceNotation(modifiers.replace))
  if (modifiers.reroll) modifierStrings.push(rerollNotation(modifiers.reroll))
  if (modifiers.explode) modifierStrings.push(explodeNotation())
  if (modifiers.unique) modifierStrings.push(uniqueNotation(modifiers.unique))
  if (modifiers.add) modifierStrings.push(addNotation(modifiers.add))
  if (modifiers.minus) modifierStrings.push(minusNotation(modifiers.minus))

  return modifierStrings.join('')
}

export function formatCoreNotation({
  quantity = 1,
  sides
}: RollConfig): DiceNotation {
  const formattedSides = Array.isArray(sides)
    ? `{${sides.map((s) => (s === '' ? ' ' : s)).join('')}}`
    : sides
  return `${quantity}d${formattedSides}` as DiceNotation
}
