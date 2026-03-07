export function extractRandsumDeps(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const matches = code.matchAll(/from ['"](@randsum\/[a-z-]+)['"]/g)
  for (const match of matches) {
    deps[match[1]] = 'latest'
  }
  return deps
}
