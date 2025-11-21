import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

// Templates are in packages/site/templates relative to the site package root
const templatesDir = join(__dirname, '..', '..', 'templates')

export function getTemplateCode(packageId: string): string {
  try {
    const templatePath = join(templatesDir, packageId, 'index.ts')
    return readFileSync(templatePath, 'utf-8')
  } catch (error) {
    console.warn(`Could not load template for ${packageId}:`, error)
    return ''
  }
}
