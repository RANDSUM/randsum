import type { DiceNotation, RollOptions } from '../../types/core'
import { coreNotationPattern } from '../patterns'
import { parseModifiers } from '../modifiers/parsing'

const globalCoreNotationPattern = new RegExp(coreNotationPattern.source, 'g')

export function notationToOptions<T = string>(
  notationString: DiceNotation
): RollOptions<T>[] {
  const coreMatches = Array.from(
    notationString.matchAll(globalCoreNotationPattern)
  )

  if (coreMatches.length <= 1) {
    return [singleNotationToOptions(notationString)]
  }

  return listOfNotations(notationString, coreMatches).map(
    singleNotationToOptions<T>
  )
}

function listOfNotations(
  notationString: string,
  coreMatches: RegExpMatchArray[]
): string[] {
  const completeExpressions: string[] = []

  for (const [i, currentMatch] of coreMatches.entries()) {
    const nextMatch = coreMatches[i + 1]

    if (currentMatch.index === undefined) continue

    let startPos: number

    if (i === 0) {
      startPos = 0
    } else {
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

function singleNotationToOptions<T>(notationString: string): RollOptions<T> {
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
    modifiers: parseModifiers(modifiersString)
  }
}
