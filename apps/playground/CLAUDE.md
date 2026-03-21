# @randsum/playground - Interactive Dice Notation Playground

## Overview

A single-page interactive app deployed at `playground.randsum.dev`. Users type RANDSUM dice notation, see a live human-readable description, roll dice, and explore the step-by-step modifier pipeline. The playground is the primary discovery surface for new users learning the notation.

Private workspace package (`"private": true`). Never published to npm.

Architectural decisions are documented in:

- `docs/adr/ADR-011-playground-layout-design.md` — layout, component tree, interaction model, design tokens
- `docs/adr/ADR-012-playground-app-infrastructure.md` — Astro config, Netlify deployment, CI scope, workspace integration

## Commands

```bash
# From the monorepo root:
bun run playground:dev          # Dev server (also starts roller watcher)
bun run playground:build        # Production build (outputs to apps/playground/dist)

# From apps/playground/:
bun run dev                     # Astro dev server (localhost:4321)
bun run build                   # Production Astro build
bun run preview                 # Preview production build locally
bun run typecheck               # TypeScript strict check (tsc --noEmit)
```

The `playground:dev` root script runs two processes in parallel:

```
bun run --filter @randsum/roller dev & bun run --filter @randsum/playground dev
```

Workspace dependencies must be built (or in watch mode) before the Astro dev server starts.

## File Structure

```
apps/playground/
  astro.config.mjs          # Astro configuration (static output, React integration)
  netlify.toml              # Netlify build config (base = monorepo root)
  package.json              # Private package, @randsum/playground
  tsconfig.json             # Extends root tsconfig
  CLAUDE.md                 # This file
  public/
    favicon.svg             # Site favicon
  src/
    pages/
      index.astro           # Single Astro page shell — renders PlaygroundApp
    components/
      PlaygroundApp.tsx     # Root React island (client:load); owns all state
      PlaygroundHeader.tsx  # Logo, randsum.dev link, StackBlitz button
      PlaygroundLayout.tsx  # CSS Grid container (main + sidebar columns)
      MainColumn.tsx        # Left column wrapper
      NotationInput.tsx     # Controlled input with roll() wrapper affordance
      NotationDescription.tsx  # Live human-readable notation description
      RollResult.tsx        # Step-by-step roll visualization
      ReferenceSidebar.tsx  # Layout wrapper for the reference panel
      QuickReferenceGrid.tsx   # Two-column modifier reference grid
      ReferenceDetail.tsx    # Expandable docs for a selected notation entry
      ReferenceDisclosure.tsx  # Mobile: wraps sidebar in <details>/<summary>
    styles/
      tokens.css            # --pg-* CSS custom properties (design tokens)
      global.css            # Reset, base styles, font imports
```

## Architecture

The page is an Astro static shell (`src/pages/index.astro`) that renders a single React island:

```
PlaygroundPage (Astro, index.astro)
  |
  +-- PlaygroundApp (React island, client:load)
       |
       +-- PlaygroundHeader
       |
       +-- PlaygroundLayout (CSS Grid)
       |     |
       |     +-- MainColumn
       |     |     +-- NotationInput
       |     |     +-- NotationDescription
       |     |     +-- RollResult (conditional — renders after first roll)
       |     |
       |     +-- ReferenceSidebar  [desktop only — always visible]
       |           +-- QuickReferenceGrid
       |           +-- ReferenceDetail (conditional — renders when entry selected)
       |
       +-- ReferenceDisclosure  [mobile only — <details>/<summary>]
             +-- ReferenceSidebar
                   +-- QuickReferenceGrid
                   +-- ReferenceDetail
```

`PlaygroundApp` is the only stateful component. All child components are either pure display or controlled via props. No child component calls `roll()` or `validateNotation()` directly.

## State Management

`PlaygroundApp` owns the complete application state. The shape:

```typescript
type ValidationState = "empty" | "valid" | "invalid"

interface PlaygroundState {
  // Input
  notation: string // Current value of the text input
  validationState: ValidationState
  validationResult: ValidationResult | null // null when notation is empty

  // Roll result — null before the first roll or after Escape
  rollResult: RollerRollResult | null

  // Reference sidebar
  selectedEntry: string | null // Key for any reference entry (modifier, die type, or operator)
  // Modifier keys match MODIFIER_DOCS (e.g. 'L', '!', 'R{..}')
  // Die/operator keys are hardcoded (e.g. 'NdS', 'd%', 'xN')
  // null when no entry is selected
}
```

State transitions:

