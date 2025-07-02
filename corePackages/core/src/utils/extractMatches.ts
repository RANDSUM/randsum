export function extractMatches(
  notationString: string,
  pattern: RegExp
): string[] {
  const MAX_INPUT_LENGTH = 1000

  if (notationString.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input string too long: ${String(notationString.length)} characters exceeds maximum of ${String(MAX_INPUT_LENGTH)}`
    )
  }

  return [...notationString.matchAll(pattern)].map((matches) => matches[0])
}
