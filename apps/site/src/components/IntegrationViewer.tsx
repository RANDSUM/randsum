import { useCallback, useEffect, useRef, useState } from 'react'

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

function highlightCode(code: string, filename: string): React.JSX.Element {
  if (filename === 'terminal') {
    // Terminal: highlight $ prompts and box-drawing
    const lines = code.split('\n')
    return (
      <>
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 && '\n'}
            {line.startsWith('$') ? (
              <>
                <span style={{ color: '#98c379' }}>$</span>
                <span style={{ color: '#e5c07b' }}>{line.slice(1)}</span>
              </>
            ) : (
              <span style={{ color: '#abb2bf' }}>{line}</span>
            )}
          </span>
        ))}
      </>
    )
  }

  if (filename.endsWith('.ts')) {
    // TypeScript: keyword, string, comment, function highlighting
    const tokenPattern =
      /(\/\/[^\n]*|'[^']*'|`[^`]*`|"[^"]*"|\b(?:import|from|export|const|function|return|if|throw|new|map)\b|(?:Error|string)\b|\{|\}|\(|\))/g
    const parts = code.split(tokenPattern)
    return (
      <>
        {parts.map((part, i) => {
          if (!part) return null
          if (part.startsWith('//'))
            return (
              <span key={i} style={{ color: '#5c6370', fontStyle: 'italic' }}>
                {part}
              </span>
            )
          if (part.startsWith("'") || part.startsWith('"') || part.startsWith('`'))
            return (
              <span key={i} style={{ color: '#98c379' }}>
                {part}
              </span>
            )
          if (/^(?:import|from|export|const|function|return|if|throw|new)$/.test(part))
            return (
              <span key={i} style={{ color: '#c678dd' }}>
                {part}
              </span>
            )
          if (/^(?:Error|string|map)$/.test(part))
            return (
              <span key={i} style={{ color: '#e5c07b' }}>
                {part}
              </span>
            )
          return <span key={i}>{part}</span>
        })}
      </>
    )
  }

  if (filename.endsWith('.md')) {
    // Markdown: frontmatter, headings, code blocks, bold
    const lines = code.split('\n')
    const firstFence = lines.indexOf('---')
    const secondFence = firstFence >= 0 ? lines.indexOf('---', firstFence + 1) : -1
    return (
      <>
        {lines.map((line, i) => {
          const inFrontmatter =
            firstFence >= 0 && secondFence >= 0 && i > firstFence && i < secondFence
          if (line === '---' && (i === firstFence || i === secondFence)) {
            return (
              <span key={i}>
                {i > 0 && '\n'}
                <span style={{ color: '#5c6370' }}>{line}</span>
              </span>
            )
          }
          if (inFrontmatter) {
            const colonIdx = line.indexOf(':')
            if (colonIdx > 0) {
              return (
                <span key={i}>
                  {i > 0 && '\n'}
                  <span style={{ color: '#e5c07b' }}>{line.slice(0, colonIdx)}</span>
                  <span style={{ color: '#abb2bf' }}>:</span>
                  <span style={{ color: '#98c379' }}>{line.slice(colonIdx + 1)}</span>
                </span>
              )
            }
            return (
              <span key={i}>
                {i > 0 && '\n'}
                <span style={{ color: '#98c379' }}>{line}</span>
              </span>
            )
          }
          if (line.startsWith('#'))
            return (
              <span key={i}>
                {i > 0 && '\n'}
                <span style={{ color: '#61afef' }}>{line}</span>
              </span>
            )
          if (line.startsWith('```'))
            return (
              <span key={i}>
                {i > 0 && '\n'}
                <span style={{ color: '#5c6370' }}>{line}</span>
              </span>
            )
          if (line.includes('**')) {
            const boldParts = line.split(/(\*\*[^*]+\*\*)/)
            return (
              <span key={i}>
                {i > 0 && '\n'}
                {boldParts.map((p, j) =>
                  p.startsWith('**') ? (
                    <span key={j} style={{ color: '#e5c07b', fontWeight: 700 }}>
                      {p}
                    </span>
                  ) : (
                    <span key={j}>{p}</span>
                  )
                )}
              </span>
            )
          }
          return (
            <span key={i}>
              {i > 0 && '\n'}
              {line}
            </span>
          )
        })}
      </>
    )
  }

  return <>{code}</>
}

export function IntegrationViewer(): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const cycleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const startCycle = useCallback(() => {
    if (cycleRef.current) clearInterval(cycleRef.current)
    cycleRef.current = setInterval(() => {
      setSelectedIdx(i => (i + 1) % INTEGRATIONS.length)
    }, 8000)
  }, [])

  const handleChipClick = useCallback((idx: number) => {
    setSelectedIdx(idx)
    if (cycleRef.current) clearInterval(cycleRef.current)
    cycleRef.current = undefined
  }, [])

  useEffect(() => {
    startCycle()
    const handler = (): void => {
      setSelectedIdx(i => (i + 1) % INTEGRATIONS.length)
      startCycle()
    }
    window.addEventListener('die-rolled', handler)
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
      window.removeEventListener('die-rolled', handler)
    }
  }, [startCycle])

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
                <code>{highlightCode(selected.content, selected.filename)}</code>
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
                <code>{highlightCode(selected.content, selected.filename)}</code>
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
