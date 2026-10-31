// bunup builds the JavaScript entries; the stylesheet ships as one plain file.
// tokens.css (the only file that spells a raw value) is inlined ahead of
// styles.css, so consumers import a single `@randsum/ui/styles.css`.
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const tokens = await Bun.file(join(root, 'src/tokens.css')).text()
const styles = await Bun.file(join(root, 'src/styles.css')).text()
const body = styles.replace(/^@import '\.\/tokens\.css';\n/m, '')
await Bun.write(join(root, 'dist/styles.css'), `${tokens}\n${body}`)
