# @randsum/component-library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract `RollerPlayground` from `apps/site` into a standalone, publishable `@randsum/component-library` package and re-import it back into the site.

**Architecture:** New package at `packages/component-library/` — same bunup ESM+CJS+DTS build pattern as other packages, with React as a peer dependency. CSS ships with sensible hardcoded defaults and predictable `.roller-playground-*` class names. Consumers style via a `className` prop on the root — targeting descendant class names with their own CSS is the familiar, obvious override path. No token layer, no special configuration needed.

**Tech Stack:** React 18+, bunup, TypeScript (strict + isolatedDeclarations), `@randsum/roller` for dice logic.

---

## Task 1: Scaffold the package

**Files:**
- Create: `packages/component-library/package.json`
- Create: `packages/component-library/tsconfig.json`
- Modify: `tsconfig.json` (root) — add reference

**Step 1: Create `packages/component-library/package.json`**

```json
{
  "name": "@randsum/component-library",
  "version": "0.1.0",
  "description": "React component library for RANDSUM dice rolling tools",
  "private": false,
  "author": {
    "name": "Alex Jarvis",
    "url": "https://github.com/alxjrvs"
  },
  "license": "MIT",
  "homepage": "https://github.com/RANDSUM/randsum",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/RANDSUM/randsum.git",
    "directory": "packages/component-library"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "src",
    "LICENSE",
    "README.md"
  ],
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "react": ">=18"
  },
  "dependencies": {
    "@randsum/roller": "workspace:~"
  },
  "devDependencies": {
    "@types/react": "catalog:"
  },
  "engines": {
    "bun": ">=1.3.10",
    "node": ">=18.0.0"
  },
  "keywords": [
    "dice",
    "roller",
    "rpg",
    "react",
    "components",
    "randsum"
  ],
  "scripts": {
    "dev": "bunup --watch",
    "build": "bunup --entry src/index.ts --format esm,cjs --dts --external react --external react-dom --minify --sourcemap external --target browser --clean",
    "test": "bun test",
    "lint": "eslint . -c ../../eslint.config.js",
    "format": "prettier --write . --ignore-path ../../.prettierignore --config ../../.prettierrc",
    "format:check": "prettier --check . --ignore-path ../../.prettierignore --config ../../.prettierrc",
    "typecheck": "tsc --noEmit"
  }
}
```

**Step 2: Create `packages/component-library/tsconfig.json`**

This package needs JSX support, which the root tsconfig doesn't enable.

```json
{
  "extends": "../../tsconfig.packages.json",
  "compilerOptions": {
    "outDir": "dist",
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "references": [{ "path": "../roller" }]
}
```

**Step 3: Add to root `tsconfig.json` references**

In `tsconfig.json` (repo root), add to the `references` array:

```json
{ "path": "packages/component-library" }
```

**Step 4: Run bun install to link workspace**

```bash
bun install
```

Expected: No errors. `@randsum/component-library` should appear as a symlink in `node_modules/@randsum/`.

**Step 5: Commit**

```bash
git add packages/component-library/package.json packages/component-library/tsconfig.json tsconfig.json
git commit -m "feat(component-library): scaffold package"
```

---

## Task 2: Create the CSS file

**Files:**
- Create: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

The CSS ships with hardcoded sensible defaults (dark-mode biased) and predictable `.roller-playground-*` class names. No token layer — consumers override by targeting these class names from a `className` they pass to the root element.

**Step 1: Create directory**

```bash
mkdir -p packages/component-library/src/components/RollerPlayground
```

**Step 2: Create `RollerPlayground.css`**

This is a rewrite of `apps/site/src/components/playground/RollerPlayground.css` with all `--sl-*` Starlight vars replaced by actual hardcoded values. Light mode uses `@media (prefers-color-scheme: light)`.

