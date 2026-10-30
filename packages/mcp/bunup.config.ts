import { defineConfig } from 'bunup'

export default defineConfig({
  // `index.ts` is the stdio bin. `remote.ts` is the `./remote` subpath, which
  // the api.randsum.dev Worker imports, and the only importable entry: the
  // package exports no `.`, because importing the bin would start a stdio
  // server. Only `remote.ts` gets declarations.
  entry: ['src/index.ts', 'src/remote.ts'],
  format: ['esm'],
  dts: { entry: ['src/remote.ts'] },
  minify: false,
  sourcemap: 'external',
  target: 'node',
  clean: true,
  // Bundle the workspace @randsum/* packages into dist (they are
  // devDependencies), but keep @modelcontextprotocol/sdk external — it is a real
  // runtime dependency resolved from node_modules by consumers.
  noExternal: [/^@randsum\//]
})
