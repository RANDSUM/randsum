# ADR-005: Design System & Theme Tokens

## Status
Proposed

## Context

The RANDSUM Expo app targets iOS, Android, and Web from a single codebase. It must establish a shared visual identity that:

1. Matches `randsum.dev` and `playground.randsum.dev` so the product feels like a coherent ecosystem, not a separate app bolted on.
2. Respects the TTRPG audience — tabletop players overwhelmingly use apps in dark environments (game nights, dimly lit tables) and expect dark-mode-first interfaces.
3. Works across React Native's `StyleSheet` system without a CSS-in-JS runtime, while remaining compatible with Expo Web where CSS is available.
4. Distinguishes dice values and notation from ambient UI text. Notation strings like `4d6L` and numeric results like `18` carry semantic weight and must be visually distinct from labels and chrome.

Without a token system, each component author makes independent color choices. On a multi-screen app that includes a pool builder, game rollers, a history feed, and account settings, divergent choices compound quickly into an incoherent visual hierarchy.

## Decision

### Accent and Neutral Palette

The app adopts the same palette as `randsum.dev`:

- **Accent:** `#a855f7` (Tailwind purple-500) — used for primary CTAs, active tab indicators, focus rings, and the Roll button
- **Accent high:** `#d8b4fe` (Tailwind purple-300) — used for text links and subtle accent states on dark surfaces

Neutral grays follow the Tailwind zinc scale, which has a cool, slightly blue-gray cast that reads well against the purple accent without competing.

### Semantic Token Set

All components consume semantic tokens, never raw hex values. This ensures light/dark mode switching is a single-layer concern in the theme store, not scattered across every component.

| Token | Dark value | Light value | Purpose |
|---|---|---|---|
| `bg` | `#09090b` (zinc-950) | `#ffffff` | Screen/page background |
| `surface` | `#18181b` (zinc-900) | `#f4f4f5` | Cards, sheets, modals |
| `surface-alt` | `#27272a` (zinc-800) | `#e4e4e7` | Nested surfaces, input backgrounds |
| `border` | `#52525b` (zinc-600) | `#a1a1aa` | Dividers, input outlines, separators |
| `text` | `#fafafa` (zinc-50) | `#18181b` | Primary text |
| `text-muted` | `#a1a1aa` (zinc-400) | `#3f3f46` | Secondary labels, metadata |
| `text-dim` | `#71717a` (zinc-500) | `#71717a` | Placeholder text, disabled states |
| `accent` | `#a855f7` | `#a855f7` | Primary actions, active states |
| `accent-high` | `#d8b4fe` | `#7c3aed` | Links, accent text on surfaces |
| `error` | `#ef4444` (red-500) | `#dc2626` | Validation errors, destructive actions |
| `success` | `#10b981` (emerald-500) | `#059669` | Sync status, success confirmations |

The `accent` token is the same in both modes — purple-500 has adequate contrast against both `bg` (dark) and `#ffffff` (light) at the sizes used for button backgrounds and tab indicators.

`text-dim` is the same in both modes because zinc-500 sits at approximately the perceptual midpoint between the dark and light backgrounds, making it serviceable (though not optimal) as placeholder text in either mode. This is a known trade-off: optimizing both would require separate tokens, adding cognitive overhead for a minor gain.

### Dark-Mode Default

The app defaults to dark mode. The user's system preference (`useColorScheme` from React Native) is read on first launch; if the system is light, the app starts light. After first launch, the user's explicit preference (stored in `preferences.theme`) overrides the system value. This is implemented in the Zustand theme store.

Rationale for dark-first: TTRPG sessions happen at tables where ambient light is low. A bright white screen is disruptive. Dark-first is also consistent with how `randsum.dev` presents itself.

### Typography

Two typefaces cover all use cases:

**JetBrains Mono** — used for:
- Notation strings (e.g. `4d6L`, `1d20+5`)
- Numeric roll results (e.g. `18`, `[6, 5, 4, 1]`)
- Individual die values in the breakdown
- The pool display in Simple Mode
- The notation input field in Advanced Mode

Rationale: Notation is a formal language with tokens (`d`, `L`, `+`, `{}`). Monospace rendering makes the tokenization visually apparent — each character occupies a fixed slot, so users can parse notation quickly. JetBrains Mono is already loaded on `randsum.dev`, so using it in the app creates direct continuity.

**System sans-serif** (San Francisco on iOS, Roboto on Android, system-ui on Web) — used for:
- Tab bar labels
- Screen headings and section titles
- Button labels
- Form field labels and helper text
- Game names, template names, metadata

Rationale: System fonts render at native quality with no bundle cost. They feel at home on each platform. The two-typeface system creates a clear semantic split: monospace = dice values/notation, sans = UI chrome.

Font sizes follow a stepped scale. All sizes are defined as tokens, not magic numbers in individual components:
- `size-xs`: 11
- `size-sm`: 13
- `size-base`: 15
- `size-lg`: 17
- `size-xl`: 22
- `size-2xl`: 32
- `size-3xl`: 48 (roll result total only)

### Theme Store Implementation

A Zustand store (`lib/theme.ts`) holds the resolved token map and a `colorScheme: 'dark' | 'light'` field. Components access tokens via a `useTheme()` hook that returns the current token map. The store initializes from `preferences.theme` (persisted) with `useColorScheme()` as the fallback.

All `StyleSheet` objects that need color values are created inside the component body using `useTheme()`, not as module-level constants. This is the React Native idiom for dynamic theming and avoids stale closures when the user switches modes at runtime.

### Game-Specific Color Accents

The Games tab features six game systems, each with a distinct color identity to aid rapid recognition. These are supplementary to the accent palette and appear only on game cards and game roller headers:

| Game | Color |
|---|---|
| Blades in the Dark | slate (`#64748b`) |
| D&D 5th Edition | gold (`#f59e0b`) |
| Daggerheart | amber (`#f97316`) |
| Powered by the Apocalypse | emerald (`#10b981`) |
| Root RPG | green (`#22c55e`) |
| Salvage Union | orange (`#ea580c`) |

These colors are not part of the semantic token system. They are constants in a `gameColors` map and are consumed only by game-specific components.

## Consequences

### Positive
- Visual consistency across all screens and with the wider RANDSUM web ecosystem
- Dark-mode default aligns with TTRPG user expectations and reduces eye strain at the table
- Semantic token layer makes light/dark switching a single-store concern — no per-component conditionals
- JetBrains Mono provides clear notation readability and ecosystem continuity with randsum.dev
- System sans-serif costs nothing in bundle size and renders natively on each platform

### Negative
- JetBrains Mono must be bundled with the app (adds ~120KB to the binary for the relevant weights). This is a fixed cost regardless of how many screens use it.
- All StyleSheet objects that include color tokens must be constructed inside component bodies (cannot be module-level constants), which is slightly less ergonomic than the React Native default and may be unfamiliar to contributors new to dynamic theming.
- `text-dim` (zinc-500) is a compromise: adequate contrast in both modes but not optimal in either. If accessibility audits flag it, splitting into separate dark/light tokens will require touching every component that uses `text-dim`.

### Neutral
- Light mode is fully supported from day one; it is not an afterthought. The implementation cost is low because the token layer exists.
- `accent` (purple-500) carries a small contrast shortfall against white (`#ffffff`) at small text sizes (contrast ratio ~4.5:1, passing AA but not AAA). Accent is never used as body text, so this is not a practical concern.
- The `gameColors` map is intentionally kept out of the semantic token system. If a future design iteration unifies game colors with the token system, this can be refactored without affecting any non-game components.