- **notation changes** (user types): runs `validateNotation(notation)` synchronously; updates `notation`, `validationState`, and `validationResult`. Clears `rollResult` only if the new notation is invalid.
- **roll triggered** (Enter or Go button, guard: `validationState === 'valid'`): calls `roll(notation)` inside a try/catch; updates `rollResult` on success; sets an error banner on catch. The URL query param `?n=<notation>` is written via `history.replaceState`.
- **Escape pressed**: sets `rollResult = null`; returns focus to the input.
- **modifier selected** (QuickReferenceGrid `onSelect`): sets `selectedEntry`; inserts the modifier's `displayBase` token at the input cursor position.
- **page load**: reads `?n=` from `window.location.search`; if present and non-empty, sets `notation` and runs validation. Does not auto-roll on load.

## Components

### `PlaygroundApp`

Root React island. Mounted with `client:load` in `index.astro`.

Responsibilities:

- Owns all `PlaygroundState`
- Reads initial notation from `?n=` query param on mount
- Handles keyboard events: `Enter` (roll), `Escape` (clear result)
- Writes `?n=` to URL via `history.replaceState` after each roll
- Passes state slices and callbacks down to children

No props (reads from URL on mount).

---

### `PlaygroundHeader`

```typescript
interface PlaygroundHeaderProps {
  notation: string // passed to buildStackBlitzProject for the StackBlitz button
}
```

Renders:

- RANDSUM logo wordmark (SVG or text) linking to `https://randsum.dev`
- Link to `https://randsum.dev` labeled "docs" or "randsum.dev"
- StackBlitz button: calls `buildStackBlitzProject(notation)` from `src/helpers/stackblitz.ts` (local helper) and opens the project using `@stackblitz/sdk`. Button is disabled when `notation` is empty.

---

### `PlaygroundLayout`

```typescript
interface PlaygroundLayoutProps {
  children: React.ReactNode
}
```

CSS Grid container. On desktop (>=768px): two columns, main column `minmax(0, 1fr)`, sidebar `clamp(240px, 30%, 360px)`. On mobile (<768px): single column. No JavaScript logic — layout only.

---

### `MainColumn`

```typescript
interface MainColumnProps {
  children: React.ReactNode
}
```

Layout wrapper. No logic.

---

### `NotationInput`

```typescript
interface NotationInputProps {
  value: string
  validationState: ValidationState // 'empty' | 'valid' | 'invalid'
  onChange: (notation: string) => void
  onSubmit: () => void
}
```

Renders an `<input type="text">` wrapped in a code-frame affordance that displays `roll('...')`. The input is auto-focused on mount (`autoFocus`).

Validation state maps to input border color:

- `'empty'`: `--pg-color-border` (default)
- `'valid'`: `--pg-color-accent`
- `'invalid'`: `--pg-color-error`

Placeholder text: `4d6L`

The input uses `@randsum/roller`'s `tokenize()` function (from `@randsum/roller/tokenize` subpath — no roll engine imported) to apply syntax highlighting to the typed text. Each `Token` is rendered as a `<span>` with a class derived from its `TokenType`. CSS colors for token types:

| Token category                                                                     | CSS class          | Color token              |
| ---------------------------------------------------------------------------------- | ------------------ | ------------------------ |
| `core` die (NdS)                                                                   | `token-core`       | `--pg-color-text`        |
| Special die (`percentile`, `fate`, `geometric`, `draw`, `zeroBias`, `customFaces`) | `token-special`    | `--pg-color-accent-high` |
| Drop/keep (`dropLowest`, `dropHighest`, `keepHighest`, `keepLowest`, `keepMiddle`) | `token-pool`       | `--pg-color-accent`      |
| Reroll/explode/unique/cap/replace                                                  | `token-modifier`   | `--pg-color-text-muted`  |
| Arithmetic (`plus`, `minus`, `multiply`, `multiplyTotal`)                          | `token-arithmetic` | `--pg-color-accent`      |
| `repeat`                                                                           | `token-repeat`     | `--pg-color-text-muted`  |
| `label`                                                                            | `token-label`      | `--pg-color-text-dim`    |
| `unknown`                                                                          | `token-unknown`    | `--pg-color-error`       |

The Go button sits inline with the input (right-aligned). Its `type="submit"` triggers `onSubmit`. It is disabled when `validationState !== 'valid'`. Disabled style uses `--pg-color-border`. Active style uses `--pg-color-accent`.

`NotationInput` does not call `roll()` or `validateNotation()`. It calls `onSubmit` and lets `PlaygroundApp` execute the roll.

The `tokenize()` import must use the subpath `@randsum/roller/tokenize` to avoid pulling the roll engine into the input component bundle.

