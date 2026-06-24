# Performance

**Grade: A- (90/100)**

> **Confidence: Medium-High.** Findings combine static reading of the roller
> hot paths with **one empirical measurement** — `bun run size` (size-limit) was
> executed against a fresh `@randsum/roller` build, so the bundle numbers below
> are real, not estimated. The benchmark harness (`mitata`) was _read_ but not
> run to completion in this pass; latency claims are structural inferences from
> the code, not measured nanoseconds. Per the dimension contract: static
> performance findings need profiling to confirm before any rework. None of the
> findings here rise to "rework needed" — they are headroom and hygiene notes.

## Summary

This is a **pure-compute TypeScript library ecosystem**, not a service with a
data tier. The performance-relevant surface is narrow and the team has clearly
engineered against it: per-package bundle budgets are enforced in CI, the roll
engine is fully synchronous with bounded loops everywhere, and a `mitata`
benchmark suite exists with large-pool cases wired in. The two highest-leverage
risk classes for a dice engine — **unbounded explode/reroll/unique loops** and
**bundle-size creep** — are both actively guarded. The only material finding
is tight bundle headroom on two roller entry points.

> **Correction (post-review):** An earlier draft of this report claimed "the
> absence of an enforced benchmark regression gate." That is incorrect — a
> `bench (regression gate)` job **does** exist in `.github/workflows/ci.yml`
> (`fail-on-alert: true`, 150% threshold). The residual nuance is only that the
> gate triggers on roller path-changes; it is not a missing control.

**Data-access findings (N+1, missing indexes, pagination): N/A.** There is no
database, ORM, or persistent data tier anywhere in the ecosystem (`@randsum/roller`
is zero-dependency; the discord-bot holds only ephemeral in-memory metrics state).
The classic N+1 / missing-index / `SELECT *` / unpaginated-list-endpoint findings
do not apply and are reported as not-applicable rather than absent-by-omission.

## Metrics

| Metric                          | Value                                                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suspected N+1 patterns          | **N/A** — no DB / ORM / data tier in any package                                                                                                                                                      |
| Endpoints without pagination    | **N/A** — no list endpoints (library + stateless bot)                                                                                                                                                 |
| Missing-index suspects          | **N/A** — no migrations / schema                                                                                                                                                                      |
| Async/sync mismatch occurrences | **0** in roller (0 `async`/`await`/`Promise` in `packages/roller/src`); discord-bot async is idiomatic discord.js I/O                                                                                 |
| Caching layers present          | App-level only: discord-bot in-memory metrics buffer with a bounded flush timer (`apps/discord-bot/src/utils/metrics.ts`); Netlify CDN fronts the static docs sites; no Redis/Memcached (none needed) |
| Frontend bundle red flags       | None observed — no `lodash`/`moment` root imports; roller is zero-dependency                                                                                                                          |
| Bundle budgets enforced         | **Yes** — `size-limit` gates on `@randsum/roller` (5 entry points) and `@randsum/games` (7 generated game bundles), brotli-compressed                                                                 |
| Unbounded-loop guards           | **5 distinct ceilings** (see Hot-path section)                                                                                                                                                        |

### Bundle size — measured (`bun run size`, roller, fresh build)

| Entry point           | Limit   | Measured (brotli) | Headroom                    |
| --------------------- | ------- | ----------------- | --------------------------- |
| `dist/index.js`       | 16 KB   | **15.73 KB**      | **0.27 KB (1.7%)** ⚠️ tight |
| `dist/tokenize.js`    | 6.75 KB | **6.5 KB**        | **0.25 KB (3.7%)** ⚠️ tight |
| `dist/docs/index.js`  | 20 KB   | 10.07 KB          | 9.93 KB (50%) ✅            |
| `dist/trace/index.js` | 5 KB    | 0.91 KB           | 4.09 KB (82%) ✅            |
| `dist/index.d.ts`     | 10 KB   | 13 B\*            | n/a                         |

