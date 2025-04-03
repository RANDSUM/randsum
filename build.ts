import dts from 'bun-plugin-dts'

async function build() {
  try {
    console.log('🔨 Building package...')

    const result = await Bun.build({
      entrypoints: ['src/index.ts'],
      outdir: 'dist',
      format: 'esm',
      target: 'node',
      minify: true,
      packages: 'external',
      sourcemap: 'inline',
      naming: 'index.js',
      plugins: [dts()]
    })

    if (!result.success) {
      console.error('❌ ESM build failed:', result.logs)
      process.exit(1)
    }

    console.log('✅ Build completed successfully!')
  } catch (error) {
    console.error('❌ Build failed with an error:', error)
    process.exit(1)
  }
}

await build()
