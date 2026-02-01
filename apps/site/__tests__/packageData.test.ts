import { describe, expect, test } from 'bun:test'
import {
  allPackages,
  corePackages,
  gamePackages,
  getPackageById,
  toolPackages
} from '../src/utils/packageData'

describe('packageData', () => {
  describe('getPackageById', () => {
    test('returns package for valid id', () => {
      const roller = getPackageById('roller')
      expect(roller).toBeDefined()
      expect(roller?.id).toBe('roller')
      expect(roller?.name).toBe('roller')
    })

    test('returns undefined for non-existent package', () => {
      expect(getPackageById('nonexistent')).toBeUndefined()
    })

    test('returns correct package for each category', () => {
      expect(getPackageById('roller')).toBe(corePackages[0])
      expect(getPackageById('blades')).toBeDefined()
      expect(getPackageById('mcp')).toBeDefined()
    })
  })

  describe('allPackages', () => {
    test('includes all packages from each category', () => {
      const expectedCount = corePackages.length + gamePackages.length + toolPackages.length
      expect(allPackages).toHaveLength(expectedCount)
    })
  })
})
