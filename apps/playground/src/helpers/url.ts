// URL helpers for playground shareable links.
// Kept in a standalone module so they can be tested without pulling in React.

export function resolveInitialNotation(params: URLSearchParams): string | null {
  const notationParam = params.get('notation')
  if (notationParam !== null) {
    return notationParam.length > 0 ? notationParam : null
  }
  const nParam = params.get('n')
  return nParam !== null && nParam.length > 0 ? nParam : null
}

export function buildNotationUrl(notation: string): string {
  return `?n=${encodeURIComponent(notation)}`
}

export function getCopyButtonLabel(isCopied: boolean): string {
  return isCopied ? 'Copied!' : 'Copy Link'
}
