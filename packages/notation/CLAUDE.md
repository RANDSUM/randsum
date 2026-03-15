# @randsum/notation - Dice Notation Parser and Types

## Overview

Zero-dependency package providing dice notation parsing, validation, and the shared type system for the @randsum ecosystem. Extracted from `@randsum/roller` so that notation logic can be consumed independently. `@randsum/roller` depends on this package and re-exports everything for backward compatibility.

## Public API

### Parsing

- `isDiceNotation(value: string): value is DiceNotation` - Type guard for valid notation
- `notation(value: string): DiceNotation` - Assert valid notation or throw `NotationParseError`
- `notationToOptions(notation: DiceNotation): ParsedNotationOptions` - Parse notation to options
- `listOfNotations(input: string): DiceNotation[]` - Split combined expression into individual notations
- `validateNotation(notation: string): ValidationResult` - Validate with detailed result/errors
- `suggestNotationFix(notation: string): string | undefined` - Suggest corrections for invalid input

### Transformers

- `optionsToNotation(options: RollOptions): DiceNotation` - Options to notation string
- `optionsToDescription(options: RollOptions): string` - Options to human-readable text
- `optionsToSidesFaces(options: RollOptions): number[]` - Options to array of face values
- `modifiersToNotation(modifiers: ModifierOptions): string` - Modifiers to notation suffix
- `modifiersToDescription(modifiers: ModifierOptions): string` - Modifiers to readable text

### Comparison Utilities

- `parseComparisonNotation(notation: string): ComparisonOptions` - Parse `{<3,>18}` syntax
- `hasConditions(options: ComparisonOptions): boolean` - Check for active conditions
- `formatComparisonNotation(options: ComparisonOptions): string` - Format as notation
- `formatComparisonDescription(options: ComparisonOptions): string` - Format as text

### Modifier Schemas

20 `NotationSchema` definitions (cap, drop, keep, replace, reroll, explode, compound, penetrate, explodeSequence, wildDie, unique, multiply, plus, minus, sort, integerDivide, modulo, countSuccesses, countFailures, multiplyTotal). Each schema defines the regex pattern and parse/format logic for one modifier type. The roller uses these to build its modifier registry.

The `explodeSequence` schema handles three notation forms:

- `!s{4,6,8}` — explicit die size sequence
- `!i` — inflation (explode UP through TTRPG standard set: 4, 6, 8, 10, 12, 20, 100)
- `!r` — reduction (explode DOWN through TTRPG standard set)

### Tokenization

- `tokenize(notation: string): readonly Token[]` — Parse notation into typed tokens for UI display. Returns tokens with `text`, `type`, `start`, `end`, `description` for each segment.
- `Token` — Interface: `{ text, type: TokenType, start, end, description }`
- `TokenType` — Union of all token types: `'core' | 'dropLowest' | 'dropHighest' | 'keepHighest' | 'keepLowest' | 'explode' | 'compound' | 'penetrate' | 'explodeSequence' | 'wildDie' | 'reroll' | 'cap' | 'replace' | 'unique' | 'countSuccesses' | 'countFailures' | 'dropCondition' | 'plus' | 'minus' | 'multiply' | 'multiplyTotal' | 'integerDivide' | 'modulo' | 'sort' | 'label' | 'unknown'`

### Types

All shared types: `DiceNotation`, `RollOptions`, `ParsedNotationOptions`, `ModifierOptions`, `ModifierConfig`, `ComparisonOptions`, `DropOptions`, `KeepOptions`, `RerollOptions`, `ReplaceOptions`, `UniqueOptions`, `SuccessCountOptions`, `FailureCountOptions`, `ValidationResult`, `ValidValidationResult`, `InvalidValidationResult`, `ValidationErrorInfo`, `NotationSchema`, `GeometricDieNotation`, `DrawDieNotation`

## Internal Structure

- `schema.ts` - `NotationSchema` type and `defineNotationSchema` helper
- `definitions/` - All 14 modifier schema definitions
- `parse/` - `notationToOptions` and `listOfNotations` parsing logic
- `comparison/` - Comparison notation parsing and formatting (`{<3,>18}` syntax)
- `transformers/` - Options-to-notation and options-to-description converters
- `isDiceNotation.ts` - Type guard and `NotationParseError`
- `validateNotation.ts` - Full validation with error reporting
- `suggestions.ts` - Notation fix suggestions for invalid input
- `coreNotationPattern.ts` - Base `NdS` regex pattern
- `formatHumanList.ts` - Utility for joining arrays into human-readable lists
- `types.ts` - All shared type definitions

## What Belongs Here vs Roller

**Notation package**: Anything related to parsing, validating, or converting dice notation strings. All modifier _schemas_ (pattern matching and formatting). All shared types.

- `tokenize()` — notation UI tokenizer (parses notation into colored token segments for display)

**Roller package**: The `roll()` function, modifier _application_ logic (actually modifying dice pools), random number generation, `analyze()`, error types like `RandsumError` and `ValidationError`.

## Dependencies

Zero runtime dependencies. No dev dependencies.
