# Test Coverage Gaps — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the eight identified coverage gaps across `@randsum/roller` and the component-library to eliminate all uncovered branches.

**Architecture:** Each task adds tests to an existing `__tests__` file. No new source files are touched. All tests use `bun:test`. Tasks are ordered smallest→largest for easy validation.

**Tech Stack:** Bun test runner (`bun:test`), TypeScript strict mode, existing test utilities in `packages/roller/test-utils/`.

---

## Coverage Gaps at a Glance

```
tokenize.ts                  23.81% fn  85.22% ln  → unknown tokens, bare drop/keep suffixes
builder.ts                   56.25% fn  81.58% ln  → 6 unchained modifier methods
parseComparisonNotation.ts  100.00% fn  91.67% ln  → >= and <= operators
cap.ts                       77.78% fn  98.08% ln  → validate / toDescription with exact values
countSuccesses.ts            100.00% fn  92.86% ln  → botchThreshold >= threshold error
drop.ts                      100.00% fn  98.40% ln  → greaterThanOrEqual description
reroll.ts                    100.00% fn  98.11% ln  → greaterThanOrEqual description
normalize.ts                 100.00% fn  86.67% ln  → compound notation error
```

---

### Task 1: parseComparisonNotation — `>=` and `<=` operators

**Files:**
- Modify: `packages/roller/__tests__/lib/notationToOptions.test.ts` (or create a new file nearby)

There is no dedicated `parseComparisonNotation.test.ts`. The function lives at `packages/roller/src/lib/comparison/parseComparisonNotation.ts`. Uncovered lines 49 and 51 are the `>=` and `<=` branches.

**Step 1: Write the failing tests**

Add to a new describe block inside `packages/roller/__tests__/lib/notationToOptions.test.ts`, or create:

`packages/roller/__tests__/lib/parseComparisonNotation.test.ts`

```typescript
import { describe, expect, test } from 'bun:test'
import { parseComparisonNotation } from '../../src/lib/comparison/parseComparisonNotation'

describe('parseComparisonNotation — >= and <=', () => {
  test('parses >= alone', () => {
    const result = parseComparisonNotation('>=5')
    expect(result.greaterThanOrEqual).toBe(5)
  })

  test('parses <= alone', () => {
    const result = parseComparisonNotation('<=3')
    expect(result.lessThanOrEqual).toBe(3)
  })

  test('parses >= combined with other operators', () => {
    const result = parseComparisonNotation('>=5,<2')
    expect(result.greaterThanOrEqual).toBe(5)
    expect(result.lessThan).toBe(2)
  })

  test('parses <= combined with other operators', () => {
    const result = parseComparisonNotation('<=3,>1')
    expect(result.lessThanOrEqual).toBe(3)
    expect(result.greaterThan).toBe(1)
  })

  test('parses braced >= and <=', () => {
    const result = parseComparisonNotation('{>=4,<=2}')
    expect(result.greaterThanOrEqual).toBe(4)
    expect(result.lessThanOrEqual).toBe(2)
  })
})
```

**Step 2: Run to confirm failure**

```bash
bun test packages/roller/__tests__/lib/parseComparisonNotation.test.ts
```

Expected: file not found or 0 tests (if adding to existing file, run that file and confirm new tests appear).

**Step 3: Create / add the tests**

Write the file as shown above.

**Step 4: Run to confirm pass**

```bash
bun test packages/roller/__tests__/lib/parseComparisonNotation.test.ts
```

Expected: 5 pass, 0 fail.

**Step 5: Commit**

```bash
git add packages/roller/__tests__/lib/parseComparisonNotation.test.ts
git commit -m "test(roller): cover >= and <= in parseComparisonNotation"
```

---

### Task 2: normalize — compound notation throws

**Files:**
- Modify: `packages/roller/__tests__/lib/normalize.test.ts`

Uncovered: line 9 — `throw new NotationParseError(notation, 'normalize() only supports single-segment notation')`.

**Step 1: Write the failing tests**

Add inside `packages/roller/__tests__/lib/normalize.test.ts`:

```typescript
import { NotationParseError } from '../../src/errors'

// inside describe('normalize', () => { ... })

  test('throws NotationParseError for compound notation', () => {
    expect(() => normalize('1d6+1d20')).toThrow(NotationParseError)
  })

  test('error message includes "single-segment notation"', () => {
    expect(() => normalize('1d6+1d20')).toThrow('single-segment notation')
  })
```

**Step 2: Run to confirm failure**

```bash
bun test packages/roller/__tests__/lib/normalize.test.ts
```

