export function extractRandsumDeps(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const matches = code.matchAll(/from ['"](@randsum\/[a-z-]+(?:\/[a-z-]+)*)['"]/g)
  for (const match of matches) {
    const pkg = match[1]
    if (pkg) deps[pkg] = 'latest'
  }
  return deps
}
