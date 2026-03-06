# RollerPlayground Docs Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace static `<LiveRepl>` code blocks in the docs with interactive `<RollerPlayground>` instances; rename the `LiveRepl` component to `CodeExample` throughout.

**Architecture:** Add a `defaultNotation` prop to `RollerPlayground`, rename `LiveRepl.astro` → `CodeExample.astro`, then update every MDX doc file. Files using `@randsum/roller` notation get playground embeds; game-package pages and other non-notation files get a rename-only treatment.

**Tech Stack:** Astro MDX, React (client:only="react"), TypeScript, @astrojs/starlight

---

## Transformation rules (reference throughout)

**Basic block** — code is ONLY `import { roll } from '@randsum/roller'` + bare `roll('notation')` or `roll(number)` calls (optionally with inline comments). No variable assignments, no console.log, no options objects, no multi-argument calls.
→ **Replace entirely** with stacked `<RollerPlayground>` instances, one per notation.

**Contextual block** — code has result reading (`const result = …`, `console.log`), options objects, multi-arg `roll()`, custom functions, or error handling.
→ **Keep as `<CodeExample>`**, then add a `<RollerPlayground>` below using the primary notation from the block. Skip the playground if: (a) the block uses only options objects with no equivalent notation, (b) the block intentionally uses invalid input (`'not-valid-notation'`), (c) the block uses multi-arg rolls that the playground can't represent, or (d) the block is `readonly`.

**Number-only rolls** — `roll(20)` has no notation string, but `"1d20"` is equivalent. Use the notation form for the playground.

---

## Task 1: Add `defaultNotation` prop to `RollerPlayground`

**Files:**
- Modify: `apps/site/src/components/playground/RollerPlayground.tsx`

**Step 1: Update the component signature**

Change the props destructuring from:
```tsx
export function RollerPlayground({
  stackblitz = true
}: { readonly stackblitz?: boolean } = {}): React.JSX.Element {
  const [notation, setNotation] = useState('4d6L')
```

To:
```tsx
export function RollerPlayground({
  stackblitz = true,
  defaultNotation = '4d6L'
}: { readonly stackblitz?: boolean; readonly defaultNotation?: string } = {}): React.JSX.Element {
  const [notation, setNotation] = useState(defaultNotation)
```

**Step 2: Verify it builds**

```bash
bun run --filter @randsum/site typecheck
```
Expected: no errors

**Step 3: Commit**

```bash
git add apps/site/src/components/playground/RollerPlayground.tsx
git commit -m "feat(site): add defaultNotation prop to RollerPlayground"
```

---

## Task 2: Rename `LiveRepl.astro` → `CodeExample.astro`

**Files:**
- Rename: `apps/site/src/components/live-repl/LiveRepl.astro` → `apps/site/src/components/live-repl/CodeExample.astro`

**Step 1: Rename the file**

```bash
mv apps/site/src/components/live-repl/LiveRepl.astro apps/site/src/components/live-repl/CodeExample.astro
```

The file contents do not need to change — it imports `OpenInStackBlitz` using a relative path that doesn't involve the filename.

**Step 2: Verify the new file exists**

```bash
ls apps/site/src/components/live-repl/
```
Expected: `CodeExample.astro  OpenInStackBlitz.tsx  extractRandsumDeps.ts`

**Step 3: Commit**

```bash
git add -A apps/site/src/components/live-repl/
git commit -m "refactor(site): rename LiveRepl to CodeExample"
```

---

## Task 3: Update rename-only files

These files use `LiveRepl` only for bash install blocks, readonly type blocks, or game-package `roll()` calls that take non-notation arguments. They need only a find-and-replace of the import and component name.

**Files** (14 total):
- `apps/site/src/content/docs/getting-started/installation.mdx`
- `apps/site/src/content/docs/getting-started/faq.mdx`
- `apps/site/src/content/docs/games/blades.mdx`
- `apps/site/src/content/docs/games/daggerheart.mdx`
- `apps/site/src/content/docs/games/fifth.mdx`
- `apps/site/src/content/docs/games/pbta.mdx`
- `apps/site/src/content/docs/games/root-rpg.mdx`
- `apps/site/src/content/docs/games/salvageunion.mdx`
- `apps/site/src/content/docs/games/overview.mdx`
- `apps/site/src/content/docs/games/comparison.mdx`
- `apps/site/src/content/docs/guides/testing.mdx`
- `apps/site/src/content/docs/guides/custom-game-packages.mdx`
- `apps/site/src/content/docs/tools/skill/index.mdx`
- `apps/site/src/content/docs/tools/discord-bot.mdx`

