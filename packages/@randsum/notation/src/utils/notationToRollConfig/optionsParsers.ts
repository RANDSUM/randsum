import {
  dropHighestPattern,
  dropLowestPattern,
  dropConstraintsPattern,
  explodePattern,
  uniquePattern,
  replacePattern,
  rerollPattern,
  capPattern,
  plusPattern,
  minusPattern
} from './patterns'
import type {
  RequiredCoreDiceParameters,
  DropOptions,
  GreaterLessOptions,
  Modifiers,
  RerollOptions
} from '@randsum/core'

export function parseCoreNotation(
  notationString: string
): RequiredCoreDiceParameters {
  const [quantity, sides] = notationString.split(/[Dd]/)

  return {
    quantity: Number(quantity),
    sides: Number(sides)
  }
}

function parseCapNotation(modifiersString: string): Pick<Modifiers, 'cap'> {
  const notations = extractMatches(modifiersString, capPattern)
  if (notations.length === 0) {
    return {}
  }
  return notations.reduce(
    (acc, notationString) => {
      const capString = notationString
        .split(/[Cc]/)[1]
        .replaceAll(/{|}/g, '')
        .split(',')

      const capOptions = capString.reduce((innerAcc, note) => {
        if (note.includes('<')) {
          return {
            ...innerAcc,
            lessThan: Number(note.replaceAll('<', ''))
          }
        }
        return {
          ...innerAcc,
          greaterThan: Number(note.replaceAll('>', ''))
        }
      }, {} as GreaterLessOptions)

      return {
        cap: {
          ...acc.cap,
          ...capOptions
        }
      }
    },
    { cap: {} } as Pick<Modifiers, 'cap'>
  )
}

