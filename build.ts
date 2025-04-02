import { existsSync } from 'fs';
import { readdir, rename } from 'fs/promises';
import { join } from 'path';
import { createBuildConfig } from './build.config';

async function build() {
  try {
    console.log('🔨 Building package...');

    // Define entrypoints
    const entrypoints = ['src/index.ts'];
    const outdir = 'dist';

    // Build both ESM and CJS formats
    console.log('📦 Building ESM and CJS formats...');

    // ESM Build
    console.log('📦 Building ESM format...');
    const esmConfig = createBuildConfig(entrypoints);
    esmConfig.format = 'esm';
    esmConfig.outdir = join(outdir, 'esm-temp'); // Temporary directory for ESM
    const esmResult = await Bun.build(esmConfig);

    if (!esmResult.success) {
      console.error('❌ ESM build failed:', esmResult.logs);
      process.exit(1);
    }

    // CJS Build
    console.log('📦 Building CJS format...');
    const cjsConfig = createBuildConfig(entrypoints);
    cjsConfig.format = 'cjs';
    cjsConfig.outdir = join(outdir, 'cjs-temp'); // Temporary directory for CJS
    const cjsResult = await Bun.build(cjsConfig);

    if (!cjsResult.success) {
      console.error('❌ CJS build failed:', cjsResult.logs);
      process.exit(1);
    }

    // Rename and move files to the correct locations
    console.log('📦 Renaming files to correct extensions...');

    // Process ESM files
    const esmFiles = await readdir(join(process.cwd(), outdir, 'esm-temp'));
    let dtsFile: string | null = null; // Track the d.ts file to copy only once

    for (const file of esmFiles) {
      if (file.endsWith('.js')) {
        const baseName = file.replace('.js', '');
        await rename(
          join(process.cwd(), outdir, 'esm-temp', file),
          join(process.cwd(), outdir, `${baseName}.mjs`)
        );
      } else if (file.endsWith('.d.ts')) {
        // Save the d.ts file for later - we'll only copy it once
        dtsFile = file;
      } else {
        // Copy other files (like source maps) directly
        await rename(
          join(process.cwd(), outdir, 'esm-temp', file),
          join(process.cwd(), outdir, file)
        );
      }
    }

    // Process CJS files
    const cjsFiles = await readdir(join(process.cwd(), outdir, 'cjs-temp'));
    for (const file of cjsFiles) {
      if (file.endsWith('.js')) {
        const baseName = file.replace('.js', '');
        await rename(
          join(process.cwd(), outdir, 'cjs-temp', file),
          join(process.cwd(), outdir, `${baseName}.cjs`)
        );
      } else if (file.endsWith('.d.ts')) {
        // We already have the d.ts file from ESM, so skip it
        // If we didn't find it in ESM, save it now
        if (!dtsFile) {
          dtsFile = file;
        }
      } else {
        // Copy other files (like source maps) directly
        await rename(
          join(process.cwd(), outdir, 'cjs-temp', file),
          join(process.cwd(), outdir, file)
        );
      }
    }

    // Copy the d.ts file once (if found)
    if (dtsFile) {
      const baseName = dtsFile.replace('.d.ts', '');
      // Check ESM temp dir first, then CJS temp dir
      const sourcePath = existsSync(join(process.cwd(), outdir, 'esm-temp', dtsFile))
        ? join(process.cwd(), outdir, 'esm-temp', dtsFile)
        : join(process.cwd(), outdir, 'cjs-temp', dtsFile);

      await rename(
        sourcePath,
        join(process.cwd(), outdir, `${baseName}.d.ts`)
      );
      console.log(`📄 Generated single declaration file: ${baseName}.d.ts`);
    }

    // Clean up temporary directories
    console.log('💥 Cleaning up temporary directories...');
    try {
      const cleanup = Bun.spawn(['rm', '-rf', join(process.cwd(), outdir, 'esm-temp'), join(process.cwd(), outdir, 'cjs-temp')], {
        stdout: 'inherit',
        stderr: 'inherit'
      });
      await cleanup.exited;
    } catch (cleanupError) {
      console.warn('⚠️ Warning: Failed to clean up temporary directories:', cleanupError);
      // Continue execution even if cleanup fails
    }

    console.log('✅ Build completed successfully!');
    console.log(`📦 Files generated in ${outdir}/`);
  } catch (error) {
    console.error('❌ Build failed with an error:', error);
    process.exit(1);
  }
}

// Run the build
build();