**Step 1: In each file, change the import line**

From:
```mdx
import LiveRepl from '../../../components/live-repl/LiveRepl.astro'
```
To:
```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
```
(Adjust `../` depth for files nested deeper, e.g. `tools/skill/index.mdx` uses `../../../../`.)

**Step 2: Replace all `<LiveRepl` with `<CodeExample` and `</LiveRepl>` with `</CodeExample>`**

Since these are self-closing components, only `<LiveRepl` → `<CodeExample` matters in practice.

**Step 3: Verify build**

```bash
bun run --filter @randsum/site build 2>&1 | head -40
```
Expected: no import errors

**Step 4: Commit**

```bash
git add apps/site/src/content/docs/games/ apps/site/src/content/docs/getting-started/installation.mdx apps/site/src/content/docs/getting-started/faq.mdx apps/site/src/content/docs/guides/testing.mdx apps/site/src/content/docs/guides/custom-game-packages.mdx apps/site/src/content/docs/tools/
git commit -m "refactor(site): rename LiveRepl → CodeExample in game and tool pages"
```

---

## Task 4: Update `introduction.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/getting-started/introduction.mdx`

**Step 1: Update imports**

Replace:
```mdx
import LiveRepl from '../../../components/live-repl/LiveRepl.astro'
```
With:
```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Update the one code block**

The single block shows result reading (`const result`, `console.log`) — it's contextual. Keep it as `<CodeExample>` and add a playground below:

```mdx
<CodeExample code={`import { roll } from '@randsum/roller'

// Roll a d20
const result = roll(20)
console.log(result.total) // 1-20

// Roll 4d6, drop the lowest
const abilityScore = roll('4d6L')

// Roll with advantage
const attack = roll('2d20H+5')`} />

<RollerPlayground defaultNotation="1d20" client:only="react" />
```

**Step 3: Verify**

```bash
bun run --filter @randsum/site typecheck
```

**Step 4: Commit**

```bash
git add apps/site/src/content/docs/getting-started/introduction.mdx
git commit -m "feat(site): add RollerPlayground to introduction page"
```

---

## Task 5: Update `quick-start.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/getting-started/quick-start.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Block | Content summary | Rule | Result |
|---|---|---|---|
| "Your first roll" | `const result = roll(20)` + console.log | contextual | keep as CodeExample + add `<RollerPlayground defaultNotation="1d20" …/>` below |
| "Notation strings" | 3 bare calls: 2d6, 4d8, 1d20 | basic | stacked: `"2d6"`, `"4d8"`, `"1d20"` |
| "Drop modifiers" | 4 bare calls: 4d6L, 2d20L, 2d20H, 4d6L2 | basic | stacked: `"4d6L"`, `"2d20L"`, `"2d20H"`, `"4d6L2"` |
| Arithmetic #1 | `roll('1d20+5')` | basic | single `"1d20+5"` |
| Arithmetic #2 | `roll('2d6-1')` | basic | single `"2d6-1"` |
| Reroll #1 | `roll('4d6R{1}')` | basic | single `"4d6R{1}"` |
| Reroll+explode | `roll('4d6R{<3}')` + `roll('3d6!')` | basic | stacked: `"4d6R{<3}"`, `"3d6!"` |
| Combining | `roll('4d6R{1}L+2')` + `roll('3d6!L')` | basic | stacked: `"4d6R{1}L+2"`, `"3d6!L"` |
| Options object | shows both `roll('4d6L')` and options form | contextual | keep CodeExample + add `"4d6L"` below |
| Reading result | `const result = roll('4d6L+2')` + console.log | contextual | keep CodeExample + add `"4d6L+2"` below |
| Multiple dice groups | `roll('1d20+5', '2d6+3')` | multi-arg | keep as CodeExample, no playground |