\* The `.d.ts` size-limit entry reports 13 B because size-limit treats the
declaration file as a JS module and tree-shakes it to nothing — a measurement
quirk, not a real type-surface shrink. The budget still trips if a genuine
runtime dependency leaks into the declaration entry.

Game-package budgets (`@randsum/games`: 15 KB each, daggerheart/pbta 16 KB,
salvageunion 33 KB) are declared and CI-enforced but were **not** re-measured
in this pass — the games `dist/` was empty after `bunup` (codegen produces the
`*.generated.ts` sources that the build consumes; a full `gen && build` is
needed to populate it). The budgets are credible given roller's measured
discipline; treat the games numbers as enforced-but-unverified-here.

## Hot-path complexity (the roll engine)

The roll pipeline (`packages/roller/src/roll/pipeline.ts`) and the 19-modifier
registry (`packages/roller/src/modifiers/registry.ts`) are the only real hot
paths. Assessment by area:

**Modifier dispatch is O(M) per roll, M = 19, with zero per-call allocation of
the registry.** `MODIFIER_ORDER` and the name→definition `Map` are built **once
at module init** and frozen (`registry.ts:14-24`). `applyAllModifiers` is an
`Array.reduce` over the 19 ordered keys, skipping any modifier whose option is
`undefined`. The dispatch cost is a small constant per roll regardless of pool
size. ✅

**Unbounded-loop risk — the headline concern for a dice engine — is
systematically bounded.** Every loop that could in principle run forever has an
explicit ceiling:

| Modifier / op                  | Risk                      | Ceiling                                                                                      | Location                          |
| ------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| reroll `R{..}`                 | reroll-until-not-matching | `MAX_REROLL_ATTEMPTS = 99` per die                                                           | `reroll.ts:210`                   |
| unique `U`                     | reroll-until-unique       | `MAX_REROLL_ATTEMPTS = 99` per dup; throws on exhaustion                                     | `unique.ts:105`                   |
| compound/penetrate `!!`/`!p`   | depth recursion           | `DEFAULT_EXPLOSION_DEPTH = 1000` (the `!!0` "unlimited" ceiling)                             | `explosion.ts`, `constants.ts:14` |
| explodeSequence `!s`/`!i`/`!r` | step-through              | `sequence.length + 1000` iterations                                                          | `explodeSequence.ts:111`          |
| geometric die `gN`             | roll-until-non-max        | hard `1000` cap per sequence                                                                 | `pipeline.ts:69`                  |
| repeat operator `xN`           | result blow-up            | `MAX_REPEAT_COUNT = 1000`, `MAX_REPEAT_DEPTH = 10` (guards `1d6x10x10…` exponential nesting) | `notationToOptions.ts:12,18`      |

The single-wave `explode` (`!`) is intentionally **not** recursive — it filters
triggering dice once and rolls one replacement each (`explode.ts:109`), so it is
inherently O(n) with no loop risk. This is a genuinely strong safety posture for
a notation language that lets users write arbitrary explode/reroll combinations.

**Per-die accumulator complexity was deliberately de-quadratic'd.** Both
`reroll.ts` (lines 230-249) and `unique.ts` (lines 117-141) carry explicit
comments documenting a prior **O(n²)** implementation (spread-copying the
accumulator / cloning the `Set` each iteration) that was rewritten to a single
linear pass with one persistent array and one persistent `Set`. The large-pool
benchmark cases (`5000d10000U`, `100d6R{<3}`, `1000d6`) exist specifically to
exercise these paths. This is the audit's best evidence that the team treats
hot-path complexity as a first-class concern. ✅

**Minor allocation note (low leverage):** `applyAllModifiers` (`registry.ts:125`)
builds a fresh `{rolls, logs, totalTransformers}` object and spreads `logs`/
`totalTransformers` arrays on every modifier step inside the `reduce`. For a roll
with K active modifiers this is O(K²) array copies — but K is bounded by 19 and
typically 1-3, and the arrays are tiny, so the practical cost is negligible. Not
worth changing without a benchmark showing it matters. Similarly `applyModifier`
does `const initialRolls = [...rolls]` per modifier to snapshot for logging
(`registry.ts:82`); this is an O(pool) copy per active modifier — relevant only
for very large pools with many modifiers, which the benchmark suite already
covers.

