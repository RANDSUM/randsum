# Sandpack Integration Design

**Date:** 2026-03-06
**Branch:** jarvis/skill-roller
**Scope:** `apps/site`

## Goal

Replace static `LiveRepl` code blocks with interactive Sandpack editors across the RANDSUM docs site, enabling users to run and edit TypeScript examples in-browser without leaving the page.

## Three Modes

| Mode | Props | Renderer |
|------|-------|----------|
| Static (non-runnable) | `readonly` + `lang="bash"` (or any non-TS lang) | Starlight `<Code>` |
| Read-only runnable | `readonly` (TypeScript) | Sandpack, `readOnly: true` |
| Editable runnable | _(default)_ | Sandpack, `readOnly: false` |

No MDX changes are required. Mode is inferred from existing props.

## Component Interface

`LiveRepl.astro` retains its current props — no call-site changes across 22 MDX files:

```ts
interface Props {
  code: string
  lang?: string      // default: 'typescript'
  readonly?: boolean
}
```

## Architecture

### `LiveRepl.astro` (Astro shell)

- Wraps all output in `<div class="live-repl-wrapper">` for consistent outer styling
- If `lang !== 'typescript'`: renders Starlight `<Code>` inside the wrapper
- Otherwise: renders `<SandpackRepl>` React component with `client:visible`

### `SandpackRepl.tsx` (React component)

- Receives `code`, `readonly` props
- Parses `code` string for `@randsum/*` import statements → builds `customSetup.dependencies`
- Renders `<Sandpack>` from `@codesandbox/sandpack-react` with:
  - `template="vanilla-ts"`
  - `theme={sandpackDark}` from `@codesandbox/sandpack-themes`
  - `options={{ readOnly: readonly }}`
  - Console panel visible by default (Sandpack default layout)

### Dependency detection

```ts
function extractRandsumDeps(code: string): Record<string, string> {
  const matches = code.matchAll(/from ['"](@randsum\/[\w-]+)['"]/g)
  return Object.fromEntries([...matches].map(([, pkg]) => [pkg, 'latest']))
}
```

Only loads the packages actually referenced in each code block.

## Styling

- `sandpackDark` theme used for all Sandpack instances
- Starlight's expressive-code theme configured in `astro.config.mjs` to match `sandpackDark` colors (background, font, border-radius, padding)
- Shared `.live-repl-wrapper` CSS class enforces consistent outer container (border, spacing) across both renderer paths

## Dependencies to Add

```json
"@codesandbox/sandpack-react": "latest",
"@codesandbox/sandpack-themes": "latest"
```

No changes to other workspace packages.

## What Does Not Change

- All 22 MDX files — zero prop changes required
- `LiveRepl.astro` prop interface
- Bash/install blocks — continue rendering as static `<Code>`
- Starlight layout and navigation
