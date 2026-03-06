# Sandpack Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace static `LiveRepl` code blocks with interactive Sandpack editors that let docs users run and edit TypeScript examples in-browser.

**Architecture:** `LiveRepl.astro` becomes a routing shell — non-TypeScript blocks render Starlight's static `<Code>`, TypeScript blocks render a new `SandpackRepl.tsx` React component. Mode (static / read-only runnable / editable runnable) is inferred from existing props, so zero MDX call-site changes are needed.

**Tech Stack:** `@codesandbox/sandpack-react`, `@codesandbox/sandpack-themes`, Astro `client:visible` for lazy hydration, existing `bun:test` for unit tests.

---

### Task 1: Install Sandpack dependencies

**Files:**
- Modify: `apps/site/package.json`

**Step 1: Add the packages**

```bash
cd apps/site && bun add @codesandbox/sandpack-react @codesandbox/sandpack-themes
```

**Step 2: Verify they appear in package.json dependencies**

```bash
grep sandpack apps/site/package.json
```

Expected output includes both `@codesandbox/sandpack-react` and `@codesandbox/sandpack-themes`.

**Step 3: Commit**

```bash
git add apps/site/package.json bun.lock
git commit -m "chore(site): add sandpack dependencies"
```

---

### Task 2: `extractRandsumDeps` utility — TDD

**Files:**
- Create: `apps/site/src/components/live-repl/extractRandsumDeps.ts`
- Create: `apps/site/src/components/live-repl/__tests__/extractRandsumDeps.test.ts`

**Step 1: Write the failing tests**

Create `apps/site/src/components/live-repl/__tests__/extractRandsumDeps.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { extractRandsumDeps } from '../extractRandsumDeps'

describe('extractRandsumDeps', () => {
  test('extracts a single @randsum package', () => {
    const code = `import { roll } from '@randsum/roller'`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('extracts multiple distinct @randsum packages', () => {
    const code = `
      import { roll } from '@randsum/roller'
      import { roll as bladesRoll } from '@randsum/blades'
    `
    expect(extractRandsumDeps(code)).toEqual({
      '@randsum/roller': 'latest',
      '@randsum/blades': 'latest'
    })
  })

  test('deduplicates repeated imports of the same package', () => {
    const code = `
      import { roll } from '@randsum/roller'
      import type { RollResult } from '@randsum/roller'
    `
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('returns empty object for non-@randsum code', () => {
    expect(extractRandsumDeps(`import { something } from 'some-lib'`)).toEqual({})
  })

  test('returns empty object for bash/empty strings', () => {
    expect(extractRandsumDeps('bun add @randsum/roller')).toEqual({})
    expect(extractRandsumDeps('')).toEqual({})
  })

  test('handles double-quote imports', () => {
    const code = `import { roll } from "@randsum/fifth"`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/fifth': 'latest' })
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
bun test apps/site/src/components/live-repl/__tests__/extractRandsumDeps.test.ts
```

Expected: FAIL — `Cannot find module '../extractRandsumDeps'`

**Step 3: Implement the utility**

Create `apps/site/src/components/live-repl/extractRandsumDeps.ts`:

```ts
export function extractRandsumDeps(code: string): Record<string, string> {
  const matches = code.matchAll(/from ['"](@randsum\/[\w-]+)['"]/g)
  const packages = [...new Set([...matches].map(([, pkg]) => pkg))]
  return Object.fromEntries(packages.map((pkg) => [pkg, 'latest']))
}
```

**Step 4: Run tests to verify they pass**

```bash
bun test apps/site/src/components/live-repl/__tests__/extractRandsumDeps.test.ts
```

Expected: all 6 tests PASS

**Step 5: Commit**

```bash
git add apps/site/src/components/live-repl/extractRandsumDeps.ts \
        apps/site/src/components/live-repl/__tests__/extractRandsumDeps.test.ts
git commit -m "feat(site): add extractRandsumDeps utility with tests"
```

---

### Task 3: Create `SandpackRepl.tsx`

**Files:**
- Create: `apps/site/src/components/live-repl/SandpackRepl.tsx`

**Context:** Sandpack renders a Monaco-based editor + console in the browser. `@codesandbox/sandpack-react` exports a `<Sandpack>` component. `@codesandbox/sandpack-themes` exports `sandpackDark`. The `template="vanilla-ts"` template runs TypeScript in a Node-like sandbox, so `import { roll } from '@randsum/roller'` works once the dependency is in `customSetup.dependencies`.

**Step 1: Create the component**

Create `apps/site/src/components/live-repl/SandpackRepl.tsx`:

