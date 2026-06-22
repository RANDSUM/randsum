# ADR-006: Interaction Patterns & Component Hierarchy

## Status

Proposed — most patterns not yet implemented

## Context

The app is a single-screen prototype. Earlier drafts of this ADR specified a
full interaction model for an eight-screen app: a bottom tab bar, a Simple-Mode
dice grid with tap/long-press, a roll wizard, game rollers, a saved-templates
list with inline actions, and a history feed. **Almost none of that is built.**
This document is trimmed to the interactions that actually ship on the one
screen, with the rest recorded as deferred.

## Decision (what exists today)

The single screen (`app/index.tsx`) renders `@randsum/dice-ui` components and a
result modal. The implemented interactions are:

### Notation roller

`NotationRoller` (from `@randsum/dice-ui`) owns notation input, token
highlighting, validation, and the ROLL action. Its value is bound to
`useNotationStore`. On web the notation is also seeded from / synced to a `?n=`
URL query param (debounced `history.replaceState`).

### Quick reference grid

`QuickReferenceGrid` lists notation fragments. Selecting one appends the
fragment to the current notation (`onAdd`). On web (desktop ≥ 768px) it sits in a
right-hand column; on narrow web it collapses into a `<details>` disclosure; on
native it renders inverted above the roller. On web, selecting an entry can open
a `DocModal` describing that notation token.

### Roll result modal

On roll, the result is held in local `useState` and shown in a React Native
`<Modal>`:

- **Web** renders dice-ui's `RollResultPanel`, with `Escape` / backdrop-tap
  dismiss, ARIA dialog semantics, and focus moved into and restored out of the
  dialog.
- **Native** renders `components/RollResultView`, which animates the total
  counting up from 0 over 400ms, announces the final total via
  `AccessibilityInfo.announceForAccessibility`, and fires a single
  `Haptics.notificationAsync(Success)` pulse when the animation completes
  (`expo-haptics`, native only).

### Web header

`components/WebHeader` (web only) links out to `randsum.dev` and
`notation.randsum.dev` via `Linking.openURL`.

### Accessibility (implemented on the screen)

- A "Skip to content" link on web (visible on focus) jumps to `#main-content`.
- The result modal uses `role="dialog"` / `aria-modal` on web with managed
  focus, and `accessibilityRole` / `accessibilityLabel` on the backdrop.

## Deferred — not implemented

The following from earlier specs do **not** exist:

- **Bottom tab bar** and the five tabs (Roll, Games, Saved, History, Account).
- **Simple Mode dice grid** (D4–D20), tap-to-increment, long-press-to-decrement,
  per-die badges, pool display, and the Save/Notation/Clear action row.
- **Simple/Advanced mode toggle** (the screen has one notation-based mode).
- **Game rollers** — game-card grid, spec-driven inputs (steppers, segmented
  controls), per-game accent colors.
- **Saved templates** list, inline Edit/Delete, quick-roll, variable prompt sheet.
- **Roll history feed** — rows, tap-to-expand, long-press-to-delete.
- **Roll Wizard** — the four-step (`Type → Build → Variables → Name`) `pageSheet`
  modal and its `useWizardStore`.
- **Roll-result actions** — Share, Save as template, Roll again.
- **`react-native-reanimated` / `useReducedMotion`** — not a dependency; the
  native total animation uses RN's built-in `Animated`.
- **`react-native-gesture-handler`** swipe actions — not a dependency.
- **Tap/roll-button haptics** — only the result-reveal Success haptic fires
  today; there is no per-tap impact haptic (no dice grid to tap).

These should be re-specified against the codebase as it stands when each feature
is taken on, under fresh decision records.

## Dependencies (actually present)

- `expo-haptics` — the Success haptic on the native result reveal.
- `@randsum/dice-ui` — `NotationRoller`, `QuickReferenceGrid`, `RollResultPanel`,
  `DocModal`.

(`react-native-reanimated` and `react-native-gesture-handler` are **not**
dependencies of `apps/expo`.)

## Consequences

### Positive

- The implemented interactions are small and platform-aware (web dialog
  semantics vs. native animated reveal), with real accessibility affordances on
  the one screen.

### Negative

- The bulk of the interaction model is unbuilt, so this ADR documents intent for
  features that will need their own validation when implemented.

### Neutral

- Haptics are native-only and degrade to nothing on web, where the count-up
  animation is not present either (web uses `RollResultPanel`).

## References

- `app/index.tsx` — the single screen
- `components/RollResultView.tsx` — native animated result + Success haptic
- `components/WebHeader.tsx` — web header links
- `@randsum/dice-ui` components
