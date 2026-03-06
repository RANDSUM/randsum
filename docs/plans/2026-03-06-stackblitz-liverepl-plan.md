# StackBlitz LiveRepl Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Open in StackBlitz" button below TypeScript code blocks in the RANDSUM docs site so users can run examples in a real Node.js environment with one click.

**Architecture:** `LiveRepl.astro` renders a static Starlight `<Code>` block for all languages, then conditionally renders an `<OpenInStackBlitz>` React island for TypeScript blocks only. The island extracts `@randsum/*` imports from the code string and calls `sdk.openProject()` from `@stackblitz/sdk` on click, opening a pre-populated Node.js project in a new tab.

**Tech Stack:** Astro 5, `@astrojs/react`, `@stackblitz/sdk`, `bun:test`, TypeScript strict mode

---

## Codebase Context

- Workspace root: `/Users/jarvis/Code/RANDSUM/@RANDSUM`
- Site app: `apps/site/`
- Live repl components: `apps/site/src/components/live-repl/`
- Tests live in: `apps/site/__tests__/` (alongside `package.test.ts`)
- Run tests: `bun test` from workspace root, or `bun run --filter @randsum/site test`
- TypeScript is strict — `const` only, no `any`, explicit return types on exports
- No semicolons, single quotes, no trailing commas (Prettier enforced on commit)
- `client:visible` is Astro's lazy-hydration directive: hydrates when element enters viewport

---

## Task 1: Add `@stackblitz/sdk` dependency

**Files:**
- Modify: `apps/site/package.json`

**Step 1: Add the dependency**

In `apps/site/package.json`, add `"@stackblitz/sdk": "latest"` to `dependencies` (not `devDependencies` — it ships client-side code):

```json
"dependencies": {
  "@astrojs/netlify": "^6.6.4",
  "@astrojs/react": "^4.4.2",
  "@astrojs/starlight": "^0.34.0",
  "@randsum/blades": "workspace:~",
  "@randsum/daggerheart": "workspace:~",
  "@randsum/fifth": "workspace:~",
  "@randsum/pbta": "workspace:~",
  "@randsum/roller": "workspace:~",
  "@randsum/root-rpg": "workspace:~",
  "@randsum/salvageunion": "workspace:~",
  "@stackblitz/sdk": "latest",
  "@types/react": "^19.1.8",
  "@types/react-dom": "^19.1.6",
  "astro": "^5.18.0",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "sucrase": "3.35.1"
}
```

**Step 2: Install**

```bash
bun install
```

Expected: Resolves `@stackblitz/sdk`, updates `bun.lock`. No errors.

**Step 3: Commit**

```bash
git add apps/site/package.json bun.lock
git commit -m "chore(site): add @stackblitz/sdk dependency"
```

---

## Task 2: Create `extractRandsumDeps` utility (TDD)

**Files:**
- Create: `apps/site/src/components/live-repl/extractRandsumDeps.ts`
- Create: `apps/site/__tests__/extractRandsumDeps.test.ts`

### Step 1: Write the failing test

Create `apps/site/__tests__/extractRandsumDeps.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { extractRandsumDeps } from '../src/components/live-repl/extractRandsumDeps'

describe('extractRandsumDeps', () => {
  test('extracts a single @randsum import (single quotes)', () => {
    const code = `import { roll } from '@randsum/roller'`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('handles double quotes', () => {
    const code = `import { roll } from "@randsum/roller"`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('extracts multiple distinct @randsum imports', () => {
    const code = [
      `import { roll } from '@randsum/roller'`,
      `import { bladeRoll } from '@randsum/blades'`
    ].join('\n')
    expect(extractRandsumDeps(code)).toEqual({
      '@randsum/roller': 'latest',
      '@randsum/blades': 'latest'
    })
  })

  test('deduplicates repeated imports of the same package', () => {
    const code = [
      `import { roll } from '@randsum/roller'`,
      `import { roll2 } from '@randsum/roller'`
    ].join('\n')
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('returns empty object when no @randsum imports', () => {
    const code = `import { something } from 'some-other-package'`
    expect(extractRandsumDeps(code)).toEqual({})
  })

  test('returns empty object for empty string', () => {
    expect(extractRandsumDeps('')).toEqual({})
  })
})
```

### Step 2: Run test to verify it fails

```bash
bun test apps/site/__tests__/extractRandsumDeps.test.ts
```

Expected: FAIL — "Cannot find module '../src/components/live-repl/extractRandsumDeps'"

### Step 3: Write the implementation

Create `apps/site/src/components/live-repl/extractRandsumDeps.ts`:

```typescript
export function extractRandsumDeps(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const matches = code.matchAll(/from ['"](@randsum\/[a-z-]+)['"]/g)
  for (const match of matches) {
    deps[match[1]] = 'latest'
  }
  return deps
}
```

Uses `String.matchAll()` for clean iteration over all regex captures — no mutable state needed.

### Step 4: Run test to verify it passes

