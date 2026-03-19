import { useCallback, useEffect, useState } from 'react'

const INTEGRATIONS = [
  {
    label: 'CLI',
    id: 'cli',
    type: 'terminal' as const,
    filename: 'terminal',
    content: `$ npx @randsum/cli roll 4d6L
┌─────────────────────────────┐
│  4d6L                       │
│  Rolled: [5, 2, 6, 3]      │
│  Drop lowest: 2             │
│  Result: [3, 5, 6]          │
│  Total: 14                  │
└─────────────────────────────┘

$ npx @randsum/cli roll 2d20H
┌─────────────────────────────┐
│  2d20H                      │
│  Rolled: [14, 19]           │
│  Keep highest: 19           │
│  Total: 19                  │
└─────────────────────────────┘`
  },
  {
    label: 'Your Code',
    id: 'code',
    type: 'code' as const,
    filename: 'app.ts',
    content: `import { roll } from '@randsum/roller'
import { isDiceNotation } from '@randsum/roller/validate'

function rollFromUserInput(input: string) {
  if (!isDiceNotation(input)) {
    throw new Error(\`Invalid notation: \${input}\`)
  }

  const { total, rolls } = roll(input)

  return {
    total,
    breakdown: rolls.map(r => ({
      dice: r.initialRolls,
      final: r.rolls,
      description: r.description
    }))
  }
}`
  },
  {
    label: 'Discord',
    id: 'discord',
    type: 'image' as const,
    filename: '',
    content: '/discord-bot-su-example.png'
  },
  {
    label: 'AI Skills',
    id: 'skills',
    type: 'code' as const,
    filename: 'SKILL.md',
    content: `---
name: dice-rolling
description: Roll dice and interpret results
  for tabletop RPGs using RANDSUM notation.
license: MIT
metadata:
  author: RANDSUM
  version: "3.0"
  repository: github.com/RANDSUM/randsum
---

# Dice Rolling Skill

## Executing Rolls

When a user asks you to roll dice,
**produce an actual result** — don't just
show notation or code.

\`\`\`bash
bunx @randsum/cli 4d6L    # ability score
bunx @randsum/cli 2d20L+7 # advantage
bunx @randsum/cli 3d6     # Blades pool
\`\`\``
  }
] as const

export function IntegrationViewer(): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState(0)

  const handleChipClick = useCallback((idx: number) => {
    setSelectedIdx(idx)
  }, [])

  useEffect(() => {
    const handler = (): void => {
      setSelectedIdx(i => (i + 1) % INTEGRATIONS.length)
    }
    window.addEventListener('die-rolled', handler)
    return () => {
      window.removeEventListener('die-rolled', handler)
    }
  }, [])

  const selected = INTEGRATIONS[selectedIdx]
  if (!selected) return <div />

  return (
    <div className="integration-viewer">
      <div className="integration-chips">
        {INTEGRATIONS.map((item, i) => (
          <button
            key={item.id}
            className={['hero-chip', selectedIdx === i ? 'hero-chip--active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              handleChipClick(i)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="integration-display">
        {selected.type === 'terminal' && (
          <div className="integration-terminal">
            <div className="code-example-chrome">
              <div className="code-chrome-dots">
                <span className="code-chrome-dot code-chrome-dot--red" />
                <span className="code-chrome-dot code-chrome-dot--yellow" />
                <span className="code-chrome-dot code-chrome-dot--green" />
              </div>
              <span className="code-chrome-filename">{selected.filename}</span>
            </div>
            <div className="integration-terminal-body">
              <pre>
                <code>{selected.content}</code>
              </pre>
            </div>
          </div>
        )}
        {selected.type === 'code' && (
          <div className="integration-terminal">
            <div className="code-example-chrome">
              <div className="code-chrome-dots">
                <span className="code-chrome-dot code-chrome-dot--red" />
                <span className="code-chrome-dot code-chrome-dot--yellow" />
                <span className="code-chrome-dot code-chrome-dot--green" />
              </div>
              <span className="code-chrome-filename">{selected.filename}</span>
            </div>
            <div className="integration-terminal-body">
              <pre>
                <code>{selected.content}</code>
              </pre>
            </div>
          </div>
        )}
        {selected.type === 'image' && (
          <div className="integration-image-wrap">
            <img
              src={selected.content}
              alt={`${selected.label} preview`}
              className="integration-image"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  )
}