**Step 3: Verify**

```bash
bun run --filter @randsum/site typecheck
```

**Step 4: Commit**

```bash
git add apps/site/src/content/docs/getting-started/quick-start.mdx
git commit -m "feat(site): replace LiveRepl with RollerPlayground in quick-start"
```

---

## Task 6: Update `roller.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/packages/roller.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Block | Content summary | Rule | Result |
|---|---|---|---|
| Basic usage #1 | `roll(20)` + `roll('1d20')` bare calls | basic | single `"1d20"` (they're equivalent) |
| Basic usage #2 | `roll('4d6L')` bare call | basic | single `"4d6L"` |
| Basic usage #3 | `roll('2d20H')` + `roll('2d20L')` bare | basic | stacked: `"2d20H"`, `"2d20L"` |
| Basic usage #4 | `roll('4d6L!R{<3}')` bare | basic | single `"4d6L!R{<3}"` |
| Argument types | shows number, notation, options obj, multi-arg | contextual | keep CodeExample + add `"4d6L"` below |
| Result object | `const result = roll(…)` + console.log | contextual | keep CodeExample + add `"4d6L+2"` below |
| Validation utilities | `isDiceNotation` + `validateNotation` calls | contextual | keep CodeExample + add `"4d6L"` below |
| Custom random | `const cryptoRandom = …; roll(…)` | contextual | keep CodeExample + add `"2d6"` below |
| TypeScript types | `readonly` type imports | readonly | keep CodeExample only, no playground |

**Step 3: Verify + Commit**

```bash
bun run --filter @randsum/site typecheck
git add apps/site/src/content/docs/packages/roller.mdx
git commit -m "feat(site): replace LiveRepl with RollerPlayground in roller docs"
```

---

## Task 7: Update `dice-notation.mdx`

This is the largest file — nearly every `<LiveRepl>` block is a basic notation demo.

