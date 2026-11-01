import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/check.ts',
    'src/key-pad.ts',
    'src/keys.ts',
    'src/notation-field.ts',
    'src/preset-list.ts',
    'src/presets.ts',
    'src/react/key-pad.ts',
    'src/react/notation-field.ts',
    'src/react/preset-list.ts',
    'src/react/readout.ts',
    'src/react/roll-button.ts',
    'src/react/roll-steps.ts',
    'src/react/roller.ts',
    'src/react/status-line.ts',
    'src/react/use-roller.ts',
    'src/readout.ts',
    'src/roll-button.ts',
    'src/roll-steps.ts',
    'src/roller.ts',
    'src/roller-state.ts',
    'src/scope.ts',
    'src/ssr.ts',
    'src/status-line.ts',
    'src/svelte.ts',
    'src/vue/key-pad.ts',
    'src/vue/notation-field.ts',
    'src/vue/preset-list.ts',
    'src/vue/readout.ts',
    'src/vue/roll-button.ts',
    'src/vue/roll-steps.ts',
    'src/vue/roller.ts',
    'src/vue/status-line.ts',
    'src/vue/use-roller.ts'
  ],
  format: ['esm'],
  dts: true,
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  // bunup 0.16 starts its clean without awaiting it, so a slow delete can
  // remove chunks the build just wrote; the build script cleans first instead
  clean: false,
  // Every entry is a file in src/; shared code goes to chunks, so importing one
  // component pulls in only what it uses.
  sourceBase: './src',
  splitting: true
})
