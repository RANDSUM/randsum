import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  minify: false,
  sourcemap: 'external',
  target: 'node',
  clean: true,
  // Bundle the workspace @randsum/* packages into dist (they are devDependencies,
  // like apps/cli), but keep @modelcontextprotocol/sdk external — it is a real
  // runtime dependency resolved from node_modules by consumers.
  noExternal: [/^@randsum\//]
})
