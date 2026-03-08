# Custom Modifiers

The modifier system is extensible via `defineModifier()`. You can add domain-specific
modifiers for custom game systems without forking the package.

## How Modifiers Work

Modifiers self-register in a global Map on import, sorted by priority, and applied in order
to the dice pool during `roll()`. See `MODIFIER_PRIORITIES` for the built-in order.

## Modifier Definition Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Key in `ModifierOptions` |
| `priority` | ✅ | Execution order — lower runs first |
| `pattern` | ✅ | Regex matching notation syntax |
| `parse` | ✅ | Notation string → option value |
| `toNotation` | ✅ | Option value → notation string |
| `toDescription` | ✅ | Option value → human-readable strings |
| `apply` | ✅ | Transform the dice pool: `(rolls, options, ctx) => { rolls }` |
| `validate` | ❌ | Throw `ModifierError` for invalid options |
| `requiresRollFn` | ❌ | Set `true` if `apply` calls `ctx.rollOne` |
| `requiresParameters` | ❌ | Set `true` if `apply` reads `ctx.parameters` |

## Example: "Minimum Value" Modifier

Floors each die to a minimum value (runs between cap and drop).

```ts
import { defineModifier, ModifierError } from '@randsum/roller'

defineModifier({
  name: 'minimum' as keyof ModifierOptions,
  priority: 15, // after cap (10), before drop (20)

  pattern: /[Mm](\d+)/,

  parse: (notation) => {
    const match = notation.match(/[Mm](\d+)/)
    if (!match?.[1]) return {}
    return { minimum: Number(match[1]) }
  },

  toNotation: (options) => `M${options}`,
  toDescription: (options) => [`Minimum value: ${options}`],

  validate: (options, { sides }) => {
    if (options < 1 || options > sides) {
      throw new ModifierError('minimum', `Minimum ${options} out of range for d${sides}`)
    }
  },

  apply: (rolls, options) => ({
    rolls: rolls.map(r => Math.max(r, options as number))
  })
})
```

## Important Notes

- `ctx.rollOne()` returns a 0-indexed value `[0, sides)`. Add `+1` for die face values.
  See `packages/roller/src/lib/modifiers/definitions/reroll.ts` for the canonical pattern.
- `apply` receives the full dice pool array — use `.map()` / `.filter()` to transform it
- Modifiers are global — registration affects all `roll()` calls in the process
- `defineModifier()` invalidates the pattern cache; first call after registration is slightly slower

## Priority Gaps for Custom Modifiers

Built-in priorities: 10, 20, 21, 30, 40, 50, 51, 52, 60, 85, 90, 91, 95, 100

Recommended slots:
- **15** — after cap, before drop
- **25** — after drop/keep
- **45** — after reroll, before explode
- **75** — after unique, before multiply