```css
/* ===== Container ===== */
.roller-playground {
  max-width: 36rem;
  width: 100%;
}

/* ===== Shell (the visible "input box") ===== */
.roller-playground-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
  overflow: visible;
}

@media (prefers-color-scheme: light) {
  .roller-playground-shell {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(0, 0, 0, 0.15);
  }
}

/* ===== Main content row ===== */
.roller-playground-row {
  display: flex;
  align-items: stretch;
  height: 3rem;
  padding: 0.25rem 0;
}

/* ===== Description row ===== */
.roller-playground-desc-row {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.2rem 0.2rem 0.5rem;
  margin-top: 0.5rem;
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.7rem;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (prefers-color-scheme: light) {
  .roller-playground-desc-row {
    border-top-color: rgba(0, 0, 0, 0.1);
  }
}

.roller-playground-shell--valid {
  border-color: #7c3aed;
}

.roller-playground-shell--invalid {
  border-color: #f97583;
}

/* ===== Input wrap ===== */
.roller-playground-input-wrap {
  position: relative;
  flex: 1;
  margin: 0;
  display: flex;
  align-items: center;
}

/* ===== Input ===== */
.roller-playground-input {
  width: 100%;
  padding: 0 0.5rem;
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 1rem;
  line-height: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f0f0f0;
  box-sizing: border-box;
}

@media (prefers-color-scheme: light) {
  .roller-playground-input {
    color: #111;
  }
}

/* ===== Roll button ===== */
.roller-playground-btn {
  position: relative;
  flex-shrink: 0;
  margin: 0 0.125rem 0 0.25rem;
  padding: 0 0.875rem;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 0.35rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: filter 0.15s ease;
  min-width: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1;
}

.roller-playground-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

.roller-playground-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Spinner ===== */
.roller-playground-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  animation: roller-spin 0.6s linear infinite;
}

@keyframes roller-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== Notation description text ===== */
.roller-playground-desc--hint {
  color: rgba(255, 255, 255, 0.3);
}

@media (prefers-color-scheme: light) {
  .roller-playground-desc--hint {
    color: rgba(0, 0, 0, 0.3);
  }
}

.roller-playground-desc--valid {
  color: #9ca3af;
}

.roller-playground-desc--invalid {
  color: #f97583;
}

/* ===== StackBlitz button ===== */
.roller-playground-stackblitz {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.15rem;
  padding: 0.2rem 0.4rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  color: #9ca3af;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  flex-shrink: 0;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
  white-space: nowrap;
}

.roller-playground-stackblitz:hover {
  border-color: #1389fd;
  color: #1389fd;
}

.roller-playground-stackblitz-icon {
  width: 0.55rem;
  height: 0.55rem;
  fill: currentColor;
  flex-shrink: 0;
}

/* ===== Result chip ===== */
.roller-playground-chip {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.875rem;
  margin: 0 0.375rem 0 0.5rem;
  background: #7c3aed;
  border: none;
  border-radius: 0.35rem;
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
  transition: filter 0.15s ease;
  animation: chip-enter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.roller-playground-chip:hover {
  filter: brightness(1.1);
}

.roller-playground-chip--copied {
  background: #3fb950;
}

@keyframes chip-enter {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.roller-playground-chip-value {
  color: #fff;
}

/* ===== Tooltip ===== */
.roller-playground-tooltip {
  position: absolute;
  left: 0;
  z-index: 100;
  pointer-events: none;
  animation: tooltip-enter 0.1s ease both;
}

.roller-playground-tooltip--above {
  bottom: calc(100% + 0.5rem);
  top: auto;
}

.roller-playground-tooltip--below {
  top: calc(100% + 0.5rem);
  bottom: auto;
}

@keyframes tooltip-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.roller-tooltip-inner {
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  padding: 0.5rem 0.875rem;
  min-width: 12rem;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  font-size: 0.8rem;
  font-family: system-ui, -apple-system, sans-serif;
}

@media (prefers-color-scheme: light) {
  .roller-tooltip-inner {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.15);
  }
}

.roller-tooltip-hint {
  color: #9ca3af;
}

.roller-tooltip-valid {
  color: #a78bfa;
}

.roller-tooltip-invalid {
  color: #f97583;
}

.roller-tooltip-notation {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-weight: 700;
  font-size: 0.9rem;
  color: #a78bfa;
  margin-bottom: 0.1rem;
}

.roller-tooltip-desc {
  color: #6b7280;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.roller-tooltip-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.1rem 0;
}

@media (prefers-color-scheme: light) {
  .roller-tooltip-divider {
    background: rgba(0, 0, 0, 0.1);
  }
}

.roller-tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.05rem 0;
  line-height: 1;
}

.roller-tooltip-label {
  color: #9ca3af;
}

.roller-tooltip-dice-group {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.roller-tooltip-dice {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  letter-spacing: 0;
}

.roller-tooltip-dice-sep {
  color: rgba(255, 255, 255, 0.1);
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
}

.roller-tooltip-dice--removed {
  color: rgba(255, 255, 255, 0.3);
  text-decoration: line-through;
  text-decoration-color: #9ca3af;
}

.roller-tooltip-dice--added {
  color: #a78bfa;
}

.roller-tooltip-dice--arithmetic {
  color: #a78bfa;
  font-weight: 600;
}

.roller-tooltip-row--final {
  padding-bottom: 0.3rem;
}

.roller-tooltip-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.05rem 0;
  padding-top: 0.3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  line-height: 1;
  font-weight: 700;
}

@media (prefers-color-scheme: light) {
  .roller-tooltip-total {
    border-top-color: rgba(0, 0, 0, 0.1);
  }
}
```

