#!/usr/bin/env bun

/**
 * CI Aggregator Guard
 *
 * Usage: bun run check:ci-aggregator
 *
 * Proves the ONE required status check actually gates every job in ci.yml.
 *
 * WHY THIS EXISTS
 * ---------------
 * Branch protection on `main` requires exactly one context: "CI Gate". That job
 * (`ci-gate` in .github/workflows/ci.yml) is `if: always()` and decides pass/fail
 * by reading `join(needs.*.result)` — so its verdict covers precisely the jobs in
 * its hand-maintained `needs:` array, and NOTHING else. A job missing from that
 * list still runs, still goes red, and still cannot fail the merge: it is
 * invisible to the only check anyone requires.
 *
 * That is the worst failure mode a gate can have. It does not break, it stops
 * gating — silently, while every PR keeps showing green. Nothing in GitHub
 * Actions warns about it, because a `needs:` list that omits a job is perfectly
 * valid YAML and a perfectly valid workflow. The omission is visible only to
 * someone diffing two lists by eye, which is exactly the review step that gets
 * skipped when a job is added under time pressure.
 *
 * So: diff the two lists mechanically, in the root `check` chain and in CI.
 *
 * PRESENCE, NOT REACHABILITY
 * --------------------------
 * This checks that every job appears in `needs:` — it deliberately does NOT
 * reason about `if:` conditions. Most jobs here are path-filtered
 * (`if: needs.changes.outputs.roller == 'true'`), and a filtered-out job reports
 * `skipped`, which the gate's `if: always()` loop treats as a pass. That is
 * correct and intended. A job that is *absent* from `needs:` is a different
 * thing entirely: its `failure` is never even looked at.
 *
 * SCOPE
 * -----
 * `needs:` reaches only inside a single workflow file, so this guard can only
 * ever speak for ci.yml. It says so on every run rather than implying that a
 * green result means every workflow in the repo is gated.
 *
 * NO YAML PARSER
 * --------------
 * There is no YAML parser in this repo's dependencies (`yaml` appears only in the
 * root `overrides` block, which pins a transitive rather than declaring one), and
 * every other script in scripts/ imports node: builtins only. Depending on a
 * hoisted transitive would make this gate break the moment an unrelated dep drops
 * it, so the parse below is dependency-free and deliberately narrow: it reads two
 * things (top-level job keys, one job's `needs:` list) out of one file whose shape
 * we control, and hard-errors rather than guesses if that file does not look the
 * way it expects.
 *
 * Exit codes: 0 — every job is gated; 1 — a job is un-gated, or ci.yml could not
 * be read in the shape this check requires.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const WORKFLOW_DIR = '.github/workflows'
const WORKFLOW = `${WORKFLOW_DIR}/ci.yml`

/**
 * The aggregate job's key. This is the identity of the required status check
 * ("CI Gate" is its `name:`), not an assumption about the job graph — every other
 * job name in this file is derived at runtime. It lives here as a single named
 * constant precisely so a rename is a one-line change: if the gate is renamed,
 * branch protection has to be updated in the same breath, and this check failing
 * loudly is the reminder to do it.
 */
const AGGREGATOR = 'ci-gate'

/**
 * Jobs deliberately outside the gate, each with the reason it is exempt. This is
 * an explicit, reviewable opt-out: a job cannot quietly leave the gate without
 * appearing here. Keep it as short as it deserves to be.
 */
const EXCLUDED = new Map<string, string>([
  [
    'sca',
    'report-only OSV pass (`continue-on-error: true`); the `audit` job is the blocking advisory gate'
  ]
])

