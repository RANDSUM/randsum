import type {
  DropOptions,
  GreaterLessOptions,
  Modifiers,
  ReplaceOptions,
  RequiredCoreDiceParameters,
  RerollOptions
} from '@randsum/core'

class InvalidUniqueError extends Error {
  constructor() {
    super(
      'You cannot have unique rolls when there are more rolls than sides of die.'
    )
  }
}

export function applyUnique(
  rolls: number[],
  {
    unique,
    sides,
    quantity
  }: RequiredCoreDiceParameters & Pick<Modifiers, 'unique'>,
  rollOne: () => number
): number[] {
  if (quantity > sides) {
    throw new InvalidUniqueError()
  }
  const notUnique =
    unique === undefined || typeof unique === 'boolean'
      ? []
      : unique.notUnique.map(Number)

  const filteredArray = new Set(
    rolls.filter((n) => !notUnique.includes(Number(n)))
  )
  return rolls.map(Number).map((roll, index, array) => {
    let newRoll: number
    if (array.indexOf(roll) === index || notUnique.includes(roll)) {
      return roll
    }
    do {
      newRoll = rollOne()
    } while (filteredArray.has(newRoll))
    return newRoll
  })
}

export function applySingleCap(
  { greaterThan, lessThan }: GreaterLessOptions,
  value?: number
) {
  return (roll: number) => {
    if (greaterThan !== undefined && roll > greaterThan) {
      return value ?? greaterThan
    }
    if (lessThan !== undefined && roll < lessThan) {
      return value ?? lessThan
    }
    return roll
  }
}

function rerollRoll(
  roll: number,
  { greaterThan, lessThan, exact, maxReroll }: RerollOptions,
  rollOne: () => number,
  index = 0
): number {
  if (maxReroll === index) {
    return roll
  }
  if (index === 99) {
    return roll
  }

  const exactValue =
    exact !== undefined && Array.isArray(exact)
      ? exact.includes(roll)
      : exact === roll
  if (
    (greaterThan !== undefined && roll > greaterThan) ||
    (lessThan !== undefined && roll < lessThan) ||
    exactValue
  ) {
    return rerollRoll(
      rollOne(),
      { greaterThan, lessThan, exact, maxReroll },
      rollOne,
      index + 1
    )
  }
  return roll
}

export function applyReroll(
  rolls: number[],
  reroll: RerollOptions,
  rollOne: () => number
): number[] {
  const newRolls = [...rolls]
  return newRolls.map((roll) => rerollRoll(roll, reroll, rollOne))
}

export function applyReplace(
  rolls: number[],
  replace: ReplaceOptions | ReplaceOptions[]
): number[] {
  const parameters = Array.isArray(replace) ? replace : [replace]

  let replaceRolls = rolls

  parameters.forEach(({ from, to }) => {
    replaceRolls = replaceRolls.map((roll) => {
      if (from !== undefined) {
        if (typeof from === 'object') {
          return applySingleCap(from, to)(roll)
        }
        if (roll === from) {
          return to
        }
      }
      return roll
    })
  })

  return replaceRolls
}

export function applyExplode(
  rolls: number[],
  { sides }: Pick<RequiredCoreDiceParameters, 'sides'>,
  rollOne: () => number
): number[] {
  const explodeCount = rolls.filter((roll) => roll === sides).length
  const explodeResults = Array.from({ length: explodeCount }, rollOne)
  return [...rolls, ...explodeResults]
}

function times(iterator: number) {
  return (callback: (index?: number) => void) => {
    if (iterator > 0) {
      callback(iterator)
      times(iterator - 1)(callback)
    }
  }
}

export function applyDrop(
  rolls: number[],
  { highest, lowest, greaterThan, lessThan, exact }: DropOptions
): number[] {
  const sortedResults = rolls
    .filter(
      (roll) =>
        !(
          (greaterThan !== undefined && roll > greaterThan) ||
          (lessThan !== undefined && roll < lessThan) ||
          exact?.map((number) => number).includes(roll) === true
        )
    )
    .sort((a, b) => a - b)

  if (highest !== undefined) {
    times(highest)(() => sortedResults.pop())
  }

  if (lowest !== undefined) {
    times(lowest)(() => sortedResults.shift())
  }

  return sortedResults
}