function parseUniqueNotation(
  modifiersString: string
): Pick<Modifiers, 'unique'> {
  const notations = extractMatches(modifiersString, uniquePattern)
  if (notations.length === 0) {
    return {}
  }
  return notations.reduce(
    (acc, notationString) => {
      if (notationString === 'u' || notationString === 'U') {
        if (typeof acc.unique === 'object') {
          return acc
        }
        return { unique: true }
      }
      const notUnique = notationString
        .replaceAll(/[Uu]{/g, '')
        .replaceAll('}', '')
        .split(',')

      return {
        unique: {
          notUnique: notUnique.map(Number)
        }
      }
    },
    { unique: false } as Pick<Modifiers, 'unique'>
  )
}

function parseDropConstraintsNotation(
  notations: string[]
): Pick<Modifiers, 'drop'> {
  if (notations.length === 0) {
    return {}
  }
  const dropConstraintParameters: DropOptions = {}

  return notations.reduce(
    (acc, notationString) => {
      const constraints = notationString
        .split(/[Dd]/)[1]
        .replaceAll('{', '')
        .replaceAll('}', '')
        .split(',')
      const parsedConstraints = constraints.reduce((innerAcc, constraint) => {
        if (constraint.includes('<')) {
          return {
            ...innerAcc,
            lessThan: Number(constraint.split('<')[1])
          }
        }

        if (constraint.includes('>')) {
          return {
            ...innerAcc,
            greaterThan: Number(constraint.split('>')[1])
          }
        }

        const exact = [...(innerAcc?.exact || []), Number(constraint)]
        return {
          ...innerAcc,
          ...(exact.length > 0 ? { exact } : {})
        }
      }, dropConstraintParameters)

      return {
        drop: {
          ...acc.drop,
          ...parsedConstraints
        }
      }
    },
    { drop: dropConstraintParameters }
  )
}

function parseDropHighNotation(notations: string[]): Pick<Modifiers, 'drop'> {
  if (notations.length === 0) {
    return {}
  }

  const notationString = notations[notations.length - 1]
  const highestCount = notationString.split(/[Hh]/)[1]

  return {
    drop: { highest: highestCount === '' ? 1 : Number(highestCount) }
  }
}

function parseDropLowNotation(notations: string[]): Pick<Modifiers, 'drop'> {
  if (notations.length === 0) {
    return { drop: {} }
  }
  const notationString = notations[notations.length - 1]
  const lowestCount = notationString.split(/[Ll]/)[1]

  return {
    drop: {
      lowest: lowestCount === '' ? 1 : Number(lowestCount)
    }
  }
}

function parseRerollNotation(
  modifiersString: string
): Pick<Modifiers, 'reroll'> {
  const notations = extractMatches(modifiersString, rerollPattern)
  if (notations.length === 0) {
    return {}
  }
  return notations.reduce(
    (acc, notationString) => {
      const parsedString = notationString
        .split(/[Rr]/)[1]
        .replaceAll('{', '')
        .replaceAll('}', ',!')
        .split(',')

      const rerollOptions = parsedString.reduce((innerAcc, notation) => {
        if (notation === '!') {
          return innerAcc
        }
        if (notation.includes('<')) {
          return {
            ...innerAcc,
            lessThan: Number(notation.split('<')[1])
          }
        }
        if (notation.includes('>')) {
          return {
            ...innerAcc,
            greaterThan: Number(notation.split('>')[1])
          }
        }
        if (notation.includes('!')) {
          return {
            ...innerAcc,
            maxReroll: Number(notation.split('!')[1])
          }
        }
        return {
          ...innerAcc,
          exact: [
            ...(Array.isArray(innerAcc?.exact) ? innerAcc.exact : []),
            Number(notation)
          ]
        }
      }, {} as RerollOptions)

      return {
        reroll: {
          ...acc.reroll,
          ...rerollOptions
        }
      }
    },
    { reroll: {} }
  )
}

function parseExplodeNotation(
  modifiersString: string
): Pick<Modifiers, 'explode'> {
  const notations = extractMatches(modifiersString, explodePattern)
  return notations.length === 0
    ? {}
    : {
        explode: true
      }
}

function parseMinusNotation(
  modifiersString: string
): Pick<Modifiers, 'subtract'> {
  const notations = extractMatches(modifiersString, minusPattern)
  if (notations.length === 0) {
    return {}
  }
  const subtract = notations
    .map((notationString) => Number(notationString.split('-')[1]))
    .reduce((acc, num) => acc - num, 0)

  return {
    subtract: Math.abs(subtract)
  }
}

function parsePlusNotation(modifiersString: string): Pick<Modifiers, 'add'> {
  const notations = extractMatches(modifiersString, plusPattern)
  if (notations.length === 0) {
    return {}
  }
  const add = notations
    .map((notationString) => Number(notationString.split('+')[1]))
    .reduce((acc, num) => acc + num, 0)

  return {
    add
  }
}

function parseReplaceNotation(
  modifiersString: string
): Pick<Modifiers, 'replace'> {
  const notations = extractMatches(modifiersString, replacePattern)
  if (notations.length === 0) {
    return {}
  }
  const replace = notations
    .map((notationString) => {
      const replaceOptions = notationString
        .split(/[Vv]/)[1]
        .replaceAll('{', '')
        .replaceAll('}', '')
        .split(',')
        .map((replacement) => {
          const [noteFrom, noteTo] = replacement.split('=')

          const coreReplacement = { to: Number(noteTo) }
          if (noteFrom.includes('>')) {
            return {
              ...coreReplacement,
              from: { greaterThan: Number(noteFrom.replaceAll('>', '')) }
            }
          }
          if (noteFrom.includes('<')) {
            return {
              ...coreReplacement,
              from: { lessThan: Number(noteFrom.replaceAll('<', '')) }
            }
          }
          return { ...coreReplacement, from: Number(noteFrom) }
        })

      return replaceOptions.length === 1
        ? replaceOptions[0]
        : replaceOptions.filter(Boolean)
    })
    .flat()
  return { replace }
}

function parseDropModifiers(modifiersString: string): Pick<Modifiers, 'drop'> {
  const dropHighModifiers = parseDropHighNotation(
    extractMatches(modifiersString, dropHighestPattern)
  )
  const dropLowModifiers = parseDropLowNotation(
    extractMatches(modifiersString, dropLowestPattern)
  )
  const dropConstraintsModifiers = parseDropConstraintsNotation(
    extractMatches(modifiersString, dropConstraintsPattern)
  )

  const rawDropModifiers = {
    drop: {
      ...dropHighModifiers.drop,
      ...dropLowModifiers.drop,
      ...dropConstraintsModifiers.drop
    }
  }

  return Object.keys(rawDropModifiers.drop).length > 0 ? rawDropModifiers : {}
}

function extractMatches(notationString: string, pattern: RegExp) {
  return [...(notationString.matchAll(pattern) || [])].map(
    (matches) => matches[0]
  )
}

export function parseModifiers(modifiersString: string): {
  modifiers: Modifiers
} {
  return {
    modifiers: {
      ...parseDropModifiers(modifiersString),
      ...parseExplodeNotation(modifiersString),
      ...parseUniqueNotation(modifiersString),
      ...parseReplaceNotation(modifiersString),
      ...parseRerollNotation(modifiersString),
      ...parseCapNotation(modifiersString),
      ...parsePlusNotation(modifiersString),
      ...parseMinusNotation(modifiersString)
    }
  }
}
