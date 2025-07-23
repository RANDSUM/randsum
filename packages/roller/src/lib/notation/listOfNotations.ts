export function listOfNotations(
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
