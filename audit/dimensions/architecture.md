# Architecture

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo_

## Summary

The RANDSUM monorepo exhibits a deliberate, well-governed layered architecture: a
zero-dependency core (`@randsum/roller`) sits at the base, game packages and the
component library depend only on it, and apps sit at the top — a strict DAG
(`roller <- {games, dice-ui} <- apps`). The single most important architectural
invariant — no cycles, no cross-game coupling, no reaching into internal
`src`/`dist` — is not merely documented but **mechanically enforced** by a
`dependency-cruiser` config wired into `arch:check`, which runs in pre-push and
CI. Running that check during this audit confirmed a clean graph (275 modules,
570 dependencies, zero violations). Decision history is unusually strong: 19
numbered ADRs in `docs/adr/`, the most recent committed two days before the
audit, capturing nearly every structural choice (unified games package, codegen,
notation merge, ESM-only output, modifier co-location). The few observations
below are minor refinements, not structural debt.

**Overall grade:** A

## Framework anchors

- **ISO/IEC 25010 §6.5.1** — Modularity sub-characteristic.
- **Acyclic Dependencies Principle (ADP)** — packages must form a DAG.
- **Stable Dependencies Principle (SDP)** — depend toward stability.
- **Robert C. Martin package metrics** — Instability / stable-core layering.
- **Light DDD** — bounded contexts (per-game spec packages) aligned to module
  boundaries.

## Findings

### F1 — Architecture invariants are enforced by tooling, not just convention

- **Severity:** Low (positive finding)
- **Location:** `.dependency-cruiser.cjs`, `package.json:65` (`arch:check`), `lefthook.yml` (pre-push)
- **Evidence:** Four forbidden rules encode the design contract: `no-circular`
  (whole workspace must be a DAG), `no-cross-game-import-internal` and
  `no-cross-game-import-subpath` (game packages depend only on roller, never on
  each other — with an explicit allow for the shared `@randsum/games/schema`
  API), and `no-internal-reach-in` (consumers may import only published subpath
  entry points, never `@randsum/*/src|dist`). `dependency-cruiser` 17.4.3 is a
  pinned dependency; the check runs in pre-push and the CI Gate. Live run during
  this audit: "no dependency violations found (275 modules, 570 dependencies
  cruised)."
- **Impact:** The stable-core layering cannot silently erode. This is the
  difference between an aspirational architecture and a guaranteed one, and it
  removes the primary risk this dimension usually flags (latent cycles).

### F2 — Exemplary, current ADR discipline

- **Severity:** Low (positive finding)
- **Location:** `docs/adr/ADR-001` … `ADR-019`, `docs/adr/README.md`
- **Evidence:** 19 MADR-style ADRs with explicit `## Status` sections, covering
  the unified games package (001), codegen from JSON specs (002), notation as a
  separate package and its later merge into roller (003, 005, 006, 010), literal
  vs branded types (004), modifier co-location (007), ESM-only output (008),
  public API surface reduction (009), and tooling/app decisions (011–019). Most
  recent ADR committed 2026-06-21, two days before the audit.
- **Impact:** Decision rationale is discoverable and recent; the
  `dependency-cruiser` comments even back-reference architecture remediation
  IDs (R2/R3), showing the audit→decision→enforcement loop is closed. Strong
  positive signal per the skill's ADR-presence heuristic.

### F3 — Stable-core layering matches actual imports

- **Severity:** Low (positive finding)
- **Location:** per-package `package.json` dependency blocks; `packages/roller/src/`
- **Evidence:** `roller` declares no `@randsum` dependency (true zero-dep core).
  `games` and `dice-ui` depend on `roller` via `workspace:~` only. Apps depend
  downward only (`discord-bot` → games + roller; `expo`/`site` → dice-ui +
  roller; `rdn`/`cli` → roller). Roller's own internals are cleanly layered:
  `roll/pipeline.ts` composes `lib/random`, `modifiers`, `types`, and `errors`
  in a one-directional pipeline (generate → apply modifiers → total → record).
  Domain logic never reaches into framework/UI code.
- **Impact:** Confirms the documented layering is real, not just declared. The
  most-depended-on package (roller) is also the most stable (zero deps),
  satisfying SDP.

### F4 — Game packages are well-isolated bounded contexts

- **Severity:** Low (positive finding)
- **Location:** `packages/games/src/*.generated.ts`, `packages/games/codegen.ts`, `*.randsum.json`
- **Evidence:** Each game (blades, daggerheart, fate, fifth, root-rpg,
  salvageunion, pbta) is generated from a declarative `.randsum.json` spec and
  emitted as an independent `*.generated.ts` entry. Grep for cross-game imports
  (relative or via the published subpath) returned zero matches; the
  dependency-cruiser run confirms. The generated files call `roll()` directly.
  This is a clean codegen-as-architecture pattern: the spec is the source of
  truth, the boundary is the package subpath.
- **Impact:** Adding or changing a game cannot ripple into a sibling — the
  defining property of good bounded-context isolation. Aligns module boundaries
  to domain boundaries (one game = one context).

### F5 — Coupling-magnet directories exist but are bounded and local