/** Job keys sit at exactly two spaces under the top-level `jobs:` mapping. */
const JOB_KEY = /^ {2}([A-Za-z0-9_-]+):[ \t]*(#.*)?$/

/** `    needs:` — a job property, so exactly four spaces. */
const NEEDS_KEY = /^ {4}needs:[ \t]*(.*)$/

/** `      - job-name` — a sequence item under `needs:`, six spaces. */
const NEEDS_ITEM = /^ {6}-[ \t]+([A-Za-z0-9_-]+)[ \t]*(#.*)?$/

/** A block-scalar indicator (`run: |`, `scan-args: |-`, …) opens literal content. */
const BLOCK_SCALAR = /^\s*[^#\s][^\n]*[|>][-+]?\d*[ \t]*$/

const fail = (message: string): never => {
  console.error(`CI aggregator guard failed.\n\n${message}`)
  process.exit(1)
}

/**
 * The `jobs:` block, as lines, with every block-scalar body (the shell scripts in
 * `run:` steps, the `filters: |` blob) removed.
 *
 * Stripping block scalars is the whole reason this is a state machine and not a
 * grep: a `run: |` body is arbitrary text, and a two-space-indented shell line
 * ending in a colon inside one would otherwise read as a job key.
 */
const jobsBlockLines = (source: string): readonly string[] => {
  const lines = source.split('\n')

  const jobsAt = lines.findIndex(line => /^jobs:[ \t]*(#.*)?$/.test(line))
  if (jobsAt === -1) fail(`No top-level \`jobs:\` mapping found in ${WORKFLOW}.`)

  // A block scalar's content is always indented past its introducer, which is
  // itself indented — so the first column-0 key genuinely ends the `jobs:` block
  // and can be found without tracking block-scalar state. A trailing top-level
  // comment is not a key.
  const body = lines.slice(jobsAt + 1)
  const endsAt = body.findIndex(
    line => line.trim() !== '' && !line.startsWith(' ') && !line.startsWith('#')
  )

  const kept: string[] = []
  // Indentation of the block-scalar introducer we are currently inside, if any.
  // A container rather than a rebound `let`, per the repo's no-`let` policy.
  const open: { indent: number | null } = { indent: null }

  for (const line of endsAt === -1 ? body : body.slice(0, endsAt)) {
    const indent = line.length - line.trimStart().length
    const trimmed = line.trim()

    // Inside a block scalar: everything more-indented than its introducer, plus
    // every blank line, is opaque content.
    if (open.indent !== null && (trimmed === '' || indent > open.indent)) continue

    open.indent = BLOCK_SCALAR.test(line) ? indent : null
    if (open.indent === null && trimmed !== '' && !trimmed.startsWith('#')) kept.push(line)
  }

  return kept
}

/** Every top-level job key, in file order. */
const jobKeys = (block: readonly string[]): readonly string[] =>
  block.flatMap(line => {
    const key = line.match(JOB_KEY)?.[1]
    return key ? [key] : []
  })

/** Whatever follows `needs:` on its own line — the inline and scalar spellings. */
const parseDeclaration = (declaration: string): readonly string[] => {
  // Inline flow form: `needs: [a, b]`.
  if (declaration.startsWith('[')) {
    return declaration
      .replace(/^\[|][ \t]*$/g, '')
      .split(',')
      .map(raw => raw.trim().replace(/^['"]|['"]$/g, ''))
      .filter(name => name !== '')
  }

  // Bare `needs:` introducing a block sequence, or a trailing comment.
  if (declaration === '' || declaration.startsWith('#')) return []

  // Single-scalar form: `needs: changes`.
  return [declaration.replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '')]
}

/**
 * The aggregate job's `needs:` entries. Scoped to that job's own body — from its
 * key line to the next job key — and tolerant of all three spellings GitHub
 * accepts: `needs: one`, `needs: [a, b]`, and a `- a` block sequence.
 */
const aggregatorNeeds = (block: readonly string[]): ReadonlySet<string> => {
  const startAt = block.findIndex(line => line.match(JOB_KEY)?.[1] === AGGREGATOR)
  const after = block.slice(startAt + 1)
  const nextJobAt = after.findIndex(line => JOB_KEY.test(line))
  const jobBody = nextJobAt === -1 ? after : after.slice(0, nextJobAt)

  const needsAt = jobBody.findIndex(line => NEEDS_KEY.test(line))
  if (needsAt === -1) return new Set()

  // Whatever sits on the `needs:` line itself, plus — if it introduced a block
  // sequence — the contiguous run of `- name` items beneath it. The run is
  // contiguous because comments were already stripped upstream, so the first
  // non-item line (`steps:`, `if:`, …) genuinely ends the list.
  const rest = jobBody.slice(needsAt + 1)
  const listEnd = rest.findIndex(line => !NEEDS_ITEM.test(line))

  return new Set([
    ...parseDeclaration((jobBody[needsAt]?.match(NEEDS_KEY)?.[1] ?? '').trim()),
    ...(listEnd === -1 ? rest : rest.slice(0, listEnd)).flatMap(line => {
      const item = line.match(NEEDS_ITEM)?.[1]
      return item ? [item] : []
    })
  ])
}

/** Sibling workflows this guard cannot speak for. See SCOPE above. */
const otherWorkflows = (): readonly string[] =>
  readdirSync(join(ROOT, WORKFLOW_DIR))
    .filter(entry => /\.ya?ml$/.test(entry) && `${WORKFLOW_DIR}/${entry}` !== WORKFLOW)
    .sort()

const readWorkflow = (): string => {
  try {
    return readFileSync(join(ROOT, WORKFLOW), 'utf8')
  } catch {
    return fail(`Cannot read ${WORKFLOW}.`)
  }
}

const block = jobsBlockLines(readWorkflow())
const jobs = jobKeys(block)

if (jobs.length === 0) {
  fail(`Parsed zero jobs from ${WORKFLOW} — the parse is wrong, not the workflow.`)
}

if (!jobs.includes(AGGREGATOR)) {
  fail(
    `No \`${AGGREGATOR}\` job in ${WORKFLOW}.\n\n` +
      '"CI Gate" is the only required status check on main. If the aggregate job was\n' +
      'renamed, update AGGREGATOR in scripts/check-ci-aggregator.ts AND the\n' +
      'branch-protection ruleset.'
  )
}

const needs = aggregatorNeeds(block)

if (needs.size === 0) {
  fail(
    `\`${AGGREGATOR}\` has no parseable \`needs:\` list in ${WORKFLOW}.\n\n` +
      'With an empty needs list the required check gates NOTHING at all.'
  )
}

// The aggregate job is excluded from its own diff: a job cannot `needs:` itself,
// so a naive key-set comparison would always report it missing.
const gated = jobs.filter(job => job !== AGGREGATOR && !EXCLUDED.has(job))

const problems = [
  ...gated
    .filter(job => !needs.has(job))
    .map(
      job =>
        `  job \`${job}\` is NOT in \`${AGGREGATOR}.needs\` — it can never fail the required check`
    ),
  ...[...needs]
    .filter(name => !jobs.includes(name))
    .map(name => `  \`${AGGREGATOR}.needs\` lists \`${name}\`, which is not a job — stale entry`),
  ...[...EXCLUDED.keys()]
    .filter(job => !jobs.includes(job))
    .map(job => `  EXCLUDED lists \`${job}\`, which is not a job — stale exemption`),
  ...[...EXCLUDED.keys()]
    .filter(job => needs.has(job))
    .map(
      job => `  \`${job}\` is in both EXCLUDED and \`${AGGREGATOR}.needs\` — drop one; it IS gated`
    )
]

if (problems.length > 0) {
  fail(
    `${WORKFLOW}\n\n${problems.join('\n')}\n\n` +
      '"CI Gate" is the ONLY required status check on main, and it can only fail on a\n' +
      `job it \`needs:\`. Fix the list at ${WORKFLOW} → ${AGGREGATOR}: → needs:, or — for\n` +
      'a deliberate opt-out — add the job to EXCLUDED in scripts/check-ci-aggregator.ts\n' +
      'with a one-line reason.'
  )
}

const exemptions =
  EXCLUDED.size === 0
    ? ''
    : `\nExempt by allowlist: ${[...EXCLUDED].map(([job, why]) => `${job} (${why})`).join('; ')}.`

console.log(
  `CI aggregator guard passed: "CI Gate" (${AGGREGATOR}) gates all ${gated.length} jobs in ` +
    `${WORKFLOW}.${exemptions}\n` +
    `Scope: \`needs:\` reaches only inside one workflow file, so this says nothing about ` +
    `${otherWorkflows().join(', ')}. If any job in those ever becomes a required status ` +
    'check, this guard cannot see it.'
)
