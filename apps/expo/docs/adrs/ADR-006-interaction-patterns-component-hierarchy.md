# ADR-006: Interaction Patterns & Component Hierarchy

## Status
Proposed

## Context

The RANDSUM Expo app has eight distinct screens spanning a pool builder, notation editor, six game rollers, template management, roll history, and account settings. Expo Router's file-based system shapes the navigation structure, but the interaction patterns within and between screens — how users move between states, how results appear, how they build and save rolls — are design decisions that must be made explicitly.

Three qualities the interaction model must preserve:

1. **The physical dice metaphor.** Dice are tactile objects. Digital dice rolling is inherently less satisfying than reaching into a bag and pulling out a handful of polyhedrals. Haptic feedback, animated reveals, and a clear "throw" gesture are the primary design levers available to recover some of that physicality.

2. **Speed for the recurring action.** A player at the table rolls dice dozens of times in a session. The most common path — open app, pick dice, roll, see result, dismiss — must have zero friction. Extra taps, confirmation dialogs, or slow animations on the critical path are disqualifying.

3. **Progressive disclosure.** Simple Mode is for the 80% case. Advanced Mode, game rollers, template variables, and the Roll Wizard are for users who have already mastered the basics. The UI must lead with simplicity and reveal power without hiding it.

## Decision

### Navigation: Bottom Tab Bar

Five tabs, persistent across all primary screens:

| Position | Tab | Icon | Default content |
|---|---|---|---|
| 1 | Roll | Dice outline | Simple Mode pool builder |
| 2 | Games | Controller outline | Game selector grid |
| 3 | Saved | Bookmark outline | Template list |
| 4 | History | Clock outline | Roll history feed |
| 5 | Account | User circle outline | Auth / preferences |

The Roll tab is always selected on first launch. Tab order is fixed — users familiar with the app should be able to reach any tab by touch position without reading the label.

Game roller screens, Roll Wizard sheets, and the Roll Result overlay are pushed above the tab bar or presented as modals. They do not replace the tab bar. This preserves the user's place in the navigation hierarchy: dismissing a result overlay returns them to exactly the screen they were on.

### Simple Mode: Dice Grid Interaction

The 3x2 dice grid (D4, D6, D8, D10, D12, D20) is the heart of Simple Mode. Each cell is a die button.

**Tap:** Increments the die count by one. A tap on an empty button shows `1d6`. A second tap shows `2d6`. Haptic feedback fires on every tap (native only; no-op on Web).

The haptic used is `Haptics.impactAsync(ImpactFeedbackStyle.Light)` — a single light pulse. This is intentional: it should feel like a plink, not a thud. The goal is acknowledgment, not drama. Drama is reserved for the roll reveal.

**Long-press:** Decrements the die count by one, down to zero. At zero, the die type is removed from the pool. Long-press threshold: 400ms (Expo default). No separate "remove" button exists; the long-press serves that purpose.

**Die button visual states:**
- `count === 0`: border-only, `text-dim` label, no badge
- `count >= 1`: filled `surface-alt` background, `text` label, `accent`-colored badge in the top-right corner showing the count
- Active press: scale 0.93 with `useAnimatedStyle` spring

The count badge is the primary affordance that a die is in the pool. It must be readable at a glance across the table. Minimum badge diameter: 20pt. Font: JetBrains Mono, `size-sm`, bold.

