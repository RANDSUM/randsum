import { spawnSync } from 'node:child_process'

// Format generated source with Biome's formatter so the output matches house
// style (the repo's biome.json — the single formatter for the monorepo). We
// shell out to the workspace Biome binary via stdin. The stdin file path uses a
// plain `.ts` extension (not `.generated.ts`, which biome.json excludes from
// normal formatting) so the formatter always applies, mirroring how a
// hand-written src file would be formatted.
export function formatGeneratedCode(code: string, filepath: string): string {
  const stdinPath = filepath.replace(/\.generated\.ts$/, '.ts')
  const result = spawnSync('bunx', ['@biomejs/biome', 'format', `--stdin-file-path=${stdinPath}`], {
    input: code,
    encoding: 'utf-8'
  })
  if (result.status !== 0) {
    throw new Error(
      `biome format failed for ${filepath}: ${result.stderr || result.stdout || 'unknown error'}`
    )
  }
  return result.stdout
}