**Step 3: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.css
git commit -m "feat(component-library): add RollerPlayground CSS with hardcoded defaults"
```

---

## Task 3: Create `RollerPlayground.tsx`

**Files:**
- Create: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`

Adapted from `apps/site/src/components/playground/RollerPlayground.tsx` with one addition:
- `className?: string` — appended to the root `div` alongside `roller-playground`

No `unstyled` prop. Consumers who want custom styles pass a `className` and use descendant CSS selectors to target `.roller-playground-*` elements. All class names stay as-is; no `cx` helper needed.

**Step 1: Create `RollerPlayground.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import type { RollRecord } from '@randsum/roller'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; record: RollRecord }

function tooltipDir(el: HTMLElement): 'above' | 'below' {
  return el.getBoundingClientRect().top < window.innerHeight / 2 ? 'below' : 'above'
}

function openInStackBlitz(notation: string): void {
  const code = `import { roll } from '@randsum/roller'

const result = roll('${notation}')

console.log('Notation:', '${notation}')
console.log('Total:   ', result.total)
console.log('Rolls:   ', result.rolls)
`
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = 'https://stackblitz.com/run'
  form.target = '_blank'

  const packageJson = JSON.stringify(
    {
      name: 'randsum-playground',
      version: '1.0.0',
      private: true,
      scripts: { start: 'tsx index.ts' },
      dependencies: { '@randsum/roller': 'latest', tsx: 'latest' }
    },
    null,
    2
  )

  const fields: Record<string, string> = {
    'project[title]': `RANDSUM — ${notation}`,
    'project[description]': `Rolling ${notation} with @randsum/roller`,
    'project[template]': 'node',
    'project[files][index.ts]': code,
    'project[files][package.json]': packageJson
  }

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export function RollerPlayground({
  stackblitz = true,
  defaultNotation = '4d6L',
  className
}: {
  readonly stackblitz?: boolean
  readonly defaultNotation?: string
  readonly className?: string
} = {}): React.JSX.Element {
  const [notation, setNotation] = useState(defaultNotation)
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [chipDir, setChipDir] = useState<'above' | 'below'>('above')
  const chipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const isValid = notation.length > 0 && isDiceNotation(notation)
  const shellVariant = notation.length === 0 ? 'empty' : isValid ? 'valid' : 'invalid'

  const handleRoll = useCallback(() => {
    if (!isValid) return
    setState({ status: 'rolling' })
    setShowTooltip(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const result = roll(notation)
      if (result.error || !result.rolls[0]) return
      setState({ status: 'result', total: result.total, record: result.rolls[0] })
    }, 300)
  }, [notation, isValid])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
    setShowTooltip(false)
  }, [])

  const rootClass = ['roller-playground', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className={`roller-playground-shell roller-playground-shell--${shellVariant}`}>
        <div className="roller-playground-row">
          <button
            className="roller-playground-btn"
            onClick={handleRoll}
            disabled={!isValid || state.status === 'rolling'}
            aria-label={state.status === 'rolling' ? 'Rolling' : 'Roll'}
          >
            {state.status === 'rolling' ? (
              <span className="roller-playground-spinner" aria-hidden="true" />
            ) : (
              'Roll'
            )}
          </button>
          <div className="roller-playground-input-wrap">
            <input
              type="text"
              className="roller-playground-input"
              value={notation}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRoll()
              }}
              placeholder="4d6L"
              spellCheck={false}
              autoComplete="off"
              aria-label="Dice notation"
            />
          </div>

          {state.status === 'result' && (
            <div
              ref={chipRef}
              className={`roller-playground-chip${copied ? ' roller-playground-chip--copied' : ''}`}
              onMouseEnter={() => {
                if (chipRef.current) setChipDir(tooltipDir(chipRef.current))
                setShowTooltip(true)
              }}
              onMouseLeave={() => {
                setShowTooltip(false)
              }}
              onClick={() => {
                void navigator.clipboard.writeText(String(state.total))
                setCopied(true)
                if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
                copyTimerRef.current = setTimeout(() => {
                  setCopied(false)
                }, 1200)
              }}
              role="button"
              aria-label={`Copy result ${state.total}`}
            >
              <span className="roller-playground-chip-value">{copied ? '✓' : state.total}</span>
              {showTooltip && (
                <div
                  className={`roller-playground-tooltip roller-playground-tooltip--${chipDir}`}
                  role="tooltip"
                >
                  {copied ? (
                    <div className="roller-tooltip-inner">
                      <span className="roller-tooltip-valid">Result copied</span>
                    </div>
                  ) : (
                    <RollTooltip record={state.record} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="roller-playground-desc-row">
          <span
            className={`roller-playground-desc--${notation.length === 0 ? 'hint' : isValid ? 'valid' : 'invalid'}`}
          >
            {notationDesc(notation, isValid)}
          </span>
          {stackblitz && (
            <button
              className="roller-playground-stackblitz"
              onClick={() => {
                openInStackBlitz(notation)
              }}
              aria-label="Edit in StackBlitz"
            >
              <svg
                className="roller-playground-stackblitz-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M10 0L0 14h10L5 24 24 8h-10L19 0z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function notationDesc(notation: string, isValid: boolean): string {
  if (notation.length === 0) return 'Try: 4d6L, 1d20+5, 2d8!'
  if (!isValid) return 'Invalid notation'
  const result = validateNotation(notation)
  if (!result.valid) return notation
  const lines = result.description.flat()
  return lines.length > 0 ? lines.join(', ') : notation
}

type TooltipStep =
  | {
      kind: 'rolls'
      label: string
      unchanged: readonly number[]
      removed: readonly number[]
      added: readonly number[]
    }
  | { kind: 'divider' }
  | { kind: 'arithmetic'; label: string; display: string }
  | { kind: 'finalRolls'; rolls: readonly number[]; arithmeticDelta: number }
  | { kind: 'total'; value: number }

const ARITHMETIC_MODIFIERS: Partial<Record<string, { label: string; sign: string }>> = {
  plus: { label: 'Add', sign: '+' },
  minus: { label: 'Subtract', sign: '-' },
  multiply: { label: 'Multiply', sign: '×' },
  multiplyTotal: { label: 'Multiply total', sign: '×' }
}

const MAX_DICE_SHOWN = 10

function formatAsMath(rolls: readonly number[], delta = 0): string {
  const terms = rolls.map((n, i) => {
    if (i === 0) return String(n)
    return n < 0 ? `-${Math.abs(n)}` : `+${n}`
  })
  if (delta > 0) terms.push(`+${delta}`)
  if (delta < 0) terms.push(`-${Math.abs(delta)}`)
  return terms.join(' ')
}

function computeSteps(record: RollRecord): readonly TooltipStep[] {
  const steps: TooltipStep[] = []
  const current: number[] = [...record.modifierHistory.initialRolls]

  steps.push({ kind: 'rolls', label: 'Rolled', unchanged: [...current], removed: [], added: [] })

  const modifierSteps: TooltipStep[] = []

  for (const log of record.modifierHistory.logs) {
    const arith = ARITHMETIC_MODIFIERS[log.modifier]
    if (arith) {
      const value = log.options as number
      modifierSteps.push({
        kind: 'arithmetic',
        label: arith.label,
        display: `${arith.sign}${value}`
      })
      continue
    }
    if (log.removed.length === 0 && log.added.length === 0) continue
    for (const val of log.removed) {
      const idx = current.indexOf(val)
      if (idx !== -1) current.splice(idx, 1)
    }
    current.push(...log.added)

    const unchanged = [...current]
    for (const val of log.added) {
      const idx = unchanged.indexOf(val)
      if (idx !== -1) unchanged.splice(idx, 1)
    }

    const label = log.modifier.charAt(0).toUpperCase() + log.modifier.slice(1)
    modifierSteps.push({ kind: 'rolls', label, unchanged, removed: log.removed, added: log.added })
  }

  if (modifierSteps.length > 0) {
    steps.push(...modifierSteps)
    const arithmeticDelta = record.appliedTotal - record.modifierHistory.total
    steps.push({ kind: 'finalRolls', rolls: record.modifierHistory.modifiedRolls, arithmeticDelta })
    steps.push({ kind: 'total', value: record.appliedTotal })
  }
  return steps
}

function DiceGroup({
  unchanged,
  removed,
  added
}: {
  readonly unchanged: readonly number[]
  readonly removed: readonly number[]
  readonly added: readonly number[]
}): React.JSX.Element {
  const hasModified = removed.length > 0 || added.length > 0
  const shown = unchanged.slice(0, MAX_DICE_SHOWN)
  const truncated = unchanged.length > MAX_DICE_SHOWN

  return (
    <span className="roller-tooltip-dice-group">
      {removed.length > 0 && (
        <span className="roller-tooltip-dice roller-tooltip-dice--removed">
          {removed.join(' ')}
        </span>
      )}
      {added.length > 0 && (
        <span className="roller-tooltip-dice roller-tooltip-dice--added">{added.join(' ')}</span>
      )}
      {hasModified && shown.length > 0 && <span className="roller-tooltip-dice-sep">|</span>}
      {shown.length > 0 && (
        <span className="roller-tooltip-dice">
          {shown.join(' ')}
          {truncated ? ' …' : ''}
        </span>
      )}
    </span>
  )
}

function RollTooltip({ record }: { readonly record: RollRecord }): React.JSX.Element {
  const steps = computeSteps(record)

  return (
    <div className="roller-tooltip-inner">
      <div className="roller-tooltip-notation">{record.notation}</div>
      {record.description.length > 0 && (
        <div className="roller-tooltip-desc">{record.description.join(', ')}</div>
      )}
      <div className="roller-tooltip-divider" />
      {steps.map((step, i) => {
        if (step.kind === 'divider') {
          return <div key={`div-${i}`} className="roller-tooltip-divider" />
        }
        if (step.kind === 'arithmetic') {
          return (
            <div key={i} className="roller-tooltip-row">
              <span className="roller-tooltip-label">{step.label}</span>
              <span className="roller-tooltip-dice roller-tooltip-dice--arithmetic">
                {step.display}
              </span>
            </div>
          )
        }
        if (step.kind === 'rolls') {
          return (
            <div key={i} className="roller-tooltip-row">
              <span className="roller-tooltip-label">{step.label}</span>
              <DiceGroup unchanged={step.unchanged} removed={step.removed} added={step.added} />
            </div>
          )
        }
        if (step.kind === 'finalRolls') {
          return (
            <div key="finalRolls" className="roller-tooltip-row roller-tooltip-row--final">
              <span className="roller-tooltip-label">Final rolls</span>
              <span className="roller-tooltip-dice">
                {formatAsMath(step.rolls, step.arithmeticDelta)}
              </span>
            </div>
          )
        }
        return (
          <div key="total" className="roller-tooltip-total">
            <span>Total</span>
            <span>{step.value}</span>
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx
git commit -m "feat(component-library): add RollerPlayground component"
```

