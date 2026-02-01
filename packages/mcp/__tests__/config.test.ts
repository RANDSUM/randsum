import { describe, expect, spyOn, test } from 'bun:test'
import * as fs from 'fs'
import { config, getPackageVersion } from '../src/config'

describe('config', () => {
  describe('getPackageVersion', () => {
    test('returns fallback version when package.json read fails', () => {
      const readFileSyncSpy = spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found')
      })
      const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => undefined)

      const version = getPackageVersion()

      expect(version).toBe('0.0.0')
      readFileSyncSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('config', () => {
    test('exports version and name', () => {
      expect(config.version).toBeDefined()
      expect(config.name).toBe('RANDSUM')
    })
  })
})
