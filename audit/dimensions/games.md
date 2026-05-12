# Games Package Audit

_Audited: 2026-05-10_

## Summary

The `@randsum/games` package is architecturally sound: codegen-driven, spec-validated, and well-tested. Six genuine mechanical bugs or omissions were found — one is a confirmed logic error in D&D 5e crit detection under advantage/disadvantage that the existing test suite misses entirely. The schema extensibility gaps for the three upcoming games (Fate Core, Ironsworn, Pathfinder 2e) are real and each requires a non-trivial schema addition. Code quality is strong; the main structural risk is that hand-edits to generated files are caught at push time but not at commit time.

---

## Findings

### F1. D&D 5e: Nat 1/20 detection reads the wrong die under advantage/disadvantage — P0 — Mechanics

**Observation:** `/packages/games/src/fifth.generated.ts` lines 44–45 and 62–63 detect natural 1/20 with `r.rolls[0]?.initialRolls[0] === 1`. With advantage or disadvantage, `initialRolls` contains both rolled dice (in order of generation). `initialRolls[0]` is always the first die off the RNG, not the kept die. The result of crit detection is therefore dependent on RNG ordering, not on whether the kept die was a 1 or 20.

**Example:** Rolling advantage with die1=1, die2=20 keeps 20 (correct), but `isNatural20` reports `false` and `isNatural1` reports `true` — a complete inversion. The correct check is `r.rolls[0]?.rolls[0]` (the post-modifier roll, i.e., the kept die).

**Why it matters:** Callers using `crit: true` with `rollingWith: 'Advantage'` or `'Disadvantage'` receive wrong crit flags. This is a rules-accuracy defect — in D&D 5e, what matters is the die that was actually kept.

**Test coverage gap:** The stress tests at `__tests__/fifth.test.ts` lines 127–148 only test the plain roll case (`{ modifier: 0, crit: true }` with no `rollingWith`). For a 1d20 roll, `initialRolls[0]` equals `rolls[0]`, so the bug is invisible to these tests. No test exercises crit detection under advantage or disadvantage.

**Recommendation:** Change `r.rolls[0]?.initialRolls[0]` to `r.rolls[0]?.rolls[0]` in the three crit detection sites in `fifth.generated.ts`. Propagate the fix to `fifth.randsum.json` via `$dieCheck.field: 'final'` instead of `'initial'`. Add stress tests with `rollingWith: 'Advantage'` that confirm `isNatural20` when the kept die is 20.

**Effort:** S — two lines in the spec, one codegen field, two new test cases.

---

### F2. Root RPG: Mastery and helping mechanics are absent — P1 — Mechanics

**Observation:** `/packages/games/root-rpg.randsum.json` models only the basic move roll (2d6 + bonus, Strong Hit/Weak Hit/Miss). Root: The TTRPG (Magpie Games, 2022) has two additional dice mechanics on every move:

