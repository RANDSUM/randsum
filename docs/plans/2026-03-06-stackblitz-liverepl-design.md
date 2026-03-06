# StackBlitz LiveRepl Design

**Date:** 2026-03-06
**Branch:** jarvis/skill-roller
**Scope:** `apps/site`

## Goal

Add an "Open in StackBlitz" button to TypeScript code blocks across the RANDSUM docs site, letting users run and experiment with examples in a real Node.js environment without leaving the docs.

## Approach

Keep the static Starlight `<Code>` block as-is (SSR'd, always visible). Add a small client-side button island below TypeScript blocks only that opens the code pre-populated in StackBlitz.

## Three Block Types

| Block | Props | Behavior |
|-------|-------|----------|
| Install/bash | `lang="bash"` | Static only, no button |
| TypeScript example | _(default)_ | Static code + "Open in StackBlitz" button |

No MDX changes required across the 22 docs pages.

## Architecture

### `LiveRepl.astro` (routing shell)

Unchanged prop interface:

```ts
interface Props {
  code: string
  lang?: string      // default: 'typescript'
  readonly?: boolean
}
```

Renders:
1. Starlight `<Code>` for all blocks (static syntax highlighting, SSR)
2. `<OpenInStackBlitz code={code} client:visible />` below TypeScript blocks only

### `OpenInStackBlitz.tsx` (React island)

- Receives `code` prop
- Extracts `@randsum/*` imports via `extractRandsumDeps`
- On button click, calls `sdk.openProject()` from `@stackblitz/sdk`
- Styled to match Starlight's code block aesthetic (right-aligned, accent color, light/dark adaptive)

### StackBlitz project setup

Each opened project contains three files:

```
index.ts        ← user's exact code from the docs block
package.json    ← { dependencies: { ...@randsum/*, tsx: "latest" },
                    scripts: { start: "tsx index.ts" } }
tsconfig.json   ← { compilerOptions: { target: "ESNext",
                    module: "NodeNext", moduleResolution: "NodeNext" } }
```

`tsx` handles TypeScript execution via WebContainers' Node.js runtime with no compile step. `@randsum/*` packages are extracted from the code string.

### `extractRandsumDeps.ts` (utility)

Restored from earlier work. Parses `from '@randsum/...'` and `from "@randsum/..."` import statements to build the `dependencies` object.

## Button UX

```
[code block]
                        Open in StackBlitz ↗
```

- Right-aligned, below the code block
- Text link style using `--sl-color-accent` (adapts to light/dark mode)
- No new CSS file — scoped styles in the component

## Dependencies to Add

```json
"@stackblitz/sdk": "latest"
```

`lz-string` and Sandpack packages are NOT needed.

## What Does Not Change

- All 22 MDX files — zero prop changes
- `LiveRepl.astro` prop interface
- Bash/install blocks — continue rendering as static `<Code>` only
- Starlight layout, navigation, and theme
