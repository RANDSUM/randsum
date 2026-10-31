import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/roller-max.tsx',
    'src/roller-compact.tsx',
    'src/roller-mini.tsx',
    'src/keys.ts',
    'src/presets.ts'
  ],
  format: ['esm'],
  dts: true,
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true,
  jsx: { runtime: 'automatic', development: false }
})