---

## Task 4: Wire up entry points

**Files:**
- Create: `packages/component-library/src/components/RollerPlayground/index.ts`
- Create: `packages/component-library/src/index.ts`

**Step 1: Create `src/components/RollerPlayground/index.ts`**

```ts
export { RollerPlayground } from './RollerPlayground'
```

**Step 2: Create `src/index.ts`**

```ts
export { RollerPlayground } from './components/RollerPlayground'
```

**Step 3: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/index.ts packages/component-library/src/index.ts
git commit -m "feat(component-library): add package entry points"
```

---

## Task 5: Build and verify

**Step 1: Install dependencies**

```bash
bun install
```

**Step 2: Build the package**

```bash
bun run --filter @randsum/component-library build
```

Expected: No errors. Check that `packages/component-library/dist/` contains:
- `index.js` (ESM)
- `index.cjs` (CJS)
- `index.d.ts` (types)
- `index.d.cts` (CJS types)

**Step 3: Check CSS output**

Bun's bundler may extract the imported CSS into `dist/index.css`. Check with:

```bash
ls packages/component-library/dist/
```

If no CSS file is in dist, add a manual copy to the build script in `packages/component-library/package.json`:

```json
"build": "bunup --entry src/index.ts --format esm,cjs --dts --external react --external react-dom --minify --sourcemap external --target browser --clean && cp src/components/RollerPlayground/RollerPlayground.css dist/roller-playground.css"
```

Then rebuild.

**Step 4: Typecheck**

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: No errors. If JSX errors appear, verify `tsconfig.json` has `"jsx": "react-jsx"` and `"jsxImportSource": "react"`.

**Step 5: Commit any build config fixes**

```bash
git add packages/component-library/
git commit -m "fix(component-library): adjust build config for CSS output"
```

---

## Task 6: Update `apps/site` to use the new package

**Files:**
- Modify: `apps/site/package.json` — add dependency
- Delete: `apps/site/src/components/playground/RollerPlayground.tsx`
- Delete: `apps/site/src/components/playground/RollerPlayground.css`
- Update imports in site files that use `RollerPlayground`
- Add site CSS overrides targeting `.roller-playground-*` via a scoped wrapper class

**Step 1: Add dependency to site `package.json`**

```json
"@randsum/component-library": "workspace:~"
```

**Step 2: Run `bun install`**

```bash
bun install
```

**Step 3: Find all usages of the local RollerPlayground**

```bash
grep -r "RollerPlayground" apps/site/src --include="*.tsx" --include="*.astro" --include="*.ts" -l
```

For each file, update the import to:

```ts
import { RollerPlayground } from '@randsum/component-library'
```

Also add `className="site-roller"` to each `<RollerPlayground />` usage (this is the hook for site-specific CSS overrides).

**Step 4: Delete the local files**

```bash
rm apps/site/src/components/playground/RollerPlayground.tsx
rm apps/site/src/components/playground/RollerPlayground.css
```

**Step 5: Add site CSS overrides**

Find the site's global CSS entry or Starlight `customCss` config. Add a new CSS block that overrides the component's defaults to match Starlight's theme, scoped via `.site-roller` so it doesn't bleed:

```css
/* Scope: applied when the site passes className="site-roller" */
.site-roller .roller-playground-btn {
  background: var(--sl-color-accent);
  color: var(--sl-color-black);
  font-family: var(--sl-font);
}

