// Builds dist/mcp-app.html, and dist/mcp-app-page.js exporting it as a
// string (the `@randsum/ui/mcp-app-page` subpath): the page an MCP Apps host (Claude, among others)
// loads in a sandboxed frame when the RANDSUM server's `roll` or `roll_game`
// tool runs. Hosts read the page as one string from a ui:// resource and
// allow no outside scripts by default, so `src/mcp-app.ts` and everything it
// imports (Lit, the roller's trace) are bundled into one inline module.
// @randsum/mcp imports the string and serves it as its ui:// resource.
import { join } from 'node:path'

const root = join(import.meta.dir, '..')

const build = await Bun.build({
  entrypoints: [join(root, 'src/mcp-app.ts')],
  target: 'browser',
  format: 'esm',
  minify: true
})
const [output] = build.outputs
if (!build.success || output === undefined) {
  for (const log of build.logs) console.error(log)
  process.exit(1)
}

// A literal "</script" inside the bundle would end the inline script early.
const script = (await output.text()).replaceAll('</script', '<\\/script')

// The body stays transparent so the conversation shows through, and
// color-scheme covers the first paint before the host's theme arrives.
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>RANDSUM roll</title>
<style>html,body{margin:0;background:transparent}</style>
</head>
<body>
<randsum-mcp-app></randsum-mcp-app>
<script type="module">${script}</script>
</body>
</html>
`

await Bun.write(join(root, 'dist/mcp-app.html'), page)
await Bun.write(
  join(root, 'dist/mcp-app-page.js'),
  `// The <randsum-mcp-app> page, built by scripts/mcp-app-html.ts.\nexport default ${JSON.stringify(page)}\n`
)
await Bun.write(
  join(root, 'dist/mcp-app-page.d.ts'),
  '/** The <randsum-mcp-app> page: one self-contained HTML document. */\ndeclare const page: string\nexport default page\n'
)
console.log(`dist/mcp-app.html ${(page.length / 1024).toFixed(1)} KB`)
