import dts from 'bun-plugin-dts'
import { statSync } from 'fs'
import { join } from 'path'

/**
 * Analyzes the size of the built bundle
 * @param {string} filePath - Path to the bundle file
 * @returns {void}
 */
function analyzeBundleSize(filePath: string): void {
  try {
    const stats = statSync(filePath)
    const fileSizeInBytes = stats.size
    const fileSizeInKilobytes = fileSizeInBytes / 1024

    console.log(`📊 Bundle size: ${fileSizeInKilobytes.toFixed(2)} KB`)

    // Warn if bundle size is over 50KB
    if (fileSizeInKilobytes > 50) {
      console.warn(
        '⚠️  Warning: Bundle size is over 50KB. Consider optimizing imports.'
      )
    }
  } catch (error) {
    console.error(`❌ Failed to analyze bundle size: ${String(error)}`)
  }
}

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

    // Analyze bundle size
    const bundlePath = join(process.cwd(), 'dist', 'index.js')
    analyzeBundleSize(bundlePath)
  } catch (error) {
    console.error('❌ Build failed with an error:', error)
    process.exit(1)
  }
}

await build()
