import { BuildConfig } from 'bun'
import dts from 'bun-plugin-dts'

// Common build configuration that can be reused across packages
export const createBuildConfig = (
  override?: Partial<BuildConfig>
): BuildConfig => ({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  format: 'esm',
  target: 'node',
  minify: true,
  splitting: true,
  sourcemap: 'inline',
  plugins: [dts()],
  ...override
})

// Default export for direct usage
export default createBuildConfig()
