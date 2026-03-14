# Spec Examples

Complete working `.randsum.json` specs at three complexity levels.

## Simple: Pool-Based with Tiered Outcomes

A Blades in the Dark-style mechanic: roll a pool of d6s based on rating, keep highest, classify the result. Rating 0 is a special case -- roll 2d6 and keep the lowest.

```json
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json",
  "name": "Blades in the Dark",
  "shortcode": "blades",
  "version": "1.0.0",
  "game_url": "https://bladesinthedark.com",

  "pools": {
    "actionDice": { "sides": 6 }
  },

  "tables": {
    "coreMechanic": {
      "ranges": [
        {
          "poolCondition": { "countWhere": { "operator": "=", "value": 6 }, "atLeast": 2 },
          "result": "critical"
        },
        { "exact": 6, "result": "success" },
        { "min": 4, "max": 5, "result": "partial" },
        { "min": 1, "max": 3, "result": "failure" }
      ]
    }
  },

  "outcomes": {
    "coreMechanicOutcome": { "tableLookup": { "$ref": "#/tables/coreMechanic" } },
    "desperateActionOutcome": {
      "ranges": [
        { "exact": 6, "result": "success" },
        { "min": 4, "max": 5, "result": "partial" },
        { "min": 1, "max": 3, "result": "failure" }
      ]
    }
  },

  "roll": {
    "inputs": {
      "rating": {
        "type": "integer",
        "minimum": 0,
        "maximum": 4,
        "default": 1,
        "description": "Action rating (0 = desperate: roll 2, keep lowest; 1-4 = roll that many, keep highest)"
      }
    },
    "dice": {
      "pool": { "$ref": "#/pools/actionDice" },
      "quantity": { "$input": "rating" }
    },
    "modify": [{ "keepHighest": 1 }],
    "resolve": "sum",
    "outcome": { "$ref": "#/outcomes/coreMechanicOutcome" },
    "when": [
      {
        "condition": { "input": "rating", "operator": "=", "value": 0 },
        "override": {
          "dice": { "pool": { "$ref": "#/pools/actionDice" }, "quantity": 2 },
          "modify": [{ "keepLowest": 1 }],
          "outcome": { "$ref": "#/outcomes/desperateActionOutcome" }
        }
      }
    ]
  }
}
```

Key patterns demonstrated:
- Named pool with `$ref`
- `poolCondition` for detecting criticals (2+ sixes)
- Separate outcome for the 0-rating case (no critical possible with 1 kept die)
- `when` override changes dice quantity, modifier, and outcome

## Moderate: Conditional Pools with Arithmetic

A PbtA-style mechanic: roll 2d6 + stat + forward + ongoing, with advantage/disadvantage variants. Demonstrates per-die modifiers, outcome ranges, and details passthrough.

```json
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json",
  "name": "Powered by the Apocalypse",
  "shortcode": "pbta",
  "version": "1.0.0",
  "game_url": "https://apocalypse-world.com/",

  "roll": {
    "inputs": {
      "stat": { "type": "integer", "minimum": -3, "maximum": 5 },
      "forward": { "type": "integer", "minimum": -5, "maximum": 5, "default": 0 },
      "ongoing": { "type": "integer", "minimum": -5, "maximum": 5, "default": 0 },
      "rollingWith": {
        "type": "string",
        "enum": ["Advantage", "Disadvantage"],
        "optional": true
      }
    },
    "dice": { "pool": { "sides": 6 }, "quantity": 2 },
    "modify": [
      { "add": { "$input": "stat" } },
      { "add": { "$input": "forward" } },
      { "add": { "$input": "ongoing" } }
    ],
    "resolve": "sum",
    "details": {
      "stat": { "$input": "stat" },
      "forward": { "$input": "forward", "default": 0 },
      "ongoing": { "$input": "ongoing", "default": 0 },
      "diceTotal": { "expr": "diceTotal" }
    },
    "outcome": {
      "ranges": [
        { "min": 10, "max": 27, "result": "strong_hit" },
        { "min": 7, "max": 9, "result": "weak_hit" },
        { "min": -11, "max": 6, "result": "miss" }
      ]
    },
    "when": [
      {
        "condition": { "input": "rollingWith", "operator": "=", "value": "Advantage" },
        "override": {
          "dice": { "pool": { "sides": 6 }, "quantity": 3 },
          "modify": [
            { "keepHighest": 2 },
            { "add": { "$input": "stat" } },
            { "add": { "$input": "forward" } },
            { "add": { "$input": "ongoing" } }
          ]
        }
      },
      {
        "condition": { "input": "rollingWith", "operator": "=", "value": "Disadvantage" },
        "override": {
          "dice": { "pool": { "sides": 6 }, "quantity": 3 },
          "modify": [
            { "keepLowest": 2 },
            { "add": { "$input": "stat" } },
            { "add": { "$input": "forward" } },
            { "add": { "$input": "ongoing" } }
          ]
        }
      }
    ]
  }
}
```

