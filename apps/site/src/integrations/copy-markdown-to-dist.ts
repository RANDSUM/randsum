import type { AstroIntegration } from 'astro'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Astro integration that copies cleaned .md files from the Vite build output
 * (.netlify/build/) into dist/ so they're accessible in production.
 *
 * This is needed because vite-plugin-static-copy (used by starlight-page-actions)
 * outputs to Vite's build directory, which the Netlify adapter places in
 * .netlify/build/ rather than dist/.
 */
export function copyMarkdownToDist(): AstroIntegration {
  return {
    name: 'copy-markdown-to-dist',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const distPath = fileURLToPath(dir)
        const netlifyBuildPath = path.resolve(distPath, '..', '.netlify', 'build')

        if (!fs.existsSync(netlifyBuildPath)) return

        const copyMdFiles = (srcDir: string, destDir: string): number => {
          const entries = fs.readdirSync(srcDir, { withFileTypes: true })

          return entries.reduce((count, entry) => {
            const srcPath = path.join(srcDir, entry.name)
            const destPath = path.join(destDir, entry.name)

            if (entry.isDirectory()) {
              return count + copyMdFiles(srcPath, destPath)
            }

            if (entry.name.endsWith('.md')) {
              fs.mkdirSync(path.dirname(destPath), { recursive: true })
              fs.copyFileSync(srcPath, destPath)
              return count + 1
            }

            return count
          }, 0)
        }

        const copied = copyMdFiles(netlifyBuildPath, distPath)
        if (copied > 0) {
          console.warn(`[copy-markdown-to-dist] Copied ${copied} .md files to dist/`)
        }
      }
    }
  }
}
