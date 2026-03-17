# ADR-011: Playground Layout Design

## Status

Accepted

## Context

Epic #938 calls for a full-page, Rubular-style interactive playground for RANDSUM dice notation, deployed as a standalone Astro app at `apps/playground/` and served from `playground.randsum.dev`. The playground is the primary way new users will discover and experiment with the notation, so its layout must prioritize discoverability, density, and fast feedback loops.

Three prior art sources inform this design:

1. **Rubular** (rubular.com) -- the gold standard for "type, see result, read reference" single-page tools. Dense, functional, zero chrome. The input is always visible, the output updates live, and the reference is always one glance away.
2. **The existing CLI TUI** (`apps/cli/src/tui/`) -- already implements the input-description-result-reference flow in a terminal context using Ink. Its component decomposition (NotationHighlight, NotationDescriptionRow, RollResultPanel, NotationReference) and interaction model (type notation, see live description, press Enter to roll, view step-by-step results) translate directly to the web.
3. **The docs site** (`apps/site/`) -- defines the project's visual identity through CSS custom properties in `apps/site/src/styles/custom.css`: a slate gray scale, blue-500 accent, JetBrains Mono headings, and game-specific color tokens.

The playground is genuinely single-page -- no routing, no navigation hierarchy. It links back to `randsum.dev` but is otherwise self-contained. It must work well on desktop (where side-by-side panels maximize information density) and on mobile (where vertical stacking and collapsible sections are necessary).

### Constraints

- React components (via `@astrojs/react`) for interactive elements; Astro for the page shell.
- Depends on `@randsum/roller` for roll execution and notation validation.
- Depends on `@randsum/display-utils` for step visualization (`computeSteps`, `formatAsMath`) and modifier documentation (`MODIFIER_DOCS`).
- Must share visual identity with `randsum.dev` without importing Starlight's CSS framework directly. The playground extracts the relevant design tokens into its own stylesheet.
- URL state via query parameters for shareable links (e.g., `?n=4d6L`).

## Decision

### 1. Layout Structure

The page is a single viewport divided into two columns on desktop and a single stacked column on mobile.

**Desktop (>=768px):**

```
+-----------------------------------------------------------+
| Header: logo wordmark          [randsum.dev] [StackBlitz]  |
+-------------------------------------+---------------------+
|                                     |                     |
|  roll('___________________')  [Go]  |  Quick Reference    |
|                                     |  (always visible)   |
|  Description: Roll 4 six-sided     |                     |
|  dice, drop the lowest             |  NdS  -- basic roll |
|                                     |  L/H  -- drop lo/hi |
+-------------------------------------+  K/kl -- keep hi/lo |
|                                     |  !    -- explode    |
|  Result: 14                         |  R{..} -- reroll    |
|                                     |  C{..} -- cap       |
|  Rolled        [5] [3] [6] [2]     |  ...                |
|  Drop Lowest 1 [x2] [5] [3] [6]   |                     |
|  Final         3 + 5 + 6 = 14      |                     |
|                                     |                     |
+-------------------------------------+---------------------+
```

The left column (main column) is ~70% width. It contains the input area at the top, description below it, and the result panel below that. The right column (reference sidebar) is ~30% width. It contains the quick reference grid and is independently scrollable.

**Mobile (<768px):**

```
+----------------------------------+
| Header: logo     [dev] [SB]      |
+----------------------------------+
| roll('______________')  [Go]     |
+----------------------------------+
| Description: Roll 4 six-sided   |
| dice, drop the lowest           |
+----------------------------------+
| Result: 14                       |
| Rolled      [5] [3] [6] [2]    |
| Drop Low 1  [x2] [5] [3] [6]  |
| Final        3 + 5 + 6 = 14    |
+----------------------------------+
| [v] Quick Reference (collapsed) |
+----------------------------------+
```

On mobile the reference panel collapses into a disclosure widget below the result area. It defaults to collapsed so the input and result get maximum vertical space.

### 2. Visual Hierarchy

The eye should flow in this order:

1. **Input field** -- the largest interactive element, placed at the top of the main column. Monospace font, generous padding, prominent border. This is where the user starts. The `roll('...')` wrapper text uses the same code-frame metaphor as the TUI.
2. **Description** -- immediately below the input, in a subdued text color (`--sl-color-gray-2`). Updates live as the user types. Provides the "aha" moment where notation becomes readable English.
3. **Go button / roll action** -- inline with the input field, right-aligned. Uses accent color (`--sl-color-accent`) for the primary action. Disabled state uses `--sl-color-gray-4`.
4. **Result panel** -- appears below the description after a roll. Uses the same step-by-step visualization as the TUI's `RollResultPanel`: initial rolls, modifier applications with strikethrough/additions, arithmetic, and the final total. The total is the most visually prominent element in the result (large font, accent-high color).
5. **Reference sidebar** -- persistent on desktop, collapsed on mobile. Lower visual weight than the main column. Uses the same two-column grid layout as the TUI's `NotationReference` with notation on the left and description on the right.

**Color assignments** (mapped from `custom.css` tokens):