Key patterns demonstrated:
- Multiple additive modifiers from inputs
- `details` passthrough for returning input values alongside the roll
- `expr: "diceTotal"` to return raw dice sum before modifiers
- `when` overrides for advantage (3d6 keep 2 highest) and disadvantage (keep 2 lowest)
- Outcome ranges covering the full possible range (negative totals are valid with negative stats)

## Complex: Multi-Pool Comparison with Conditional Pools

A Daggerheart-style mechanic: roll Hope (d12) vs Fear (d12), compare highest to determine narrative control. Supports amplification (swapping d12 for d20), advantage/disadvantage as conditional extra pools, and post-resolve modifiers.

```json
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json",
  "name": "Daggerheart",
  "shortcode": "daggerheart",
  "version": "1.0.0",
  "game_url": "https://darringtonpress.com/daggerheart/",

  "roll": {
    "inputs": {
      "modifier": { "type": "integer", "minimum": -30, "maximum": 30, "default": 0 },
      "amplifyHope": { "type": "boolean", "default": false },
      "amplifyFear": { "type": "boolean", "default": false },
      "rollingWith": {
        "type": "string",
        "enum": ["Advantage", "Disadvantage"],
        "optional": true
      }
    },
    "dicePools": {
      "hope": {
        "pool": { "sides": { "$input": "amplifyHope", "ifTrue": 20, "ifFalse": 12 } }
      },
      "fear": {
        "pool": { "sides": { "$input": "amplifyFear", "ifTrue": 20, "ifFalse": 12 } }
      }
    },
    "conditionalPools": {
      "advantage": {
        "condition": { "input": "rollingWith", "operator": "=", "value": "Advantage" },
        "pool": { "sides": 6 },
        "arithmetic": "add"
      },
      "disadvantage": {
        "condition": { "input": "rollingWith", "operator": "=", "value": "Disadvantage" },
        "pool": { "sides": 6 },
        "arithmetic": "subtract"
      }
    },
    "resolve": {
      "comparePoolHighest": {
        "pools": ["hope", "fear"],
        "ties": "critical hope",
        "outcomes": { "hope": "hope", "fear": "fear" }
      }
    },
    "postResolveModifiers": [{ "add": { "$input": "modifier" } }],
    "details": {
      "hope": {
        "roll": { "$pool": "hope", "field": "total" },
        "amplified": { "$input": "amplifyHope", "default": false }
      },
      "fear": {
        "roll": { "$pool": "fear", "field": "total" },
        "amplified": { "$input": "amplifyFear", "default": false }
      },
      "modifier": { "$input": "modifier", "default": 0 },
      "extraDie": {
        "when": { "input": "rollingWith" },
        "value": {
          "advantageRoll": { "$conditionalPool": "advantage", "field": "total" },
          "disadvantageRoll": { "$conditionalPool": "disadvantage", "field": "total" }
        }
      }
    }
  }
}
```

Key patterns demonstrated:
- `dicePools` for named multi-pool rolls instead of single `dice`
- `comparePoolHighest` resolve strategy with tie handling
- Boolean-conditional die sizes (`ifTrue`/`ifFalse` on `$input`)
- `conditionalPools` for extra dice rolled only when a condition matches
- `postResolveModifiers` for arithmetic after resolution
- Nested `details` with conditional sections (`when` + `value`)
- `$pool` and `$conditionalPool` references in details
