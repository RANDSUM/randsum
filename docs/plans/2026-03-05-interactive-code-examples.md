# Interactive Code Examples Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `<RollableCode>` React component that wraps code examples in MDX docs with Run/Re-roll/Clear buttons and live dice results inline.

**Architecture:** A React island component (`client:load`) renders code via `react-syntax-highlighter` (matching Starlight's dark/light theme). All result-formatting logic lives in pure utility functions (testable). The component calls `roll(...liveArgs)` directly — no eval. In rolled state, the last `// comment` in the code string is replaced with a formatted live result string including a JSX representation of dropped dice with strikethrough.

**Tech Stack:** React 19, `react-syntax-highlighter`, `@randsum/roller`, `bun:test`, Astro MDX, Starlight CSS vars.

---

## Preliminary: Verify drop data structure

Before building the formatter, confirm which `RollRecord` fields hold pre-modifier vs post-modifier dice. Run this in a quick scratch file or REPL:

```typescript
import { roll } from '@randsum/roller'

const result = roll('4d6L')
const record = result.rolls[0]
console.log('rolls:', record.rolls)
console.log('initialRolls:', record.modifierHistory.initialRolls)
console.log('modifiedRolls:', record.modifierHistory.modifiedRolls)
console.log('total:', record.total)
```

Expected: `initialRolls` has 4 values (all dice), `modifiedRolls` has 3 (dropped lowest). Confirm before Task 3.

---

### Task 1: Add `react-syntax-highlighter` dependency

**Files:**
- Modify: `apps/site/package.json`

**Step 1: Install the package**

```bash
cd apps/site
bun add react-syntax-highlighter
bun add -d @types/react-syntax-highlighter
```

**Step 2: Verify it installed**

```bash
bun run typecheck
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add apps/site/package.json bun.lock
git commit -m "chore(site): add react-syntax-highlighter"
```

---

### Task 2: Create result-formatting utilities (TDD first)

**Files:**
- Create: `apps/site/src/components/rollable-code/formatLiveResult.ts`
- Create: `apps/site/__tests__/formatLiveResult.test.ts`

**Step 1: Write failing tests**

Create `apps/site/__tests__/formatLiveResult.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import {
  findDroppedIndices,
  findLastCommentIndex,
  buildCommentText
} from '../src/components/rollable-code/formatLiveResult'

describe('findLastCommentIndex', () => {
  test('returns index of last // comment line', () => {
    const lines = [
      "import { roll } from '@randsum/roller'",
      '',
      "const result = roll('4d6L')",
      'console.log(result.total) // 14'
    ]
    expect(findLastCommentIndex(lines)).toBe(3)
  })

  test('returns -1 when no comment', () => {
    const lines = ["roll('4d6L')"]
    expect(findLastCommentIndex(lines)).toBe(-1)
  })

  test('returns last match when multiple comments', () => {
    const lines = [
      '// Roll 4d6, drop lowest',
      "roll('4d6L') // 1-20"
    ]
    expect(findLastCommentIndex(lines)).toBe(1)
  })
})

describe('findDroppedIndices', () => {
  test('finds single dropped die', () => {
    const initial = [6, 5, 3, 1]
    const modified = [6, 5, 3]
    expect(findDroppedIndices(initial, modified)).toEqual(new Set([3]))
  })

  test('finds multiple dropped dice', () => {
    const initial = [6, 5, 3, 1]
    const modified = [6, 5]
    // lowest two: index 3 (1) and index 2 (3) — but by value matching
    const dropped = findDroppedIndices(initial, modified)
    expect(dropped.size).toBe(2)
    expect(dropped.has(2)).toBe(true)
    expect(dropped.has(3)).toBe(true)
  })

  test('empty when no dice dropped', () => {
    const initial = [4, 5, 6]
    const modified = [4, 5, 6]
    expect(findDroppedIndices(initial, modified)).toEqual(new Set())
  })

  test('handles duplicate values — only marks extras as dropped', () => {
    // If initial = [3, 3, 5, 6] and modified = [3, 5, 6], one 3 was dropped
    const initial = [3, 3, 5, 6]
    const modified = [3, 5, 6]
    const dropped = findDroppedIndices(initial, modified)
    expect(dropped.size).toBe(1)
    // One of the two 3s is marked dropped (index 0 or 1, first match wins)
    expect(dropped.has(0) || dropped.has(1)).toBe(true)
  })
})

describe('buildCommentText', () => {
  test('formats simple roll with no drops', () => {
    const segments = [{ value: 14, dropped: false }]
    expect(buildCommentText(segments, 14, [])).toBe('// [14] = 14')
  })

  test('formats single roll group with drop', () => {
    const segments = [
      { value: 6, dropped: false },
      { value: 5, dropped: false },
      { value: 3, dropped: false },
      { value: 1, dropped: true }
    ]
    expect(buildCommentText(segments, 14, [])).toBe('// [6, 5, 3, 1̶] = 14')
    // Note: we test the plain-text form; JSX form is tested via component
  })
})
```

**Step 2: Run tests — verify they fail**

```bash
bun test apps/site/__tests__/formatLiveResult.test.ts
```

Expected: `FAIL` — module not found.

**Step 3: Implement the utilities**

Create `apps/site/src/components/rollable-code/formatLiveResult.ts`:

```typescript
export interface DiceSegment {
  readonly value: number
  readonly dropped: boolean
}

/**
 * Finds the index of the last line ending with a `// comment`.
 * Returns -1 if no such line exists.
 */
export function findLastCommentIndex(lines: string[]): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/\/\/\s*.+/.test(lines[i] ?? '')) return i
  }
  return -1
}

