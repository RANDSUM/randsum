import { defineConfig } from 'bunup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/bin.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    external: ['@randsum/roller'],
    minify: true,
    sourcemap: 'external',
    target: 'node',
    clean: true
  },
  {
    entry: ['src/bin-build.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    external: ['@randsum/roller', 'bunup', 'prettier'],
    minify: true,
    target: 'node',
    clean: false
  }
])