| Element | Dark mode | Light mode | Token |
|---|---|---|---|
| Page background | `#020617` (slate-950) | `#ffffff` | `--sl-color-black` |
| Panel backgrounds | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) | `--sl-color-gray-6` |
| Input border (default) | `#475569` (slate-600) | `#94a3b8` (slate-400) | `--sl-color-gray-4` |
| Input border (valid) | `#3b82f6` (blue-500) | `#2563eb` (blue-600) | `--sl-color-accent` |
| Input border (invalid) | `#ef4444` (red-500) | `#dc2626` (red-600) | `--game-fifth` (repurposed) |
| Description text | `#94a3b8` (slate-400) | `#334155` (slate-700) | `--sl-color-gray-2` |
| Go button | `#3b82f6` | `#2563eb` | `--sl-color-accent` |
| Result total | `#93c5fd` (blue-300) | `#1e40af` (blue-800) | `--sl-color-accent-high` |
| Removed dice | `#ef4444` with strikethrough | `#dc2626` | `--game-fifth` |
| Added dice | `#3b82f6` | `#2563eb` | `--sl-color-accent` |
| Reference notation | `#f8fafc` (white) | `#0f172a` (near-black) | `--sl-color-white` |
| Reference description | `#64748b` (slate-500) | `#64748b` | `--sl-color-gray-3` |

### 3. Interaction Model

The user flow is: **Type -> Understand -> Roll -> Explore**.

**Type.** The input field is auto-focused on page load. The user types dice notation. As they type:
- The notation is syntax-highlighted using token colors consistent with the TUI's `NotationHighlight` component.
- A live validation indicator shows whether the current input is valid notation: the input border transitions from default to valid (accent) or invalid (red).
- The description row updates in real time with a human-readable translation of the notation (e.g., "Roll 4 six-sided dice, drop the lowest").

**Understand.** The description provides instant feedback. If the input is invalid, the description shows the validation error message. The reference sidebar (always visible on desktop) lets the user look up modifier syntax without leaving the page. Clicking a reference entry inserts that modifier's notation into the input field at the cursor position.

