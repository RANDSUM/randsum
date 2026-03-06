export function extractRandsumDeps(code: string): Record<string, string> {
  const matches = code.matchAll(/from ['"](@randsum\/[\w-]+)['"]/g)
  const packages = [...new Set([...matches].map(([, pkg]) => pkg))]
  return Object.fromEntries(packages.map(pkg => [pkg, 'latest']))
}