- **Severity:** Low
- **Location:** `packages/roller/src/lib/` (utils, random, comparison, constants), `packages/games/src/lib/`, `apps/*/src/utils|helpers`
- **Evidence:** The skill flags `utils/`/`lib/`/`helpers/`/`shared/`/`common/`
  names as coupling magnets. roller's `src/lib/` has ~12 intra-package
  importers; games' `src/lib/` has ~9. These are real fan-in hubs, but: (a)
  every one is **package-local** (no cross-package `lib` sharing — there is no
  top-level `shared/` package), (b) contents are cohesive and named by concern
  (`lib/random`, `lib/comparison`, `lib/utils/constants`), not catch-all dumping
  grounds, and (c) app-level `utils/`/`helpers/` directories are small and
  confined to their own app. The `roller/src/lib/utils` nesting and a generic
  `lib/utils/constants.ts` are the only mild "grab-bag" smells.
- **Impact:** Low. These hubs are intentional and contained; the risk is only
  that `lib/utils` could accrete unrelated helpers over time. Worth periodic
  review, not remediation. Per the skill's edge-case guidance, this is an
  intentional trade-off for a small team, not a Critical finding.

### F6 — CLI consumes roller via a bundled devDependency

- **Severity:** Low (informational)
- **Location:** `apps/cli/package.json` (`devDependencies.@randsum/roller`), `apps/cli/src/run.ts`
- **Evidence:** `apps/cli` imports `roll` from `@randsum/roller/roll` but lists
  roller under `devDependencies`, not `dependencies`. For a CLI that bundles its
  output (`bunup` build) this is a defensible choice — roller is inlined at
  build time, so it need not be a runtime dependency. It does, however, make the
  dependency edge invisible to consumers reading `dependencies` and to some
  tooling that ignores devDependencies.
- **Impact:** Minimal — purely a manifest-hygiene nuance. Confirm the published
  CLI bundle is self-contained (it is built with `bunup`), otherwise the runtime
  edge would be undeclared.

## Metrics

| Repo             | Metric                                 | Value                                                                                   | Notes                                                                                                                                   |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| randsum-monorepo | Top-level workspace modules            | 8 (roller, games, dice-ui + cli, discord-bot, expo, site, rdn)                          | 3 publishable libs + 1 CLI + 4 apps                                                                                                     |
| randsum-monorepo | Layering scheme                        | Layered / stable-core (`roller <- {games, dice-ui} <- apps`)                            | Matches actual imports                                                                                                                  |
| randsum-monorepo | Suspected cycles                       | None                                                                                    | `arch:check` (dependency-cruiser) run clean: 275 modules / 570 deps, 0 violations                                                       |
| randsum-monorepo | Coupling magnets                       | `roller/src/lib` (~12 fan-in), `games/src/lib` (~9 fan-in); app-local `utils`/`helpers` | All package-local; no cross-package shared dir                                                                                          |
| randsum-monorepo | ADR presence                           | Yes — 19 ADRs, most recent 2026-06-21                                                   | MADR-style with Status sections; back-referenced by tooling                                                                             |
| randsum-monorepo | Cross-service / cross-package coupling | Low                                                                                     | Strict DAG; game packages mutually independent; enforced                                                                                |
| randsum-monorepo | Public API surface                     | Well-defined                                                                            | Subpath exports (`roller/{roll,errors,validate,tokenize,docs,trace}`; games `/blades` … `/schema`); ADR-009 documents surface reduction |

## Recommendations

- **R1** — Keep the `lib/utils` and `lib/` hubs under periodic review so they do
  not accrete unrelated helpers; consider splitting `roller/src/lib/utils` by
  concern if it grows. [Horizon: later] [Risk reduction: Lo]
- **R2** — Optionally move `@randsum/roller` from `devDependencies` to
  `dependencies` in `apps/cli/package.json` (or add a comment documenting the
  bundled-edge rationale) so the dependency edge is explicit to manifest-reading
  tooling. [Horizon: later] [Risk reduction: Lo]
- **R3** — Maintain the ADR + `dependency-cruiser` discipline as the team grows;
  it is the load-bearing control for this architecture and should be treated as
  a required gate, not optional. [Horizon: now] [Risk reduction: Med]

## Confidence

Cycle detection here is **not** the usual v1 heuristic: the repo ships a real
tool (`dependency-cruiser` 17.4.3) and I ran `bun run arch:check` live, so the
"no cycles / no cross-game coupling / no reach-in" conclusions are
directly observed, not estimated. One caveat: the project deliberately sets
`tsPreCompilationDeps: false`, so the cruiser ignores type-only (`import type`)
edges; this is justified in the config (erased at compile time, not runtime
cycles) and is the correct call, but it means a pathological _type-only_ cycle
would not be caught by the tool — I did not find evidence of one, and such cycles
are benign at runtime. Fan-in counts for `lib/` directories are grep-based
approximations (importer-file counts), not a weighted coupling metric, and should
be read as order-of-magnitude. ADR count and recency, dependency edges, and
layering are directly observable from the tree and manifests. The grade rests on
exhaustively-verified structural invariants plus directly-counted ADRs, so
confidence is high.
