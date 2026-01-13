import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    // In built form, we're in dist/ and package.json is in parent directory
    const packageJsonPath = join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version: string
    }
    return packageJson.version
  } catch (error) {
    console.error('Failed to read package version:', error)
    return '0.0.0' // Fallback version
  }
}

export const config: { version: string; name: string } = {
  version: getPackageVersion(),
  name: 'RANDSUM'
}