**Files:**
- Modify: `apps/site/src/content/docs/reference/dice-notation.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Section | Calls | Rule | Notations for playgrounds |
|---|---|---|---|
| Basic syntax | `roll('1d20')`, `roll('4d6')`, `roll('2d12')` | basic | stacked: `"1d20"`, `"4d6"`, `"2d12"` |
| Number form | `roll(20)` | basic | single `"1d20"` |
| Arithmetic | `roll('4d6+2')`, `roll('4d6-1')` | basic | stacked: `"4d6+2"`, `"4d6-1"` |
| Drop | 5 bare calls | basic | stacked: `"4d6L"`, `"4d6H2"`, `"4d20D{>17}"`, `"4d20D{<5}"`, `"4d20D{8,12}"` |
| Keep | 4 bare calls | basic | stacked: `"4d6K3"`, `"4d6kl2"`, `"2d20K"`, `"2d20kl"` |
| Cap | 3 bare calls | basic | stacked: `"4d20C{>18}"`, `"4d20C{<3}"`, `"4d20C{<2,>19}"` |
| Reroll | 4 bare calls | basic | stacked: `"4d20R{>17}"`, `"4d20R{<5}"`, `"4d20R{8,12}"`, `"4d20R{<5}3"` |
| Replace | 3 bare calls | basic | stacked: `"4d20V{8=12}"`, `"4d20V{>17=20}"`, `"4d20V{<5=1}"` |
| Unique | 2 bare calls | basic | stacked: `"4d20U"`, `"4d20U{5,10}"` |
| Explode | 3 bare calls | basic | stacked: `"4d20!"`, `"3d6!5"`, `"3d6!0"` |
| Compound exploding | 2 bare calls | basic | stacked: `"3d6!!"`, `"3d6!!5"` |
| Penetrating exploding | 2 bare calls | basic | stacked: `"3d6!p"`, `"3d6!p5"` |
| Pre-arithmetic multiply | 2 bare calls | basic | stacked: `"2d6*2+3"`, `"4d6*3"` |
| Count successes | 2 bare calls | basic | stacked: `"5d10S{7}"`, `"5d10S{7,1}"` |
| Total multiply | 2 bare calls | basic | stacked: `"2d6+3**2"`, `"4d6L+2**3"` |
| Combining modifiers | 4 bare calls | basic | stacked: `"4d6R{<3}L"`, `"4d6L+2"`, `"3d6!!*2+3"`, `"4d6K3!+2"` |
| Multiple dice groups | `roll('1d20+5', '2d6+3')` multi-arg | contextual | keep CodeExample, no playground |
| D&D ability scores | `roll('4d6K3')`, `roll('4d6L')` | basic | stacked: `"4d6K3"`, `"4d6L"` |
| D&D advantage/disadvantage | `roll('2d20K')`, `roll('2d20kl')` | basic | stacked: `"2d20K"`, `"2d20kl"` |
| Critical hits | `roll('2d6+3*2')`, `roll('2d6+3**2')` | basic | stacked: `"2d6+3*2"`, `"2d6+3**2"` |
| Hackmaster penetrating | `roll('1d6!p')`, `roll('2d6!p+3')` | basic | stacked: `"1d6!p"`, `"2d6!p+3"` |
| WoD/Shadowrun pools | `roll('5d10S{7}')`, `roll('5d10S{7,1}')` | basic | stacked: `"5d10S{7}"`, `"5d10S{7,1}"` |

**Step 3: Verify + Commit**

```bash
bun run --filter @randsum/site typecheck
git add apps/site/src/content/docs/reference/dice-notation.mdx
git commit -m "feat(site): replace LiveRepl with RollerPlayground in dice-notation reference"
```

---

## Task 8: Update `modifiers.mdx`

Most blocks here show both notation AND options-object forms together — all are contextual.

**Files:**
- Modify: `apps/site/src/content/docs/reference/modifiers.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Block | Rule | Playground notation (if any) |
|---|---|---|
| `ModifierOptions` interface | readonly | none |
| Cap | contextual (has options object) | `"4d20C{>18}"` |
| `ComparisonOptions` interface | readonly | none |
| Drop | contextual (has options object) | `"4d6L"` |
| `DropOptions` interface | readonly | none |
| Keep | contextual (has options object) | `"4d6K3"` |
| `KeepOptions` interface | readonly | none |
| Replace | contextual (has options object) | `"4d20V{8=12}"` |
| `ReplaceOptions` interface | readonly | none |
| Reroll | contextual (has options object) | `"4d20R{<5}"` |
| `RerollOptions` interface | readonly | none |
| Explode | contextual (has options object) | `"4d20!"` |
| Compound | contextual (has options object) | `"3d6!!"` |
| Penetrate | contextual (has options object) | `"3d6!p"` |
| Unique | contextual (has options object) | `"4d20U"` |
| `UniqueOptions` interface | readonly | none |
| Pre-arithmetic multiply | contextual (has options object) | `"2d6*2+3"` |
| Plus: `roll('4d6+5')` | basic (bare notation call only) | `"4d6+5"` → replace with single playground |
| Minus: `roll('2d8-2')` | basic (bare notation call only) | `"2d8-2"` → replace with single playground |
| Plus options object | contextual (options object only, no notation call) | none |
| Count successes | contextual (has options object) | `"5d10S{7}"` |
| `SuccessCountOptions` interface | readonly | none |
| Total multiply | contextual (has options object) | `"2d6+3**2"` |
| Complete order example | basic (`roll('4d6K3!*2+3**2')` bare) | `"4d6K3!*2+3**2"` → replace with single playground |

**Step 3: Verify + Commit**

```bash
bun run --filter @randsum/site typecheck
git add apps/site/src/content/docs/reference/modifiers.mdx
git commit -m "feat(site): add RollerPlayground embeds to modifiers reference"
```

---

