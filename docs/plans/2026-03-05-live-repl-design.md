# Live REPL Design

## Goal

Replace all static TypeScript code examples in the docs site with fully interactive, editable, runnable REPLs powered by Monaco editor and a Web Worker execution sandbox.

## Architecture

A new `LiveRepl` React island component (`client:only="react"`) replaces both static fenced code blocks and the existing `RollableCode` component. Code runs in a Vite module Web Worker with `roll` pre-injected, Sucrase stripping TypeScript types before execution. Monaco editor provides the editing surface.

## Visual Design

No header bar. Clean, minimal. Run and Copy buttons float absolutely in the top-right corner inside the editor pane. Output pane always visible below with a labeled separator.

```
+-----------------------------[⎘ Copy] [▶ Run]--+
|                                                 |
|  import { roll } from '@randsum/roller'         |
|                                                 |
|  const result = roll('4d6L')                    |
|  console.log(result.total)                      |
|                                                 |
+------ Output ─────────────────────────────────+
|  > 14                                           |
+-------------------------------------------------+
```

After running, buttons become `[⎘ Copy] [↻ Re-run] [✕ Clear]`. Copy is always present.

## Component Props

```typescript
interface LiveReplProps {
  code: string   // initial code string shown in the editor
  lang?: string  // default 'typescript'
}
```

## Execution Pipeline

1. User clicks Run or presses `Cmd+Enter` / `Ctrl+Enter`
2. Sucrase strips TypeScript types in the browser (no type-checking, ~15KB)
3. Import lines for `@randsum/roller` are stripped — `roll` is pre-injected into worker scope
4. Compiled JS is posted to the Web Worker
5. Worker intercepts `console.log`, evaluates the code, captures the last expression value
6. Worker posts back `{ logs: string[], result: unknown, error?: string }`
7. Output pane renders results. 5-second timeout kills runaway code.

The worker is a Vite module worker (`new Worker(url, { type: 'module' })`), which imports `roll` from `@randsum/roller` at the top — Vite bundles it in at build time.

## Output Display

- Each `console.log(...)` call on its own line, prefixed with `>`
- Last expression value prefixed with `=` (skipped if `undefined` or already logged)
- Errors in red, prefixed with `✕`
- Placeholder `// waiting...` (muted) before first run
- Objects serialized with `JSON.stringify` (2-space indent)

## MDX Integration

Usage in MDX files:

```mdx
import { LiveRepl } from '../../../components/live-repl/LiveRepl'

<LiveRepl code={`
import { roll } from '@randsum/roller'

const result = roll('4d6L')
console.log(result.total)
`} />
```

### Files to update

- `apps/site/src/content/docs/getting-started/quick-start.mdx`
- `apps/site/src/content/docs/reference/dice-notation.mdx`
- `apps/site/src/content/docs/guides/recipes.mdx`
- `apps/site/src/content/docs/reference/modifiers.mdx`

## Files to Create

- `apps/site/src/components/live-repl/LiveRepl.tsx` — main component
- `apps/site/src/components/live-repl/LiveRepl.css` — styles
- `apps/site/src/components/live-repl/repl-worker.ts` — Web Worker
- `apps/site/src/components/live-repl/useRepl.ts` — execution hook

## Files to Delete

Once all usages are replaced:

- `apps/site/src/components/rollable-code/RollableCode.tsx`
- `apps/site/src/components/rollable-code/RollableCode.css`
- `apps/site/src/components/rollable-code/formatLiveResult.ts`