**Pool display** sits above the dice grid and shows the assembled notation string (e.g. `3d6 + 2d8 + 1d20`) in JetBrains Mono, `size-lg`. Empty state: "Select dice to add to your pool" in `text-muted`, `size-base`. This is read-only in Simple Mode; tapping it does nothing (does not open Advanced Mode — that is the Notation button's job).

**Action row** (between grid and Roll button): three equally-weighted buttons.
- **Save** — disabled (`text-dim`, no press state) when pool is empty. When enabled, opens the Quick Builder sheet at the Name step (pool is pre-filled).
- **Notation** — always enabled. Switches the Roll tab to Advanced Mode. The pool state is preserved and serialized into the notation field.
- **Clear** — always enabled. Resets all die counts to zero with a single destructive action. No confirmation dialog — the action is low-stakes and easily undone by re-tapping dice.

**Roll button:** Full-width bar pinned to the bottom of the Roll tab screen (above the tab bar). Height: 56pt. Background: `accent`. Label: "Roll" in `size-lg`, `text`, semibold. Disabled state: `surface-alt` background, `text-dim` label. On press: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`, then triggers roll and opens the Roll Result overlay.

### Roll Result Overlay

A full-screen modal presented via `router.push('/result')` using Expo Router's modal presentation. It slides up from the bottom using the platform default sheet animation.

**Layout (top to bottom):**
1. **Dismiss handle** — 36pt wide pill at top center, `border` color. Swipe-down gesture on the handle (or anywhere on the overlay) dismisses it.
2. **Total** — centered, `size-3xl` (48pt), JetBrains Mono, bold. Animates in with a number spin: the displayed value counts up from 0 to the actual total over 400ms using a spring easing. The spin finishes with a haptic pulse: `Haptics.notificationAsync(NotificationFeedbackType.Success)`.
3. **Notation** — the notation that was rolled, `size-sm`, `text-muted`, centered, below the total.
4. **Breakdown** — individual die results in a horizontal scroll row for compact pools, or a vertical list for deep breakdowns. Each die value is shown in a pill: `surface-alt` background, JetBrains Mono, `size-base`. Dropped or discarded dice are shown with a strikethrough in `text-dim`.
5. **Action buttons** — Share, Save as template, Roll again — arranged in a row at the bottom of the overlay, above a safe-area inset.

Dismissing the overlay (swipe down, tap backdrop, or pressing the device back button on Android) writes the roll to the History feed and returns the user to the screen they were on.

**Roll again** re-executes the same notation without dismissing and re-opening the overlay. The total animates again from its current displayed value (not from 0 — this would be disorienting for re-rolls). The haptic fires again.

### Advanced Mode

Advanced Mode replaces Simple Mode content within the Roll tab (not a new tab, not a new screen). A back-to-Simple button in the header returns to Simple Mode; the pool state from Simple Mode is preserved in the Zustand store.

The notation input is a single-line text field with a token overlay. Validation runs on each keystroke via `isDiceNotation()`. The Roll button is disabled when the notation is invalid; validation error text appears below the input in `error` color when the field is non-empty and invalid.

The quick reference grid (scrollable, grouped by modifier category) lives below the input. Tapping a reference item appends the corresponding notation fragment to the current input. This is the primary input-assist mechanism — it reduces the need to memorize notation syntax.

### Game Rollers

The Games tab presents a scrollable grid of game cards (2-column on phones, 3-column on tablets). Each card shows the game name, a short description, and uses that game's accent color as a left border or header band.

Tapping a game card pushes a Game Roller screen (not a modal — it is a destination, not an overlay). This screen auto-generates inputs from the game's `.randsum.json` spec:

- `integer` inputs → **Numeric stepper**: minus button, value display, plus button. Value clamped to `min`/`max` from the spec. JetBrains Mono for the value display.
- `string` inputs with `options` → **Segmented control** (3 or fewer options) or **bottom sheet picker** (4 or more options). Labels from the spec's option values.
- `string` inputs without options → **Text input field**.

Each input has a label above it (from the spec's `label` field) in `text-muted`, `size-sm`. The Roll button at the bottom is styled identically to Simple Mode.

"Back to games" is the standard platform back button/gesture — no special affordance is needed.

### Template List and Swipe Actions

The Saved tab displays templates in a flat list. Each row shows: template name (primary, `text`, `size-base`), notation or game reference (secondary, `text-muted`, `size-sm`, JetBrains Mono for notation strings), and a quick-roll button (right side, `accent` circle with a play icon, 44pt minimum touch target).

**Swipe left on a row:** Reveals two actions — **Edit** (`surface-alt`, pencil icon) and **Delete** (`error`, trash icon). This is the platform-standard swipe-to-reveal pattern on both iOS and Android (via `react-native-gesture-handler`).

Tapping **Edit** opens the Roll Wizard sheet at the appropriate step (pre-filled with the template's values).

Tapping **Delete** shows a brief confirmation alert (one tap to confirm, one to cancel). Deletion is permanent and cloud-synced; a confirmation dialog is appropriate here unlike the Clear button in Simple Mode, because templates represent deliberate user investment.

**Rolling a template with variables:** Tapping the quick-roll button on a template that has variables opens a bottom sheet with an inline form — one field per variable, pre-filled with defaults. Tapping "Roll" in this sheet submits the variable values, interpolates the notation, and opens the Roll Result overlay. This sheet is lightweight: no scroll, no wizard steps, just the variable fields.

### Roll Wizard (Template Creation)

The Roll Wizard is a single modal route at `app/wizard.tsx`, presented with `presentationStyle: 'pageSheet'` on iOS. It is entered via `router.push('/wizard')` and dismissed via `router.back()`. There is no nested Expo Router stack inside the wizard — the route is a single file.

Step progression and all wizard state (current step index, in-progress notation, selected type, variable definitions, draft name) are managed by a Zustand `useWizardStore`. The store is cleared on wizard entry and on wizard exit (both save and cancel paths). This avoids stale state if the user re-opens the wizard.

The wizard renders four internal steps, controlled by the store's `currentStep` field:

1. **Type** — Standard notation or Game-specific (segmented control, two options)
2. **Build** — Pool builder (Standard path) or Game input form (Game path). For the Standard path, this is the same dice grid as Simple Mode with the Add Modifiers expansion below it.
3. **Variables** (optional, skip button available) — Mark parts of the notation as `{variable_name}`. A simple interface: tap a token in the notation to convert it to a variable, then name it and set an optional default.
4. **Name and Save** — Text input for the template name, Save button.

A step indicator at the top of the sheet shows the current position (e.g. "Step 2 of 4"). Navigation between steps uses **Next** and **Back** buttons at the bottom of each step, which call `useWizardStore.goToNext()` and `useWizardStore.goToPrev()` — there is no `router.push()` between steps. **Cancel** (top-left, always visible) calls `router.back()` after clearing the store. No changes are persisted until Step 4's Save button is pressed.

Because the wizard is a single route (not a stack), the device back button and iOS swipe-down both call `router.back()` from any step — the user exits the wizard entirely rather than going back one step. The **Back** button within each step handles intra-wizard backwards navigation. This is an intentional trade-off: it keeps the route model simple and avoids the URL-param serialization problem that a multi-route wizard would introduce.

### History Feed

Each history entry is a row: notation (JetBrains Mono, `size-sm`, `text-muted`) + total (JetBrains Mono, `size-xl`, `text`) on one line, timestamp and game name on a second line (`text-dim`, `size-xs`).

**Tap to expand:** The row expands in-place (not a new screen, not a modal) to reveal the full breakdown — individual die values, modifier steps. The expansion uses a height animation (spring, 200ms). Tapping again collapses it.

**Long-press to delete:** Long-press (400ms) reveals an inline Delete button. This replaces the originally-proposed swipe-to-reveal pattern to avoid adding `react-native-gesture-handler` as a dependency — the long-press approach keeps the native dependency surface smaller. No confirmation dialog — a single long-press-tap to delete is not worth a dialog; the history feed is a log, not a curated collection. If swipe-to-reveal is added later (when `react-native-gesture-handler` is needed for other features), this can be upgraded without changing the data model.

### Accessibility

All interactive elements carry explicit `accessibilityLabel` and `accessibilityHint` props. Die buttons: "D6, 2 in pool. Tap to add, long press to remove." Roll button: "Roll dice. Double-tap to roll." Tab bar items use `accessibilityLabel` matching the visible label.

Minimum touch target: 44 x 44pt on all interactive elements, enforced via `minWidth`/`minHeight` in StyleSheet. Elements that appear visually smaller (the count badge, the dismiss handle) are wrapped in a larger transparent hit area.

Focus order on the Roll screen follows reading order: pool display → dice grid (left-right, top-bottom) → action row → roll button. VoiceOver/TalkBack navigation is tested against this order.

The animated total in the Roll Result overlay uses `AccessibilityInfo.announceForAccessibility()` to announce the final number when the animation completes. The animation itself is suppressed when `useReducedMotion()` returns `true` (replaced with an immediate value display). `useReducedMotion` is imported from `react-native-reanimated`:

```ts
import { useReducedMotion } from 'react-native-reanimated'
```

## Dependencies

- `react-native-reanimated` — provides `useReducedMotion()` and `useAnimatedStyle` for all spring animations (die button press scale, roll result number spin, history row expansion). This package is a mandatory peer dependency of Expo SDK 55 and is already present in the project.
- `expo-haptics` — `Haptics.impactAsync` and `Haptics.notificationAsync` for tactile feedback on tap, roll, and result reveal.
- `react-native-gesture-handler` — swipe-to-reveal on template and history rows.

## Consequences

### Positive
- Long-press to decrement removes the need for a separate remove button, keeping the dice grid clean and touch-target-friendly
- The Roll Result overlay's slide-up-from-bottom pattern is the platform idiom for ephemeral results on both iOS and Android — users understand it without instruction
- Swipe-to-reveal on template and history rows is consistent with iOS Mail and other list-management apps players already know
- The Roll Wizard as a single modal route eliminates the URL-param serialization problem for complex wizard state — all state lives in `useWizardStore`, which is typed and validated
- The single-route wizard avoids generating deep-link-able URLs for mid-wizard states, which would be meaningless and potentially confusing
- In-place history expansion avoids navigation overhead for the peek-at-details use case
- `useReducedMotion()` support (from `react-native-reanimated`) means animated reveals do not cause problems for users with motion sensitivity

### Negative
- Long-press to decrement is a non-obvious affordance — first-time users may not discover it without a tooltip or onboarding hint. A brief first-launch tooltip on the dice grid ("Long press to remove") is recommended but not specified in this ADR.
- The Roll Wizard's single-route model means the device back button exits the wizard entirely from any step rather than going back one step. The explicit in-wizard Back button handles step regression. Users accustomed to the OS back gesture for step-back (common in Android apps) may find this surprising.
- The Roll Wizard's four-step flow is the longest interaction in the app. Users who abandon at Step 2 or 3 lose all their work (no draft persistence). Draft persistence is out of scope for v1 but should be considered in v1.1.
- In-place history expansion with a height animation is straightforward for short breakdowns. For deeply nested results (e.g. Salvage Union rolls with many modifier steps), the expanded row may be very tall, pushing subsequent rows far down the list. A max-height with internal scroll should be evaluated during implementation.
- The numeric stepper for `integer` inputs in game rollers requires two taps to change a value by one (minus, then confirm). For ratings that span 1–6 (Blades in the Dark), this is acceptable. For wider ranges, a direct-tap-to-edit numeric input may be preferable. This can be addressed with game-specific UI overrides post-launch.

### Neutral
- Haptic feedback is a no-op on Web and is gated on a `preferences.haptics` toggle. The absence of haptics on Web does not degrade the interaction model — the visual animations carry the feedback role there.
- The Roll tab toggles between Simple and Advanced Mode as a state change within a single screen, not as two separate routes. This means there is no browser-style back button between modes on native. Users return to Simple Mode via the explicit back control in Advanced Mode's header.
- Bottom sheet / `pageSheet` presentation for the Roll Wizard and variable prompt means these surfaces are dismissible by swipe-down on iOS (the platform default). On Android, the back button dismisses them. This behavior is consistent with platform conventions and requires no custom implementation.
