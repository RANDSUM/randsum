#!/usr/bin/env bun

/**
 * CI Benchmark Runner
 *
 * Usage: bun run bench:ci
 *
 * Runs the roller benchmark suite three times and emits the per-benchmark
 * MEDIAN into benchmark-results.json (github-action-benchmark
 * customSmallerIsBetter format: [{ name, unit, value }]).
 *
 * Why: the regression gate produced a false positive from a single mitata run
 * compared against a stale cached baseline — sub-20µs benchmarks are noisy
 * enough that one cold run trips the alert threshold. Taking the median of
 * three runs rejects a single anomalous sample without smearing a real
 * regression the way a mean would. Kept as a wrapper so roll.bench.ts stays a
 * plain benchmark file with no CI aggregation logic.
 */

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface BenchResult {
  readonly name: string
  readonly unit: string
  readonly value: number
}

const RUNS = 3
const BENCH_FILE = join(import.meta.dir, '..', 'packages/roller/__benchmarks__/roll.bench.ts')
const OUTPUT = join(import.meta.dir, '..', 'benchmark-results.json')

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const hi = sorted[mid] ?? 0
  if (sorted.length % 2 !== 0) return hi
  const lo = sorted[mid - 1] ?? hi
  return (lo + hi) / 2
}

const runs: readonly (readonly BenchResult[])[] = Array.from({ length: RUNS }, (_unused, index) => {
  console.log(`Running benchmark suite (${index + 1}/${RUNS})...`)
  const stdout = execFileSync('bun', ['run', BENCH_FILE, '--json'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  })
  return JSON.parse(stdout) as readonly BenchResult[]
})

const [first] = runs
if (first === undefined) throw new Error('benchmark produced no runs')

const results: readonly BenchResult[] = first.map(entry => {
  const samples = runs.map(run => run.find(r => r.name === entry.name)?.value ?? entry.value)
  return { name: entry.name, unit: entry.unit, value: median(samples) }
})

writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`)

console.log(`Wrote median-of-${RUNS} results for ${results.length} benchmarks to ${OUTPUT}`)