.site-roller .roller-playground-shell {
  background: rgba(0, 0, 0, 0.25);
  border-color: var(--sl-color-gray-4);
}

.site-roller .roller-playground-shell--valid {
  border-color: var(--sl-color-accent);
}

.site-roller .roller-playground-input {
  color: var(--sl-color-white);
  font-family: var(--sl-font-mono);
}

.site-roller .roller-playground-chip {
  background: var(--sl-color-accent);
  font-family: var(--sl-font-mono);
}

.site-roller .roller-playground-chip-value {
  color: var(--sl-color-black);
}

.site-roller .roller-playground-desc-row {
  border-top-color: var(--sl-color-gray-4);
  font-family: var(--sl-font-mono);
}

.site-roller .roller-playground-desc--hint {
  color: var(--sl-color-gray-4);
}

.site-roller .roller-playground-desc--valid {
  color: var(--sl-color-gray-3);
}

.site-roller .roller-playground-stackblitz {
  border-color: var(--sl-color-gray-5);
  color: var(--sl-color-gray-3);
  font-family: var(--sl-font);
}

.site-roller .roller-tooltip-inner {
  background: var(--sl-color-bg-nav, var(--sl-color-gray-6));
  border-color: var(--sl-color-gray-4);
  font-family: var(--sl-font);
}

