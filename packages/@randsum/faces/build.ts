import dts from 'bun-plugin-dts'

const results = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'inline',
  plugins: [dts()]
})

if (results.success == false) {
  console.error('Build failed')
  for (const message of results.logs) {
    console.error(message)
  }
} else {
  console.log('Compiled ' + results.outputs.length + ' javascript files...')
}

export {}
