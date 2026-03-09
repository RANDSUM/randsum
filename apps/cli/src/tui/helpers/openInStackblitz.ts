import { execFile } from 'node:child_process'
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
}

export function openInStackblitz(notation: string): void {
  const code = `import { roll } from '@randsum/roller'

const result = roll('${notation}')

console.log('Notation:', '${notation}')
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

  const fields: Record<string, string> = {
    'project[title]': `RANDSUM — ${notation}`,
    'project[description]': `Rolling ${notation} with @randsum/roller`,
    'project[template]': 'node',
    'project[files][index.ts]': code,
    'project[files][package.json]': packageJson
  }

  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html>
<body>
<form id="f" method="POST" action="https://stackblitz.com/run">
${inputs}
</form>
<script>document.getElementById('f').submit()</script>
</body>
</html>`

  const tmpFile = join(tmpdir(), `randsum-stackblitz-${Date.now()}.html`)
  writeFileSync(tmpFile, html, 'utf8')

  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  execFile(cmd, [tmpFile])

  setTimeout(() => {
    try {
      unlinkSync(tmpFile)
    } catch {
      // ignore
    }
  }, 10000)
}