```bash
bun test apps/site/__tests__/extractRandsumDeps.test.ts
```

Expected: All 6 tests pass.

### Step 5: Commit

```bash
git add apps/site/src/components/live-repl/extractRandsumDeps.ts apps/site/__tests__/extractRandsumDeps.test.ts
git commit -m "feat(site): add extractRandsumDeps utility with tests"
```

---

## Task 3: Create `OpenInStackBlitz` React component

**Files:**
- Create: `apps/site/src/components/live-repl/OpenInStackBlitz.tsx`

There is no behavior to unit-test here (it's a UI component that calls a browser SDK). Verified visually in Task 5.

### Step 1: Write the component

Create `apps/site/src/components/live-repl/OpenInStackBlitz.tsx`:

```tsx
import sdk from '@stackblitz/sdk'
import { extractRandsumDeps } from './extractRandsumDeps'

interface Props {
  code: string
}

export function OpenInStackBlitz({ code }: Props) {
  const handleClick = () => {
    const randsumDeps = extractRandsumDeps(code)
    sdk.openProject({
      title: 'RANDSUM Example',
      template: 'node',
      files: {
        'index.ts': code,
        'package.json': JSON.stringify(
          {
            name: 'randsum-example',
            type: 'module',
            scripts: { start: 'tsx index.ts' },
            dependencies: { ...randsumDeps, tsx: 'latest' }
          },
          null,
          2
        ),
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ESNext',
              module: 'NodeNext',
              moduleResolution: 'NodeNext'
            }
          },
          null,
          2
        )
      }
    })
  }

  return (
    <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
      <button
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--sl-color-accent)',
          fontSize: '0.8125rem',
          fontFamily: 'var(--sl-font)',
          padding: '0.25rem 0',
          textDecoration: 'none'
        }}
      >
        Open in StackBlitz ↗
      </button>
    </div>
  )
}
```

**Notes:**
- Inline styles are intentional — no new CSS file per the design doc
- `var(--sl-color-accent)` is a Starlight CSS variable that adapts to light/dark mode automatically
- `sdk.openProject()` opens a new browser tab — no `await` needed
- `template: 'node'` uses WebContainers (real Node.js environment), not a browser bundler

### Step 2: Commit

```bash
git add apps/site/src/components/live-repl/OpenInStackBlitz.tsx
git commit -m "feat(site): add OpenInStackBlitz React island"
```

---

## Task 4: Update `LiveRepl.astro` to render the button island

**Files:**
- Modify: `apps/site/src/components/live-repl/LiveRepl.astro`

### Step 1: Replace the file content

The current file is:

```astro
---
import { Code } from '@astrojs/starlight/components'

interface Props {
  code: string
  lang?: string
  readonly?: boolean
}

const { code, lang = 'typescript' } = Astro.props
---

<Code code={code} lang={lang} />
```

Replace it entirely with:

```astro
---
import { Code } from '@astrojs/starlight/components'
import { OpenInStackBlitz } from './OpenInStackBlitz'

interface Props {
  code: string
  lang?: string
  readonly?: boolean
}

const { code, lang = 'typescript' } = Astro.props
const isTypeScript = lang === 'typescript'
---

<Code code={code} lang={lang} />
{isTypeScript && <OpenInStackBlitz code={code} client:visible />}
```

**Notes:**
- `client:visible` — hydrates the React component only when it scrolls into viewport. Avoids loading `@stackblitz/sdk` JS for every page upfront.
- Bash blocks (`lang="bash"`) are excluded — `lang === 'typescript'` is false for them.
- The `readonly` prop stays in the interface for MDX callsite compatibility (callers pass `readonly` on bash blocks, e.g. `<LiveRepl readonly lang="bash" code={...} />`). It is safely ignored here since Starlight's `<Code>` component does not accept `readonly`.

### Step 2: Commit

```bash
git add apps/site/src/components/live-repl/LiveRepl.astro
git commit -m "feat(site): wire OpenInStackBlitz island into LiveRepl for TypeScript blocks"
```

---

## Task 5: Verify and finish

**Step 1: Run all site tests**

```bash
bun run --filter @randsum/site test
```

Expected: All tests pass, including the 6 new `extractRandsumDeps` tests.

**Step 2: Typecheck**

```bash
bun run --filter @randsum/site typecheck
```

Expected: No TypeScript errors.

**Step 3: Visual verification with dev server**

```bash
bun run site:dev
```

Open http://localhost:4321/packages/roller. Verify:
1. Static syntax-highlighted code blocks render as before
2. "Open in StackBlitz ↗" button appears below each TypeScript block
3. No button appears below the bash install blocks
4. Clicking the button opens a new StackBlitz tab with the code in `index.ts`, `tsx index.ts` as the start script, and the correct `@randsum/*` package(s) in `dependencies`

**Step 4: Commit any auto-formatting**

The pre-commit hook runs Prettier automatically. If it reformats anything and the commit fails, stage the reformatted files and retry:

```bash
git add -A
git commit -m "chore(site): apply formatting"
```
