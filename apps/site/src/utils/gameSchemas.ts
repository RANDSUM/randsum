// Trimmed .randsum.json specs for the landing page's game section: enough of
// each to show how a game's rules are written down, not the full spec.
export interface GameSchemaSample {
  readonly label: string
  // The game's id, which also names its --game-<id> colour
  readonly shortcode: string
  readonly json: string
}

export const GAME_SCHEMAS: readonly GameSchemaSample[] = [
  {
    label: 'Salvage Union',
    shortcode: 'salvageunion',
    json: `{
  "name": "Salvage Union",
  "shortcode": "salvageunion",
  "roll": {
    "inputs": {
      "tableName": { "type": "string" }
    },
    "dice": { "pool": { "sides": 20 }, "quantity": 1 },
    "resolve": {
      "remoteTableLookup": {
        "url": "https://salvageunion.io/schema/roll-tables.json",
        "find": {
          "field": "name",
          "input": "tableName",
          "errorMessage": "Invalid table: \\"\${value}\\""
        },
        "tableField": "table",
        "resultMapping": {
          "key": { "$lookupResult": "key" },
          "label": { "$lookupResult": "result.label" },
          "description": { "$lookupResult": "result.value" },
          "tableName": { "$input": "tableName" }
        }
      }
    }
  }
}`
  },
  {
    label: 'Blades in the Dark',
    shortcode: 'blades',
    json: `{
  "name": "Blades in the Dark",
  "shortcode": "blades",
  "pools": {
    "actionDice": { "sides": 6 }
  },
  "tables": {
    "coreMechanic": {
      "ranges": [
        { "poolCondition": { "countWhere": { "operator": "=", "value": 6 }, "atLeast": 2 }, "result": "critical" },
        { "exact": 6, "result": "success" },
        { "min": 4, "max": 5, "result": "partial" },
        { "min": 1, "max": 3, "result": "failure" }
      ]
    }
  },
  "roll": {
    "inputs": {
      "rating": { "type": "integer", "minimum": 0, "maximum": 10, "default": 1 }
    },
    "dice": { "pool": { "$ref": "#/pools/actionDice" }, "quantity": { "$input": "rating" } },
    "modify": [{ "keepHighest": 1 }],
    "resolve": "sum",
    "outcome": { "$ref": "#/outcomes/coreMechanicOutcome" }
  }
}`
  },
  {
    label: 'D&D 5e',
    shortcode: 'fifth',
    json: `{
  "name": "D&D 5th Edition",
  "shortcode": "fifth",
  "roll": {
    "inputs": {
      "modifier": { "type": "integer", "minimum": -30, "maximum": 30, "default": 0 },
      "rollingWith": { "type": "string", "enum": ["Advantage", "Disadvantage"], "optional": true },
      "crit": { "type": "boolean", "optional": true }
    },
    "dice": { "pool": { "sides": 20 }, "quantity": 1 },
    "resolve": "sum",
    "modify": [{ "add": { "$input": "modifier" } }],
    "when": [
      {
        "condition": { "input": "rollingWith", "operator": "=", "value": "Advantage" },
        "override": {
          "dice": { "pool": { "sides": 20 }, "quantity": 2 },
          "modify": [{ "keepHighest": 1 }, { "add": { "$input": "modifier" } }]
        }
      }
    ]
  }
}`
  },
  {
    label: 'PbtA',
    shortcode: 'pbta',
    json: `{
  "name": "Powered by the Apocalypse",
  "shortcode": "pbta",
  "roll": {
    "inputs": {
      "stat": { "type": "integer", "minimum": -3, "maximum": 5 }
    },
    "dice": { "pool": { "sides": 6 }, "quantity": 2 },
    "resolve": "sum",
    "modify": [{ "add": { "$input": "stat" } }],
    "outcome": {
      "ranges": [
        { "min": 10, "result": "strong_hit" },
        { "min": 7, "max": 9, "result": "weak_hit" },
        { "max": 6, "result": "miss" }
      ]
    }
  }
}`
  },
  {
    label: 'Daggerheart',
    shortcode: 'daggerheart',
    json: `{
  "name": "Daggerheart",
  "shortcode": "daggerheart",
  "pools": {
    "hope": { "sides": 12 },
    "fear": { "sides": 12 }
  },
  "roll": {
    "dice": [
      { "pool": { "$ref": "#/pools/hope" }, "quantity": 1 },
      { "pool": { "$ref": "#/pools/fear" }, "quantity": 1 }
    ],
    "resolve": "sum",
    "details": {
      "hopeDominates": { "$dieCheck": { "pool": 0, "field": "final", "die": 0, "operator": ">", "compareTo": { "pool": 1, "field": "final", "die": 0 } } },
      "criticalHope": { "$dieCheck": { "pool": 0, "field": "final", "die": 0, "operator": "=", "compareTo": { "pool": 1, "field": "final", "die": 0 } } }
    }
  }
}`
  }
]
