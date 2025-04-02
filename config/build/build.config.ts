import { BuildConfig } from 'bun';
import dts from 'bun-plugin-dts';

// Common build configuration that can be reused across packages
export const createBuildConfig = (entrypoints: string[] = ['src/index.ts']): BuildConfig => ({
  entrypoints,
  outdir: 'dist',
  format: 'esm', // Bun.build only accepts a single format at a time
  target: 'node',
  minify: true,
  splitting: true,
  sourcemap: 'inline',
  plugins: [
    dts()
  ]
});

// Function to create both ESM and CJS builds
export const createMultiFormatBuild = async (entrypoints: string[] = ['src/index.ts']) => {
  // ESM build
  const esmConfig = createBuildConfig(entrypoints);
  esmConfig.format = 'esm';

  // CJS build
  const cjsConfig = createBuildConfig(entrypoints);
  cjsConfig.format = 'cjs';

  return {
    esm: esmConfig,
    cjs: cjsConfig
  };
};

// Default export for direct usage
export default createBuildConfig();
