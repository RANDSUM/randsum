import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  splitting: true,
  sourcemap: 'inline',
  plugins: [dts()]
})
