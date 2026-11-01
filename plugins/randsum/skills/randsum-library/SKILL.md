---
name: randsum-library
description: Writes code that rolls dice with the RANDSUM npm packages, @randsum/roller (notation engine), @randsum/games (game mechanics) and @randsum/ui (dice roller Web Components with React and Vue wrappers), or with the api.randsum.dev REST API from other languages. Use when adding dice rolling to an app, bot, game, VTT or script, when code imports @randsum/*, when an app needs a dice roller UI, or when the user asks how to call roll(), validate user-typed notation, seed rolls for tests, or roll a game system's mechanics in code. To roll dice for the user in chat, use dice-rolling.
license: MIT
metadata:
  author: RANDSUM
  repository: https://github.com/RANDSUM/randsum
---

# Rolling dice in code with RANDSUM

## Choose the package

| The program needs | Use |
|---|---|
| Any dice roll from notation or options, in TypeScript/JavaScript | `@randsum/roller` |
| A supported game's outcome (D&D 5e, Blades, Daggerheart, Fate, PbtA, Root RPG, Salvage Union) | `@randsum/games/<game>` |
| Dice from Python, Go, Ruby, a shell script, or anything not JS | REST API, `https://api.randsum.dev/v1` |
| To check notation as the user types, without the roll engine | `@randsum/roller/tokenize` or `@randsum/roller/validate` |
| A ready-made dice roller UI in a web page or app (HTML, htmx, Astro, React, Vue, Svelte) | `@randsum/ui` |

```bash
npm install @randsum/roller        # or: bun add @randsum/roller
npm install @randsum/games         # brings @randsum/roller with it
```

Both are ESM-only with TypeScript types built in. Roller has zero dependencies and games depends only on roller; both run in Node, Bun, browsers and edge workers. There is no CommonJS build: CJS projects need a bundler. Never generate random numbers by hand next to these packages; let `roll()` do it.

## `roll()`

```typescript
import { roll } from '@randsum/roller'

roll(20)                     // 1d20
roll('4d6L')                 // notation string
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })  // same as 4d6L
roll('1d20+5', '2d6')        // several arguments, one combined total
roll('4d6L', { randomFn })   // a RollConfig, always the LAST argument
```

```typescript
const result = roll('2d6+3')
result.total          // number: the final total
result.values         // each die's value after modifiers
result.rolls          // RollRecord[]: one per argument / dice group
result.rolls[0].initialRolls  // dice before modifiers (before drops, rerolls, explosions)
result.rolls[0].rolls         // dice after modifiers
result.rolls[0].description   // human-readable, e.g. for a tooltip
result.rolls[0].label         // 'fire' from '2d6[fire]'
```

`4d6Lx6` repeats a roll: `result.rolls` has six records, one per ability score, and `total` sums them, so read each record's `total`.

Notation is a superset of common VTT syntax: `L`/`H` drop, `K`/`kl` keep, `R{<3}` reroll, `!` explode, `S{7}` count successes, `C{>18}` cap, `4dF` Fate dice, `d%`. The full grammar is at https://notation.randsum.dev/; the plugin's `dice-rolling` skill has a quick reference.

## User-typed notation

`roll()` throws on bad input. Validate first when the string comes from a person:

```typescript
import { roll, validateNotation, suggestNotationFix, RandsumError } from '@randsum/roller'

const check = validateNotation(input)
if (!check.valid) {
  // check.error.message, check.error.position (character offset of the problem)
  const fix = suggestNotationFix(input)   // string | undefined
  return showError(check.error.message, fix)
}

try {
  return roll(input)
} catch (error) {
  if (error instanceof RandsumError) return showError(error.message)
  throw error
}
```

`isDiceNotation(s)` is a type guard; `notation(s)` asserts or throws. Every RANDSUM error extends `RandsumError` and has a `code`; the subclasses are `NotationParseError`, `ModifierError`, `ValidationError` and `RollError` (and `SchemaError` from `@randsum/games`).

## Game mechanics

Each game is a subpath export with its own `roll()` that returns `{ total, result, rolls }`, plus `details` for some games. `result` is the game's outcome as a typed string union (or number, for 5e), so `switch` on it.

```typescript
import { roll as blades } from '@randsum/games/blades'
import { roll as fifth } from '@randsum/games/fifth'

const action = blades(3)
switch (action.result) {
  case 'critical': case 'success': break
  case 'partial': break
  case 'failure': break
}

const attack = fifth({ modifier: 5, rollingWith: 'Advantage', crit: true })
attack.total
attack.details.criticals?.isNatural20
```

Every game's input type, ranges, result values and details: [references/GAMES.md](references/GAMES.md).

## A dice roller UI: `@randsum/ui`

`@randsum/ui` is the roller as Web Components (custom elements, built with Lit, styles in Shadow DOM). Don't hand-build a roller form when this fits.

```html
<script type="module">
  import '@randsum/ui/roller'
</script>
<randsum-roller size="compact" notation="2d20H+5"></randsum-roller>
```

- One element, `<randsum-roller>`, with `size="mini"` (one row), `"compact"` (the default, a panel) or `"max"` (adds recent rolls and history; `storage-key` keeps them in localStorage).
- Events: `randsum-change` (detail `{ notation }`) on each edit, `randsum-roll` (detail: the result, with `total` and `records`) after each roll. Method: `roll()`.
- `presets` and `keys` take JSON attributes or properties; `modifierKeys(name)` (`@randsum/ui/keys`) and `modifierPresets(name)` (`@randsum/ui/presets`) give each modifier's own set.
- Parts are elements too (`notation-field`, `roll-button`, `status-line`, `key-pad`, `preset-list`, `readout`, `roll-steps`); inside a `<randsum-scope notation="…">` they share one roller with no script.
- Theme with `--rsui-*` custom properties (`--rsui-accent`, `--rsui-font`, …) on the element or any ancestor.
- Every element and wrapper is its own subpath; there is no root import.

| Stack | Use |
|---|---|
| Plain HTML, htmx, Astro | The tags directly; no wrapper |
| React 18/19 | `import { Roller } from '@randsum/ui/react/roller'`: `<Roller size="mini" defaultNotation="4d6L" onRoll={r => …} />`; `useRoller` (`@randsum/ui/react/use-roller`) and each part (`@randsum/ui/react/key-pad`, `@randsum/ui/react/readout`, …) |
| Vue 3 | `import { Roller } from '@randsum/ui/vue/roller'`: `<Roller v-model="notation" @roll="…" />` |
| Svelte 5 | The tags directly (`onrandsum-roll={…}`); `import type {} from '@randsum/ui/svelte'` for types |
| Server rendering | `renderToString(markup)` from `@randsum/ui/ssr` (needs `@lit-labs/ssr`) returns the elements as Declarative Shadow DOM, so they show before scripts load |
| React Native / Expo | `import { Roller } from '@randsum/ui/native/roller'`: native views, same props as the React `Roller`; `useRoller` (`@randsum/ui/native/use-roller`), each part (`@randsum/ui/native/key-pad`, …), and `RollerThemeProvider` (`@randsum/ui/native/theme`). Max history: `initialHistory` in, `onHistoryChange` out, to persist with AsyncStorage |

## Deterministic rolls for tests and replays

```typescript
import { roll } from '@randsum/roller'
import { createSeededRandom } from '@randsum/roller/random'

const randomFn = createSeededRandom(42)
roll('4d6L', { randomFn })   // same sequence for the same seed
```

`createQueueRandom` from the same subpath plays back fixed values, for testing an exact outcome. Game `roll()` functions take no RNG, so test game code on the shape and range of the result, not on specific numbers.

## Keep bundles small

Import from the narrowest subpath in browser code:

| Subpath | Provides |
|---|---|
| `@randsum/roller/roll` | `roll` only |
| `@randsum/roller/validate` | `validateNotation`, `isDiceNotation`, `notation` |
| `@randsum/roller/tokenize` | Tokenizer for syntax highlighting, no roll engine |
| `@randsum/roller/errors` | Error classes and `ERROR_CODES` |
| `@randsum/roller/random` | `createSeededRandom`, `createQueueRandom` |
| `@randsum/roller/trace` | `traceRoll`: a `RollRecord` as display steps |
| `@randsum/roller/docs` | Static docs for every die and modifier |

Each game subpath (`@randsum/games/fifth` and so on) pulls in only that game.

## From other languages: the REST API

`https://api.randsum.dev/v1` is public, keyless, CORS-enabled and returns JSON. It uses the same engine.

```bash
curl 'https://api.randsum.dev/v1/roll?notation=4d6L'
curl -X POST https://api.randsum.dev/v1/roll -H 'content-type: application/json' -d '{"notation":"2d20L+5","seed":7}'
curl 'https://api.randsum.dev/v1/games/pbta/roll?stat=2&rollingWith=Advantage'
curl 'https://api.randsum.dev/v1/random?min=1&max=100&count=5'
```

```python
import requests
r = requests.get("https://api.randsum.dev/v1/roll", params={"notation": "4d6L"}).json()
print(r["total"], r["pools"])
```

A 400 has `error` and often `suggestion`. Requests are rate-limited per IP, so a program that rolls in bulk (simulations, batch jobs) should use the npm package instead. `GET /v1` describes every endpoint; docs at https://randsum.dev/api/introduction/.