- **Mastery** (character advancement perk): roll 3d6, keep the 2 highest (same as PbtA advantage, but it's a permanent character ability, not a situational modifier).
- **Helping** (other players assist): also grants 3d6 keep highest 2.

The spec has no `rollingWith` input, no `when` branch for advantage, and no way for a caller to express that a character has Mastery.

**Why it matters:** Players using this package for Root RPG cannot model the two most common deviations from the base roll without reconstructing the mechanic themselves. The PbtA package (`pbta.randsum.json`) already has `rollingWith: Advantage/Disadvantage` modeled identically — Root RPG could adopt the same pattern.

**Recommendation:** Add `rollingWith` input with `Advantage/Disadvantage` enum and corresponding `when` branch (identical to `pbta.randsum.json`). The result labels can stay as is. Update `root-rpg.randsum.json` and regenerate.

**Effort:** S — copy the `rollingWith` block from `pbta.randsum.json` verbatim.

---

### F3. Blades in the Dark: Resistance roll outcome not modeled — P1 — Mechanics

**Observation:** `/packages/games/blades.randsum.json` exposes a single `roll()` function that returns `critical | success | partial | failure` outcome labels. These are action roll labels. Blades in the Dark also has a **resistance roll** — mechanically identical dice pool roll, but the outcome interpretation is entirely different: the caller computes Stress cost as `6 − highest_die` (or clears 1 Stress on a critical). No variant roll or separate outcome path exists in the spec.

**Why it matters:** Consumer code performing resistance rolls must ignore the returned result label entirely and re-derive the stress cost from `total` independently. This is workable but undocumented and error-prone. A separate `"resistanceRoll"` roll definition (second key in a multi-roll spec) would make the correct outcome explicit. The schema already supports multiple roll definitions per spec via its top-level `roll` shape — however, the current codegen only handles a single `roll` key per spec.

**Recommendation:** As a short-term improvement, document in the README that the `total` field (1–6) can be used by callers to derive resistance stress cost (`6 - total`, clamped). Longer term, add a `resistanceRoll` second roll definition once the codegen supports multi-roll specs. This also applies to fortune rolls (which use the same core mechanic as action rolls and do not need a separate entry).

**Effort:** M (codegen multi-roll support) / S (README documentation only).

---

### F4. D&D 5e: Ability score generation (4d6L), attack rolls, saving throws — not modeled — P2 — Mechanics

**Observation:** `/packages/games/fifth.randsum.json` models only the ability check/attack roll (1d20 + modifier, with advantage/disadvantage). The system is described as "D&D 5th Edition" but omits several other canonical d20 system rolls:

- **Ability score generation**: 4d6 drop lowest (4d6L), roll 6 times. This is a distinct roll type, not a modifier on the basic check.
- **Saving throws**: mechanically identical to ability checks but semantically different — the spec could note the distinction.
- **Death saving throws**: unmodified 1d20, success on 10+, nat 1 = two failures, nat 20 = revive. Requires the nat 1/20 detection to be present (already has `crit`) but the death-save interpretation is not in the outcome table.

**Why it matters:** The package name implies a full 5e dice API. Consumers expecting to use it for character creation or tracking all roll types will hit gaps immediately.

**Recommendation:** Add a second roll definition `"abilityScore"` (4d6 drop lowest, no outcome — returns numeric total) once multi-roll specs are supported. Document scope clearly in the README in the interim. Fix the nat 1/20 detection first (F1) before adding more crit-dependent mechanics.

**Effort:** S (documentation) / M (schema + codegen for multi-roll, then addability score roll).

---

### F5. Pre-commit codegen check only triggers on spec changes, not generated file changes — P2 — Code

**Observation:** In `/lefthook.yml`, the pre-commit `codegen-check` command has `glob: "packages/games/*.randsum.json"`. This means it runs only when a `.randsum.json` spec file is staged. If a developer hand-edits `src/blades.generated.ts` (or any `*.generated.ts`) and commits that change without touching the spec, `gen:check` is not triggered at commit time.

The pre-push hook runs `gen:check` unconditionally (no glob), so the drift will be caught before it reaches the remote — but it allows a commit containing invalid generated code to exist in the local history.

**Why it matters:** Generated files are checked into git. A hand-edit that makes it to a commit (but not yet a push) creates a confusing intermediate state. CI would catch it, but only after the push. The pattern is particularly risky during rebasing or cherry-pick workflows.

**Recommendation:** Add `packages/games/src/*.generated.ts` to the pre-commit glob so that edits to generated files also trigger `gen:check`. Alternatively, add a separate `glob: "packages/games/src/*.generated.ts"` pre-commit command that warns the developer. The pre-push protection is the primary safety net, but the earlier the feedback, the better.

**Effort:** S — one glob line added to `lefthook.yml`.

---

### F6. Fate Core (#940) requires schema extension: Fate dice not expressible in PoolDefinition — P2 — Codegen Extensibility

**Observation:** `/packages/games/src/lib/types.ts` defines `PoolDefinition.sides` as `IntegerOrInput` — a number or an `$input` reference resolving to a number. Fate dice (Fudge dice, `-1/0/+1` per die) are represented in roller notation as `dF`. There is no way to express `sides: 'F'` or `sides: 'fate'` in the current spec schema.

To add Fate Core (`@randsum/games/fate`), the schema would need either:

1. A `notation` field in `PoolDefinition` allowing roller-notation strings like `"4dF"` directly, or
2. A `faces` array field (e.g., `faces: [-1, 0, 1]`) that maps to roller's custom faces API.

Without this, Fate Core cannot be added as a `.randsum.json` spec — it would require custom TypeScript, violating the schema-extension principle documented in project memory.

**Recommendation:** Extend `PoolDefinition` with either a `notation` escape hatch or a `specialDie: 'fate' | 'fudge'` discriminant. A `notation` field that accepts roller-valid notation strings for the pool (e.g., `"4dF"`) is the simplest path and reuses the existing roller parser. Document the codegen path for this new pool shape.

**Effort:** M — schema type change, codegen emitter update, validator update, one new game spec.

---

### F7. Ironsworn (#944) requires schema extension: no multi-pool comparison-against-challenge mechanic — P2 — Codegen Extensibility

**Observation:** Ironsworn (Shawn Tomkin, 2018) rolls 1d6 + stat + bonus (the action die) and compares the result against **two separate d10 challenge dice**. Outcomes are: beat both = strong hit, beat one = weak hit, beat neither = miss, equal to a challenge die = "match" (twist). This is a fundamentally different resolve strategy — it is not `comparePoolHighest` (which picks the winner of two equal-sided pools) and not `countMatching` (which counts dice meeting a threshold within a single pool).

The schema has no "compare-one-pool-against-two-challenge-dice" resolve strategy. Adding Ironsworn requires a new resolve type, e.g.:

```json
"resolve": {
  "challengeComparison": {
    "actionPool": "action",
    "challengePools": ["challenge1", "challenge2"],
    "matchResult": "match"
  }
}
```

**Recommendation:** Design a `challengeComparison` resolve strategy as part of the schema extension effort for #944. The compare semantics (count how many challenge dice are beaten, with match detection) are distinct enough from existing strategies to warrant a dedicated type. The codegen emitter would need a new `generateChallengeComparisonBody` function.

**Effort:** L — new schema type, codegen emitter, validator, normalizer, tests, and game spec.

---

### F8. Blades in the Dark: crit fires on preModify but single-die pools can never crit — P3 — Code

**Observation:** In `/packages/games/src/blades.generated.ts` lines 46–49, the crit check reads:

```ts
const preModify = r.rolls.flatMap(x => x.initialRolls)
if (preModify.filter(v => v === 6).length >= 2) return { ..., result: 'critical' }
```

For `rating: 1`, only one die is rolled, so `preModify` has exactly one element. The `>= 2` condition can never be true. The code falls through to `total === 6` returning `'success'` — which is mechanically correct per Blades rules (crit requires multiple 6s). However, the crit code path is dead for `rating: 1` and the range coverage validator correctly skips `poolCondition`-gated ranges, so there is no runtime crash risk.

**Why it matters:** This is a minor code smell. The dead crit check for single-die pools wastes a filter+length operation on every `rating: 1` roll. A pre-condition guard on pool size would make the intent explicit and marginally improve performance for the most common pool size.

**Recommendation:** No change required for correctness. Optionally add a short-circuit: `if (preModify.length >= 2 && preModify.filter(v => v === 6).length >= 2)`. The schema could also note in the `poolCondition` spec that this range is unreachable for `rating: 1`.

**Effort:** XS — one guard line; no priority.

---

### F9. PbtA: No 12+ critical threshold — future hacks will need schema extension — P3 — Mechanics

**Observation:** `/packages/games/pbta.randsum.json` models base PbtA thresholds: 10+ strong hit, 7-9 weak hit, 6- miss. Some PbtA hacks (Dungeon World, Masks, Blades-derived PbtA variants) add a 12+ threshold for "full success with extra benefit" or "critical." The current spec has no way for a consumer to configure this threshold without forking the spec.

The `roll.outcome.ranges` in `pbta.randsum.json` are hardcoded. There is no `criticalThreshold` input parameter.

**Why it matters:** This is low severity for the base package — base PbtA has no 12+ mechanic. But it signals that the package is scoped to the exact base game, not to the PbtA family. Consumers building Dungeon World or Masks tools on top of the pbta subpath will need to re-check the total themselves. This is expected; documenting it clearly in the README would help.

**Recommendation:** Add a comment to `pbta.randsum.json` and the README noting the package models base PbtA mechanics. If PbtA hack support is desired, consider an optional `criticalThreshold` input (default 999, effectively disabled) that shifts the strong_hit boundary.

**Effort:** S — documentation only; M if adding the optional threshold input.

---

### F10. lookupByRange falls back to `{ label: 'No result' }` silently on miss — P3 — Code

**Observation:** `/packages/games/src/lib/lookupByRange.ts` line 40 returns `{ key: String(value), result: { label: 'No result' } }` when no range matches. For the Salvage Union tables (all externally fetched, baked in at codegen), this should never trigger if the range coverage validator is correct. However, unlike outcome range checks (which use `validateRangeCoverage` and throw `SchemaError` at codegen), the `lookupByRange` function silently succeeds with a synthetic fallback at runtime.

If a Salvage Union table entry has a range gap (e.g., a table uses `'2-4'` and `'6-20'`, skipping 5), the returned result would be `{ label: 'No result' }` with no error. The current `rangeCoverage.ts` validator does not apply to remote table data (it only validates `outcome.ranges`, not the key shapes of `remoteTableLookup` tables).

**Why it matters:** The Salvage Union tables come from an external URL (`salvageunion.io/schema/roll-tables.json`). If that upstream schema has a gap, the library silently returns a `'No result'` label instead of throwing. Consumers may not notice.

**Recommendation:** Add a validation step in the codegen pipeline for `remoteTableLookup` tables: after fetching and caching the data, run a range-coverage check on each table's keys against `1..20` (the d20 range). This would make codegen fail loudly if an upstream table has a gap, rather than shipping silent fallback behavior. Alternatively, make `lookupByRange` throw when it falls through to the fallback.

**Effort:** M — range coverage check in codegen for remote tables; S — throw instead of silent fallback in `lookupByRange`.

---

### F11. Daggerheart: "with Hope" tie outcome matches spec but naming is ambiguous — P3 — Mechanics

**Observation:** `/packages/games/daggerheart.randsum.json` declares `"ties": "critical hope"` and the generated code at line 74 returns `result: 'critical hope'` when `hopeTotal === fearTotal`. Per the Daggerheart 1.4 rulebook, equal dice produce a "Critical Success" — mechanically equivalent to rolling with Hope, granting a Hope token. The naming `'critical hope'` is non-standard relative to the rulebook terminology ("Critical Success") and may confuse consumers.

Additionally, the `DaggerheartRollResult` type (`'critical hope' | 'fear' | 'hope'`) does not include a `'critical'` label distinct from the hope/fear outcome — "critical hope" bundles the crit and the Hope-side result into one label, making it harder to check for criticals independent of the Hope/Fear distinction.

**Why it matters:** API consumers checking `result === 'critical'` will always get false. They must check `result === 'critical hope'`. If a future Daggerheart update adds critical fear (critical on a tie where Fear is favored), a new label would be needed. The current union type is brittle to rule expansion.

**Recommendation:** Consider splitting the result type into separate critical and hope/fear fields in `details`, or normalizing to `result: 'hope' | 'fear'` with `details.isCritical: boolean`. The spec's `ties` field in `comparePoolHighest` could set `result: 'hope'` and `details.isCritical: true` through a forthcoming `criticalTie` details mechanism.

**Effort:** M — requires a new details field or result union change; breaking API change for consumers.

---

### F12. Root RPG: bonus range allows +5 but RAW stats cap at +3 — P3 — Mechanics

**Observation:** `/packages/games/root-rpg.randsum.json` declares `"bonus": { "type": "integer", "minimum": -3, "maximum": 5 }`. Root: The TTRPG stats (Charm, Cunning, Finesse, Luck, Might, Sneak) range from -1 to +2 at character creation, advancing to +3 at most. Situational bonuses (help, gear) add at most +1 each. The practical maximum bonus in a normal play session is +3 to +4. Allowing +5 as a valid input is slightly generous and could mask user input errors.

This matches the `pbta.randsum.json` stat range (`maximum: 5`) — the spec was likely copied from there. PbtA stats also max around +3 in most games, so both specs share the same slightly-generous upper bound.

**Why it matters:** No functional defect, but a stat of +5 is unreachable in Root RPG by the rules. A consumer passing `bonus: 5` gets a valid result when it should arguably be rejected.

**Recommendation:** Change `maximum: 5` to `maximum: 3` in `root-rpg.randsum.json` to match the game's actual stat ceiling. If the intention is to accommodate stacked situational bonuses, document this explicitly in the `description` field.

**Effort:** XS — one JSON value change.
