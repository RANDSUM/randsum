interface StackBlitzProject {
  readonly title: string
  readonly description: string
  readonly template: string
  readonly files: Readonly<Record<string, string>>
}

export function buildStackBlitzProject(notation: string): StackBlitzProject {
  const safe = JSON.stringify(notation)
  const code = `import { roll } from '@randsum/roller'

const result = roll(${safe})

console.log('Notation:', ${safe})
console.log('Total:   ', result.total)
console.log('Rolls:   ', result.rolls)
`

  const packageJson = JSON.stringify(
    {
      name: 'randsum-playground',
      version: '1.0.0',
      private: true,
      scripts: { start: 'tsx index.ts' },
      dependencies: { '@randsum/roller': 'latest', tsx: 'latest' }
    },
    null,
    2
  )

  return {
    title: `RANDSUM \u2014 ${notation}`,
    description: `Rolling ${notation} with @randsum/roller`,
    template: 'node',
    files: {
      'index.ts': code,
      'package.json': packageJson
    }
  }
}
