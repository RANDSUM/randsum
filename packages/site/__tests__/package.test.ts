import { describe, expect, test } from 'bun:test'
import packageJson from '../package.json'
import { corePackages, gamePackages, toolPackages } from '../src/utils/packageData'

describe('@randsum/site', () => {
  test('package.json has correct name', () => {
    expect(packageJson.name).toBe('@randsum/site')
  })

  test('package.json has version', () => {
    expect(packageJson.version).toBeDefined()
    expect(typeof packageJson.version).toBe('string')
  })

  test('package.json is private', () => {
    expect(packageJson.private).toBe(true)
  })

  describe('packageData', () => {
    test('corePackages is defined and is an array', () => {
      expect(Array.isArray(corePackages)).toBe(true)
      expect(corePackages.length).toBeGreaterThan(0)
    })

    test('gamePackages is defined and is an array', () => {
      expect(Array.isArray(gamePackages)).toBe(true)
      expect(gamePackages.length).toBeGreaterThan(0)
    })

    test('toolPackages is defined and is an array', () => {
      expect(Array.isArray(toolPackages)).toBe(true)
      expect(toolPackages.length).toBeGreaterThan(0)
    })

    test('all packages have required fields', () => {
      const allPackages = [...corePackages, ...gamePackages, ...toolPackages]
      allPackages.forEach(pkg => {
        expect(pkg).toHaveProperty('name')
        expect(pkg).toHaveProperty('description')
        expect(typeof pkg.name).toBe('string')
        expect(typeof pkg.description).toBe('string')
      })
    })
  })
})
