export function extractMatches(
  notationString: string,
  pattern: RegExp
): string[] {
  return [...notationString.matchAll(pattern)].map((matches) => matches[0])
}
