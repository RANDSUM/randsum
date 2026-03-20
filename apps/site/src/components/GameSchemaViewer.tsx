import { useCallback, useEffect, useRef, useState } from 'react'

const GAME_SCHEMAS = [
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
      "rating": { "type": "integer", "minimum": 0, "maximum": 4, "default": 1 }
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
      "stat": { "type": "integer", "minimum": -3, "maximum": 4, "default": 0 }
    },
    "dice": { "pool": { "sides": 6 }, "quantity": 2 },
    "resolve": "sum",
    "modify": [{ "add": { "$input": "stat" } }],
    "outcome": {
      "ranges": [
        { "min": 10, "max": 15, "result": "Strong Hit" },
        { "min": 7, "max": 9, "result": "Weak Hit" },
        { "min": -1, "max": 6, "result": "Miss" }
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
] as const

function highlightJson(json: string): React.JSX.Element {
  const tokenPattern =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?)\b|(true|false|null)/g
  const source = json
  const matches = Array.from(source.matchAll(tokenPattern))
  const positions: { start: number; end: number; element: React.JSX.Element }[] = []

  for (const match of matches) {
    const fullMatch = match[0]
    const start = match.index

    if (match[1] !== undefined) {
      // Key: "key":
      const colonIdx = fullMatch.lastIndexOf(':')
      positions.push({
        start,
        end: start + colonIdx,
        element: <span style={{ color: '#82aaff' }}>{fullMatch.slice(0, colonIdx)}</span>
      })
      positions.push({
        start: start + colonIdx,
        end: start + fullMatch.length,
        element: <span style={{ color: '#abb2bf' }}>{fullMatch.slice(colonIdx)}</span>
      })
    } else if (match[2] !== undefined) {
      // String value
      positions.push({
        start,
        end: start + fullMatch.length,
        element: <span style={{ color: '#98c379' }}>{fullMatch}</span>
      })
    } else if (match[3] !== undefined) {
      // Number
      positions.push({
        start,
        end: start + fullMatch.length,
        element: <span style={{ color: '#d19a66' }}>{fullMatch}</span>
      })
    } else if (match[4] !== undefined) {
      // Boolean/null
      positions.push({
        start,
        end: start + fullMatch.length,
        element: <span style={{ color: '#c678dd' }}>{fullMatch}</span>
      })
    }
  }

  // Build output by filling gaps with unstyled text
  const sorted = positions.sort((a, b) => a.start - b.start)
  const result: React.JSX.Element[] = []
  const cursor = { pos: 0 }

  for (const [i, pos] of sorted.entries()) {
    if (cursor.pos < pos.start) {
      result.push(<span key={`g-${i}`}>{source.slice(cursor.pos, pos.start)}</span>)
    }
    result.push(<span key={`t-${i}`}>{pos.element}</span>)
    cursor.pos = pos.end
  }
  if (cursor.pos < source.length) {
    result.push(<span key="end">{source.slice(cursor.pos)}</span>)
  }

  return <>{result}</>
}

export function GameSchemaViewer(): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cycleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const startCycle = useCallback(() => {
    if (cycleRef.current) clearInterval(cycleRef.current)
    cycleRef.current = setInterval(() => {
      setSelectedIdx(i => (i + 1) % GAME_SCHEMAS.length)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, 8000)
  }, [])

  const handleChipClick = useCallback((idx: number) => {
    setSelectedIdx(idx)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    if (cycleRef.current) clearInterval(cycleRef.current)
    cycleRef.current = undefined
  }, [])

  useEffect(() => {
    startCycle()
    const handler = (): void => {
      setSelectedIdx(i => (i + 1) % GAME_SCHEMAS.length)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
      startCycle()
    }
    window.addEventListener('die-rolled', handler)
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
      window.removeEventListener('die-rolled', handler)
    }
  }, [startCycle])

  const selected = GAME_SCHEMAS[selectedIdx]
  if (!selected) return <div />

  return (
    <div className="game-schema-viewer">
      <div className="game-schema-chips">
        {GAME_SCHEMAS.map((game, i) => (
          <button
            key={game.shortcode}
            className={['hero-chip', selectedIdx === i ? 'hero-chip--active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              handleChipClick(i)
            }}
          >
            {game.label}
          </button>
        ))}
      </div>
      <div className="game-schema-display">
        <div className="game-schema-chrome">
          <div className="code-chrome-dots">
            <span className="code-chrome-dot code-chrome-dot--red" />
            <span className="code-chrome-dot code-chrome-dot--yellow" />
            <span className="code-chrome-dot code-chrome-dot--green" />
          </div>
          <span className="code-chrome-filename">{selected.shortcode}.randsum.json</span>
        </div>
        <div ref={scrollRef} className="game-schema-code">
          <pre>
            <code>{highlightJson(selected.json)}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
