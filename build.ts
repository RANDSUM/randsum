import dts from 'bun-plugin-dts'

async function build() {
  try {
    console.log('🔨 Building package...')

    console.log('📦 Building ESM format...')
    const esmResult = await Bun.build({
      entrypoints: ['src/index.ts'],
      outdir: 'dist',
      format: 'esm',
      target: 'node',
      minify: true,
      packages: 'external',
      splitting: true,
      sourcemap: 'inline',
      plugins: [dts()]
    })

    if (!esmResult.success) {
      console.error('❌ ESM build failed:', esmResult.logs)
      process.exit(1)
    }

    console.log('✅ Build completed successfully!')
  } catch (error) {
    console.error('❌ Build failed with an error:', error)
    process.exit(1)
  }
}

build()