Expected: new tests fail (`normalize` does not throw — confirm it throws on compound).

Actually `normalize` calls `notationToOptions` which returns an array for compound. If the array length is >1 it throws. So the tests should fail now because they're not written yet.

**Step 3: Add the tests to normalize.test.ts**

Append the two new test cases inside the existing `describe('normalize', () => {...})` block.

**Step 4: Run to confirm pass**

```bash
bun test packages/roller/__tests__/lib/normalize.test.ts
```

Expected: all pass.

**Step 5: Commit**

```bash
git add packages/roller/__tests__/lib/normalize.test.ts
git commit -m "test(roller): cover compound notation error in normalize"
```

---

### Task 3: countSuccesses — botchThreshold validation error

**Files:**
- Modify: whichever test file covers `countSuccesses` modifier in detail.

Find the test: `grep -r "countSuccesses" packages/roller/__tests__ --include="*.ts" -l`

Likely lives in `packages/roller/__tests__/roll/roll.test.ts` or `modifiers.interaction.test.ts`. Uncovered lines 61–64: the `validate` method throws when `botchThreshold >= threshold`.

**Step 1: Locate existing countSuccesses test**

```bash
grep -r "countSuccesses\|botchThreshold" packages/roller/__tests__ --include="*.ts" -l
```

**Step 2: Write the failing tests**

Add to the located file (or create `packages/roller/__tests__/lib/modifiers/countSuccesses.test.ts`):

```typescript
import { describe, expect, test } from 'bun:test'
import { countSuccessesModifier } from '../../../src/lib/modifiers/definitions/countSuccesses'

describe('countSuccesses — validate', () => {
  test('throws when botchThreshold equals threshold', () => {
    expect(() =>
      countSuccessesModifier.validate({ threshold: 5, botchThreshold: 5 }, { sides: 10, quantity: 5 })
    ).toThrow()
  })

  test('throws when botchThreshold is greater than threshold', () => {
    expect(() =>
      countSuccessesModifier.validate({ threshold: 5, botchThreshold: 6 }, { sides: 10, quantity: 5 })
    ).toThrow('botchThreshold')
  })

  test('does not throw when botchThreshold is less than threshold', () => {
    expect(() =>
      countSuccessesModifier.validate({ threshold: 7, botchThreshold: 1 }, { sides: 10, quantity: 5 })
    ).not.toThrow()
  })
})
```

Note: `countSuccessesModifier.validate` is an internal function. If it is not directly exported, test through `roll()` instead:

```typescript
import { roll } from '../../../src/roll'

test('roll throws (or errors) when botchThreshold >= threshold', () => {
  const result = roll({ sides: 10, quantity: 5, modifiers: { countSuccesses: { threshold: 5, botchThreshold: 5 } } })
  expect(result.error).toBeDefined()
})
```

**Step 3: Run to confirm failure**

```bash
bun test packages/roller/__tests__/lib/modifiers/countSuccesses.test.ts
```

**Step 4: Add the tests**

**Step 5: Run to confirm pass**

**Step 6: Commit**

```bash
git add packages/roller/__tests__/lib/modifiers/countSuccesses.test.ts
git commit -m "test(roller): cover botchThreshold validation error in countSuccesses"
```

---

### Task 4: drop + reroll — `greaterThanOrEqual` descriptions

**Files:**
- Modify / create: `packages/roller/__tests__/lib/modifiers/drop.test.ts` and `packages/roller/__tests__/lib/modifiers/reroll.test.ts`

**Uncovered:**
- `drop.ts` line 112: `descriptions.push(\`Drop greater than or equal to [${greaterThanOrEqual}]\`)`
- `reroll.ts` line 81: `greaterLessList.push(\`greater than or equal to [${greaterThanOrEqual}]\`)`

These are inside `toDescription` methods, not `apply`. They only need to be called through `toDescription` directly or through `optionsToDescription`.

**Step 1: Check if toDescription is directly exported**

```bash
grep -n "toDescription\|dropModifier\|rerollModifier" packages/roller/src/lib/modifiers/definitions/drop.ts packages/roller/src/lib/modifiers/definitions/reroll.ts
```

If exported, test directly. If not, use `optionsToDescription` from transformers:

```typescript
import { optionsToDescription } from '../../src/lib/transformers/optionsToDescription'
```

**Step 2: Write tests for drop `greaterThanOrEqual` description**