**Roll.** The user triggers a roll by pressing Enter or clicking the Go button. A brief spinner (200-400ms, matching the TUI's 400ms delay) provides tactile feedback. The result panel appears below the description with the full step visualization.

**Explore.** After a roll, the result panel shows the complete modifier pipeline: initial rolls, each modifier step with removed/added/unchanged dice clearly differentiated, arithmetic operations, and the final total. The URL updates to include the notation as a query parameter (`?n=4d6L`) so the result is shareable. The user can immediately type a new notation to roll again -- the result panel is replaced on the next roll.

**Keyboard shortcuts:**
- `Enter` -- roll (when input is valid)
- `Escape` -- clear result, return focus to input
- `Tab` -- cycle focus: input -> Go button -> reference panel -> StackBlitz link -> input

**Error states:**
- Empty input: placeholder text `4d6L` in the input, no description shown.
- Invalid notation: red input border, description shows validation error text from `validateNotation()`.
- Roll error (should not happen with valid notation, but defensive): red error banner below the description.

### 4. Design Tokens

The playground defines its own CSS custom properties, extracted from the docs site's `custom.css` to maintain visual consistency without a Starlight dependency. The playground's token file maps 1:1 to the relevant subset:

```css
:root {
  /* Typography */
  --pg-font-body: ui-sans-serif, system-ui, sans-serif;
  --pg-font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Scale -- dark mode defaults */
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

  /* Breakpoints (used in media queries, not as variables) */
  /* Mobile: <768px, Desktop: >=768px */
}

/* Light mode */
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

The `--pg-` prefix (short for "playground") avoids collisions if these styles are ever embedded in the docs site. Every value traces back to the Tailwind slate/blue scale used in `custom.css`.

### 5. Component Boundaries

The playground decomposes into these React components:

```
PlaygroundPage (Astro page shell)
  |
  +-- PlaygroundApp (React island, client:load)
       |
       +-- PlaygroundHeader
       |     Logo wordmark, link to randsum.dev, StackBlitz button
       |
       +-- PlaygroundLayout (CSS Grid container)
       |     |
       |     +-- MainColumn
       |     |     |
       |     |     +-- NotationInput
       |     |     |     Input field with roll() wrapper, Go button, validation state
       |     |     |     Reuses token highlighting logic from TUI's NotationHighlight
       |     |     |
       |     |     +-- NotationDescription
       |     |     |     Live human-readable description of the current notation
       |     |     |     Maps to TUI's NotationDescriptionRow
       |     |     |
       |     |     +-- RollResult
       |     |           Step-by-step roll visualization
       |     |           Port of TUI's RollResultPanel to HTML/CSS
       |     |           Uses computeSteps() and formatAsMath() from display-utils
       |     |
       |     +-- ReferenceSidebar
       |           |
       |           +-- QuickReferenceGrid
       |           |     Two-column grid of modifier notation and descriptions
       |           |     Port of TUI's NotationReference to HTML/CSS
       |           |     Click-to-insert interaction
       |           |
       |           +-- ModifierDetail (expandable)
       |                 Detailed docs for the selected modifier
       |                 Uses MODIFIER_DOCS from display-utils
       |
       +-- (Mobile only) ReferenceDisclosure
             Wraps ReferenceSidebar in a collapsible <details>/<summary>
```

**Component responsibilities and isolation:**

- `PlaygroundApp` owns all state: current input, validation result, roll result, selected reference entry. No child component holds roll state.
- `NotationInput` is a controlled component. It receives `value`, `onChange`, `onSubmit`, and `validationState` as props. It does not call `roll()` itself.
- `RollResult` is a pure display component. It receives a `RollRecord[]` and renders it. It has no side effects.
- `QuickReferenceGrid` receives `onSelect` as a callback. The parent decides what happens when a modifier is selected (insert into input).
- `ReferenceSidebar` and `ReferenceDisclosure` are layout wrappers, not logic owners.

### 6. Responsive Strategy

**Desktop (>=768px):** CSS Grid with two columns. The main column is `minmax(0, 1fr)` and the reference sidebar is `clamp(240px, 30%, 360px)`. The reference sidebar is always visible and independently scrollable (`overflow-y: auto`, `max-height: 100vh`, `position: sticky`, `top: 0`). The input area and result panel share the main column vertically.

**Mobile (<768px):** Single column. All components stack vertically: header, input, description, result, reference. The reference wraps in a native `<details>` element with `<summary>Quick Reference</summary>`. This provides accessible expand/collapse without JavaScript.

**Transition behavior:**
- No horizontal scroll at any breakpoint. The input field truncates long notation with a horizontal scroll within the input element itself (standard `<input>` behavior).
- The reference grid switches from two-column to single-column below 480px, matching the TUI's `TWO_COL_THRESHOLD` behavior.
- Die result badges (the `[5] [3] [6] [2]` display) wrap naturally using `flex-wrap: wrap` with a gap of `--pg-space-xs`.

### Alternatives Considered

**Three-column layout (input | result | reference).** Rejected. Splitting input and result into separate columns breaks the top-to-bottom reading flow. The user's eye would need to jump horizontally between typing and seeing results. The Rubular model succeeds precisely because input and output share a single vertical column.

**Floating/overlay reference panel.** Rejected. An overlay obscures the result, which the user often wants to see while exploring the reference. A persistent sidebar keeps both visible simultaneously. On mobile, the collapse-to-disclosure approach is preferable to a modal or drawer because it stays in the document flow and works without JavaScript.

**Tab-based panels (Result | Reference as tabs).** Rejected for desktop because it hides one panel when both should be visible. Acceptable as a future enhancement for mobile if the disclosure approach proves insufficient, but the simpler approach should be tried first.

**Reusing `@randsum/component-library` directly.** The component library is published to npm and designed for embedding in third-party contexts. The playground needs tighter control over layout, state management, and URL integration. The playground components will share display logic (via `@randsum/display-utils`) and visual language (via the design tokens), but the React components themselves are playground-specific. If patterns stabilize, they can be extracted to the component library later.

## Consequences

### Positive

- **Consistent visual identity.** The playground's design tokens are derived from the docs site's CSS, ensuring both properties feel like the same product.
- **Portable display logic.** By depending on `@randsum/display-utils` for step visualization and modifier docs, the playground avoids reimplementing display logic. Changes to `computeSteps()` or `MODIFIER_DOCS` propagate automatically.
- **Accessible by default.** Native HTML elements (`<input>`, `<button>`, `<details>`) provide keyboard navigation and screen reader support without custom ARIA. The single-page structure means no route-change announcements are needed.
- **Shareable URLs.** Notation in query parameters means users can share specific rolls by copying the URL. This is critical for the "playground" use case -- showing someone a notation example should be a link, not instructions.
- **Clear component boundaries.** Each component has a single responsibility, making implementation stories easy to scope and test independently.

### Negative

- **Duplicated design tokens.** The playground maintains its own `--pg-*` variables rather than importing from the docs site. If the docs site's palette changes, the playground must be updated manually. This is acceptable because the playground is a separate deployment and a shared CSS dependency would couple their build pipelines.
- **No dark/light toggle.** The playground follows `prefers-color-scheme` without a manual toggle. This keeps the implementation simple but means users cannot override their OS preference. A toggle can be added later without layout changes.
- **Reference sidebar scroll.** On desktop, a very tall reference panel with all modifiers expanded could push content below the fold. The `sticky` + `overflow-y: auto` approach handles this, but developers should test with all modifier docs expanded to confirm no layout breakage.
- **Mobile reference discovery.** A collapsed `<details>` element is less discoverable than an always-visible panel. The summary text ("Quick Reference") and its position directly below the result area mitigate this, but user testing should confirm new users find it.

### Design Review Requirements

Any story touching these components requires designer approval in addition to maintainer approval:

- `NotationInput` -- validation states, syntax highlighting, input affordances
- `RollResult` -- step visualization, die badges, total emphasis
- `QuickReferenceGrid` -- grid layout, click-to-insert interaction
- `PlaygroundLayout` -- responsive breakpoints, column proportions
- Design token changes -- any modification to `--pg-*` variables
