function calculateStartPos(
  notationString: string,
  currentMatch: RegExpMatchArray,
  prevMatch: RegExpMatchArray | undefined,
  index: number
): number {
  if (index === 0) return 0
  if (currentMatch.index === undefined) return 0

  const prevEndPos = prevMatch ? Number(prevMatch.index) + prevMatch[0].length : 0
  const textBetween = notationString.slice(prevEndPos, currentMatch.index)
  const arithmeticMatch = /([+-])/.exec(textBetween)

  if (arithmeticMatch?.[1]) {
    return prevEndPos + textBetween.indexOf(arithmeticMatch[1])
  }
  return currentMatch.index
}

export function listOfNotations(notationString: string, coreMatches: RegExpMatchArray[]): string[] {
  return coreMatches
    .map((currentMatch, i) => {
      if (currentMatch.index === undefined) return null

      const prevMatch = coreMatches[i - 1]
      const nextMatch = coreMatches[i + 1]

      const startPos = calculateStartPos(notationString, currentMatch, prevMatch, i)
      const endPos = nextMatch?.index ?? notationString.length

      return notationString.slice(startPos, endPos).trim()
    })
    .filter((expression): expression is string => expression !== null && expression.length > 0)
}