```typescript
import { describe, expect, test } from 'bun:test'
import { optionsToDescription } from '../../src/lib/transformers/optionsToDescription'

describe('drop modifier — greaterThanOrEqual description', () => {
  test('toDescription includes greaterThanOrEqual condition', () => {
    const descriptions = optionsToDescription({
      sides: 6,
      quantity: 4,
      modifiers: { drop: { greaterThanOrEqual: 5 } }
    })
    expect(descriptions.join(' ')).toMatch(/greater than or equal to \[5\]/i)
  })
})

describe('reroll modifier — greaterThanOrEqual description', () => {
  test('toDescription includes greaterThanOrEqual condition', () => {
    const descriptions = optionsToDescription({
      sides: 6,
      quantity: 4,
      modifiers: { reroll: { greaterThanOrEqual: 4 } }
    })
    expect(descriptions.join(' ')).toMatch(/greater than or equal to \[4\]/i)
  })
})
```

**Step 3: Run to confirm failure**

```bash
bun test packages/roller/__tests__/lib/optionsToDescription.test.ts
```

(Add to existing file, or create `packages/roller/__tests__/lib/modifiers/greaterThanOrEqual.description.test.ts`)

**Step 4: Add tests**

**Step 5: Run to confirm pass**

**Step 6: Commit**

```bash
git add packages/roller/__tests__/lib/optionsToDescription.test.ts
git commit -m "test(roller): cover greaterThanOrEqual descriptions in drop and reroll"
```

---

### Task 5: builder — six uncovered methods

**Files:**
- Modify: `packages/roller/__tests__/lib/builder.test.ts`

Uncovered methods (all confirmed in source):
- `dropHighest(n)` → `drop: { highest: n }`
- `keep(highest)` → `keep: { highest }`
- `keepLowest(n)` → `keep: { lowest: n }`
- `minus(n)` → `minus: n`
- `reroll(options)` → `reroll: options`
- `explode()` → `explode: true`

**Step 1: Write all six failing tests**

Add inside the existing `describe('DiceBuilder', () => {...})` in `packages/roller/__tests__/lib/builder.test.ts`:

```typescript
  test('dropHighest(n) adds drop.highest modifier', () => {
    expect(d(6).quantity(4).dropHighest(2).build().modifiers?.drop).toEqual({ highest: 2 })
  })

  test('keep(highest) adds keep.highest modifier', () => {
    expect(d(6).quantity(4).keep(3).build().modifiers?.keep).toEqual({ highest: 3 })
  })

  test('keepLowest(n) adds keep.lowest modifier', () => {
    expect(d(6).quantity(4).keepLowest(2).build().modifiers?.keep).toEqual({ lowest: 2 })
  })

  test('minus(n) adds minus modifier', () => {
    expect(d(6).minus(5).build().modifiers?.minus).toBe(5)
  })

  test('reroll(options) adds reroll modifier', () => {
    expect(d(6).reroll({ exact: [1] }).build().modifiers?.reroll).toEqual({ exact: [1] })
  })

  test('explode() adds explode modifier', () => {
    expect(d(6).explode().build().modifiers?.explode).toBe(true)
  })

  test('chain: quantity + dropHighest + reroll executes without error', () => {
    const result = d(6).quantity(4).dropHighest(1).reroll({ exact: [1] }).toRoll()
    expect(result.rolls[0]?.rolls.length).toBeLessThanOrEqual(4)
  })
```

**Step 2: Run to confirm failure**

```bash
bun test packages/roller/__tests__/lib/builder.test.ts
```

Expected: 6 new tests fail (TS compile errors if types mismatch, else runtime assertion failures).

**Step 3: Add the tests to builder.test.ts**

**Step 4: Run to confirm pass**

```bash
bun test packages/roller/__tests__/lib/builder.test.ts
```

Expected: all pass (7 original + 7 new = 14 pass).

**Step 5: Commit**

```bash
git add packages/roller/__tests__/lib/builder.test.ts
git commit -m "test(roller): cover all uncovered DiceBuilder methods"
```

---

### Task 6: tokenize — uncovered branches (biggest task)

**Files:**
- Modify: `packages/component-library/__tests__/tokenize.test.ts`

Uncovered branches in `packages/component-library/src/components/RollerPlayground/tokenize.ts`:

| Lines | Description |
|-------|-------------|
| 57–58 | `dropHighest` with no numeric suffix (`H` → `'Drop highest'`) |
| 75–76 | `keepLowest` with no numeric suffix (`KL` → `'Keep lowest'`) |
| 83–84 | `keepHighest` with no numeric suffix (`K` → `'Keep highest'`) |
| 92–93 | `reroll` with content in braces — the `inner` extraction branch |
| 114–118 | `appendUnknown` merging into existing unknown token |
| 156 | For-loop completing without matching any modifier |
| 158 | `appendUnknown` call when no modifier matched |
| 178 | `parseFrom` called directly (no initial core match) |