**Tokenizer / notation parsing.** Parsing is regex-driven with a `length > 1000`
short-circuit (`notationToOptions.ts:29`) and per-segment matching; no
catastrophic-backtracking pattern was observed in a read of the explode/reroll/
compound regexes (they are anchored, bounded-repetition character classes). The
multi-pool path uses a single global `matchAll` rather than nested scans. ✅

## Async / concurrency

- **Roller core is 100% synchronous** — zero `async`/`await`/`Promise` in
  `packages/roller/src`. Correct for a pure-compute library: no event-loop
  blocking concern because there is no event loop to share, and no sync-in-async
  mismatch is possible.
- **discord-bot** uses async idiomatically for discord.js I/O (62 `async`/`await`
  sites). Notable good patterns: `loginWithBackoff.ts` (bounded exponential
  backoff on login rather than a tight retry loop) and `metrics.ts` (a single
  bounded-interval flush timer, not per-event spawning). No goroutine/thread-leak
  analog, no unbounded `setInterval` fan-out, no hard-coded worker-pool sizing.
- **No worker threads, child_process, or cluster** usage anywhere in
  `packages/` or `apps/` — appropriate for the workload.

## Frontend assets

The Astro/Starlight docs sites (`apps/site`, `apps/rdn`) and the Expo playground
are SSG/native and out of the critical compute path. A spot read found no
world-importing entry points (`lodash`/`moment` root imports); the interactive
hero components use `useRef`-held interval handles cleaned up on unmount. Bundle
discipline on the _library_ side (zero-dependency roller) means downstream app
bundles inherit a small dependency. Not deeply audited — these are content sites,
low leverage versus the engine.

## Recommendations (ordered by leverage)

1. **[Low — already satisfied, residual nuance only] Benchmark regression gate
   exists; widen its trigger.** A `bench (regression gate)` job is already wired
   in `.github/workflows/ci.yml` (`github-action-benchmark`, `fail-on-alert:
true`, 150% threshold) over the `mitata` suite
   (`packages/roller/__benchmarks__/roll.bench.ts`). The O(n²)→O(n) rewrites in
   reroll/unique are therefore protected on the next refactor. The only residual
   item is that the gate triggers on roller path-changes — consider whether
   cross-package changes that affect roller hot paths should also trip it. (An
   earlier draft mis-stated this gate as absent; corrected post-review.)

2. **[Low-Medium] Watch the two tight bundle budgets.** `dist/index.js` (1.7%
   headroom) and `dist/tokenize.js` (3.7% headroom) will trip on the next
   non-trivial addition to the barrel or a behavior accidentally leaking into the
   tokenize import graph (the documented tree-shaking invariant). The gate is
   already in `size-limit`, so this is "be aware," not "fix" — but a new modifier
   or notation primitive is likely to force a deliberate budget-vs-trim decision.
   Keep the `dist/tokenize.js` isolation invariant (schema must not reference
   behavior symbols at module-init) front-of-mind in review.

3. **[Low / optional] Micro-optimize `applyAllModifiers` only if a benchmark
   demands it.** The per-step object rebuild + array spread in the `reduce`
   (`registry.ts:125-139`) and the per-modifier `[...rolls]` snapshot
   (`registry.ts:82`) are the only remaining non-linear-ish allocations on the
   hot path. With K ≤ 19 and typically 1-3 active modifiers, this is almost
   certainly not worth the readability cost — flagged for completeness, gated on
   recommendation #1 producing evidence.

## What was checked and found clean

- No unbounded loops (5 explicit ceilings, enumerated above).
- No sync-in-async or blocking-in-`async` mismatches.
- No N+1 / missing-index / unpaginated-endpoint exposure (no data tier — N/A).
- No world-importing frontend bundles; library is zero-dependency.
- Modifier registry built once at init, not per-roll.
- Measured bundle budgets all currently **passing** (roller).