/**
 * Given the initial rolls and the post-modifier rolls, returns a Set
 * of indices (into `initial`) that were dropped/removed.
 *
 * Uses a greedy left-to-right matching strategy: for each value in
 * `modified`, consume the first matching index in `initial`.
 */
export function findDroppedIndices(
  initial: readonly number[],
  modified: readonly number[]
): Set<number> {
  const remaining = new Map<number, number[]>()

  for (let i = 0; i < initial.length; i++) {
    const val = initial[i] ?? 0
    const indices = remaining.get(val) ?? []
    indices.push(i)
    remaining.set(val, indices)
  }

  for (const val of modified) {
    const indices = remaining.get(val)
    if (indices && indices.length > 0) {
      indices.shift() // consume one match
    }
  }

  const dropped = new Set<number>()
  for (const indices of remaining.values()) {
    for (const idx of indices) {
      dropped.add(idx)
    }
  }
  return dropped
}

/**
 * Builds the plain-text comment replacement string.
 * Used for accessible display and copy-paste behavior.
 * The React component renders the JSX version with <del> elements.
 */
export function buildCommentText(
  segments: readonly DiceSegment[],
  total: number,
  _extraGroups: readonly { segments: readonly DiceSegment[]; bonus?: number }[]
): string {
  const formatGroup = (segs: readonly DiceSegment[]): string => {
    const parts = segs.map(s => (s.dropped ? `${s.value}\u0336` : String(s.value)))
    return `[${parts.join(', ')}]`
  }
  return `// ${formatGroup(segments)} = ${total}`
}
```

**Step 4: Run tests — verify they pass**

```bash
bun test apps/site/__tests__/formatLiveResult.test.ts
```

Expected: all pass.

**Step 5: Commit**

```bash
git add apps/site/src/components/rollable-code/formatLiveResult.ts apps/site/__tests__/formatLiveResult.test.ts
git commit -m "feat(site): add roll result formatting utilities"
```

---

### Task 3: Build `RollableCode` component — skeleton

**Files:**
- Create: `apps/site/src/components/rollable-code/RollableCode.tsx`
- Create: `apps/site/src/components/rollable-code/RollableCode.css`

**Step 1: Create the component file**

Create `apps/site/src/components/rollable-code/RollableCode.tsx`:

```tsx
import { useState, useCallback } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { roll } from '@randsum/roller'
import type { RollArgument } from '@randsum/roller'
import { findDroppedIndices, findLastCommentIndex } from './formatLiveResult'
import type { DiceSegment } from './formatLiveResult'
import './RollableCode.css'

interface RollableCodeProps {
  readonly code: string
  readonly lang?: string
  readonly liveArgs: ReadonlyArray<string | number>
  readonly children?: never
}

interface RollState {
  readonly segments: readonly DiceSegment[]
  readonly total: number
  readonly commentLineIndex: number
}

