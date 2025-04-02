import { createBuildConfig } from './build.config'

async function build() {
  try {
    console.log('🔨 Building package...')

    console.log('📦 Building ESM format...')
    const esmResult = await Bun.build(createBuildConfig())

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

// Run the build
build()
