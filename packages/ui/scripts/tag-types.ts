// bunup's declaration bundler drops `declare global` blocks, so each element
// entry's HTMLElementTagNameMap entry is appended to its .d.ts after the
// build. That is what types `document.querySelector('randsum-roller')`.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const src = join(root, 'src')

for (const file of readdirSync(src).filter(name => name.endsWith('.ts'))) {
  const code = await Bun.file(join(src, file)).text()
  const defined = /define\('([\w-]+)', (\w+)\)/.exec(code)
  if (defined === null) continue
  const [, tag, element] = defined
  const dts = join(root, 'dist', file.replace(/\.ts$/, '.d.ts'))
  const types = await Bun.file(dts).text()
  if (types.includes('HTMLElementTagNameMap')) continue
  await Bun.write(
    dts,
    `${types}\ndeclare global {\n\tinterface HTMLElementTagNameMap {\n\t\t"${tag}": ${element};\n\t}\n}\n`
  )
}
