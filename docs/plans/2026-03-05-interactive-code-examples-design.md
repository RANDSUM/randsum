# Interactive Code Examples

**Date:** 2026-03-05
**Status:** Approved

## Problem

Code examples in the docs site are static. Readers cannot see what `roll()` actually produces — they have to install the package or use the playground to verify any example.

## Goal

Add live, executable `roll()` examples inline with documentation code blocks. No full REPL — just enough to let the reader click a button and see the dice land.

## Approach

Replace selected fenced code blocks in MDX files with a `<RollableCode>` React island component. The component renders its own syntax-highlighted code block, executes the roll via `@randsum/roller` on demand, and replaces the trailing `// comment` on the last annotated line with a formatted live result.

Not chosen:
- **Rehype plugin** — too complex to implement correctly against ExpressiveCode's AST
- **Global client script** — fragile against Starlight/ExpressiveCode's HTML structure

## Architecture

### New file: `apps/site/src/components/RollableCode.tsx`

A single React component used with `client:load` in MDX files.

**Props:**

```typescript
interface RollableCodeProps {
  code: string                        // The code string to display
  lang?: string                       // Syntax language (default: 'typescript')
  liveArgs: Array<string | number>   // Arguments forwarded to roll()
}
```

**State machine:**

- `idle` — shows Run button
- `rolled` — shows Re-roll + Clear buttons, comment is replaced with live result

**Syntax highlighting:** `react-syntax-highlighter` configured to match Starlight's dark/light theme tokens (same CSS vars: `--sl-font-mono`, `--sl-color-gray-6`, etc.).

**No eval.** The `liveArgs` prop is explicit — the component calls `roll(...liveArgs)` directly. Code that cannot be expressed as a simple `liveArgs` array (histograms, loops, seeded examples) stays as a static fenced block.

### Usage in MDX

```mdx
import RollableCode from '../../../components/RollableCode'

<RollableCode lang="typescript" liveArgs={['4d6L']}>
{`import { roll } from '@randsum/roller'

const result = roll('4d6L')
console.log(result.total) // 14`}
</RollableCode>
```

## Comment Replacement Format

The last `// comment` token in the code string is replaced with the live result after rolling.

| Example | Comment becomes |
|---|---|
| `roll(20)` → 14 | `// [14] = 14` |
| `roll('4d6L')` → total 14, dropped 1 | `// [6, 5, 3, ~~1~~] = 14` |
| `roll('1d20+5')` → 14 rolled, +5 | `// [14] +5 = 19` |
| `roll('1d20+5', '2d6+3')` | `// [14] +5 + [3, 5] +3 = 30` |

Dropped/eliminated dice render as `<del>` (strikethrough). Dropped dice are computed by comparing `RollRecord.modifierHistory.initialRolls` against `modifierHistory.modifiedRolls`.

Arithmetic bonuses (`plus`, `minus`) are shown explicitly between groups: `[14] +5`.

## UI Layout

**Before rolling:**
```
┌─────────────────────────────────────────────────────────────┐
│  typescript                                     [▶ Run]    │
├─────────────────────────────────────────────────────────────┤
│  import { roll } from '@randsum/roller'                     │
│                                                             │
│  const result = roll('4d6L')                               │
│  console.log(result.total) // 14                           │
└─────────────────────────────────────────────────────────────┘
```

**After rolling:**
```
┌─────────────────────────────────────────────────────────────┐
│  typescript                     [↻ Re-roll]  [✕ Clear]    │
├─────────────────────────────────────────────────────────────┤
│  import { roll } from '@randsum/roller'                     │
│                                                             │
│  const result = roll('4d6L')                               │
│  console.log(result.total) // [6, 5, 3, ~~1~~] = 14       │
└─────────────────────────────────────────────────────────────┘
```

Controls:
- **Run (▶)** — executes roll, replaces comment, switches to Re-roll/Clear
- **Re-roll (↻)** — executes again, updates comment in place
- **Clear (✕)** — restores original comment text, shows Run button again

State resets on page navigation (no persistence needed).

## Scope: MDX Files to Update

Pages with `roll()` examples suitable for live execution:

| File | Estimated blocks |
|---|---|
| `getting-started/quick-start.mdx` | ~8 |
| `reference/modifiers.mdx` | ~12 (notation form only) |
| `reference/dice-notation.mdx` | ~6 |
| `games/blades.mdx` | ~3 |
| `games/fifth.mdx` | ~3 |
| `games/daggerheart.mdx` | ~3 |
| `games/pbta.mdx` | ~3 |
| `games/root-rpg.mdx` | ~2 |
| `games/salvageunion.mdx` | ~2 |
| `guides/recipes.mdx` | ~6 (skip histogram, seeded, crypto examples) |

Complex options-object-only examples remain as static fenced blocks for this iteration.

## Not in Scope

- Homepage hero code block (custom hand-rolled HTML in `index.astro`)
- Histogram / loop examples in recipes
- Seeded random examples
- Options object forms (where `liveArgs` would be complex to represent)
- Game package examples where the roll function is not from `@randsum/roller` (e.g., `@randsum/blades`) — these can be added in a follow-up with a `package` prop
