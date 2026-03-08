# @randsum/notation

Zero-dependency dice notation parser and type foundation for the [RANDSUM](https://randsum.dev) ecosystem.

## Install

```bash
bun add @randsum/notation
# or
npm install @randsum/notation
```

## Exports

### Validation

- `isDiceNotation(value)` — type guard that narrows to `DiceNotation`
- `validateNotation(notation)` — full validation with parsed options or error details
- `suggestNotationFix(notation)` — suggest corrections for invalid notation

### Parsing

- `notationToOptions(notation)` — parse a notation string into structured `RollOptions`
- `listOfNotations(input)` — split a multi-part notation string

### Transformation

- `optionsToNotation(options)` — convert `RollOptions` to a notation string
- `optionsToDescription(options)` — convert `RollOptions` to a human-readable description
- `modifiersToNotation(modifiers)` — convert `ModifierOptions` to notation
- `modifiersToDescription(modifiers)` — convert `ModifierOptions` to description

### Types

- `DiceNotation` — branded string type for valid notation
- `RollOptions` — structured roll configuration
- `ModifierOptions` — modifier configuration (cap, drop, keep, reroll, etc.)
- `ValidationResult` — validation output with parsed options or errors
- `ComparisonOptions`, `DropOptions`, `KeepOptions`, `RerollOptions`, `ReplaceOptions`, `UniqueOptions`, `SuccessCountOptions`

### Modifier Schemas

All 14 modifier notation schemas are exported: `capSchema`, `dropSchema`, `keepSchema`, `replaceSchema`, `rerollSchema`, `explodeSchema`, `compoundSchema`, `penetrateSchema`, `uniqueSchema`, `countSuccessesSchema`, `multiplySchema`, `plusSchema`, `minusSchema`, `multiplyTotalSchema`.

## Relationship to @randsum/roller

`@randsum/roller` depends on this package and re-exports its entire API. If you need `roll()`, use roller directly — you get everything from notation for free.

Use `@randsum/notation` directly when you only need parsing, validation, or types without the roll engine.

## Documentation

[randsum.dev](https://randsum.dev)