function computeRollState(
  result: ReturnType<typeof roll>,
  commentLineIndex: number
): RollState | null {
  if (result.error) return null

  const record = result.rolls[0]
  if (!record) return null

  const initial = record.modifierHistory.initialRolls
  const modified = record.modifierHistory.modifiedRolls
  const dropped = findDroppedIndices(initial, modified)

  const segments: DiceSegment[] = initial.map((value, i) => ({
    value,
    dropped: dropped.has(i)
  }))

  return { segments, total: result.total, commentLineIndex }
}

export function RollableCode({ code, lang = 'typescript', liveArgs }: RollableCodeProps): React.JSX.Element {
  const [rollState, setRollState] = useState<RollState | null>(null)

  const lines = code.split('\n')
  const commentLineIndex = findLastCommentIndex(lines)

  const execute = useCallback(() => {
    const result = roll(...(liveArgs as RollArgument[]))
    setRollState(computeRollState(result, commentLineIndex))
  }, [liveArgs, commentLineIndex])

  const clear = useCallback(() => {
    setRollState(null)
  }, [])

  // Build display code: if rolled, replace the comment text
  const displayCode = rollState !== null
    ? buildDisplayCode(lines, rollState)
    : code

  return (
    <div className="rollable-code">
      <div className="rollable-code-header">
        <span className="rollable-code-lang">{lang}</span>
        <div className="rollable-code-controls">
          {rollState === null ? (
            <button type="button" className="rollable-btn rollable-btn-run" onClick={execute}>
              ▶ Run
            </button>
          ) : (
            <>
              <button type="button" className="rollable-btn rollable-btn-reroll" onClick={execute}>
                ↻ Re-roll
              </button>
              <button type="button" className="rollable-btn rollable-btn-clear" onClick={clear}>
                ✕ Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rollable-code-body">
        {rollState !== null && commentLineIndex !== -1 ? (
          <LiveCodeView
            lines={lines}
            commentLineIndex={commentLineIndex}
            rollState={rollState}
            lang={lang}
          />
        ) : (
          <SyntaxHighlighter
            language={lang}
            style={atomOneDark}
            customStyle={{ margin: 0, padding: '1.25rem 1.5rem', background: 'transparent', fontSize: '0.9rem', lineHeight: 1.7 }}
            codeTagProps={{ style: { fontFamily: 'inherit' } }}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  )
}

function buildDisplayCode(lines: string[], rollState: RollState): string {
  return lines.map((line, i) => {
    if (i !== rollState.commentLineIndex) return line
    const commentStart = line.lastIndexOf('//')
    if (commentStart === -1) return line
    return line.slice(0, commentStart) // strip comment; will be replaced by LiveCodeView
  }).join('\n')
}

interface LiveCodeViewProps {
  readonly lines: readonly string[]
  readonly commentLineIndex: number
  readonly rollState: RollState
  readonly lang: string
}

function LiveCodeView({ lines, commentLineIndex, rollState, lang }: LiveCodeViewProps): React.JSX.Element {
  const beforeLines = lines.slice(0, commentLineIndex)
  const commentLine = lines[commentLineIndex] ?? ''
  const commentStart = commentLine.lastIndexOf('//')
  const beforeComment = commentLine.slice(0, commentStart)

  const beforeCode = [...beforeLines, beforeComment].join('\n')

  return (
    <>
      <SyntaxHighlighter
        language={lang}
        style={atomOneDark}
        customStyle={{ margin: 0, padding: '1.25rem 1.5rem 0', background: 'transparent', fontSize: '0.9rem', lineHeight: 1.7 }}
        codeTagProps={{ style: { fontFamily: 'inherit' } }}
      >
        {beforeCode}
      </SyntaxHighlighter>
      <div className="rollable-live-comment">
        <span className="rollable-comment-prefix">// [</span>
        {rollState.segments.map((seg, i) => (
          <span key={i}>
            {i > 0 && <span className="rollable-comment-sep">, </span>}
            {seg.dropped
              ? <del className="rollable-dice-dropped">{seg.value}</del>
              : <span className="rollable-dice-kept">{seg.value}</span>
            }
          </span>
        ))}
        <span className="rollable-comment-prefix">] = {rollState.total}</span>
      </div>
    </>
  )
}
```

**Step 2: Create the CSS file**

Create `apps/site/src/components/rollable-code/RollableCode.css`:

```css
.rollable-code {
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--sl-color-gray-6);
  font-family: var(--sl-font-mono);
  margin: 1rem 0;
}

.rollable-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
}

.rollable-code-lang {
  font-size: 0.75rem;
  color: var(--sl-color-gray-3);
  font-family: var(--sl-font-mono);
}

.rollable-code-controls {
  display: flex;
  gap: 0.5rem;
}

.rollable-btn {
  font-size: 0.75rem;
  font-family: var(--sl-font-mono);
  padding: 0.2rem 0.6rem;
  border-radius: 0.25rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rollable-btn-run {
  background: var(--sl-color-accent);
  color: var(--sl-color-black);
  border-color: var(--sl-color-accent);
}

.rollable-btn-run:hover {
  filter: brightness(1.15);
}

.rollable-btn-reroll {
  background: transparent;
  color: var(--sl-color-accent);
  border-color: var(--sl-color-accent);
}

.rollable-btn-reroll:hover {
  background: var(--sl-color-accent);
  color: var(--sl-color-black);
}

.rollable-btn-clear {
  background: transparent;
  color: var(--sl-color-gray-3);
  border-color: var(--sl-color-gray-4);
}

.rollable-btn-clear:hover {
  color: var(--sl-color-white);
  border-color: var(--sl-color-gray-3);
}

.rollable-code-body {
  overflow-x: auto;
}

/* Live result comment line */
.rollable-live-comment {
  padding: 0 1.5rem 1.25rem;
  font-size: 0.9rem;
  line-height: 1.7;
  font-family: var(--sl-font-mono);
}

.rollable-comment-prefix {
  color: var(--sl-color-gray-3);
}

.rollable-comment-sep {
  color: var(--sl-color-gray-3);
}

.rollable-dice-kept {
  color: var(--sl-color-accent-high);
}

.rollable-dice-dropped {
  color: var(--sl-color-gray-3);
  text-decoration: line-through;
}
```

**Step 3: Verify the site builds without errors**

```bash
bun run --filter @randsum/site build
```

Expected: build succeeds, no TypeScript errors.

**Step 4: Run the dev server and visually verify**

```bash
bun run --filter @randsum/site dev
```

Open `http://localhost:4321` and check there are no console errors.

**Step 5: Commit**

```bash
git add apps/site/src/components/rollable-code/
git commit -m "feat(site): add RollableCode interactive component"
```

---

### Task 4: Update `quick-start.mdx` — first integration

This is the simplest page with clean roll() examples. Do this first to verify the component works end-to-end before touching the larger pages.

**Files:**
- Modify: `apps/site/src/content/docs/getting-started/quick-start.mdx`

**Step 1: Read the current file**

Read `apps/site/src/content/docs/getting-started/quick-start.mdx` — already done in planning, but re-read to get current line numbers.

**Step 2: Add the import and replace code blocks**

At the top of the MDX file, add after the frontmatter:

```mdx
import { RollableCode } from '../../../components/rollable-code/RollableCode'
```

Replace each fenced code block that calls `roll()` with a `<RollableCode>` component. Rules:
- Only blocks where `liveArgs` can be expressed as a simple notation string or number array
- Do NOT replace blocks that have multi-line logic (loops, helpers, `randomFn`)
- Do NOT replace blocks that only show the options-object form (those can stay static)

Example conversion:

**Before:**
````
```typescript
import { roll } from '@randsum/roller'

// Roll a single d20
const result = roll(20)
console.log(result.total) // 1-20
```
````

**After:**
```mdx
<RollableCode client:load lang="typescript" liveArgs={[20]}>
{`import { roll } from '@randsum/roller'

// Roll a single d20
const result = roll(20)
console.log(result.total) // 1-20`}
</RollableCode>
```

Blocks to convert in `quick-start.mdx`:
1. `roll(20)` → `liveArgs={[20]}`
2. `roll('2d6')`, `roll('4d8')`, `roll('1d20')` → leave as a static block (multiple calls, no comment to replace — skip)
3. `roll('4d6L')` → `liveArgs={['4d6L']}`
4. `roll('2d20L')` → `liveArgs={['2d20L']}`
5. `roll('1d20+5')` → `liveArgs={['1d20+5']}`
6. `roll('4d6R{1}')` → `liveArgs={['4d6R{1}']}`
7. `roll('4d6L')` (options object block) → leave static
8. `roll('4d6L+2')` in the result-reading block → `liveArgs={['4d6L+2']}`

**Step 3: Run the dev server and test each button**

```bash
bun run --filter @randsum/site dev
```

Navigate to `http://localhost:4321/getting-started/quick-start/` and click Run on each block. Verify:
- The `// comment` updates with actual result
- Dropped dice show with strikethrough (on `4d6L`)
- Re-roll produces different result
- Clear restores the original comment text

**Step 4: Commit**

```bash
git add apps/site/src/content/docs/getting-started/quick-start.mdx
git commit -m "feat(site): add live roll examples to quick-start page"
```

---

### Task 5: Update `reference/modifiers.mdx`

The modifier reference has many code blocks. Convert notation-form blocks only (not options-object blocks, which stay static).

**Files:**
- Modify: `apps/site/src/content/docs/reference/modifiers.mdx`

**Step 1: Add import**

Add after frontmatter:
```mdx
import { RollableCode } from '../../../components/rollable-code/RollableCode'
```

**Step 2: Convert blocks — notation examples only**

For each modifier section, convert the notation form block. Leave the options-object blocks as static fenced code. Key conversions:

| Section | liveArgs |
|---|---|
| Cap: `roll('4d20C{>18}')` | `["4d20C{>18}"]` |
| Drop: `roll('4d6L')` | `["4d6L"]` |
| Drop: `roll('4d6H')` | `["4d6H"]` |
| Keep: `roll('4d6K3')` | `["4d6K3"]` |
| Reroll: `roll('4d20R{<5}')` | `["4d20R{<5}"]` |
| Explode: `roll('4d20!')` | `["4d20!"]` |
| Unique: `roll('4d20U')` | `["4d20U"]` |
| Plus: `roll('4d6+5')` | `["4d6+5"]` |
| Minus: `roll('2d8-2')` | `["2d8-2"]` |
| Count successes: `roll('5d10S{7}')` | `["5d10S{7}"]` |

Blocks with multiple calls in one fenced block should be split into individual `<RollableCode>` components (one per call) separated by prose, OR left static if splitting would break the narrative flow.

**Step 3: Build and test**

```bash
bun run --filter @randsum/site build
```

Navigate to the modifiers page in dev and verify each interactive block works.

**Step 4: Commit**

```bash
git add apps/site/src/content/docs/reference/modifiers.mdx
git commit -m "feat(site): add live examples to modifiers reference"
```

---

### Task 6: Update `reference/dice-notation.mdx`

**Files:**
- Modify: `apps/site/src/content/docs/reference/dice-notation.mdx`

Same process as Task 5. Add the import, convert notation-form roll() examples. Skip any blocks with complex multi-argument patterns if a clean `liveArgs` isn't obvious.

**Step 1: Add import, convert blocks**

**Step 2: Build and test**

```bash
bun run --filter @randsum/site build
```

**Step 3: Commit**

```bash
git add apps/site/src/content/docs/reference/dice-notation.mdx
git commit -m "feat(site): add live examples to dice notation reference"
```

---

### Task 7: Update game package pages

**Files:**
- Modify: `apps/site/src/content/docs/games/blades.mdx`
- Modify: `apps/site/src/content/docs/games/fifth.mdx`
- Modify: `apps/site/src/content/docs/games/daggerheart.mdx`
- Modify: `apps/site/src/content/docs/games/pbta.mdx`
- Modify: `apps/site/src/content/docs/games/root-rpg.mdx`
- Modify: `apps/site/src/content/docs/games/salvageunion.mdx`

**Note:** Game pages import from game packages (`@randsum/blades`, etc.), not `@randsum/roller`. The `RollableCode` component calls `roll()` from `@randsum/roller` directly. For game-package examples, the `liveArgs` still works because game roll calls ultimately use the same dice — but the result object shape differs.

For game pages, there are two options:
1. Convert only the basic `roll(N)` calls if the comment shows a numeric outcome
2. Skip game pages for now (leave static)

**Recommendation:** Convert only the basic usage examples from game pages if they call `roll()` with a notation string or number and have a `// comment` showing expected output. If the game page shows `result.result // 'critical' | 'success' ...` (string outcomes from game logic), leave those static — the component currently only handles numeric totals.

For each game page that HAS a basic numeric roll example:

**Step 1: Add import, convert eligible blocks**

**Step 2: Commit per page**

```bash
git add apps/site/src/content/docs/games/<pagename>.mdx
git commit -m "feat(site): add live examples to <game> page"
```

---

### Task 8: Update `guides/recipes.mdx` — selective blocks

**Files:**
- Modify: `apps/site/src/content/docs/guides/recipes.mdx`

Convert only simple, standalone roll() calls. Skip:
- The histogram (10,000-iteration loop) — keep static
- Seeded random example (uses `randomFn`) — keep static
- Crypto random example — keep static
- `Array.from` multi-roll example — keep static

Convert:
- `roll('1d20+5', '2d6+3')` — `liveArgs={['1d20+5', '2d6+3']}` (multi-arg)
- `roll('2d12H')` / `roll('2d12L')` — each gets its own `<RollableCode>`
- The `countSuccesses` example → `liveArgs={[{ sides: 6, quantity: 10, modifiers: { countSuccesses: { threshold: 4 } } }]}` (options object — but it's expressible as a JS object, not a string; the component accepts `RollArgument` which includes options objects)

Wait — `liveArgs` accepts `Array<string | number>` but options objects are also valid. Update the type definition:

```typescript
// In RollableCode.tsx, update the prop type:
readonly liveArgs: ReadonlyArray<string | number | RollOptions>
```

**Step 1: Update `liveArgs` type in `RollableCode.tsx`**

```typescript
import type { RollArgument, RollOptions } from '@randsum/roller'

interface RollableCodeProps {
  readonly liveArgs: ReadonlyArray<string | number | RollOptions>
  // ...
}
```

**Step 2: Add import to recipes.mdx, convert eligible blocks**

**Step 3: Build and test**

```bash
bun run --filter @randsum/site build
```

**Step 4: Commit**

```bash
git add apps/site/src/content/docs/guides/recipes.mdx apps/site/src/components/rollable-code/RollableCode.tsx
git commit -m "feat(site): add live examples to recipes guide"
```

---

### Task 9: Final visual polish pass

**Step 1: Run full check**

```bash
bun run check:all
```

Fix any lint/format/typecheck issues.

**Step 2: Visual smoke test in dev**

```bash
bun run --filter @randsum/site dev
```

Check dark mode and light mode on:
- `/getting-started/quick-start/`
- `/reference/modifiers/`
- One game page

Verify:
- Code block matches Starlight's visual weight (same background, similar border)
- Run button is visible but not distracting
- Strikethrough on dropped dice is readable in both themes
- Re-roll changes the result
- Clear restores original

**Step 3: Fix any visual issues found**

Adjust `RollableCode.css` as needed.

**Step 4: Final commit**

```bash
git add -p
git commit -m "fix(site): polish interactive code block styles"
```

---

## Notes

- **SyntaxHighlighter theme mismatch:** `atomOneDark` is close to Starlight's dark theme but not identical. If the color difference is jarring, try `vs2015` or `monokai-sublime` from the hljs styles. In light mode, Starlight switches themes automatically — the `atomOneDark` theme will always show dark regardless of Starlight's theme toggle. Consider passing `style={isDark ? atomOneDark : atomOneLight}` using a `prefers-color-scheme` media query or Starlight's `data-theme` attribute read via `document.documentElement.dataset.theme`.

- **Multiple roll groups:** The current `LiveCodeView` only handles a single `RollRecord`. For multi-arg calls like `liveArgs={['1d20+5', '2d6+3']}`, extend `computeRollState` to iterate `result.rolls` (one per arg group) and display them as `[14] +5 + [3, 5] +3 = 30`. This is an enhancement, not required for MVP.

- **Game package roll():** The `@randsum/blades` `roll()` returns `GameRollResult`, not `RollerRollResult`. If adding game page interactivity, the component would need a `package` prop and conditional import. Defer to a follow-up.