---

### `NotationDescription`

```typescript
interface NotationDescriptionProps {
  validationResult: ValidationResult | null
  // null = empty input; renders nothing (or empty placeholder height)
}
```

Renders the human-readable description of the current notation. The description text comes from `validationResult.description` when `validationResult.valid === true`. When `validationResult.valid === false`, renders the `validationResult.error.message` in `--pg-color-error`. When `validationResult` is null (empty input), renders nothing but preserves layout height to prevent content shift.

`ValidationResult` is a discriminated union on `valid: boolean`:

- `{ valid: true; description: string[][]; ... }` — `description` is an array of arrays; join each inner array with `', '` and the outer array with `' + '` for display
- `{ valid: false; error: { message: string; argument: string } }` — display `error.message`

---

### `RollResult`

```typescript
interface RollResultProps {
  result: RollerRollResult
}
```

Pure display component. Renders nothing if the component is not mounted (caller conditionally renders based on `rollResult !== null`).

For each `RollRecord` in `result.rolls`, calls `traceRoll(record)` from `@randsum/roller/trace` to get an ordered `readonly RollTraceStep[]`. Renders each step:

| `RollTraceStep` kind | Rendering                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'rolls'`            | Row: label on left, die badges on right. Badges: unchanged in `--pg-color-text`, removed in `--pg-color-removed` with strikethrough, added in `--pg-color-added` |
| `'arithmetic'`       | Row: `label` on left, `display` (`+5`, `×2`, etc.) on right in `--pg-color-accent`                                                                               |
| `'divider'`          | `<hr>` separator                                                                                                                                                 |
| `'finalRolls'`       | Row: "Final" label, die badges, then `formatAsMath(rolls, arithmeticDelta)` from `@randsum/roller/trace`                                                         |

The grand total (`result.total`) is displayed as a large number in `--pg-color-total` above the step breakdown.

Die badges are `<span>` elements styled as rounded rectangles. Badge layout uses `flex-wrap: wrap` with `gap: --pg-space-xs`.

When `result.rolls` has more than one entry (multi-pool roll), each pool is rendered in its own section with its `record.notation` as a section heading.

---

### `ReferenceSidebar`

```typescript
interface ReferenceSidebarProps {
  selectedEntry: string | null
  onSelect: (modifierKey: string) => void
}
```

Layout wrapper. Always visible on desktop (sticky, `overflow-y: auto`, `max-height: 100vh`). Renders `QuickReferenceGrid` and, when `selectedEntry` is non-null, `ReferenceDetail`.

---

### `QuickReferenceGrid`

```typescript
interface QuickReferenceGridProps {
  selectedEntry: string | null
  onSelect: (entryKey: string) => void
}
```

Renders a two-column grid covering the **complete** RANDSUM dice notation — not just modifiers. The reference is organized into sections:

**1. Core Dice**

| Notation      | Description                  |
| ------------- | ---------------------------- |
| `NdS`         | Roll N dice with S sides     |
| `d%`          | Percentile die (1-100)       |
| `dF` / `dF.2` | Fate / Extended Fudge die    |
| `gN`          | Geometric die (roll until 1) |
| `DDN`         | Draw die (no replacement)    |
| `zN`          | Zero-bias die (0 to N-1)     |
| `d{a,b,c}`    | Custom faces die             |

**2. Modifiers** — rendered from `MODIFIER_DOCS` (`@randsum/roller/docs`). Each entry shows `doc.displayBase` in the left column and `doc.title` in the right. This covers all 19+ modifiers: drop, keep, cap, reroll, replace, explode, compound, penetrate, unique, wild die, count successes, count failures, plus, minus, multiply, multiply total, integer divide, modulo, sort.

**3. Operators**

| Notation | Description                    |
| -------- | ------------------------------ |
| `xN`     | Repeat operator (roll N times) |
| `[text]` | Annotation / label             |

The core dice and operators sections are hardcoded in the component (not from `MODIFIER_DOCS`). Modifier entries come from `MODIFIER_DOCS`.

Clicking any entry calls `onSelect(key)`. The selected entry is highlighted using `--pg-color-surface-alt`. Section headers are non-interactive.

On desktop: two-column table layout. Below 480px: single-column list.

---

### `ReferenceDetail`

```typescript
interface ReferenceDetailProps {
  modifierKey: string // Key into MODIFIER_DOCS (from @randsum/roller/docs)
  doc: ModifierDoc // Pre-looked-up doc entry
}
```

Renders full documentation for the selected modifier using `ModifierDoc` fields:

- `doc.title` — heading
- `doc.description` — prose description
- `doc.forms` — table of notation variants and their notes
- `doc.examples` — notation + description pairs, each rendered as a mini code block
- `doc.comparisons` — comparison operator table (only if `doc.comparisons` is non-undefined)

---

### `ReferenceDisclosure`

No props beyond children (wraps `ReferenceSidebar`).

Renders a native `<details>` element with `<summary>Quick Reference</summary>`. Defaults to closed (`open` attribute absent). The disclosure is placed below `RollResult` in the mobile column. Provides accessible expand/collapse without JavaScript event handling.

## URL State

The single supported query parameter is `?n=` (notation).

**On page load:** `PlaygroundApp` reads `new URLSearchParams(window.location.search).get('n')`. If the value is a non-empty string, it is set as the initial `notation` state and validation runs immediately. No auto-roll occurs on load.

**After each roll:** `history.replaceState({}, '', `?n=${encodeURIComponent(notation)}`)` updates the URL without a page reload. The `encodeURIComponent` call handles characters like `+`, `%`, `{`, `}`.

**When notation is cleared (Escape):** The URL is updated to `?n=` (empty param) or the query string is removed entirely. Either is acceptable; the parser treats both as no initial notation.

## Interaction Model

**Type.** Input is auto-focused on load. As the user types:

1. `PlaygroundApp.onChange` fires
2. `validateNotation(notation)` runs synchronously
3. `validationState` and `validationResult` update
4. `NotationInput` border color reflects `validationState`
5. `NotationDescription` updates with the new description or error

**Roll.** Triggered by pressing `Enter` (when `validationState === 'valid'`) or clicking the Go button:

1. `PlaygroundApp.onSubmit` fires
2. `roll(notation)` is called inside a try/catch
3. On success: `rollResult` is set; URL is updated via `history.replaceState`
4. On error (should not happen with valid notation): render an error banner below the description
5. A brief loading state (200-400ms minimum) provides tactile feedback before the result appears

**Explore.** After a roll, the result panel replaces any previous result. The user can type new notation immediately; the result panel stays visible until the notation changes to invalid or Escape is pressed.

**Keyboard shortcuts:**

- `Enter` — roll (guard: `validationState === 'valid'`)
- `Escape` — set `rollResult = null`; return focus to input
- `Tab` — standard focus order: input, Go button, reference panel entries, StackBlitz button

**Click-to-insert (QuickReferenceGrid):** When the user clicks a reference entry, `PlaygroundApp.onSelect` inserts the entry's `doc.displayBase` value at the current cursor position in the input and calls `onChange` with the updated string. Focus returns to the input after insertion.

## Responsive Behavior

**Desktop (>=768px):** CSS Grid, two columns. Main column: `minmax(0, 1fr)`. Reference sidebar: `clamp(240px, 30%, 360px)`. `ReferenceSidebar` is always visible; `ReferenceDisclosure` is not rendered. The sidebar is sticky with `overflow-y: auto` and `max-height: 100vh`.

**Mobile (<768px):** Single column. All components stack: header, input, description, result, disclosure. `ReferenceSidebar` is not rendered directly; it is wrapped inside `ReferenceDisclosure`. `QuickReferenceGrid` switches to single-column below 480px.

No horizontal scroll at any viewport width. Long notation in the input scrolls horizontally within the `<input>` element itself (standard browser behavior). Die badges wrap with `flex-wrap: wrap`.

## Design Tokens

Defined in `src/styles/tokens.css`. All custom properties use the `--pg-` prefix.

```css
:root {
  /* Typography */
  --pg-font-body: ui-sans-serif, system-ui, sans-serif;
  --pg-font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* Scale — dark mode defaults */
  --pg-color-bg: #020617;
  --pg-color-surface: #0f172a;
  --pg-color-surface-alt: #1e293b;
  --pg-color-border: #475569;
  --pg-color-text: #f8fafc;
  --pg-color-text-muted: #94a3b8;
  --pg-color-text-dim: #64748b;

  /* Accent */
  --pg-color-accent: #3b82f6;
  --pg-color-accent-high: #93c5fd;
  --pg-color-accent-low: #1e3a5f;

  /* Semantic */
  --pg-color-error: #ef4444;
  --pg-color-success: #10b981;
  --pg-color-removed: #ef4444;
  --pg-color-added: #3b82f6;
  --pg-color-total: #93c5fd;

  /* Spacing */
  --pg-space-xs: 0.25rem;
  --pg-space-sm: 0.5rem;
  --pg-space-md: 1rem;
  --pg-space-lg: 1.5rem;
  --pg-space-xl: 2rem;

  /* Radii */
  --pg-radius-sm: 4px;
  --pg-radius-md: 8px;
}

