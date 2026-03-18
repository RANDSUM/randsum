import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildStackBlitzProject } from './stackblitz'
import { openUrl } from './openUrl'

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
  const project = buildStackBlitzProject(notation)

  const fields: Record<string, string> = {
    'project[title]': project.title,
    'project[description]': project.description,
    'project[template]': project.template,
    ...Object.fromEntries(
      Object.entries(project.files).map(([name, content]) => [`project[files][${name}]`, content])
    )
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

  openUrl(tmpFile)

  setTimeout(() => {
    try {
      unlinkSync(tmpFile)
    } catch {
      // ignore
    }
  }, 10000)
}
