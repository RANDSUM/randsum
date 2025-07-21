import {
  ArithmeticModifier,
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../modifiers'
import { coreNotationPattern } from '../patterns'
import type { DiceNotation, RollOptions } from '../../types'

export function notationToOptions(notationString: DiceNotation): RollOptions[] {
  const coreMatches = Array.from(
    notationString.matchAll(new RegExp(coreNotationPattern.source, 'g'))
  )

  if (coreMatches.length <= 1) {
    return [singleNotationToOptions(notationString)]
  }

  return listOfNotations(notationString, coreMatches).map(
    singleNotationToOptions
  )
}

function listOfNotations(
  notationString: string,
  coreMatches: RegExpMatchArray[]
): string[] {
  const completeExpressions: string[] = []

  for (let i = 0; i < coreMatches.length; i++) {
    const currentMatch = coreMatches[i]
    const nextMatch = coreMatches[i + 1]

    if (currentMatch?.index === undefined) continue

    let startPos: number

    if (i === 0) {
      startPos = 0
    } else {
      // Look for arithmetic operator before this dice expression
      const prevMatch = coreMatches[i - 1]
      const prevEndPos = prevMatch
        ? Number(prevMatch.index) + prevMatch[0].length
        : 0
      const textBetween = notationString.slice(prevEndPos, currentMatch.index)
      const arithmeticMatch = /([+-])/.exec(textBetween)

      if (arithmeticMatch?.[1]) {
        startPos = prevEndPos + textBetween.indexOf(arithmeticMatch[1])
      } else {
        startPos = currentMatch.index
      }
    }

    const endPos = nextMatch?.index ?? notationString.length

    const expression = notationString.slice(startPos, endPos).trim()
    if (expression) {
      completeExpressions.push(expression)
    }
  }
  return completeExpressions
}

function singleNotationToOptions(notationString: string): RollOptions {
  const trimmedNotationString = notationString.trim()
  const coreNotationMatch =
    trimmedNotationString.match(coreNotationPattern)?.at(0) ?? ''
  const modifiersString = trimmedNotationString.replace(coreNotationMatch, '')
  const [quantityNot, sidesNotation = ''] = coreNotationMatch.split(/[Dd]/)

  const core = {
    quantity: Math.abs(Number(quantityNot)),
    arithmetic:
      Number(quantityNot) < 0 ? ('subtract' as const) : ('add' as const),
    sides: Number(sidesNotation)
  }

  if (modifiersString.length === 0) {
    return core
  }

  return {
    ...core,
    modifiers: {
      ...DropModifier.parse(modifiersString),
      ...ExplodeModifier.parse(modifiersString),
      ...UniqueModifier.parse(modifiersString),
      ...ReplaceModifier.parse(modifiersString),
      ...RerollModifier.parse(modifiersString),
      ...CapModifier.parse(modifiersString),
      ...ArithmeticModifier.parsePlus(modifiersString),
      ...ArithmeticModifier.parseMinus(modifiersString)
    }
  }
}
