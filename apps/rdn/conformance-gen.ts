import { CONFORMANCE_FILE } from './src/conformance/vectors'

const STABLE_KEY_ORDER = [
  'id',
  'notation',
  'category',
  'seedRolls',
  'rerollRolls',
  'explodeRolls',
  'compoundRolls',
  'penetrateRolls',
  'sequenceRolls',
  'expectedPool',
  'expectedTotal',
  'section',
  'conformanceLevel',
  'expectedError',
  'errorDescription',
  'note'
] as const

function stableVector(v: object): object {
  return Object.fromEntries(
    STABLE_KEY_ORDER.filter(k => k in v).map(k => [k, (v as Record<string, unknown>)[k]])
  )
}

const output = {
  $id: CONFORMANCE_FILE.$id,
  specVersion: CONFORMANCE_FILE.specVersion,
  generatedFrom: CONFORMANCE_FILE.generatedFrom,
  conformanceLevels: CONFORMANCE_FILE.conformanceLevels,
  vectors: CONFORMANCE_FILE.vectors.map(stableVector)
}

const outPath = new URL('./public/conformance/v0.9.0.json', import.meta.url)
const raw = JSON.stringify(output, null, 2) + '\n'

const proc = Bun.spawnSync(
  [
    'bunx',
    'prettier',
    '--parser',
    'json',
    '--print-width',
    '100',
    '--tab-width',
    '2',
    '--trailing-comma',
    'none',
    '--stdin-filepath',
    'v0.9.0.json'
  ],
  { stdin: new TextEncoder().encode(raw), cwd: import.meta.dir }
)

if (proc.exitCode !== 0) {
  console.error('Prettier failed:', new TextDecoder().decode(proc.stderr))
  process.exit(1)
}

await Bun.write(outPath, new TextDecoder().decode(proc.stdout))
console.warn(`Written: ${outPath.pathname}`)