.site-roller .roller-tooltip-notation {
  color: var(--sl-color-accent-high);
  font-family: var(--sl-font-mono);
}

.site-roller .roller-tooltip-valid {
  color: var(--sl-color-accent-high);
}

.site-roller .roller-tooltip-label {
  color: var(--sl-color-gray-3);
}

.site-roller .roller-tooltip-desc {
  color: var(--sl-color-gray-2);
}

.site-roller .roller-tooltip-divider {
  background: var(--sl-color-gray-5);
}

.site-roller .roller-tooltip-dice--added {
  color: var(--sl-color-accent-high);
}

.site-roller .roller-tooltip-dice--arithmetic {
  color: var(--sl-color-accent-high);
}

.site-roller .roller-tooltip-total {
  border-top-color: var(--sl-color-gray-5);
}

/* Light mode */
:root[data-theme='light'] .site-roller .roller-playground-shell {
  background: rgba(255, 255, 255, 0.8);
}

:root[data-theme='light'] .site-roller .roller-playground-input {
  color: var(--sl-color-black);
}
```

Find the Starlight config in `apps/site/astro.config.mjs`. Look for the `customCss` array and add the new stylesheet, or add a new stylesheet file if one doesn't exist.

Check the Astro config to understand the current `customCss` setup before editing.

**Step 6: Commit**

```bash
git add apps/site/
git commit -m "feat(site): migrate RollerPlayground to @randsum/component-library"
```

---

## Task 7: Final verification

**Step 1: Build everything**

```bash
bun run build
```

Expected: No errors across all packages.

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Run site dev server**

```bash
bun run site:dev
```

Navigate to the page with the RollerPlayground. Verify visually:
- Looks identical to before (Starlight theme applied via `.site-roller` overrides)
- Roll button works
- Tooltip appears on hover with dice breakdown
- StackBlitz button opens
- Copy-to-clipboard chip works

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final verification fixes for component-library integration"
```