```tsx
import { Sandpack } from '@codesandbox/sandpack-react'
import { sandpackDark } from '@codesandbox/sandpack-themes'
import { extractRandsumDeps } from './extractRandsumDeps'

interface Props {
  code: string
  readonly?: boolean
}

const theme = {
  ...sandpackDark,
  font: {
    ...sandpackDark.font,
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    size: '13px'
  }
}

export function SandpackRepl({ code, readonly = false }: Props): JSX.Element {
  const dependencies = extractRandsumDeps(code)

  return (
    <Sandpack
      template="vanilla-ts"
      theme={theme}
      files={{ '/index.ts': code }}
      customSetup={{ dependencies }}
      options={{
        readOnly: readonly,
        showConsole: true,
        showConsoleButton: true,
        editorHeight: 'auto'
      }}
    />
  )
}
```

**Step 2: Typecheck**

```bash
bun run --filter @randsum/site typecheck
```

Expected: no errors. If you see a missing type for `JSX.Element`, change the return type to `React.JSX.Element` and ensure `@types/react` is in scope (it already is in `package.json`).

**Step 3: Commit**

```bash
git add apps/site/src/components/live-repl/SandpackRepl.tsx
git commit -m "feat(site): add SandpackRepl React component"
```

---

### Task 4: Update `LiveRepl.astro` to route to SandpackRepl

**Files:**
- Modify: `apps/site/src/components/live-repl/LiveRepl.astro`

**Context:** `LiveRepl.astro` currently just wraps Starlight's `<Code>`. We need it to:
- Always render a `.live-repl-wrapper` div (for consistent outer styling)
- Route to static `<Code>` when `lang !== 'typescript'`
- Route to `<SandpackRepl>` (via `client:visible`) for TypeScript blocks

`client:visible` means Astro will not hydrate the React component until it scrolls into the viewport — better performance than `client:load` since many examples are below the fold.

**Step 1: Replace the file contents**

Edit `apps/site/src/components/live-repl/LiveRepl.astro`:

```astro
---
import { Code } from '@astrojs/starlight/components'
import { SandpackRepl } from './SandpackRepl'

interface Props {
  code: string
  lang?: string
  readonly?: boolean
}

const { code, lang = 'typescript', readonly = false } = Astro.props
const isTypeScript = lang === 'typescript'
---

<div class="live-repl-wrapper">
  {isTypeScript ? (
    <SandpackRepl code={code} readonly={readonly} client:visible />
  ) : (
    <Code code={code} lang={lang} />
  )}
</div>
```

**Step 2: Start the dev server and visually verify**

```bash
bun run site:dev
```

Open `http://localhost:4321` and navigate to any docs page with a TypeScript example (e.g. `/packages/roller`). You should see:
- TypeScript blocks: Sandpack editor with dark theme and console panel
- Bash install blocks: static syntax-highlighted code (unchanged look)

**Step 3: Commit**

```bash
git add apps/site/src/components/live-repl/LiveRepl.astro
git commit -m "feat(site): wire LiveRepl.astro to SandpackRepl for TypeScript blocks"
```

---

### Task 5: Style — wrapper CSS + font consistency

**Files:**
- Modify: `apps/site/src/styles/custom.css`

**Context:** The site uses JetBrains Mono and slate-900/950 colors. Sandpack renders inside an iframe-like sandbox, so outer CSS doesn't pierce its internals. The `.live-repl-wrapper` controls the outer frame. Sandpack's own font is overridden in `SandpackRepl.tsx` via the `theme.font` object (Task 3). Here we just ensure consistent margin, border-radius, and overflow behavior between static and Sandpack blocks.

**Step 1: Add wrapper styles to `custom.css`**

Append to `apps/site/src/styles/custom.css`:

```css
/* ===== LiveRepl wrapper — consistent outer style for all code blocks ===== */
.live-repl-wrapper {
  margin: 1rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Match static Code block border-radius to Sandpack's rounded corners */
.live-repl-wrapper .expressive-code {
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Remove default margin on expressive-code inside wrapper (already handled above) */
.live-repl-wrapper .expressive-code pre {
  margin: 0;
}
```

**Step 2: Visually verify consistency**

With `bun run site:dev` still running, compare a bash block and a TypeScript block on the same page (e.g. `/getting-started/installation`). Both should have the same outer border-radius and margin. The fonts in the Sandpack editor should show JetBrains Mono.

**Step 3: Commit**

```bash
git add apps/site/src/styles/custom.css
git commit -m "style(site): add live-repl-wrapper CSS for consistent block styling"
```

---

### Task 6: Run full checks and push

**Step 1: Run the full test suite**

```bash
bun run test
```

Expected: all tests pass including the new `extractRandsumDeps` tests.

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Build**

```bash
bun run --filter @randsum/site build
```

Expected: build completes with no errors. Sandpack is client-side only so SSR/static build should succeed.

**Step 4: Push**

```bash
git push
```
