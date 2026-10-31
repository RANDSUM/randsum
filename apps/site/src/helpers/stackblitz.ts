import sdk from '@stackblitz/sdk'
import type { Project } from '@stackblitz/sdk'

// A runnable Node project that rolls one notation string with @randsum/roller
export function buildStackBlitzProject(notation: string): Project {
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
      type: 'module',
      scripts: { start: 'tsx index.ts' },
      dependencies: { '@randsum/roller': 'latest', tsx: 'latest' }
    },
    null,
    2
  )

  return {
    title: `RANDSUM — ${notation}`,
    description: `Rolling ${notation} with @randsum/roller`,
    template: 'node',
    files: {
      'index.ts': code,
      'package.json': packageJson
    }
  }
}

// StackBlitz's /run endpoint only accepts a POSTed form; a GET with the files
// in the query string lands on its homepage. The SDK posts the form for us.
export function openNotationInStackBlitz(notation: string): void {
  sdk.openProject(buildStackBlitzProject(notation), {
    newWindow: true,
    openFile: 'index.ts'
  })
}
