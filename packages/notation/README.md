<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/notation</h1>
  <h3>Dice Notation Parser and Types</h3>
  <p>The type and parsing foundation of the @randsum ecosystem.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/notation)](https://www.npmjs.com/package/@randsum/notation)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/notation)](https://bundlephobia.com/package/@randsum/notation)
[![Types](https://img.shields.io/npm/types/@randsum/notation)](https://www.npmjs.com/package/@randsum/notation)
[![License](https://img.shields.io/npm/l/@randsum/notation)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)

</div>

Zero-dependency dice notation parser, validator, and type system for JavaScript and TypeScript.

> **Note:** Most users should install `@randsum/roller`, which re-exports everything from this package along with the `roll()` function. Install `@randsum/notation` directly only if you need parsing and validation without the rolling engine.

## Installation

```bash
npm install @randsum/notation
# or
bun add @randsum/notation
```

## Usage

### Parsing Notation

```typescript
import { isDiceNotation, notationToOptions } from "@randsum/notation"

isDiceNotation("4d6L") // true
isDiceNotation("banana") // false

const options = notationToOptions("4d6L")
// { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }
```

### Validation

```typescript
import { validateNotation } from "@randsum/notation"

const result = validateNotation("4d6L")

if (result.valid) {
  result.notation // DiceNotation[] — parsed notation strings
  result.options // ParsedNotationOptions[] — parsed roll options
} else {
  result.error // { message, argument } — validation error details
}
```

### Converting Between Formats

```typescript
import { optionsToNotation, optionsToDescription } from "@randsum/notation"

const notation = optionsToNotation({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { lowest: 1 } }
})
// '4d6L'

const description = optionsToDescription({
  sides: 20,
  quantity: 1,
  modifiers: { plus: 5 }
})
// '1d20 + 5'
```

### Listing Notation Strings

```typescript
import { listOfNotations } from "@randsum/notation"

const notations = listOfNotations("4d6L + 2d8")
// ['4d6L', '2d8']
```

## API

### Parsing

- `isDiceNotation(value)` - Type guard for valid dice notation strings
- `notationToOptions(notation)` - Parse a notation string into a `RollOptions` object
- `listOfNotations(input)` - Extract individual notation strings from a combined expression
- `validateNotation(notation)` - Validate notation and return parsed result or errors
- `suggestNotationFix(notation)` - Suggest corrections for invalid notation

### Transformers

- `optionsToNotation(options)` - Convert a `RollOptions` object to a notation string
- `optionsToDescription(options)` - Convert a `RollOptions` object to a human-readable description
- `modifiersToNotation(modifiers)` - Convert modifier options to their notation suffix
- `modifiersToDescription(modifiers)` - Convert modifier options to a readable description

### Comparison Utilities

- `parseComparisonNotation(notation)` - Parse comparison syntax like `{<3,>18}`
- `hasConditions(options)` - Check if comparison options have any conditions
- `formatComparisonNotation(options)` - Format comparison options as notation
- `formatComparisonDescription(options)` - Format comparison options as text

### Types

```typescript
import type {
  DiceNotation,
  RollOptions,
  ModifierOptions,
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  SuccessCountOptions,
  ValidationResult,
  NotationSchema
} from "@randsum/notation"
```

### Modifier Schemas

All 14 modifier notation schemas are exported for use by the roller's modifier registry:

`capSchema`, `dropSchema`, `keepSchema`, `replaceSchema`, `rerollSchema`, `explodeSchema`, `compoundSchema`, `penetrateSchema`, `uniqueSchema`, `countSuccessesSchema`, `multiplySchema`, `plusSchema`, `minusSchema`, `multiplyTotalSchema`

## Related Packages

- [@randsum/roller](../roller) - Core dice rolling engine (depends on this package)
- [randsum.dev](https://randsum.dev) - Documentation site

<div align="center">
Made with <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