**Step 1: Write all failing tests**

Add to `packages/component-library/__tests__/tokenize.test.ts`:

```typescript
describe('tokenize — bare drop/keep suffixes (no number)', () => {
  test('H alone → dropHighest with "Drop highest" description', () => {
    const tokens = tokenize('1d6H')
    const t = tokens.find(t => t.type === 'dropHighest')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Drop highest')
    expect(t?.text).toBe('H')
  })

  test('KL alone → keepLowest with "Keep lowest" description', () => {
    const tokens = tokenize('1d6KL')
    const t = tokens.find(t => t.type === 'keepLowest')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Keep lowest')
    expect(t?.text).toBe('KL')
  })

  test('K alone → keepHighest with "Keep highest" description', () => {
    const tokens = tokenize('1d6K')
    const t = tokens.find(t => t.type === 'keepHighest')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Keep highest')
    expect(t?.text).toBe('K')
  })
})

describe('tokenize — reroll with condition in braces', () => {
  test('R{<3} → reroll token with extracted inner condition description', () => {
    const tokens = tokenize('1d6R{<3}')
    const t = tokens.find(t => t.type === 'reroll')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Reroll <3')
  })

  test('R{1,2} → reroll with comma-separated conditions in description', () => {
    const tokens = tokenize('1d6R{1,2}')
    const t = tokens.find(t => t.type === 'reroll')
    expect(t?.description).toBe('Reroll 1,2')
  })
})

describe('tokenize — unknown tokens and appendUnknown', () => {
  test('leading unknown char produces unknown token', () => {
    const tokens = tokenize('1d6@')
    const t = tokens.find(t => t.type === 'unknown')
    expect(t).toBeDefined()
    expect(t?.text).toBe('@')
  })

  test('consecutive unknown chars are merged into one token', () => {
    // notation with no core match so all chars go through appendUnknown
    const tokens = tokenize('@@@@')
    // all four @ characters should be merged into one unknown token
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe('unknown')
    expect(tokens[0]?.text).toBe('@@@@')
  })

  test('unknown chars after core are merged', () => {
    const tokens = tokenize('1d6@@')
    const unknowns = tokens.filter(t => t.type === 'unknown')
    expect(unknowns).toHaveLength(1)
    expect(unknowns[0]?.text).toBe('@@')
  })

  test('notation with no core token goes through fallback parseFrom path', () => {
    // No leading NdS pattern — starts in parseFrom with cursor=0
    const tokens = tokenize('@@')
    expect(tokens[0]?.type).toBe('unknown')
  })

  test('empty notation returns empty array', () => {
    expect(tokenize('')).toEqual([])
  })
})
```

**Step 2: Run to confirm failures**

```bash
bun test packages/component-library/__tests__/tokenize.test.ts
```

Expected: new tests fail (wrong description or missing tokens).

**Step 3: Add tests to tokenize.test.ts**

Append the three new describe blocks to the existing file.

**Step 4: Run to confirm pass**

```bash
bun test packages/component-library/__tests__/tokenize.test.ts
```

Expected: all 4 original + 9 new = 13 pass.

**Step 5: Verify coverage improved**

```bash
bun test --coverage 2>&1 | grep tokenize
```

Expected: function coverage well above 23.81%.

**Step 6: Commit**

```bash
git add packages/component-library/__tests__/tokenize.test.ts
git commit -m "test(component-library): cover all uncovered tokenize branches"
```

---

### Task 7: Full run + verify

**Step 1: Run all tests**

```bash
bun run test
```

Expected: all existing 887 tests pass + new tests added.

**Step 2: Check coverage for previously-failing files**

```bash
bun run test 2>&1 | grep -E "^\s+packages/" | grep -v "100\.00.*100\.00"
```

Expected: tokenize.ts function coverage >> 23.81%; builder.ts >> 56.25%; no files missing `>=`/`<=` branches.

**Step 3: Commit if not already done**

If any stragglers remain, fix and commit per-task.

**Step 4: Push**

```bash
git push
```

---

## Execution Checklist

- [ ] Task 1: parseComparisonNotation `>=` / `<=`
- [ ] Task 2: normalize compound notation error
- [ ] Task 3: countSuccesses botchThreshold validation
- [ ] Task 4: drop + reroll `greaterThanOrEqual` descriptions
- [ ] Task 5: builder 6 uncovered methods
- [ ] Task 6: tokenize uncovered branches
- [ ] Task 7: Full run verification + push