## Task 9: Update `roll-options.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/reference/roll-options.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Block | Content summary | Rule | Playground notation |
|---|---|---|---|
| Number args | `roll(20)`, `roll(6)`, `roll(100)` bare | basic | stacked: `"1d20"`, `"1d6"`, `"1d100"` |
| Notation string args | `roll('2d6')`, `roll('4d6L')`, `roll('1d20+5')` bare | basic | stacked: `"2d6"`, `"4d6L"`, `"1d20+5"` |
| Options object | options object only, no notation call | contextual | none (no equivalent single notation) |
| Multiple arguments | multi-arg `roll('1d20+5', '2d6+3')` | contextual | none (multi-arg) |
| Sides: custom faces | options with array sides | contextual | none (array sides unsupported by playground) |
| Quantity | `roll({ sides: 6, quantity: 4 })` | contextual | `"4d6"` |
| Arithmetic | arithmetic subtract options (multi-arg style) | contextual | none (multi-arg) |
| Modifiers | options with drop+reroll+plus | contextual | `"4d6L"` |
| `RollConfig` interface | readonly | none | none |
| Custom random fn | custom function | contextual | `"2d6"` |
| Result object | `const result = …` + console.log | contextual | `"4d6L+2"` |
| Error handling | `roll('invalid')` with error check | contextual (invalid input intentional) | none |
| `isDiceNotation` | type guard with if block | contextual | `"4d6L"` |
| `validateNotation` | validateNotation only, no roll() | contextual | none |

**Step 3: Verify + Commit**

```bash
bun run --filter @randsum/site typecheck
git add apps/site/src/content/docs/reference/roll-options.mdx
git commit -m "feat(site): add RollerPlayground embeds to roll-options reference"
```

---

## Task 10: Update `recipes.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/guides/recipes.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Block | Content summary | Rule | Playground notation |
|---|---|---|---|
| Seeded rolls | `seededRandom` function + `roll('4d6L', …)` | contextual | `"4d6L"` |
| Combining rolls | `roll('1d20+5', '2d6+3')` multi-arg | contextual | none (multi-arg) |
| Advantage arbitrary dice (options) | drop options object | contextual | none (no single notation) |
| Advantage shorthand #1 | `roll('2d12H')` bare | basic | single `"2d12H"` |
| Advantage shorthand #2 | `roll('2d12L')` bare | basic | single `"2d12L"` |
| Subtracting rolls | arithmetic subtract options | contextual | none (no single notation) |
| Custom faces | array sides + console.log | contextual | none (array sides unsupported) |
| Rolling and filtering (manual) | `Array.from` + `.filter` | contextual | none (complex code) |
| Rolling and filtering (countSuccesses) | options + console.log | contextual | `"10d6S{4}"` |
| Generating histogram | for loop + `roll('2d6')` | contextual | `"2d6"` |
| Crypto random | cryptoRandom function | contextual | `"2d6"` |

**Step 3: Verify + Commit**

```bash
bun run --filter @randsum/site typecheck
git add apps/site/src/content/docs/guides/recipes.mdx
git commit -m "feat(site): add RollerPlayground embeds to recipes guide"
```

---

## Task 11: Update `error-handling.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/guides/error-handling.mdx`

**Step 1: Update imports**

```mdx
import CodeExample from '../../../components/live-repl/CodeExample.astro'
import { RollerPlayground } from '../../../components/playground/RollerPlayground'
```

**Step 2: Apply transformation rules block by block**

| Block | Content summary | Rule | Playground notation |
|---|---|---|---|
| `result.error` pattern | `roll('not-valid-notation')` intentional error | contextual (invalid input) | none |
| `isDiceNotation` guard | function wrapping roll + console.log | contextual | `"4d6L"` |
| `validateNotation` | validateNotation only | contextual | `"4d6L"` |
| Checking error value | `roll('2d6')` with null check + console.log | contextual | `"2d6"` |

**Step 3: Verify + Commit**

```bash
bun run --filter @randsum/site typecheck
git add apps/site/src/content/docs/guides/error-handling.mdx
git commit -m "feat(site): add RollerPlayground embeds to error-handling guide"
```

---

## Task 12: Final verification

**Step 1: Full build**

```bash
bun run --filter @randsum/site build
```
Expected: clean build, no import errors for `LiveRepl`

**Step 2: Confirm no remaining LiveRepl references**

```bash
grep -r "LiveRepl" apps/site/src/
```
Expected: zero matches

**Step 3: Commit (if any fixups needed)**

```bash
git add -A apps/site/
git commit -m "fix(site): clean up any remaining LiveRepl references"
```
