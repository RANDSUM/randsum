# ADR-011: Playground Layout Design

## Status

Superseded by `apps/expo`. Designed, never built.

## Context

Epic #938 proposed a full-page, Rubular-style interactive playground for RANDSUM
dice notation: a single-page web app where users type notation, see a live
human-readable description, roll, and view a step-by-step result alongside an
always-visible quick reference. This ADR captured the intended layout and
interaction design before any code existed.

The design borrowed its flow from the existing CLI TUI (`apps/cli/src/tui/`) —
input, live description, roll result, notation reference — and aimed to reuse the
project's display logic and visual identity rather than reinvent them.

## Decision

Design the playground as a single-page, two-column layout (input/description/result
in a main column, persistent quick reference in a sidebar; stacked with a
collapsible reference on mobile), driven by a **Type → Understand → Roll → Explore**
interaction model with shareable URL state. Component boundaries, color tokens,
and responsive behavior were specified in detail.

**This design was never implemented.** No `apps/playground/` directory was ever
created. The interactive dice app effort instead moved to `apps/expo/` (a
single-screen prototype today). The detailed layout grids, `--pg-*` design token
set, and React component tree recorded in earlier drafts of this ADR describe
software that does not exist and have been removed; the intent above is kept only
as a historical record.

## Consequences

- The interaction model (live description, step visualization, shareable state)
  remains a useful reference for whatever the `apps/expo` app becomes, even though
  the web-specific layout and tokens do not carry over to a React Native context.
- No design-review process, component contracts, or CSS tokens from this ADR are
  in force, because nothing was built.
- Future interactive-app work should be tracked against `apps/expo`, not a
  standalone playground.
