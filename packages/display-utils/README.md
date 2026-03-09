<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/display-utils</h1>
  <h3>Tooltip steps, modifier docs, and StackBlitz scaffolding for RANDSUM UIs</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/display-utils)](https://www.npmjs.com/package/@randsum/display-utils)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/display-utils)](https://bundlephobia.com/package/@randsum/display-utils)
[![Types](https://img.shields.io/npm/types/@randsum/display-utils)](https://www.npmjs.com/package/@randsum/display-utils)
[![License](https://img.shields.io/npm/l/@randsum/display-utils)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)

</div>

Internal UI utilities for the RANDSUM ecosystem. Consumed by `@randsum/component-library` and the RANDSUM CLI to render roll breakdowns, modifier reference docs, and interactive StackBlitz playgrounds.

## Installation

```bash
npm install @randsum/display-utils
# or
bun add @randsum/display-utils
```

## API

### `computeSteps(record: RollRecord): readonly TooltipStep[]`

Takes a `RollRecord` from `@randsum/roller` and returns an ordered array of `TooltipStep` values describing each stage of a roll — initial dice, modifier applications, and the final result. Used to render step-by-step roll breakdowns in tooltips and detail panels.

```typescript
import { computeSteps } from '@randsum/display-utils'
import { roll } from '@randsum/roller'

const result = roll('4d6L')
const steps = computeSteps(result.rolls[0])
// steps: [{ kind: 'rolls', label: 'Rolled', ... }, { kind: 'rolls', label: 'Drop Lowest 1', ... }, ...]
```

`TooltipStep` is a discriminated union with `kind` values: `'rolls'`, `'divider'`, `'arithmetic'`, and `'finalRolls'`.

Also exports `formatAsMath(rolls, delta?)` — formats a roll array as a math expression string (e.g. `"3 + 5 + 2"`).

### `MODIFIER_DOCS`

A static record mapping modifier notation keys to `ModifierDoc` objects. Each entry documents a RANDSUM dice modifier with its title, description, notation forms, comparison operators, and usage examples.

```typescript
import { MODIFIER_DOCS } from '@randsum/display-utils'

const doc = MODIFIER_DOCS['R{..}']
// doc.title      => 'Reroll'
// doc.forms      => [{ notation: 'R{...}', note: '...' }, ...]
// doc.examples   => [{ notation: '4d6R{1}', description: 'Reroll any 1s' }, ...]
```

Covers all modifiers: core roll (`xDN`), drop/keep (`L`, `H`, `K`, `KL`, `D{..}`), explosions (`!`, `!!`, `!p`), reroll (`R{..}`), unique (`U`), replace (`V{..}`), count successes (`S{..}`), cap (`C{..}`), and arithmetic (`+`, `-`, `*`, `**`).

### `buildStackBlitzProject(notation: string): StackBlitzProject`

Generates a `StackBlitzProject` object ready to pass to the StackBlitz SDK. The project contains a runnable `index.ts` that rolls the given notation with `@randsum/roller` and logs the result.

```typescript
import { buildStackBlitzProject } from '@randsum/display-utils'

const project = buildStackBlitzProject('4d6L')
// project.title   => 'RANDSUM — 4d6L'
// project.files   => { 'index.ts': '...', 'package.json': '...' }
// project.template => 'node'
```

## Related Packages

- [@randsum/roller](../roller) - Core dice rolling engine
- [@randsum/component-library](../../apps/component-library) - React UI components

<div align="center">
Made with by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
