import { defineConfig } from 'bunup'

export default defineConfig({
  // `index.ts` is the library (types, levels and the runner); `cli.ts` is the
  // `rdn-conformance` bin, which bundles the latest vectors file.
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: { entry: ['src/index.ts'] },
  minify: false,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
