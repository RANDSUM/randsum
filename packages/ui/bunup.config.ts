import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/check.ts',
    'src/key-pad.tsx',
    'src/keys.ts',
    'src/notation-field.tsx',
    'src/preset-list.tsx',
    'src/presets.ts',
    'src/readout.tsx',
    'src/roll-button.tsx',
    'src/roll-steps.tsx',
    'src/roller-compact.tsx',
    'src/roller-max.tsx',
    'src/roller-mini.tsx',
    'src/status-line.tsx',
    'src/use-roller.ts'
  ],
  format: ['esm'],
  dts: true,
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true,
  // Every entry is a file in src/; shared code goes to chunks, so importing one
  // component pulls in only what it uses.
  sourceBase: './src',
  splitting: true,
  jsx: { runtime: 'automatic', development: false }
})
