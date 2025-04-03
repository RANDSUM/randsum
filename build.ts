import dts from 'bun-plugin-dts'

/**
 * Builds the package
 * @returns {Promise<void>}
 */
async function build(): Promise<void> {
  try {
    console.log('🔨 Building package...')

    const startTime = performance.now()

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
      // Tree shaking is enabled by default in Bun
    })

    if (!result.success) {
      console.error('❌ ESM build failed:', result.logs)
      process.exit(1)
    }

    const endTime = performance.now()
    const buildTime = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Build completed successfully in ${buildTime}s!`)
  } catch (error) {
    console.error('❌ Build failed with an error:', error)
    process.exit(1)
  }
}

await build()