@media (prefers-color-scheme: light) {
  :root {
    --pg-color-bg: #ffffff;
    --pg-color-surface: #f1f5f9;
    --pg-color-surface-alt: #e2e8f0;
    --pg-color-border: #94a3b8;
    --pg-color-text: #0f172a;
    --pg-color-text-muted: #334155;
    --pg-color-text-dim: #64748b;
    --pg-color-accent: #2563eb;
    --pg-color-accent-high: #1e40af;
    --pg-color-accent-low: #dbeafe;
    --pg-color-error: #dc2626;
    --pg-color-success: #059669;
    --pg-color-removed: #dc2626;
    --pg-color-added: #2563eb;
    --pg-color-total: #1e40af;
  }
}
```

These tokens derive from the Tailwind slate/blue scale used in `apps/site/src/styles/custom.css`. They are maintained independently — changes to the docs site palette must be manually applied here. See ADR-011 section 4 for rationale.

## Dependencies

```json
{
  "name": "@randsum/playground",
  "version": "1.1.2",
  "private": true,
  "dependencies": {
    "@randsum/roller": "workspace:~",
    "@randsum/dice-ui": "workspace:~",
    "@astrojs/react": "...",
    "@stackblitz/sdk": "...",
    "@supabase/supabase-js": "...",
    "astro": "...",
    "nanoid": "...",
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

### What is imported from each package

**`@randsum/roller`** (main barrel):

- `roll` — executes dice rolls
- `validateNotation` — live input validation; returns `ValidationResult`
- `ValidationResult`, `ValidValidationResult`, `InvalidValidationResult` — types for validation state
- `RollerRollResult`, `RollRecord` — types for roll output

**`@randsum/roller/tokenize`** (isolated subpath — no roll engine):

- `tokenize` — converts notation string to `readonly Token[]` for syntax highlighting in `NotationInput`
- `Token`, `TokenType` — types for token rendering

**`@randsum/roller/trace`**:

- `traceRoll` — converts a `RollRecord` to `readonly RollTraceStep[]` for step visualization (replaces old `computeSteps`)
- `formatAsMath` — formats number arrays as math expression strings
- `RollTraceStep` — type for step rendering (replaces old `TooltipStep`)

**`@randsum/roller/docs`**:

- `MODIFIER_DOCS` — static modifier documentation for `QuickReferenceGrid` and `ReferenceDetail`
- `ModifierDoc` — type for modifier doc entries

**`src/helpers/stackblitz.ts`** (local helper — not a workspace package):

- `buildStackBlitzProject` — generates a StackBlitz project object for `PlaygroundHeader`

**`@stackblitz/sdk`**:

- Used in `PlaygroundHeader` only; call `sdk.openProject(buildStackBlitzProject(notation))`

## Astro Configuration

`astro.config.mjs` key settings:

- `output: 'static'` — static site generation
- Integrations: `@astrojs/react()`, `@astrojs/netlify()` (production only)
- `site: 'https://playground.randsum.dev'`
- Vite aliases resolve `@randsum/roller` and `@randsum/dice-ui` from workspace source during development (same pattern as `apps/site/astro.config.mjs`)

## Netlify Deployment

`netlify.toml`:

```toml
[build]
  base = "."
  command = "bun run build && bun run playground:build"
  publish = "apps/playground/dist"
```

`base = "."` is the monorepo root, not `apps/playground/`. This ensures workspace dependency builds run before the Astro build.

The playground deploys to a separate Netlify site from the docs site. DNS: `playground.randsum.dev` is a CNAME pointing to the Netlify auto-assigned domain. This is a one-time manual setup step; it is not automated by CI.

## CI and Build Pipeline

The playground build is excluded from `check:all` and the npm publish pipeline. Netlify deploy previews serve as the CI gate for playground changes.

No `size-limit` entry exists for the playground. Bundle size is managed via Netlify deploy metrics, not `size-limit`.

If a pre-push hook for the playground is added in the future, it should use path filters: `apps/playground/`, `packages/roller/`, `packages/dice-ui/`.

## Design Review Requirements

Per ADR-011, any story touching the following requires designer approval in addition to maintainer review:

- `NotationInput` — validation states, syntax highlighting, input affordances
- `RollResult` — step visualization, die badges, total emphasis
- `QuickReferenceGrid` — grid layout, click-to-insert interaction
- `PlaygroundLayout` — responsive breakpoints, column proportions
- Any modification to `--pg-*` CSS custom properties
